"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Textarea, Field } from "@/components/ui";
import { CATEGORIES, getSubcategoryLabel } from "@/lib/resources";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
  category: string;
  subcategory: string;
};

export default function ResourceManager({ resources }: { resources: Resource[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<"education" | "opportunities">("education");

  const subcategories = CATEGORIES[category].subcategories;

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch("/api/resources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, isPublished: true }),
    });
    setBusy(false);
    if (res.ok) {
      setCreating(false);
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    await fetch(`/api/resources/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {creating ? (
        <Card>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category" required>
                <select
                  name="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value as "education" | "opportunities")}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <option value="education">Education</option>
                  <option value="opportunities">Opportunities</option>
                </select>
              </Field>
              <Field label="Subcategory" required>
                <select
                  name="subcategory"
                  required
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                >
                  {Object.entries(subcategories).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Title" required>
              <Input name="title" required />
            </Field>
            <Field label="URL">
              <Input name="url" type="url" placeholder="https://…" />
            </Field>
            <Field label="Description">
              <Textarea name="description" rows={2} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>Add resource</Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button onClick={() => setCreating(true)}>+ Add resource</Button>
      )}

      <div className="space-y-2">
        {resources.length === 0 && (
          <p className="text-sm text-muted">No resources yet.</p>
        )}
        {resources.map((r) => (
          <Card key={r.id} className="flex items-start justify-between gap-4">
            <div>
              <div className="font-medium">{r.title}</div>
              <div className="text-xs text-muted mt-0.5">
                {CATEGORIES[r.category as keyof typeof CATEGORIES]?.label} →{" "}
                {getSubcategoryLabel(r.subcategory)}
              </div>
              {r.url && (
                <a href={r.url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-brand hover:underline">{r.url}</a>
              )}
              {r.description && (
                <p className="text-sm text-muted mt-1">{r.description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              onClick={() => handleDelete(r.id)}
              disabled={busy}
              className="shrink-0 text-red-500 hover:text-red-700"
            >
              Delete
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
