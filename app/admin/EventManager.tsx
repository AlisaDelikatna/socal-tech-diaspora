"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Textarea, Field } from "@/components/ui";

type Attendee = {
  id: string;
  name: string;
  email: string;
  title: string;
  company: string | null;
};

type EventItem = {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  address: string;
  rsvpCount: number;
  attendees: Attendee[];
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
  const [error, setError] = useState<string | null>(null);
  const [rsvpOpenId, setRsvpOpenId] = useState<string | null>(null);

  async function save(e: React.FormEvent<HTMLFormElement>, id?: string) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    let res: Response;
    try {
      res = await fetch(id ? `/api/events/${id}` : "/api/events", {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      setBusy(false);
      setError("Network error — could not reach the server. Please try again.");
      return;
    }
    setBusy(false);
    if (res.ok) {
      setEditingId(null);
      setCreating(false);
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error || `Save failed (${res.status}). Please try again.`);
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
        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
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
              <div>
                <div className="flex justify-between items-start gap-4 flex-wrap">
                  <div>
                    <div className="font-semibold">{e.title}</div>
                    <div className="text-sm text-muted">
                      {new Date(e.dateTime).toLocaleString()} · {e.address}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setRsvpOpenId(rsvpOpenId === e.id ? null : e.id)
                      }
                      disabled={e.rsvpCount === 0}
                      className="text-xs text-brand hover:underline mt-1 disabled:text-muted disabled:no-underline disabled:cursor-default"
                    >
                      {e.rsvpCount} {e.rsvpCount === 1 ? "RSVP" : "RSVPs"}
                      {e.rsvpCount > 0 &&
                        (rsvpOpenId === e.id ? " ▲" : " — view ▼")}
                    </button>
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

                {rsvpOpenId === e.id && e.attendees.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                        Attendees ({e.attendees.length})
                      </span>
                      <a
                        href={`mailto:?bcc=${e.attendees
                          .map((a) => a.email)
                          .join(",")}`}
                        className="text-xs text-brand hover:underline"
                      >
                        Email all (BCC)
                      </a>
                    </div>
                    <ul className="space-y-1.5">
                      {e.attendees.map((a) => (
                        <li
                          key={a.id}
                          className="flex justify-between items-baseline gap-3 text-sm"
                        >
                          <span>
                            <span className="font-medium">{a.name}</span>
                            <span className="text-muted">
                              {a.title ? ` · ${a.title}` : ""}
                              {a.company ? ` @ ${a.company}` : ""}
                            </span>
                          </span>
                          <a
                            href={`mailto:${a.email}`}
                            className="text-muted hover:text-brand shrink-0"
                          >
                            {a.email}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
