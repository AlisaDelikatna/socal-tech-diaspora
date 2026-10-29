import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { sendBulkEmail, emailLayout, escapeHtml, textToHtml } from "@/lib/email";
import { formatEventDate, formatEventTimeRange } from "@/lib/time";

// POST { userIds, note? } — email the chosen approved members about a speaker
// opportunity (admin only). Replies go to REPLY_TO (lib/email.ts).
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { note, userIds } = (await req.json().catch(() => ({}))) as {
    note?: string;
    userIds?: string[];
  };
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return NextResponse.json({ error: "Choose at least one member" }, { status: 400 });
  }

  const opp = await prisma.speakerOpportunity.findUnique({
    where: { id },
    include: { event: true },
  });
  if (!opp) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (opp.status !== "open") {
    return NextResponse.json(
      { error: "Reopen this opportunity before sending invites" },
      { status: 409 }
    );
  }

  const members = await prisma.user.findMany({
    where: { isApproved: true, id: { in: userIds } },
    select: { name: true, email: true },
  });

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const date = new Date(opp.event.dateTime);
  const when = `${formatEventDate(date, {
    weekday: "long",
    month: "long",
    day: "numeric",
  })}, ${formatEventTimeRange(date, opp.event.endDateTime)}`;
  const where = opp.event.publicLocation ?? opp.event.address;

  const { sent, error } = await sendBulkEmail(
    members.map((m) => ({
      to: m.email,
      subject: `We're looking for a speaker: ${opp.topic}`,
      html: emailLayout(`
        <p>Hi ${escapeHtml(m.name.split(" ")[0])},</p>
        ${note?.trim() ? textToHtml(note) : ""}
        <p>We have a speaker spot open at <strong>${escapeHtml(opp.event.title)}</strong> (${when}, ${escapeHtml(where)}).</p>
        <p style="font-size:16px;font-weight:600;margin-bottom:4px;">${escapeHtml(opp.topic)}</p>
        <div style="color:#374151;">${textToHtml(opp.description)}</div>
        <p>Would you like to speak, or do you know someone who'd be great? Apply or recommend them here:</p>
        <p style="margin: 20px 0;">
          <a href="${base}/events/${opp.event.id}#speak" style="background:#223A5E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Apply or recommend a speaker</a>
        </p>
        <p style="color:#6b7280;font-size:13px;">You can also just reply to this email.</p>
      `),
    }))
  );

  if (sent === 0) {
    return NextResponse.json(
      { error: `No emails could be sent. Resend said: ${error ?? "unknown error"}` },
      { status: 502 }
    );
  }

  await prisma.speakerOpportunity.update({
    where: { id },
    data: { invitedAt: new Date(), inviteCount: sent },
  });

  return NextResponse.json({ ok: true, sent, total: members.length });
}
