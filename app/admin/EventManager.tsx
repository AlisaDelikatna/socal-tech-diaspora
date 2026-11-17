"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Textarea, Field } from "@/components/ui";
import { formatEventDate, toEventInput } from "@/lib/time";
import MemberInvitePanel, { type InviteMember } from "./MemberInvitePanel";
import EventPhotos, { type Photo } from "./EventPhotos";

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
  posterUrl: string | null;
  photos: Photo[];
  wifiName: string | null;
  wifiPassword: string | null;
  discussionQuestions: string | null;
  presenterIds: string[];
  rsvpCount: number;
  attendees: Attendee[];
  // Members who scanned the check-in QR code at the event.
  // Guests checked in without an account; their application is pending.
  checkedIn: { id: string; name: string; guest: boolean }[];
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
  const [photosOpenId, setPhotosOpenId] = useState<string | null>(null);
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
      const body = await res.json().catch(() => null);
      if (id && body?.attendeesNotified) {
        setInviteMessage({
          id,
          text: "Saved. Everyone going will get an updated calendar invite by email.",
        });
      }
      setEditingId(null);
      setCreating(false);
      router.refresh();
    } else {
      const body = await res.json().catch(() => null);
      setError(body?.error || `Save failed (${res.status}). Please try again.`);
    }
  }

  async function remove(id: string) {
    const e = events.find((ev) => ev.id === id);
    const upcoming = e && new Date(e.dateTime) > new Date();
    const warning =
      upcoming && e.rsvpCount > 0
        ? `Delete "${e.title}"? The ${e.rsvpCount} people going will get a cancellation email, and it will be removed from their calendars.`
        : `Delete "${e?.title ?? "this event"}"?`;
    if (!window.confirm(warning)) return;
    setBusy(true);
    await fetch(`/api/events/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {creating ? (
        <Card>
          <EventForm
            members={members}
            busy={busy}
            error={error}
            onSubmit={(ev) => save(ev)}
            onCancel={() => setCreating(false)}
          />
        </Card>
      ) : (
        <Button onClick={() => setCreating(true)}>+ New event</Button>
      )}

      <div className="space-y-3">
        {events.map((e) => (
          <Card key={e.id}>
            {editingId === e.id ? (
              <EventForm
                item={e}
                members={members}
                busy={busy}
                error={error}
                onSubmit={(ev) => save(ev, e.id)}
                onCancel={() => setEditingId(null)}
              />
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
                    {e.checkedIn.length > 0 && (
                      <span className="text-xs text-muted ml-2">
                        · {e.checkedIn.length} checked in
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
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
                    <Button
                      variant="outline"
                      onClick={() => setPhotosOpenId(photosOpenId === e.id ? null : e.id)}
                    >
                      Photos{e.photos.length > 0 && ` (${e.photos.length})`}
                    </Button>
                    <a
                      href={`/admin/events/${e.id}/slideshow`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface"
                    >
                      Slideshow
                    </a>
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
                {photosOpenId === e.id && <EventPhotos eventId={e.id} photos={e.photos} />}
                {panel?.id === e.id && (
                  <MemberInvitePanel
                    key={panel.kind}
                    endpoint={`/api/admin/events/${e.id}/${panel.kind}`}
                    what={panel.kind === "invite" ? "event invite" : "reminder"}
                    members={panel.kind === "invite" ? members : attendeeRecipients(e)}
                    alreadyIn={panel.kind === "invite" ? e.attendees.map((a) => a.id) : []}
                    alreadyInLabel="Already going"
                    showFilters={panel.kind === "invite"}
                    allowGuests={panel.kind === "invite"}
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

                {rsvpOpenId === e.id && e.checkedIn.length > 0 && (
                  <p className="mt-3 text-sm">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Checked in ({e.checkedIn.length}):{" "}
                    </span>
                    {e.checkedIn.map((c) => (c.guest ? `${c.name} (guest)` : c.name)).join(", ")}
                  </p>
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

function EventForm({
  item,
  members,
  busy,
  error,
  onSubmit,
  onCancel,
}: {
  item?: EventItem;
  members: InviteMember[];
  busy: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-3">
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
      <PosterField initialUrl={item?.posterUrl ?? null} />
      <Field label="Description" required>
        <Textarea
          name="description"
          rows={3}
          required
          defaultValue={item?.description}
        />
      </Field>
      <PresenterPicker members={members} initialIds={item?.presenterIds ?? []} />
      <div className="rounded-lg border border-border p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Slideshow (only shown on the event-night slides)
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Wi-Fi name">
            <Input name="wifiName" defaultValue={item?.wifiName ?? ""} />
          </Field>
          <Field label="Wi-Fi password">
            <Input name="wifiPassword" defaultValue={item?.wifiPassword ?? ""} />
          </Field>
        </div>
        <Field
          label="Discussion questions"
          hint="One per line. Leave empty to use a few general starter questions."
        >
          <Textarea
            name="discussionQuestions"
            rows={3}
            defaultValue={item?.discussionQuestions ?? ""}
          />
        </Field>
      </div>
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
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

// Poster upload; the URL rides along with the form in a hidden input.
function PosterField({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState(initialUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/events/poster", { method: "POST", body: form }).catch(
      () => null
    );
    setUploading(false);
    const body = await res?.json().catch(() => ({}));
    if (!res?.ok || !body?.url) {
      setError(body?.error ?? "Upload failed. Please try again.");
      return;
    }
    setUrl(body.url);
  }

  return (
    <Field label="Poster" hint="Optional. JPEG, PNG, or WebP under 5 MB. Shown on the event page, in invites, and in link previews.">
      <input type="hidden" name="posterUrl" value={url} />
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="Event poster" className="mb-2 max-h-48 rounded-lg border border-border" />
      )}
      <div className="flex items-center gap-3 text-sm">
        <label className="cursor-pointer rounded-lg border border-border px-3 py-1.5 hover:bg-surface">
          {uploading ? "Uploading..." : url ? "Replace poster" : "Upload poster"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={upload}
            disabled={uploading}
          />
        </label>
        {url && !uploading && (
          <button type="button" className="text-muted hover:text-red-600" onClick={() => setUrl("")}>
            Remove
          </button>
        )}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </Field>
  );
}

// Members presenting at the event, in order. Each gets a slide in the event
// slideshow; the ids ride along with the form in a hidden input.
function PresenterPicker({
  members,
  initialIds,
}: {
  members: InviteMember[];
  initialIds: string[];
}) {
  const [ids, setIds] = useState(initialIds);
  const byId = new Map(members.map((m) => [m.id, m]));
  const available = members.filter((m) => !ids.includes(m.id));

  function move(i: number, by: number) {
    const next = [...ids];
    [next[i], next[i + by]] = [next[i + by], next[i]];
    setIds(next);
  }

  return (
    <Field label="Presenters" hint="Each presenter gets a slide with their photo, title, and LinkedIn.">
      <input type="hidden" name="presenterIds" value={ids.join(",")} />
      {ids.length > 0 && (
        <ul className="mb-2 space-y-1">
          {ids.map((id, i) => {
            const m = byId.get(id);
            return (
              <li key={id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
                <span>
                  <span className="font-medium">{m?.name ?? "Former member"}</span>
                  {m && (
                    <span className="text-muted">
                      {m.title ? ` · ${m.title}` : ""}
                      {m.company ? ` @ ${m.company}` : ""}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 gap-2 text-muted">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="hover:text-brand disabled:opacity-30" aria-label="Move up">
                    ↑
                  </button>
                  <button type="button" disabled={i === ids.length - 1} onClick={() => move(i, 1)} className="hover:text-brand disabled:opacity-30" aria-label="Move down">
                    ↓
                  </button>
                  <button type="button" onClick={() => setIds(ids.filter((x) => x !== id))} className="hover:text-red-600">
                    Remove
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}
      <select
        value=""
        onChange={(e) => e.target.value && setIds([...ids, e.target.value])}
        className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm"
      >
        <option value="">Add a presenter...</option>
        {available.map((m) => (
          <option key={m.id} value={m.id}>
            {m.name}
            {m.company ? ` (${m.company})` : ""}
          </option>
        ))}
      </select>
    </Field>
  );
}
