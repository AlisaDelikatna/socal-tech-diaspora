import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations";
import { sendEmail, emailLayout } from "@/lib/email";
import { storeAvatarFromUrl } from "@/lib/avatar";
import {
  getPendingOAuthProfile,
  clearPendingOAuthProfile,
  oauthIdField,
} from "@/lib/oauth";

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

  // Applicants who came via LinkedIn/Google sign-in log in that way, so
  // they don't need a password.
  const oauth = await getPendingOAuthProfile();
  const viaOAuth = !!oauth;
  if (!viaOAuth && (!data.password || data.password.length < 8)) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const linkedAlready =
    oauth &&
    (await prisma.user.findFirst({
      where: { [oauthIdField(oauth.provider)]: oauth.providerAccountId },
    }));
  if (existing || linkedAlready) {
    return NextResponse.json(
      {
        error: existing
          ? "An account with that email already exists."
          : "That LinkedIn/Google account is already linked to a member. Try logging in instead.",
      },
      { status: 409 }
    );
  }

  // Validate referral if present — ignore silently if it doesn't resolve.
  let invitedByUserId: string | null = null;
  if (data.ref) {
    const inviter = await prisma.user.findUnique({ where: { id: data.ref } });
    if (inviter) invitedByUserId = inviter.id;
  }

  // OAuth applicants get a random, unknowable password; they can set a real
  // one later via "Forgot your password?".
  const passwordHash = await bcrypt.hash(
    data.password || crypto.randomUUID() + crypto.randomUUID(),
    10
  );

  let user;
  try {
    user = await prisma.user.create({
      data: {
        name: data.name,
        email,
        passwordHash,
        linkedinUrl: data.linkedinUrl,
        title: data.title,
        company: data.company || null,
        role: data.role,
        industries: data.industries,
        whatINeed: data.whatINeed,
        howICanHelp: data.howICanHelp,
        photoUrl: data.photoUrl || null,
        invitedByUserId,
        isApproved: false,
        ...(oauth && { [oauthIdField(oauth.provider)]: oauth.providerAccountId }),
      },
    });
  } catch (err) {
    console.error("[signup] DB error:", err);
    return NextResponse.json(
      { error: "Database error: " + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    );
  }

  if (viaOAuth) {
    if (!user.photoUrl && oauth.picture) {
      const photoUrl = await storeAvatarFromUrl(user.id, oauth.picture);
      if (photoUrl) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { photoUrl },
        });
      }
    }
    await clearPendingOAuthProfile();
  }

  // Confirmation email to the applicant.
  await sendEmail({
    to: email,
    subject: "Welcome to Kolo Founders Circle — application received",
    html: emailLayout(`
      <p>Hi ${user.name.split(" ")[0]},</p>
      <p>Thanks for applying to join <strong>Kolo Founders Circle</strong>. We've received your application and a community organizer will review it shortly.</p>
      <p>You'll get another email once your account is approved — then you can log in, complete your profile, connect with members, and RSVP to events.</p>
      <p>Glad to have you. We've got your back.</p>
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
