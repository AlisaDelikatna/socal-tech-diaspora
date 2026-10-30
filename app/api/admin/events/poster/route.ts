import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { checkImage, uploadPublic, IMAGE_EXT } from "@/lib/storage";

// POST multipart { file } — upload an event poster (admin only).
// Returns the public URL; the event form saves it with the event.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file") as File | null;
  const invalid = checkImage(file);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  // A new name per upload, so a replaced poster never shows a cached old one.
  const url = await uploadPublic("event-posters", `${randomUUID()}.${IMAGE_EXT[file!.type]}`, file!);
  if (!url) {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ url });
}
