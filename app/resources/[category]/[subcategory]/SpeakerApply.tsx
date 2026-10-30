"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Textarea } from "@/components/ui";

// Apply-to-speak / recommend-a-speaker form for one speaker opportunity.
export default function SpeakerApply({ opportunityId }: { opportunityId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSelf, setIsSelf] = useState(true);
  const [form, setForm] = useState({
    candidateName: "",
    candidateEmail: "",
    candidateTitle: "",
    candidateLinkedin: "",
    pitch: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/speakers/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ opportunityId, isSelf, ...form }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const first = data.details
        ? (Object.values(data.details).flat()[0] as string | undefined)
        : undefined;
      setError(first ?? data.error ?? "Something went wrong. Please try again.");
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <p className="text-sm font-medium text-brand">
        Thank you. We received it and will be in touch by email.
      </p>
    );
  }

  if (!open) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { setIsSelf(true); setOpen(true); }}>
          I&apos;d like to speak
        </Button>
        <Button variant="outline" onClick={() => { setIsSelf(false); setOpen(true); }}>
          Recommend someone
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" checked={isSelf} onChange={() => setIsSelf(true)} />
          I&apos;d like to speak
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" checked={!isSelf} onChange={() => setIsSelf(false)} />
          Recommend someone
        </label>
      </div>

      {!isSelf && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Their name" required>
            <Input
              value={form.candidateName}
              onChange={(e) => set("candidateName", e.target.value)}
              required
            />
          </Field>
          <Field label="Their email" required hint="We'll reach out to them directly.">
            <Input
              type="email"
              value={form.candidateEmail}
              onChange={(e) => set("candidateEmail", e.target.value)}
              required
            />
          </Field>
          <Field label="Role and firm">
            <Input
              value={form.candidateTitle}
              onChange={(e) => set("candidateTitle", e.target.value)}
              placeholder="Partner, Example Ventures"
            />
          </Field>
          <Field label="LinkedIn">
            <Input
              type="url"
              value={form.candidateLinkedin}
              onChange={(e) => set("candidateLinkedin", e.target.value)}
              placeholder="https://linkedin.com/in/..."
            />
          </Field>
        </div>
      )}

      <Field
        label={isSelf ? "What would you talk about?" : "Why would they be a great fit?"}
        required
        hint={isSelf ? "We'll use your profile details and email to follow up." : undefined}
      >
        <Textarea
          rows={4}
          value={form.pitch}
          onChange={(e) => set("pitch", e.target.value)}
          required
          minLength={20}
        />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>
          {busy ? "Sending..." : "Submit"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
