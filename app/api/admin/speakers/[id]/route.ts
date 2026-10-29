import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { speakerOpportunitySchema } from "@/lib/validations";

// PATCH { topic?, description?, status? } — edit a speaker opportunity (admin only).
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = speakerOpportunitySchema
    .pick({ topic: true, description: true })
    .partial()
    .extend({ status: z.enum(["open", "filled", "closed"]).optional() })
    .safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    await prisma.speakerOpportunity.update({ where: { id }, data: parsed.data });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

// DELETE — remove a speaker opportunity and its applications (admin only).
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.speakerOpportunity.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}

