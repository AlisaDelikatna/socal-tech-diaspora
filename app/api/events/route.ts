import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";

// POST — create an event (admin only).
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const event = await prisma.event.create({
    data: {
      title: d.title,
      description: d.description,
      dateTime: new Date(d.dateTime),
      address: d.address,
      createdByUserId: session.user.id,
    },
  });

  return NextResponse.json({ ok: true, id: event.id });
}
