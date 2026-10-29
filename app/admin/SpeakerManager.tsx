"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Textarea } from "@/components/ui";
import MemberInvitePanel, { type InviteMember } from "./MemberInvitePanel";
import ReplyBox, { type ReplyTemplates } from "./ReplyBox";

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

type Member = InviteMember;

const STATUS_STYLES: Record<string, string> = {
  open: "bg-green-50 text-green-700 border-green-200",
  filled: "bg-brand/10 text-brand border-brand/30",
  closed: "bg-surface text-muted border-border",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  accepted: "bg-green-50 text-green-700 border-green-200",
  sidelined: "bg-surface text-muted border-border",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status] ?? ""}`}
    >
      {status}
    </span>
  );
}

export async function api(url: string, method: string, body?: unknown) {
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
        <MemberInvitePanel
          endpoint={`/api/admin/speakers/${opp.id}/invite`}
          what="speaker invite"
          allowGuests
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

function templates(app: Application, opp: Opportunity): ReplyTemplates {
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
        <ReplyBox
          to={app.candidateEmail}
          reply={reply}
          setReply={setReply}
          templates={templates(app, opp)}
          busy={busy}
          onSend={send}
        />
      )}
      {message && <p className="mt-3 text-sm text-brand">{message}</p>}
    </div>
  );
}
