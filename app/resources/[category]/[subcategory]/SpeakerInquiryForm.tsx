"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input, Textarea } from "@/components/ui";

// Members pitch a talk of their own, outside any open speaker slot.
export default function SpeakerInquiryForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ topic: "", description: "", mediaUrl: "" });
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
    const res = await fetch("/api/speakers/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
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
    setForm({ topic: "", description: "", mediaUrl: "" });
    setOpen(false);
    setDone(true);
    router.refresh();
  }

  if (!open) {
    return (
      <div className="space-y-3">
        {done && (
          <p className="text-sm font-medium text-brand">
            Thank you. We received your talk idea and will be in touch by email.
          </p>
        )}
        <Button onClick={() => { setDone(false); setOpen(true); }}>
          {done ? "Pitch another talk" : "Pitch a talk"}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Topic" required>
        <Input
          value={form.topic}
          onChange={(e) => set("topic", e.target.value)}
          placeholder="What we learned launching our first B2B product in the US"
          required
          maxLength={200}
        />
      </Field>
      <Field
        label="Description"
        required
        hint="What you'd cover, who it's for, and what people will take away."
      >
        <Textarea
          rows={5}
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          required
          minLength={20}
          maxLength={3000}
        />
      </Field>
      <Field
        label="Link to a video or demo"
        hint="Optional: a recording of a past talk, a product demo, or slides."
      >
        <Input
          type="url"
          value={form.mediaUrl}
          onChange={(e) => set("mediaUrl", e.target.value)}
          placeholder="https://youtube.com/..."
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
