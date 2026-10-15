import { task, logger, queue } from "@trigger.dev/sdk";
import type { drive_v3 } from "googleapis";
import { admin, driveForUser, preflight } from "@/lib/gdrive";
import { resizeThumbnail } from "@/lib/drive-url";
import { dHash, technicalFilter, clusterPhotos } from "@/lib/image-analysis";
import { cullCluster } from "@/lib/culling-ai";

// Throttle agar aman dari rate limit Drive & Gemini
const driveQueue = queue({ name: "gdrive", concurrencyLimit: 15 });
const aiQueue = queue({ name: "gemini", concurrencyLimit: 5 });

async function fetchBuf(url: string): Promise<Buffer> {
  for (let attempt = 0; ; attempt++) {
    const r = await fetch(url);
    if (r.ok) return Buffer.from(await r.arrayBuffer());
    if (attempt >= 3 || ![429, 500, 502, 503].includes(r.status)) throw new Error(`fetch ${r.status}`);
    await new Promise((res) => setTimeout(res, 500 * 2 ** attempt));
  }
}

/** Fase 0-3: preflight, indexing, hash, hard technical filter, clustering. */
export const scanProject = task({
  id: "scan-project",
  queue: driveQueue,
  run: async (p: { projectId: string }) => {
    const db = admin();
    const { data: proj } = await db.from("projects").select("*").eq("id", p.projectId).single();
    if (!proj) throw new Error("project not found");
    await db.from("projects").update({ status: "SCANNING", processed_photos: 0 }).eq("id", proj.id);
    try {
      await preflight(proj.user_id, proj.source_folder_id, proj.destination_folder_id);
      const { drive } = await driveForUser(proj.user_id);

      // Fase 1: indexing tanpa download file asli
      const files: drive_v3.Schema$File[] = [];
      let pageToken: string | undefined;
      do {
        const r = await drive.files.list({
          q: `'${proj.source_folder_id}' in parents and mimeType contains 'image/' and trashed = false`,
          fields: "nextPageToken, files(id,name,thumbnailLink,imageMediaMetadata(time,isoSpeed,aperture,exposureTime,focalLength))",
          pageSize: 1000, pageToken, supportsAllDrives: true, includeItemsFromAllDrives: true,
        });
        files.push(...(r.data.files ?? []));
        pageToken = r.data.nextPageToken ?? undefined;
      } while (pageToken);
      logger.info(`indexed ${files.length} files`);

      const rows = files.map((f) => {
        const m = f.imageMediaMetadata ?? {};
        // EXIF time format "YYYY:MM:DD HH:MM:SS" (tanpa timezone -> diperlakukan UTC, hanya dipakai untuk selisih relatif)
        const t = m.time ? new Date(m.time.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3").replace(" ", "T") + "Z") : null;
        return {
          project_id: proj.id, gdrive_file_id: f.id, file_name: f.name,
          thumbnail_url: f.thumbnailLink ? resizeThumbnail(f.thumbnailLink) : null,
          captured_at: t && !isNaN(t.getTime()) ? t.toISOString() : null,
          exif_data: { iso: m.isoSpeed, aperture: m.aperture, shutterSpeed: m.exposureTime, focalLength: m.focalLength },
        };
      });
      for (let i = 0; i < rows.length; i += 500)
        await db.from("photos").upsert(rows.slice(i, i + 500), { onConflict: "project_id,gdrive_file_id" });
      await db.from("projects").update({ total_photos: rows.length }).eq("id", proj.id);

      // Fase 2+3: dHash + hard technical filter (pakai thumbnail =s1024)
      const { data: photos } = await db.from("photos").select("id,thumbnail_url").eq("project_id", proj.id);
      let done = 0;
      const CONC = 15;
      for (let i = 0; i < (photos?.length ?? 0); i += CONC) {
        await Promise.all(photos!.slice(i, i + CONC).map(async (ph) => {
          if (!ph.thumbnail_url) return;
          try {
            const buf = await fetchBuf(ph.thumbnail_url);
            const [hash, tech] = await Promise.all([dHash(buf), technicalFilter(buf)]);
            await db.from("photos").update({
              dhash: hash, sharpness_score: tech.sharpness,
              is_technically_rejected: tech.rejected, reject_reason: tech.reason,
              cull_status: tech.rejected ? "REJECTED" : "PENDING",
            }).eq("id", ph.id);
          } catch (e) { logger.warn(`photo ${ph.id} failed: ${(e as Error).message}`); }
          done++;
        }));
        await db.from("projects").update({ processed_photos: done }).eq("id", proj.id);
      }

      // Clustering (hanya foto yang lolos filter teknis)
      const { data: ok } = await db.from("photos").select("id,captured_at,dhash")
        .eq("project_id", proj.id).eq("is_technically_rejected", false).not("dhash", "is", null)
        .order("captured_at", { ascending: true, nullsFirst: false });
      const groups = clusterPhotos((ok ?? []).map((o) => ({
        id: o.id, capturedAt: o.captured_at ? new Date(o.captured_at) : null, dhash: o.dhash!,
      })));
      await db.from("photo_clusters").delete().eq("project_id", proj.id);
      for (const g of groups) {
        const { data: c } = await db.from("photo_clusters").insert({ project_id: proj.id }).select("id").single();
        await db.from("photos").update({ cluster_id: c!.id }).in("id", g);
      }
      logger.info(`${groups.length} clusters`);
      await cullProject.triggerAndWait({ projectId: proj.id }).unwrap();
    } catch (e) {
      await db.from("projects").update({ status: "FAILED" }).eq("id", proj.id);
      throw e;
    }
  },
});

/** Fase 4: comparative culling per cluster via Gemini. */
export const cullProject = task({
  id: "cull-project",
  queue: aiQueue,
  run: async (p: { projectId: string }) => {
    const db = admin();
    const { data: clusters } = await db.from("photo_clusters").select("id").eq("project_id", p.projectId);
    for (const c of clusters ?? []) {
      const { data: ph } = await db.from("photos").select("id,thumbnail_url,captured_at")
        .eq("cluster_id", c.id).order("captured_at", { ascending: true });
      if (!ph?.length) continue;
      const MAX = 6; // batasi foto per request; cluster lebih besar dipecah
      for (let i = 0; i < ph.length; i += MAX) {
        const chunk = ph.slice(i, i + MAX);
        const verdict = await cullCluster(await Promise.all(chunk.map((x) => fetchBuf(x.thumbnail_url!))));
        for (const v of verdict.photos) {
          const row = chunk[v.index]; if (!row) continue;
          const avg = (v.focus_sharpness + v.expression + v.composition + v.lighting + v.background_cleanliness) / 5;
          await db.from("photos").update({
            ai_scores: { focus_sharpness: v.focus_sharpness, expression: v.expression, composition: v.composition, lighting: v.lighting, background_cleanliness: v.background_cleanliness },
            overall_score: avg, eyes_all_open: v.eyes_all_open, ai_critique: v.critique, cull_status: v.status,
          }).eq("id", row.id);
          if (v.status === "KEEP_BEST") await db.from("photo_clusters").update({ best_photo_id: row.id }).eq("id", c.id);
        }
      }
    }
    await db.from("projects").update({ status: "READY_TO_SYNC" }).eq("id", p.projectId);
  },
});

/** Fase 5: flat sync KEEP_BEST ke destination (COPY / MOVE). Dipicu manual dari dashboard. */
export const syncProject = task({
  id: "sync-project",
  queue: driveQueue,
  run: async (p: { projectId: string }) => {
    const db = admin();
    const { data: proj } = await db.from("projects").select("*").eq("id", p.projectId).single();
    if (!proj) throw new Error("project not found");
    await db.from("projects").update({ status: "SYNCING" }).eq("id", proj.id);
    const { drive } = await driveForUser(proj.user_id);
    const { data: keep } = await db.from("photos").select("id,gdrive_file_id")
      .eq("project_id", proj.id).eq("cull_status", "KEEP_BEST").eq("is_synced_to_gdrive", false);
    for (const k of keep ?? []) {
      let synced: string | null | undefined;
      if (proj.sync_mode === "MOVE") {
        const r = await drive.files.update({
          fileId: k.gdrive_file_id, addParents: proj.destination_folder_id, removeParents: proj.source_folder_id,
          fields: "id", supportsAllDrives: true,
        });
        synced = r.data.id;
      } else {
        const r = await drive.files.copy({
          fileId: k.gdrive_file_id, requestBody: { parents: [proj.destination_folder_id] },
          fields: "id", supportsAllDrives: true,
        });
        synced = r.data.id;
      }
      await db.from("photos").update({ synced_file_id: synced, is_synced_to_gdrive: true }).eq("id", k.id);
    }
    await db.from("projects").update({ status: "COMPLETED" }).eq("id", proj.id);
  },
});
