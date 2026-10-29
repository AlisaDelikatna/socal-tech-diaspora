import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// POST { userId, isAdmin } — grant or revoke admin access (admin only).
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, isAdmin } = (await req.json().catch(() => ({}))) as {
    userId?: string;
    isAdmin?: boolean;
  };
  if (!userId || typeof isAdmin !== "boolean") {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Prevent admins from locking themselves out.
  if (userId === session.user.id && !isAdmin) {
    return NextResponse.json(
      { error: "You can't remove your own admin access." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.isApproved) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  await prisma.user.update({ where: { id: userId }, data: { isAdmin } });
  return NextResponse.json({ ok: true });
}
