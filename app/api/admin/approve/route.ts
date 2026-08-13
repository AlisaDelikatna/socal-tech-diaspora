import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, emailLayout } from "@/lib/email";

// POST { userId, action: "approve" | "reject" } — admin moderation of applicants.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, action } = (await req.json().catch(() => ({}))) as {
    userId?: string;
    action?: "approve" | "reject";
  };

  if (!userId || !action) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (action === "reject") {
    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ ok: true });
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isApproved: true },
  });

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  await sendEmail({
    to: user.email,
    subject: "You're in — welcome to SoCal Tech Diaspora",
    html: emailLayout(`
      <p>Hi ${user.name.split(" ")[0]},</p>
      <p>Your membership has been approved 🎉 You can now log in, complete your profile, connect with members, and RSVP to events.</p>
      <p style="margin: 20px 0;">
        <a href="${base}/login" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Log in</a>
      </p>
      <p>Welcome to the community. Svoi.</p>
    `),
  });

  return NextResponse.json({ ok: true });
}
