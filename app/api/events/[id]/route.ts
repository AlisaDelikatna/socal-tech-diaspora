import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";

// PUT — update an event (admin only).
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const d = parsed.data;
  try {
    await prisma.event.update({
      where: { id },
      data: {
        title: d.title,
        description: d.description,
        dateTime: new Date(d.dateTime),
        address: d.address,
      },
    });
  } catch (err) {
    console.error("[events PUT] update failed:", err);
    return NextResponse.json(
      { error: "Could not save the event. The database may be unavailable — try again in a moment." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

// DELETE — remove an event (admin only).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.event.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
