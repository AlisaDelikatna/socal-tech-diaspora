import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { speakerOpportunitySchema } from "@/lib/validations";

// POST — create a speaker opportunity for an event (admin only).
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = speakerOpportunitySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const event = await prisma.event.findUnique({ where: { id: d.eventId } });
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const opp = await prisma.speakerOpportunity.create({
    data: {
      eventId: d.eventId,
      topic: d.topic.trim(),
      description: d.description.trim(),
    },
  });
  return NextResponse.json({ ok: true, id: opp.id });
}
