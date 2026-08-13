"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Textarea, Field } from "@/components/ui";
import MemberAvatar from "@/components/MemberAvatar";

type Initial = {
  name: string;
  title: string;
  company: string;
  pronouns: string;
  bio: string;
  linkedinUrl: string;
  whatINeed: string;
  howICanHelp: string;
  photoUrl: string;
  tags: string[];
};

export default function ProfileForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl);
  const [name, setName] = useState(initial.name);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: form });
    setUploading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Photo upload failed.");
      return;
    }

    const { url } = await res.json();
    setPhotoUrl(url);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSaved(false);

    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, photoUrl }),
    });

    setSubmitting(false);

    if (res.ok) {
      setSaved(true);
      router.refresh();
      return;
    }
    const body = await res.json().catch(() => ({}));
    setError(body.error ?? "Could not save. Please check your inputs.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Photo upload */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <MemberAvatar name={name || "You"} photoUrl={photoUrl} size={72} />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
              <span className="text-white text-xs">...</span>
            </div>
          )}
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handlePhotoChange}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : photoUrl ? "Change photo" : "Upload photo"}
          </Button>
          <p className="mt-1 text-xs text-muted">JPEG, PNG, WebP or GIF · max 5 MB</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" required>
          <Input
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Pronouns">
          <Input name="pronouns" defaultValue={initial.pronouns} />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Role / title" required>
          <Input name="title" required defaultValue={initial.title} />
        </Field>
        <Field label="Company / project">
          <Input name="company" defaultValue={initial.company} />
        </Field>
      </div>

      <Field label="LinkedIn URL" required>
        <Input
          name="linkedinUrl"
          type="url"
          required
          defaultValue={initial.linkedinUrl}
        />
      </Field>

      <Field label="Bio / background">
        <Textarea name="bio" rows={4} defaultValue={initial.bio} />
      </Field>

      <Field label="What I need" required>
        <Textarea name="whatINeed" rows={2} required defaultValue={initial.whatINeed} />
      </Field>

      <Field label="How I can help" required>
        <Textarea name="howICanHelp" rows={2} required defaultValue={initial.howICanHelp} />
      </Field>

      <Field
        label="Skills / tags"
        hint="Comma-separated, e.g. React, fundraising, product design"
      >
        <Input name="tags" defaultValue={initial.tags.join(", ")} />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-3 py-2 text-sm">
          Profile saved.
        </p>
      )}

      <Button type="submit" disabled={submitting || uploading}>
        {submitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
