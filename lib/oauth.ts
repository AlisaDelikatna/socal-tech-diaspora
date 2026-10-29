import { cookies } from "next/headers";
import { encode, decode } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

import type { OAuthProvider } from "@/lib/oauth-labels";

export type { OAuthProvider };

// Social sign-in providers are switched on by their env vars, so the buttons
// only appear once the keys are configured.
export function enabledOAuthProviders(): OAuthProvider[] {
  const enabled: OAuthProvider[] = [];
  if (process.env.AUTH_LINKEDIN_ID && process.env.AUTH_LINKEDIN_SECRET) {
    enabled.push("linkedin");
  }
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    enabled.push("google");
  }
  return enabled;
}

// When someone signs in with LinkedIn/Google but isn't a member yet, we keep
// their verified profile in a short-lived encrypted cookie so the join form
// can pre-fill it and the signup API can trust the email and photo.
const COOKIE = "kolo-oauth-profile";
const SALT = "kolo-oauth-profile";
const MAX_AGE = 30 * 60;

export type PendingOAuthProfile = {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  name: string;
  picture: string | null;
};

export async function setPendingOAuthProfile(profile: PendingOAuthProfile) {
  const token = await encode({
    token: profile,
    secret: process.env.AUTH_SECRET!,
    salt: SALT,
    maxAge: MAX_AGE,
  });
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getPendingOAuthProfile(): Promise<PendingOAuthProfile | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const data = await decode({
    token,
    secret: process.env.AUTH_SECRET!,
    salt: SALT,
  }).catch(() => null);
  if (!data?.email || !data.provider || !data.providerAccountId) return null;
  return {
    provider: data.provider as OAuthProvider,
    providerAccountId: String(data.providerAccountId),
    email: String(data.email),
    name: String(data.name ?? ""),
    picture: (data.picture as string | null) ?? null,
  };
}

export async function clearPendingOAuthProfile() {
  (await cookies()).delete(COOKIE);
}

export function oauthIdField(provider: OAuthProvider) {
  return provider === "linkedin" ? "linkedinId" : "googleId";
}

// Find the member for a social sign-in: by linked provider id first, then by
// email (linking the provider id on first use).
export async function findMemberForOAuth(
  provider: OAuthProvider,
  providerAccountId: string,
  email: string | null | undefined
) {
  const field = oauthIdField(provider);
  const linked = await prisma.user.findUnique({
    where: { [field]: providerAccountId } as { linkedinId: string },
  });
  if (linked || !email) return linked;

  const byEmail = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (byEmail && !byEmail[field]) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: { [field]: providerAccountId },
    });
  }
  return byEmail;
}
