"use server";

import { createClient } from "@/lib/supabase/server";
import { admin, preflight } from "@/lib/gdrive";
import { extractFolderId } from "@/lib/drive-url";
import { tasks } from "@trigger.dev/sdk";
import { revalidatePath } from "next/cache";

export async function createProjectAction(data: {
  name: string;
  sourceUrl: string;
  destinationUrl: string;
  syncMode: "COPY" | "MOVE";
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized. Silakan login terlebih dahulu." };
  }

  const name = data.name.trim();
  if (!name) return { error: "Nama proyek wajib diisi." };

  const sourceFolderId = extractFolderId(data.sourceUrl);
  if (!sourceFolderId) {
    return { error: "URL atau ID Source Folder Google Drive tidak valid." };
  }

  const destinationFolderId = extractFolderId(data.destinationUrl);
  if (!destinationFolderId) {
    return { error: "URL atau ID Destination Folder Google Drive tidak valid." };
  }

  if (sourceFolderId === destinationFolderId) {
    return { error: "Source Folder dan Destination Folder tidak boleh sama." };
  }

  const syncMode = data.syncMode === "MOVE" ? "MOVE" : "COPY";

  // Preflight check: verify read access on source and write access on destination
  try {
    await preflight(user.id, sourceFolderId, destinationFolderId);
  } catch (err: unknown) {
    return {
      error: `Preflight check gagal: ${(err as Error)?.message || "Pastikan akun Google Anda memiliki akses ke kedua folder tersebut."}`,
    };
  }

  const db = admin();
  const { data: project, error: insertError } = await db
    .from("projects")
    .insert({
      user_id: user.id,
      name,
      source_folder_id: sourceFolderId,
      destination_folder_id: destinationFolderId,
      sync_mode: syncMode,
      status: "IDLE",
    })
    .select()
    .single();

  if (insertError || !project) {
    return { error: insertError?.message || "Gagal membuat proyek di database." };
  }

  // Trigger Trigger.dev worker task
  try {
    await tasks.trigger("scan-project", { projectId: project.id });
  } catch (err: unknown) {
    console.error("Failed to trigger scan-project task:", err);
    // Project is still created, worker can be triggered later or retried
  }

  revalidatePath("/projects");
  return { success: true, projectId: project.id };
}

export async function triggerSyncAction(projectId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const db = admin();
  const { data: proj, error } = await db
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .single();

  if (error || !proj) return { error: "Proyek tidak ditemukan." };
  if (proj.status !== "READY_TO_SYNC") {
    return { error: `Status proyek saat ini (${proj.status}) belum siap disinkronkan.` };
  }

  try {
    await tasks.trigger("sync-project", { projectId });
    await db.from("projects").update({ status: "SYNCING" }).eq("id", projectId);
  } catch (err: unknown) {
    return { error: `Gagal memicu sinkronisasi: ${(err as Error)?.message}` };
  }

  revalidatePath(`/projects/${projectId}`);
  return { success: true };
}

export async function updatePhotoStatusAction(
  photoId: string,
  newStatus: "KEEP_BEST" | "ALTERNATIVE" | "REJECTED"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const db = admin();
  // Ensure the user owns the project associated with this photo
  const { data: photo } = await db
    .from("photos")
    .select("id, project_id, cluster_id, projects!inner(user_id)")
    .eq("id", photoId)
    .single();

  if (!photo || ((photo as unknown) as { projects: { user_id: string } }).projects?.user_id !== user.id) {
    return { error: "Foto tidak ditemukan atau akses ditolak." };
  }

  await db.from("photos").update({ cull_status: newStatus }).eq("id", photoId);

  // If set to KEEP_BEST, also update cluster best_photo_id
  if (newStatus === "KEEP_BEST" && photo.cluster_id) {
    await db
      .from("photo_clusters")
      .update({ best_photo_id: photoId })
      .eq("id", photo.cluster_id);
  }

  return { success: true };
}
