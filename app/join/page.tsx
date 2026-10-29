import { Suspense } from "react";
import JoinForm from "./JoinForm";
import OAuthButtons from "@/components/OAuthButtons";
import { enabledOAuthProviders, getPendingOAuthProfile } from "@/lib/oauth";

export const metadata = {
  title: "Become a Member — Kolo Founders Circle",
};

export default async function JoinPage() {
  const oauth = await getPendingOAuthProfile();
  const providers = enabledOAuthProviders();

  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-extrabold">Become a Member</h1>
      <p className="mt-2 text-muted">
        Applications are reviewed by a community organizer before your profile
        goes live — it keeps this a trust-based space. You&apos;ll get an email
        once you&apos;re approved.
      </p>
      <div className="mt-8 space-y-4">
        {!oauth && providers.length > 0 && (
          <>
            <p className="text-sm text-muted">
              Save time: we&apos;ll fill in your name, email, and photo.
            </p>
            <OAuthButtons providers={providers} />
          </>
        )}
        <Suspense fallback={null}>
          <JoinForm
            oauth={
              oauth && {
                provider: oauth.provider,
                email: oauth.email,
                name: oauth.name,
                picture: oauth.picture,
              }
            }
          />
        </Suspense>
      </div>
    </div>
  );
}
