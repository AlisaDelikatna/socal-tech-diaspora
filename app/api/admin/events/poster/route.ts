import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "event-posters";
// Netlify functions accept request bodies up to about 6 MB.
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// POST multipart { file } — upload an event poster (admin only).
// Returns the public URL; the event form saves it with the event.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or WebP images are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "The poster must be under 5 MB. Try exporting it as a JPEG." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();
  // A new name per upload, so a replaced poster never shows a cached old one.
  const path = `${randomUUID()}.${EXT[file.type]}`;
  const upload = () =>
    supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });

  let { error } = await upload();
  if (error && /bucket not found/i.test(error.message)) {
    // First poster ever: create the public bucket, then try again.
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: ALLOWED_TYPES,
    });
    ({ error } = await upload());
  }
  if (error) {
    console.error("[poster] Supabase storage error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again." },
      { status: 500 }
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
