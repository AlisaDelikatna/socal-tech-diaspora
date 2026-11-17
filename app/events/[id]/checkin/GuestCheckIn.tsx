"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Input, Field } from "@/components/ui";

// Shown to people who aren't logged in: members log in, everyone else can
// tick the box and check in as a guest (which also starts an application).
export default function GuestCheckIn({ eventId, loginHref }: { eventId: string; loginHref: string }) {
  const [asGuest, setAsGuest] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<{ text: string; member?: boolean } | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch(`/api/events/${eventId}/checkin/guest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setDone(true);
      return;
    }
    const body = await res?.json().catch(() => null);
    setError({
      text: body?.error ?? "Couldn't reach the server. Check your connection and try again.",
      member: body?.member,
    });
  }

  if (done) {
    return (
      <div className="space-y-2">
        <p className="text-2xl font-bold text-brand">You&apos;re checked in. Welcome!</p>
        <p className="text-sm text-muted">
          We&apos;ve also started your membership application. You&apos;ll get an email once
          it&apos;s approved.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {!asGuest && (
        <Link
          href={loginHref}
          className="block rounded-lg bg-brand px-4 py-3 text-center font-medium text-white hover:bg-brand-dark"
        >
          Members: log in to check in
        </Link>
      )}

      <label className="flex items-center gap-3 rounded-lg border border-border bg-white px-4 py-3 cursor-pointer">
        <input
          type="checkbox"
          checked={asGuest}
          onChange={(e) => setAsGuest(e.target.checked)}
          className="h-5 w-5 accent-[var(--brand)]"
        />
        <span>I&apos;m not a member yet. Check in as a guest.</span>
      </label>

      {asGuest && (
        <form onSubmit={submit} className="space-y-3">
          <Field label="Full name" required>
            <Input name="name" required autoComplete="name" />
          </Field>
          <Field label="Email" required>
            <Input name="email" type="email" required autoComplete="email" />
          </Field>
          <Field label="LinkedIn profile" required>
            <Input name="linkedinUrl" required placeholder="linkedin.com/in/your-name" inputMode="url" />
          </Field>
          <Field label="Role / title" required>
            <Input name="title" required placeholder="e.g. Founder" autoComplete="organization-title" />
          </Field>
          <Field label="Company / project">
            <Input name="company" autoComplete="organization" />
          </Field>
          <p className="text-xs text-muted">
            We&apos;ll use these details to start your Kolo membership application.
          </p>
          {error && (
            <p className="text-sm text-red-600">
              {error.text}{" "}
              {error.member && (
                <Link href={loginHref} className="font-medium underline">
                  Log in
                </Link>
              )}
            </p>
          )}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Checking in..." : "Check in as a guest"}
          </Button>
        </form>
      )}
    </div>
  );
}
