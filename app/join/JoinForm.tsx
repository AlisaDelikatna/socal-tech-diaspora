"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Textarea, Field } from "@/components/ui";
import MemberAvatar from "@/components/MemberAvatar";
import RoleIndustryFields from "@/components/RoleIndustryFields";
import { OAUTH_LABELS, type OAuthProvider } from "@/lib/oauth-labels";

type OAuthPrefill = {
  provider: OAuthProvider;
  email: string;
  name: string;
  picture: string | null;
};

export default function JoinForm({ oauth }: { oauth?: OAuthPrefill | null }) {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref") ?? "";

  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, industries: formData.getAll("industries"), ref }),
    });

    setSubmitting(false);

    if (res.ok) {
      setDone(true);
      return;
    }

    const body = await res.json().catch(() => ({}));
    setError(body.error ?? "Something went wrong. Please try again.");
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <h2 className="text-xl font-bold">Application received 🎉</h2>
        <p className="mt-2 text-muted">
          Thanks for applying. A community organizer will review your
          application and you&apos;ll get an email once you&apos;re approved.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-brand hover:underline"
        >
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {ref && (
        <p className="rounded-lg bg-brand/5 border border-brand/20 px-3 py-2 text-sm">
          You were invited by a member — welcome!
        </p>
      )}

      {oauth && (
        <div className="flex items-center gap-3 rounded-lg bg-brand/5 border border-brand/20 px-3 py-2 text-sm">
          <MemberAvatar
            name={oauth.name || oauth.email}
            photoUrl={oauth.picture}
            size={40}
          />
          <span>
            Connected with {OAUTH_LABELS[oauth.provider]}. Finish the form below
            and you&apos;ll log in with {OAUTH_LABELS[oauth.provider]} once
            approved.{" "}
            <a href="/api/join/reset" className="text-brand hover:underline">
              Not you? Start over
            </a>
          </span>
        </div>
      )}

      <Field label="Full name" required>
        <Input
          name="name"
          required
          placeholder="Olena Kovalenko"
          defaultValue={oauth?.name}
        />
      </Field>

      <Field
        label="Email"
        required
        hint={
          oauth
            ? `From ${OAUTH_LABELS[oauth.provider]} — change it if you'd rather we use another email.`
            : "This becomes your login."
        }
      >
        <Input
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          defaultValue={oauth?.email}
        />
      </Field>

      {!oauth && (
        <Field label="Password" required hint="At least 8 characters.">
          <Input name="password" type="password" required minLength={8} />
        </Field>
      )}

      <Field
        label="LinkedIn profile URL"
        required
        hint="Shown on your profile so members can connect with you."
      >
        <Input
          name="linkedinUrl"
          type="url"
          required
          placeholder="https://linkedin.com/in/yourname"
        />
      </Field>

      <Field label="Current role / title" required>
        <Input name="title" required placeholder="Senior Frontend Engineer" />
      </Field>

      <Field label="Company / project">
        <Input name="company" placeholder="Acme Inc. (optional)" />
      </Field>

      <RoleIndustryFields />

      <Field
        label="What do you need from this community?"
        required
        hint="e.g. job leads, a co-founder, mentorship, investment"
      >
        <Textarea name="whatINeed" required rows={2} />
      </Field>

      <Field
        label="How can you help others?"
        required
        hint="e.g. hiring, can mentor, intros to investors, domain expertise"
      >
        <Textarea name="howICanHelp" required rows={2} />
      </Field>

      {!oauth?.picture && (
        <Field
          label="Profile photo URL"
          hint="Optional — you can add or upload a photo later from your profile."
        >
          <Input name="photoUrl" type="url" placeholder="https://..." />
        </Field>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <label className="flex items-start gap-2.5 text-sm text-muted">
        <input
          type="checkbox"
          name="emailConsent"
          required
          className="mt-0.5 h-4 w-4 shrink-0 accent-brand"
        />
        <span>
          By becoming a member, I agree to receive emails, newsletters, and
          event invitations from Kolo Founders Circle. I can unsubscribe at any
          time.
        </span>
      </label>

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Submitting…" : "Submit application"}
      </Button>

      <p className="text-center text-sm text-muted">
        Already a member?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
