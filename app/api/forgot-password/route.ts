import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validations";
import { sendEmail, emailLayout } from "@/lib/email";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always return success — don't reveal whether an email is registered.
  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const resetUrl = `${base}/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Reset your SoCal Tech Diaspora password",
      html: emailLayout(`
        <p>Hi ${user.name.split(" ")[0]},</p>
        <p>We received a request to reset your password. Click below to set a new one. This link expires in 1 hour.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Reset password</a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `),
    });
  }

  return NextResponse.json({ ok: true });
}
