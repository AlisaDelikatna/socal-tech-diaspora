import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkImage, uploadPublic, IMAGE_EXT, PHOTO_BUCKET } from "@/lib/storage";

// POST multipart { file } — add one photo to an event's gallery (admin only).
// The admin page uploads several files one request at a time.
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id }, select: { id: true } });
  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file") as File | null;
  const invalid = checkImage(file);
  if (invalid) {
    return NextResponse.json({ error: invalid }, { status: 400 });
  }

  const path = `${id}/${randomUUID()}.${IMAGE_EXT[file!.type]}`;
  const url = await uploadPublic(PHOTO_BUCKET, path, file!);
  if (!url) {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  // New photos go to the end of the gallery.
  const last = await prisma.eventPhoto.findFirst({
    where: { eventId: id },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  const photo = await prisma.eventPhoto.create({
    data: { eventId: id, url, path, position: (last?.position ?? -1) + 1 },
    select: { id: true, url: true },
  });

  return NextResponse.json({ ok: true, photo });
}
