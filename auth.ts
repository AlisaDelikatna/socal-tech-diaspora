import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import LinkedIn from "next-auth/providers/linkedin";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
import { storeAvatarFromUrl } from "@/lib/avatar";
import {
  enabledOAuthProviders,
  setPendingOAuthProfile,
  findMemberForOAuth,
  type OAuthProvider,
} from "@/lib/oauth";

// Client ID/secret are read from AUTH_LINKEDIN_* / AUTH_GOOGLE_* env vars.
const oauthProviders = enabledOAuthProviders().map((id) =>
  id === "linkedin" ? LinkedIn : Google
);

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        // Gate login on admin approval — this is a trust-based community.
        if (!user.isApproved) {
          throw new Error("PENDING_APPROVAL");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
        };
      },
    }),
    ...oauthProviders,
  ],
  callbacks: {
    // LinkedIn/Google sign-in: members are matched by linked provider id or
    // email. Approved members get in; everyone else is sent to the join form
    // with their profile.
    async signIn({ account, profile }) {
      if (!account || account.provider === "credentials") return true;

      const email = profile?.email?.toLowerCase();
      if (!email) return "/login?error=oauth";
      const picture = typeof profile?.picture === "string" ? profile.picture : null;

      const provider = account.provider as OAuthProvider;
      const member = await findMemberForOAuth(
        provider,
        account.providerAccountId,
        email
      );
      if (!member) {
        await setPendingOAuthProfile({
          provider,
          providerAccountId: account.providerAccountId,
          email,
          name: profile?.name ?? "",
          picture,
        });
        return "/join?via=oauth";
      }
      if (!member.isApproved) return "/login?error=pending";

      if (!member.photoUrl && picture) {
        const photoUrl = await storeAvatarFromUrl(member.id, picture);
        if (photoUrl) {
          await prisma.user.update({
            where: { id: member.id },
            data: { photoUrl },
          });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (user && account && account.provider !== "credentials") {
        // The OAuth user id is the provider's; swap in our member id.
        const member = await findMemberForOAuth(
          account.provider as OAuthProvider,
          account.providerAccountId,
          user.email
        );
        // signIn() above only lets existing, approved members through.
        if (member) {
          token.id = member.id;
          token.isAdmin = member.isAdmin;
        }
      } else if (user) {
        token.id = user.id as string;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
      } else if (token.id) {
        // Re-read the member so admin grants/revocations apply without
        // re-login, and deleted members are signed out.
        let fresh: { isAdmin: boolean; isApproved: boolean } | null;
        try {
          fresh = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { isAdmin: true, isApproved: true },
          });
        } catch {
          return token; // DB hiccup: keep the session as-is
        }
        if (!fresh || !fresh.isApproved) return null;
        token.isAdmin = fresh.isAdmin;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = (token.isAdmin as boolean) ?? false;
      }
      return session;
    },
  },
});
