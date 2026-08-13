"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Input, Field } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    const email = new FormData(e.currentTarget).get("email");
    await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSubmitting(false);
    setSent(true);
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <h1 className="text-2xl font-extrabold">Reset your password</h1>
      {sent ? (
        <div className="mt-6 rounded-lg bg-surface border border-border p-6 text-sm">
          If an account exists for that email, we&apos;ve sent a reset link.
          Check your inbox.
        </div>
      ) : (
        <>
          <p className="mt-1 text-muted text-sm">
            Enter your email and we&apos;ll send you a reset link.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field label="Email">
              <Input name="email" type="email" required />
            </Field>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        </>
      )}
      <p className="mt-6 text-center text-sm">
        <Link href="/login" className="text-brand hover:underline">
          Back to login
        </Link>
      </p>
    </div>
  );
}
