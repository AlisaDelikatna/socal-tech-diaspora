import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { removeFiles, PHOTO_BUCKET } from "@/lib/storage";

// PATCH { move: "first" } — show this photo first in the gallery (admin only).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { move } = (await req.json().catch(() => ({}))) as { move?: string };
  const photo = await prisma.eventPhoto.findUnique({ where: { id } });
  if (!photo || move !== "first") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const first = await prisma.eventPhoto.findFirst({
    where: { eventId: photo.eventId },
    orderBy: { position: "asc" },
    select: { position: true },
  });
  await prisma.eventPhoto.update({
    where: { id },
    data: { position: (first?.position ?? 0) - 1 },
  });
  return NextResponse.json({ ok: true });
}

// DELETE — remove a photo from the gallery and from storage (admin only).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const photo = await prisma.eventPhoto.delete({ where: { id } }).catch(() => null);
  if (photo) await removeFiles(PHOTO_BUCKET, [photo.path]);
  return NextResponse.json({ ok: true });
}
