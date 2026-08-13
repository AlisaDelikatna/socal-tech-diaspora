"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Field } from "@/components/ui";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const password = new FormData(e.currentTarget).get("password");
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setSubmitting(false);

    if (res.ok) {
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
      return;
    }
    const body = await res.json().catch(() => ({}));
    setError(body.error ?? "Something went wrong.");
  }

  if (!token) {
    return (
      <p className="mt-6 text-sm text-red-700">
        Missing reset token. Please use the link from your email.
      </p>
    );
  }

  if (done) {
    return (
      <p className="mt-6 rounded-lg bg-surface border border-border p-6 text-sm">
        Password updated. Redirecting you to login…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <Field label="New password">
        <Input name="password" type="password" required minLength={8} />
      </Field>
      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Saving…" : "Update password"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-brand hover:underline">
          Back to login
        </Link>
      </p>
    </form>
  );
}
