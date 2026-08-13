"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Textarea, Field } from "@/components/ui";

type EventItem = {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  address: string;
  rsvpCount: number;
};

// Convert an ISO string to the value format datetime-local expects.
function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function EventManager({ events }: { events: EventItem[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault();
    setBusy(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    const res = await fetch(id ? `/api/events/${id}` : "/api/events", {
      method: id ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setBusy(false);
    if (res.ok) {
      setEditingId(null);
      setCreating(false);
      router.refresh();
    }
  }

  async function remove(id: string) {
    setBusy(true);
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  function EventForm({ item }: { item?: EventItem }) {
    return (
      <form onSubmit={(e) => save(e, item?.id)} className="space-y-3">
        <Field label="Title" required>
          <Input name="title" required defaultValue={item?.title} />
        </Field>
        <Field label="Date & time" required>
          <Input
            name="dateTime"
            type="datetime-local"
            required
            defaultValue={item ? toLocalInput(item.dateTime) : ""}
          />
        </Field>
        <Field label="Address" required>
          <Input name="address" required defaultValue={item?.address} />
        </Field>
        <Field label="Description" required>
          <Textarea
            name="description"
            rows={3}
            required
            defaultValue={item?.description}
          />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>
            {item ? "Save" : "Create event"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setEditingId(null);
              setCreating(false);
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    );
  }

  return (
    <div className="space-y-4">
      {creating ? (
        <Card>
          <EventForm />
        </Card>
      ) : (
        <Button onClick={() => setCreating(true)}>+ New event</Button>
      )}

      <div className="space-y-3">
        {events.map((e) => (
          <Card key={e.id}>
            {editingId === e.id ? (
              <EventForm item={e} />
            ) : (
              <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                  <div className="font-semibold">{e.title}</div>
                  <div className="text-sm text-muted">
                    {new Date(e.dateTime).toLocaleString()} · {e.address}
                  </div>
                  <div className="text-xs text-muted mt-1">
                    {e.rsvpCount} RSVPs
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditingId(e.id)}>
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => remove(e.id)}
                    disabled={busy}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
        {events.length === 0 && (
          <p className="text-muted text-sm">No events yet.</p>
        )}
      </div>
    </div>
  );
}
