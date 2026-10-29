import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { speakerApplicationSchema } from "@/lib/validations";
import { sendBulkEmail, emailLayout, escapeHtml, textToHtml } from "@/lib/email";

// POST — a member applies to speak, or recommends someone else.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = speakerApplicationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const d = parsed.data;

  const [opportunity, me] = await Promise.all([
    prisma.speakerOpportunity.findUnique({
      where: { id: d.opportunityId },
      include: { event: { select: { title: true } } },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, title: true, company: true, linkedinUrl: true },
    }),
  ]);
  if (!opportunity || !me) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (opportunity.status !== "open") {
    return NextResponse.json(
      { error: "This speaker spot is no longer open" },
      { status: 409 }
    );
  }

  const candidate = d.isSelf
    ? {
        candidateName: me.name,
        candidateEmail: me.email,
        candidateTitle: [me.title, me.company].filter(Boolean).join(", "),
        candidateLinkedin: me.linkedinUrl,
      }
    : {
        candidateName: d.candidateName!.trim(),
        candidateEmail: d.candidateEmail!.trim(),
        candidateTitle: d.candidateTitle?.trim() || null,
        candidateLinkedin: d.candidateLinkedin?.trim() || null,
      };

  await prisma.speakerApplication.create({
    data: {
      opportunityId: opportunity.id,
      submittedByUserId: session.user.id,
      isSelf: d.isSelf,
      pitch: d.pitch.trim(),
      ...candidate,
    },
  });

  // Let the admins know there's someone to review.
  const admins = await prisma.user.findMany({
    where: { isAdmin: true, isApproved: true },
    select: { email: true },
  });
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  await sendBulkEmail(
    admins.map((a) => ({
      to: a.email,
      subject: `New speaker candidate: ${candidate.candidateName}`,
      html: emailLayout(`
        <p><strong>${escapeHtml(candidate.candidateName)}</strong>${
          candidate.candidateTitle ? ` (${escapeHtml(candidate.candidateTitle)})` : ""
        } ${d.isSelf ? "applied" : `was recommended by ${escapeHtml(me.name)}`} to speak at <strong>${escapeHtml(opportunity.event.title)}</strong> on &ldquo;${escapeHtml(opportunity.topic)}&rdquo;.</p>
        <div style="border-left:3px solid #e5e7eb;padding-left:12px;color:#374151;">${textToHtml(d.pitch)}</div>
        <p style="margin: 20px 0;">
          <a href="${base}/admin#speakers" style="background:#223A5E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Review in admin</a>
        </p>
      `),
    }))
  );

  return NextResponse.json({ ok: true });
}
