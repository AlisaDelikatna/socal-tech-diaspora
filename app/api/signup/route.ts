import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";
import { sendEmail, emailLayout } from "@/lib/email";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const email = data.email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  // Validate referral if present — ignore silently if it doesn't resolve.
  let invitedByUserId: string | null = null;
  if (data.ref) {
    const inviter = await prisma.user.findUnique({ where: { id: data.ref } });
    if (inviter) invitedByUserId = inviter.id;
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email,
      passwordHash,
      linkedinUrl: data.linkedinUrl,
      title: data.title,
      company: data.company || null,
      whatINeed: data.whatINeed,
      howICanHelp: data.howICanHelp,
      photoUrl: data.photoUrl || null,
      invitedByUserId,
      isApproved: false, // Admin approval required before login.
    },
  });

  // Confirmation email to the applicant.
  await sendEmail({
    to: email,
    subject: "Welcome to SoCal Tech Diaspora — application received",
    html: emailLayout(`
      <p>Hi ${user.name.split(" ")[0]},</p>
      <p>Thanks for applying to join <strong>SoCal Tech Diaspora</strong>. We've received your application and a community organizer will review it shortly.</p>
      <p>You'll get another email once your account is approved — then you can log in, complete your profile, connect with members, and RSVP to events.</p>
      <p>Glad to have you. Svoi means we've got your back.</p>
    `),
  });

  // Notify admins that a new application is pending.
  const admins = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { email: true },
  });
  if (admins.length > 0) {
    await sendEmail({
      to: admins.map((a) => a.email).join(","),
      subject: `New member application: ${user.name}`,
      html: emailLayout(`
        <p>A new member has applied and is pending approval:</p>
        <ul>
          <li><strong>Name:</strong> ${user.name}</li>
          <li><strong>Title:</strong> ${user.title}${user.company ? ` @ ${user.company}` : ""}</li>
          <li><strong>LinkedIn:</strong> <a href="${user.linkedinUrl}">${user.linkedinUrl}</a></li>
          <li><strong>Needs:</strong> ${user.whatINeed}</li>
          <li><strong>Can help:</strong> ${user.howICanHelp}</li>
        </ul>
        <p>Review pending members in the admin dashboard.</p>
      `),
    });
  }

  return NextResponse.json({ ok: true });
}
