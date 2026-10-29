"use client";

import { signIn } from "next-auth/react";
import { OAUTH_LABELS, type OAuthProvider } from "@/lib/oauth-labels";

export default function OAuthButtons({
  providers,
  callbackUrl = "/members",
}: {
  providers: OAuthProvider[];
  callbackUrl?: string;
}) {
  if (providers.length === 0) return null;

  return (
    <div className="space-y-2">
      {providers.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => signIn(p, { callbackUrl })}
          className="w-full rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-surface"
        >
          Continue with {OAUTH_LABELS[p]}
        </button>
      ))}
      <div className="flex items-center gap-3 py-1 text-xs text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
