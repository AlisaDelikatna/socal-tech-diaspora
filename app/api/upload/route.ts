import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "avatars";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, WebP, or GIF images are allowed." },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "File must be under 5 MB." },
      { status: 400 }
    );
  }

  const supabase = supabaseAdmin();

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${session.user.id}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    console.error("[upload] Supabase storage error:", error);
    return NextResponse.json(
      { error: "Upload failed. Please try again, or contact an organizer if it keeps happening." },
      { status: 500 }
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
