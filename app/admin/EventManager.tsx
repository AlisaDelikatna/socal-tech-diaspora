"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Textarea, Field } from "@/components/ui";
import { formatEventDate, toEventInput } from "@/lib/time";
import MemberInvitePanel, { type InviteMember } from "./MemberInvitePanel";

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
  endDateTime: string | null;
  address: string;
  publicLocation: string | null;
  capacity: number | null;
  rsvpCount: number;
  attendees: Attendee[];
  invitedAt: string | null;
  inviteCount: number;
  reminderSentAt: string | null;
};

export default function EventManager({
  events,
  members,
}: {
  events: EventItem[];
  members: InviteMember[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rsvpOpenId, setRsvpOpenId] = useState<string | null>(null);
  // Which event's email panel is open, and for what.
  const [panel, setPanel] = useState<{ id: string; kind: "invite" | "remind" } | null>(null);
  const [inviteMessage, setInviteMessage] = useState<{ id: string; text: string } | null>(null);

  function togglePanel(id: string, kind: "invite" | "remind") {
    setPanel(panel?.id === id && panel.kind === kind ? null : { id, kind });
  }

  // Attendees in the shape the email panel expects, with role/industry
  // details from the member list when available.
  function attendeeRecipients(e: EventItem): InviteMember[] {
    return e.attendees.map(
      (a) =>
        members.find((m) => m.id === a.id) ?? {
          id: a.id,
          name: a.name,
          title: a.title,
          company: a.company,
          role: null,
          industries: [],
        }
    );
  }

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
            defaultValue={item ? toEventInput(item.dateTime) : ""}
          />
        </Field>
        <Field label="End time">
          <Input
            name="endDateTime"
            type="datetime-local"
            defaultValue={item?.endDateTime ? toEventInput(item.endDateTime) : ""}
          />
        </Field>
        <Field label="Address" required>
          <Input name="address" required defaultValue={item?.address} />
        </Field>
        <Field label="Public location (hides address until RSVP)">
          <Input
            name="publicLocation"
            placeholder="e.g. Los Angeles"
            defaultValue={item?.publicLocation ?? ""}
          />
        </Field>
        <Field label="Capacity (leave empty for unlimited)">
          <Input
            name="capacity"
            type="number"
            min={1}
            defaultValue={item?.capacity ?? ""}
          />
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
                      {formatEventDate(e.dateTime, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}{" "}
                      · {e.address}
                      {e.publicLocation && ` (public: ${e.publicLocation})`}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setRsvpOpenId(rsvpOpenId === e.id ? null : e.id)
                      }
                      disabled={e.rsvpCount === 0}
                      className="text-xs text-brand hover:underline mt-1 disabled:text-muted disabled:no-underline disabled:cursor-default"
                    >
                      {e.rsvpCount}
                      {e.capacity != null && ` / ${e.capacity}`}{" "}
                      {e.rsvpCount === 1 ? "RSVP" : "RSVPs"}
                      {e.rsvpCount > 0 &&
                        (rsvpOpenId === e.id ? " ▲" : " — view ▼")}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {new Date(e.dateTime) > new Date() && (
                      <>
                        <Button onClick={() => togglePanel(e.id, "invite")}>
                          {e.invitedAt ? "Invite again" : "Invite members"}
                        </Button>
                        {e.rsvpCount > 0 && (
                          <Button variant="outline" onClick={() => togglePanel(e.id, "remind")}>
                            Send reminder
                          </Button>
                        )}
                      </>
                    )}
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

                {(e.invitedAt || e.reminderSentAt) && (
                  <p className="mt-1 text-xs text-muted">
                    {[
                      e.invitedAt &&
                        `Invite sent to ${e.inviteCount} members on ${formatEventDate(e.invitedAt, { month: "short", day: "numeric" })}`,
                      e.reminderSentAt &&
                        `Reminder sent ${formatEventDate(e.reminderSentAt, { month: "short", day: "numeric" })}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
                {panel?.id === e.id && (
                  <MemberInvitePanel
                    key={panel.kind}
                    endpoint={`/api/admin/events/${e.id}/${panel.kind}`}
                    what={panel.kind === "invite" ? "event invite" : "reminder"}
                    members={panel.kind === "invite" ? members : attendeeRecipients(e)}
                    alreadyIn={panel.kind === "invite" ? e.attendees.map((a) => a.id) : []}
                    alreadyInLabel="Already going"
                    showFilters={panel.kind === "invite"}
                    onCancel={() => setPanel(null)}
                    onSent={(text) => {
                      setPanel(null);
                      setInviteMessage({ id: e.id, text });
                      router.refresh();
                    }}
                  />
                )}
                {inviteMessage?.id === e.id && (
                  <p className="mt-3 text-sm text-brand">{inviteMessage.text}</p>
                )}

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
