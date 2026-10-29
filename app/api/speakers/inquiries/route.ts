import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { speakerInquirySchema } from "@/lib/validations";
import { sendBulkEmail, emailLayout, escapeHtml, textToHtml } from "@/lib/email";

// POST { topic, description, mediaUrl? } — a member pitches a talk of their
// own, outside any open speaker slot. Only approved members have a session.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = speakerInquirySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, title: true, company: true },
  });
  if (!me) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.speakerInquiry.create({
    data: {
      userId: session.user.id,
      topic: d.topic,
      description: d.description,
      mediaUrl: d.mediaUrl || null,
    },
  });

  // Let the admins know there's a talk idea to review.
  const admins = await prisma.user.findMany({
    where: { isAdmin: true, isApproved: true },
    select: { email: true },
  });
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const who = [me.title, me.company].filter(Boolean).join(", ");
  await sendBulkEmail(
    admins.map((a) => ({
      to: a.email,
      subject: `New talk idea from ${me.name}: ${d.topic}`,
      html: emailLayout(`
        <p><strong>${escapeHtml(me.name)}</strong>${who ? ` (${escapeHtml(who)})` : ""} would like to speak at a Kolo event.</p>
        <p style="font-size:16px;font-weight:600;margin-bottom:4px;">${escapeHtml(d.topic)}</p>
        <div style="border-left:3px solid #e5e7eb;padding-left:12px;color:#374151;">${textToHtml(d.description)}</div>
        ${d.mediaUrl ? `<p><strong>Video / demo:</strong> <a href="${escapeHtml(d.mediaUrl)}">${escapeHtml(d.mediaUrl)}</a></p>` : ""}
        <p style="margin: 20px 0;">
          <a href="${base}/admin#talk-ideas" style="background:#223A5E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Review in admin</a>
        </p>
      `),
    }))
  );

  return NextResponse.json({ ok: true });
}
