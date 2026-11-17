import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
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

  // Guests who applied by checking in at an event never chose a password
  // (the guest form doesn't ask for "needs" / "can help" either), so their
  // email gets a link to set one. It lasts a week rather than an hour.
  const isGuest = !user.whatINeed && !user.howICanHelp && !user.linkedinId && !user.googleId;
  const resetToken = isGuest ? crypto.randomBytes(32).toString("hex") : null;

  await prisma.user.update({
    where: { id: userId },
    data: {
      isApproved: true,
      ...(resetToken && {
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    },
  });

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const button = resetToken
    ? { href: `${base}/reset-password?token=${resetToken}`, label: "Set your password" }
    : { href: `${base}/login`, label: "Log in" };
  await sendEmail({
    to: user.email,
    subject: "You're in — welcome to Kolo Founders Circle",
    html: emailLayout(`
      <p>Hi ${user.name.split(" ")[0]},</p>
      <p>Your membership has been approved 🎉 You can now log in, complete your profile, connect with members, and RSVP to events.</p>
      <p style="margin: 20px 0;">
        <a href="${button.href}" style="background:#223A5E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">${button.label}</a>
      </p>${
        resetToken
          ? `<p style="color:#6b7280;font-size:13px;">This link works for 7 days. After that, use &ldquo;Forgot your password?&rdquo; on the login page.</p>`
          : ""
      }
      <p>You&rsquo;re now part of the circle.</p>
    `),
  });

  return NextResponse.json({ ok: true });
}
