import { Suspense } from "react";
import Link from "next/link";
import LoginForm from "./LoginForm";
import OAuthButtons from "@/components/OAuthButtons";
import { enabledOAuthProviders } from "@/lib/oauth";

const ERRORS: Record<string, string> = {
  pending:
    "Your account is still pending approval. We'll email you once it's live.",
  oauth: "We couldn't get your email from that account. Please log in with your password.",
  AccessDenied: "Sign-in didn't go through. Please try again.",
  Configuration: "Sign-in didn't go through. Please try again.",
};

export const metadata = {
  title: "Log in — Kolo Founders Circle",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { error, callbackUrl } = await searchParams;
  const message = typeof error === "string" ? ERRORS[error] : undefined;

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-2xl font-extrabold">Welcome back</h1>
      <p className="mt-1 text-muted text-sm">
        Log in to connect with members, message, and RSVP.
      </p>
      <div className="mt-8 space-y-4">
        {message && (
          <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
            {message}
          </p>
        )}
        <OAuthButtons
          providers={enabledOAuthProviders()}
          callbackUrl={typeof callbackUrl === "string" ? callbackUrl : "/members"}
        />
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-sm text-muted">
        Not a member yet?{" "}
        <Link href="/join" className="text-brand hover:underline">
          Apply to join
        </Link>
      </p>
    </div>
  );
}
