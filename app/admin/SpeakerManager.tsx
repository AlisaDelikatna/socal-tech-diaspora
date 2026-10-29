"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import { MEMBER_ROLES, INDUSTRIES } from "@/lib/member-fields";

type Application = {
  id: string;
  isSelf: boolean;
  candidateName: string;
  candidateEmail: string;
  candidateTitle: string | null;
  candidateLinkedin: string | null;
  pitch: string;
  status: string;
  submittedBy: string;
  createdAt: string;
};

type Opportunity = {
  id: string;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  topic: string;
  description: string;
  status: string;
  invitedAt: string | null;
  inviteCount: number;
  applications: Application[];
};

type EventOption = { id: string; title: string; date: string };

type Member = {
  id: string;
  name: string;
  title: string;
  company: string | null;
  role: string | null;
  industries: string[];
};

const STATUS_STYLES: Record<string, string> = {
  open: "bg-green-50 text-green-700 border-green-200",
  filled: "bg-brand/10 text-brand border-brand/30",
  closed: "bg-surface text-muted border-border",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-green-50 text-green-700 border-green-200",
  sidelined: "bg-surface text-muted border-border",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function SpeakerManager({
  opportunities,
  events,
  members,
}: {
  opportunities: Opportunity[];
  events: EventOption[];
  members: Member[];
}) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ eventId: events[0]?.id ?? "", topic: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { ok, data } = await api("/api/admin/speakers", "POST", form);
    setBusy(false);
    if (!ok) {
      setError(data.error ?? "Couldn't create it.");
      return;
    }
    setForm({ eventId: events[0]?.id ?? "", topic: "", description: "" });
    setCreating(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {!creating ? (
        <Button onClick={() => setCreating(true)} disabled={events.length === 0}>
          New speaker opportunity
        </Button>
      ) : (
        <Card>
          <form onSubmit={create} className="space-y-4">
            <Field label="Event" required>
              <select
                className="w-full rounded-lg border border-border px-3 py-2 text-sm bg-white"
                value={form.eventId}
                onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                required
              >
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title} ({ev.date})
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Topic" required>
              <Input
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
                placeholder="What to do before you raise: an investor's view"
                required
              />
            </Field>
            <Field
              label="Who we're looking for"
              required
              hint="Shown on the event page and in the invite email."
            >
              <Textarea
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="An angel investor or VC to talk about how founders should prepare before they start fundraising: traction, metrics, story, and common mistakes."
                required
              />
            </Field>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={busy}>
                {busy ? "Saving..." : "Create"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
      {events.length === 0 && (
        <p className="text-sm text-muted">Create an upcoming event first.</p>
      )}

      {opportunities.length === 0 ? (
        <p className="text-sm text-muted">No speaker opportunities yet.</p>
      ) : (
        opportunities.map((opp) => (
          <OpportunityCard key={opp.id} opp={opp} members={members} />
        ))
      )}
    </div>
  );
}

function OpportunityCard({ opp, members }: { opp: Opportunity; members: Member[] }) {
  const router = useRouter();
  const [inviting, setInviting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function setStatus(status: string) {
    await api(`/api/admin/speakers/${opp.id}`, "PATCH", { status });
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Delete "${opp.topic}" and its ${opp.applications.length} candidates?`)) return;
    await api(`/api/admin/speakers/${opp.id}`, "DELETE");
    router.refresh();
  }

  const pending = opp.applications.filter((a) => a.status === "pending").length;

  return (
    <Card>
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <div className="text-xs text-muted">
            {opp.eventTitle} · {opp.eventDate}
          </div>
          <div className="font-semibold text-lg">{opp.topic}</div>
          <div className="mt-1 flex items-center gap-2 text-xs text-muted">
            <StatusBadge status={opp.status} />
            {opp.invitedAt
              ? `Invite sent to ${opp.inviteCount} members on ${new Date(opp.invitedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : "Invite not sent yet"}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {opp.status === "open" && (
            <Button onClick={() => setInviting((v) => !v)}>
              {opp.invitedAt ? "Send again" : "Invite members"}
            </Button>
          )}
          <select
            className="rounded-lg border border-border px-2 py-2 text-sm bg-white"
            value={opp.status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Status"
          >
            <option value="open">Open</option>
            <option value="filled">Filled</option>
            <option value="closed">Closed</option>
          </select>
          <Button variant="ghost" onClick={remove}>
            Delete
          </Button>
        </div>
      </div>

      <p className="mt-3 text-sm whitespace-pre-line text-foreground/80">{opp.description}</p>

      {inviting && (
        <InvitePanel
          opp={opp}
          members={members}
          onCancel={() => setInviting(false)}
          onSent={(msg) => {
            setInviting(false);
            setMessage(msg);
            router.refresh();
          }}
        />
      )}
      {message && <p className="mt-3 text-sm text-brand">{message}</p>}

      <div className="mt-5 border-t border-border pt-4">
        <h3 className="text-sm font-semibold mb-3">
          Candidates ({opp.applications.length}
          {pending > 0 ? `, ${pending} to review` : ""})
        </h3>
        {opp.applications.length === 0 ? (
          <p className="text-sm text-muted">No one has applied yet.</p>
        ) : (
          <div className="space-y-3">
            {opp.applications.map((a) => (
              <CandidateRow key={a.id} app={a} opp={opp} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
              on ? "border-brand bg-brand text-white" : "border-border bg-white hover:bg-surface"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function InvitePanel({
  opp,
  members,
  onCancel,
  onSent,
}: {
  opp: Opportunity;
  members: Member[];
  onCancel: () => void;
  onSent: (message: string) => void;
}) {
  const [roles, setRoles] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  // Most existing members haven't filled these in yet, so include them by default.
  const [includeUnset, setIncludeUnset] = useState(true);
  // Members unchecked by hand, kept across filter changes.
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleIn = (list: string[], set: (v: string[]) => void) => (value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  const matches = members.filter((m) => {
    const roleOk = roles.length === 0 || (m.role ? roles.includes(m.role) : includeUnset);
    const industryOk =
      industries.length === 0 ||
      (m.industries.length > 0
        ? m.industries.some((i) => industries.includes(i))
        : includeUnset);
    return roleOk && industryOk;
  });
  const recipients = matches.filter((m) => !excluded.has(m.id));
  const filtering = roles.length > 0 || industries.length > 0;

  function toggleMember(id: string) {
    setExcluded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Check or uncheck everyone currently shown by the filters.
  function setAllMatches(checked: boolean) {
    setExcluded((cur) => {
      const next = new Set(cur);
      for (const m of matches) {
        if (checked) next.delete(m.id);
        else next.add(m.id);
      }
      return next;
    });
  }

  async function send() {
    if (!window.confirm(`Email this speaker invite to ${recipients.length} member${recipients.length === 1 ? "" : "s"}?`)) return;
    setBusy(true);
    setError(null);
    const { ok, data } = await api(`/api/admin/speakers/${opp.id}/invite`, "POST", {
      note,
      userIds: recipients.map((m) => m.id),
    });
    setBusy(false);
    if (!ok) {
      setError(data.error ?? "Couldn't send the invites.");
      return;
    }
    onSent(
      data.sent === data.total
        ? `Sent to ${data.sent} members.`
        : `Sent to ${data.sent} of ${data.total} members. Check the email settings.`
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4 space-y-4">
      <div>
        <div className="text-sm font-medium mb-1.5">Role</div>
        <Chips options={MEMBER_ROLES} selected={roles} onToggle={toggleIn(roles, setRoles)} />
      </div>
      <div>
        <div className="text-sm font-medium mb-1.5">Industry</div>
        <Chips
          options={INDUSTRIES}
          selected={industries}
          onToggle={toggleIn(industries, setIndustries)}
        />
      </div>
      {filtering && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeUnset}
            onChange={(e) => setIncludeUnset(e.target.checked)}
            className="accent-brand"
          />
          Also include members who haven&apos;t set their role or industry yet
        </label>
      )}

      <div>
        <div className="text-sm font-medium mb-1.5">
          Recipients: {recipients.length} of {members.length} members
        </div>
        {matches.length === 0 ? (
          <p className="text-sm text-muted">No members match these filters.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-white divide-y divide-border">
            <label className="sticky top-0 z-10 flex items-center gap-3 bg-surface px-3 py-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={recipients.length === matches.length}
                ref={(el) => {
                  if (el) el.indeterminate = recipients.length > 0 && recipients.length < matches.length;
                }}
                onChange={() => setAllMatches(recipients.length < matches.length)}
                className="accent-brand"
              />
              {recipients.length === matches.length ? "Uncheck all" : "Check all"}
            </label>
            {matches.map((m) => (
              <label key={m.id} className="flex items-start gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-surface">
                <input
                  type="checkbox"
                  checked={!excluded.has(m.id)}
                  onChange={() => toggleMember(m.id)}
                  className="mt-0.5 accent-brand"
                />
                <span>
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted">
                    {" "}· {m.title}
                    {m.company ? `, ${m.company}` : ""}
                  </span>
                  <span className="block text-xs text-muted">
                    {[m.role ?? "Role not set", ...m.industries].join(" · ")}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Field
        label="Personal note (optional)"
        hint="Added at the top of the email. Each person gets their own copy; replies come to your inbox."
      >
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={send} disabled={busy || recipients.length === 0}>
          {busy ? "Sending..." : `Send to ${recipients.length} member${recipients.length === 1 ? "" : "s"}`}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function templates(app: Application, opp: Opportunity) {
  const first = app.candidateName.split(" ")[0];
  const intro = app.isSelf
    ? `Thank you for your interest in speaking at ${opp.eventTitle} on ${opp.eventDate}.`
    : `${app.submittedBy}, a member of Kolo Founders Circle, recommended you as a speaker for ${opp.eventTitle} on ${opp.eventDate}.`;
  return {
    accept: {
      subject: `Speaking at ${opp.eventTitle}`,
      body: `Hi ${first},\n\n${intro} We'd love to have you speak on "${opp.topic}".\n\nCould you reply with a short bio, a headshot, and the title you'd like us to use for your talk?\n\nLooking forward to it,\nKolo Founders Circle`,
    },
    sideline: {
      subject: `Speaking at ${opp.eventTitle}`,
      body: `Hi ${first},\n\n${intro} We've gone a different direction for this particular slot, but we'd love to keep you in mind for an upcoming event and will reach out when there's a good fit.\n\nWarmly,\nKolo Founders Circle`,
    },
    blank: { subject: `Speaking at ${opp.eventTitle}`, body: `Hi ${first},\n\n` },
  };
}

function CandidateRow({ app, opp }: { app: Application; opp: Opportunity }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<{ subject: string; body: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function setStatus(status: string) {
    setBusy(true);
    setMessage(null);
    await api(`/api/admin/speaker-applications/${app.id}`, "PATCH", { status });
    setBusy(false);
    // Offer the matching email right away; nothing is sent until "Send".
    if (status === "accepted") setReply(templates(app, opp).accept);
    if (status === "sidelined") setReply(templates(app, opp).sideline);
    router.refresh();
  }

  async function send() {
    if (!reply) return;
    setBusy(true);
    const { ok, data } = await api(`/api/admin/speaker-applications/${app.id}/reply`, "POST", reply);
    setBusy(false);
    if (!ok) {
      setMessage(data.error ?? "Couldn't send the email.");
      return;
    }
    setReply(null);
    setMessage(`Email sent to ${app.candidateEmail}.`);
  }

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium">{app.candidateName}</span>
            <StatusBadge status={app.status} />
          </div>
          <div className="text-sm text-muted">
            {app.candidateTitle ? `${app.candidateTitle} · ` : ""}
            {app.candidateEmail}
            {app.candidateLinkedin && (
              <>
                {" · "}
                <a
                  href={app.candidateLinkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:underline"
                >
                  LinkedIn ↗
                </a>
              </>
            )}
          </div>
          <div className="text-xs text-muted mt-0.5">
            {app.isSelf ? "Applied" : `Recommended by ${app.submittedBy}`} on{" "}
            {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {app.status !== "accepted" && (
            <Button onClick={() => setStatus("accepted")} disabled={busy}>
              Accept
            </Button>
          )}
          {app.status !== "sidelined" && (
            <Button variant="outline" onClick={() => setStatus("sidelined")} disabled={busy}>
              Sideline
            </Button>
          )}
          {app.status !== "pending" && (
            <Button variant="ghost" onClick={() => setStatus("pending")} disabled={busy}>
              Undo
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setReply(reply ? null : templates(app, opp).blank)}
          >
            Reply by email
          </Button>
        </div>
      </div>

      <p className="mt-3 text-sm whitespace-pre-line text-foreground/90">{app.pitch}</p>

      {reply && (
        <div className="mt-4 rounded-lg border border-border bg-surface p-4 space-y-3">
          <div className="flex gap-2 text-xs">
            <span className="text-muted">Start from:</span>
            {(["accept", "sideline", "blank"] as const).map((k) => (
              <button
                key={k}
                type="button"
                className="text-brand hover:underline capitalize"
                onClick={() => setReply(templates(app, opp)[k])}
              >
                {k}
              </button>
            ))}
          </div>
          <Field label={`To: ${app.candidateEmail}`}>
            <Input
              value={reply.subject}
              onChange={(e) => setReply({ ...reply, subject: e.target.value })}
              aria-label="Subject"
            />
          </Field>
          <Textarea
            rows={8}
            value={reply.body}
            onChange={(e) => setReply({ ...reply, body: e.target.value })}
            aria-label="Message"
          />
          <p className="text-xs text-muted">Their reply will come to your email inbox.</p>
          <div className="flex gap-2">
            <Button onClick={send} disabled={busy}>
              {busy ? "Sending..." : "Send email"}
            </Button>
            <Button variant="ghost" onClick={() => setReply(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {message && <p className="mt-3 text-sm text-brand">{message}</p>}
    </div>
  );
}
