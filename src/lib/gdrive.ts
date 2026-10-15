import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";

export function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  });
}

/** Drive client dengan refresh token user; googleapis auto-refresh, kita persist token baru. */
export async function driveForUser(userId: string) {
  const db = admin();
  const { data, error } = await db.from("user_gdrive_tokens").select("*").eq("user_id", userId).single();
  if (error || !data) throw new Error("Token Google Drive user tidak ditemukan; login ulang.");
  const auth = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
  auth.setCredentials({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: new Date(data.expires_at).getTime(),
  });
  auth.on("tokens", async (t) => {
    if (!t.access_token) return;
    await db.from("user_gdrive_tokens").update({
      access_token: t.access_token,
      expires_at: new Date(t.expiry_date ?? Date.now() + 3300_000).toISOString(),
      updated_at: new Date().toISOString(),
      ...(t.refresh_token ? { refresh_token: t.refresh_token } : {}),
    }).eq("user_id", userId);
  });
  return { drive: google.drive({ version: "v3", auth }), auth };
}

/** Fase 0: Source harus bisa dibaca, Destination harus canAddChildren. */
export async function preflight(userId: string, sourceId: string, destId: string) {
  const { drive } = await driveForUser(userId);
  const fields = "id,name,mimeType,capabilities(canAddChildren,canListChildren)";
  const [src, dst] = await Promise.all([
    drive.files.get({ fileId: sourceId, fields, supportsAllDrives: true }),
    drive.files.get({ fileId: destId, fields, supportsAllDrives: true }),
  ]);
  if (src.data.mimeType !== "application/vnd.google-apps.folder") throw new Error("Source bukan folder");
  if (dst.data.mimeType !== "application/vnd.google-apps.folder") throw new Error("Destination bukan folder");
  if (!src.data.capabilities?.canListChildren) throw new Error("Tidak ada akses baca di Source");
  if (!dst.data.capabilities?.canAddChildren) throw new Error("Tidak ada akses tulis di Destination");
  return { source: src.data.name, destination: dst.data.name };
}
