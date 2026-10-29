import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { speakerReplySchema } from "@/lib/validations";
import { sendEmail, emailLayout, textToHtml } from "@/lib/email";

// POST { subject, body } — email a speaker candidate from the admin dashboard
// (admin only). The candidate's reply goes to REPLY_TO (lib/email.ts).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const json = await req.json().catch(() => null);
  const parsed = speakerReplySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Add a subject and a message" }, { status: 400 });
  }

  const app = await prisma.speakerApplication.findUnique({ where: { id } });
  if (!app) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ok = await sendEmail({
    to: app.candidateEmail,
    subject: parsed.data.subject,
    html: emailLayout(textToHtml(parsed.data.body)),
  });
  if (!ok) {
    return NextResponse.json(
      { error: "The email couldn't be sent. Try again, or email them directly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
