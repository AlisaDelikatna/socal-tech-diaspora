import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const STATUSES = ["pending", "accepted", "sidelined"] as const;

// PATCH { status } — accept, sideline, or reset a speaker candidate (admin only).
// Accepting marks the opportunity as filled.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { status } = (await req.json().catch(() => ({}))) as { status?: string };
  if (!status || !STATUSES.includes(status as (typeof STATUSES)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const app = await prisma.speakerApplication.findUnique({ where: { id } });
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.speakerApplication.update({ where: { id }, data: { status } }),
    ...(status === "accepted"
      ? [
          prisma.speakerOpportunity.update({
            where: { id: app.opportunityId },
            data: { status: "filled" },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({ ok: true });
}
