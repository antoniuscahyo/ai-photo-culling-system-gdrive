import { createClient } from "@/lib/supabase/server";
import { admin, driveForUser } from "@/lib/gdrive";
import { NextResponse } from "next/server";
import sharp from "sharp";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const db = admin();
  const { data: photo } = await db
    .from("photos")
    .select("gdrive_file_id, projects!inner(user_id)")
    .eq("id", id)
    .single();

  if (!photo || (photo as unknown as { projects: { user_id: string } }).projects?.user_id !== user.id) {
    return new NextResponse("Not Found", { status: 404 });
  }

  try {
    const { drive } = await driveForUser(user.id);
    const res = await drive.files.get(
      {
        fileId: photo.gdrive_file_id,
        alt: "media",
        supportsAllDrives: true,
      },
      { responseType: "arraybuffer" }
    );

    const buffer = Buffer.from(res.data as ArrayBuffer);
    
    // Resize down to 1024 max dimension for fast display
    const thumbBuffer = await sharp(buffer)
      .resize(1024, 1024, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();

    return new NextResponse(thumbBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (err: unknown) {
    return new NextResponse((err as Error)?.message || "Failed to fetch image", { status: 500 });
  }
}
