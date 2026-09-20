import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validations";
import { sendEmail, emailLayout } from "@/lib/email";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const { recipientId, body } = parsed.data;

  if (recipientId === session.user.id) {
    return NextResponse.json(
      { error: "You can't message yourself." },
      { status: 400 }
    );
  }

  const recipient = await prisma.user.findFirst({
    where: { id: recipientId, isApproved: true },
    select: { id: true, name: true, email: true },
  });
  if (!recipient) {
    return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
  }

  const message = await prisma.message.create({
    data: {
      senderId: session.user.id,
      recipientId,
      body,
    },
  });

  // Email notification — don't block the response on delivery.
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  await sendEmail({
    to: recipient.email,
    subject: `New message from ${session.user.name} on Kolo Founders Circle`,
    html: emailLayout(`
      <p>Hi ${recipient.name.split(" ")[0]},</p>
      <p>You have a new message from <strong>${session.user.name}</strong> on Kolo Founders Circle.</p>
      <p style="margin: 20px 0;">
        <a href="${base}/messages/${session.user.id}" style="background:#223A5E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Log in to reply</a>
      </p>
    `),
  });

  return NextResponse.json({ ok: true, id: message.id });
}
