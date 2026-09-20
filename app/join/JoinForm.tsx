"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button, Input, Textarea, Field } from "@/components/ui";

export default function JoinForm() {
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
    const data = Object.fromEntries(new FormData(form).entries());

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, ref }),
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

      <Field label="Full name" required>
        <Input name="name" required placeholder="Olena Kovalenko" />
      </Field>

      <Field label="Email" required hint="This becomes your login.">
        <Input name="email" type="email" required placeholder="you@example.com" />
      </Field>

      <Field label="Password" required hint="At least 8 characters.">
        <Input name="password" type="password" required minLength={8} />
      </Field>

      <Field
        label="LinkedIn profile URL"
        required
        hint="We link out to this — we don't pull data from LinkedIn."
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

      <Field
        label="Profile photo URL"
        hint="Optional — you can add or upload a photo later from your profile."
      >
        <Input name="photoUrl" type="url" placeholder="https://..." />
      </Field>

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
