"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { StatusBadge, api } from "./SpeakerManager";
import ReplyBox, { type Reply, type ReplyTemplates } from "./ReplyBox";

type Inquiry = {
  id: string;
  topic: string;
  description: string;
  mediaUrl: string | null;
  status: string;
  createdAt: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  memberTitle: string | null;
};

// Talks members pitched on their own, outside any open speaker slot.
export default function TalkIdeas({ inquiries }: { inquiries: Inquiry[] }) {
  if (inquiries.length === 0) {
    return <p className="text-sm text-muted">No talk ideas yet.</p>;
  }
  return (
    <div className="space-y-3">
      {inquiries.map((i) => (
        <InquiryRow key={i.id} inquiry={i} />
      ))}
    </div>
  );
}

function templates(i: Inquiry): ReplyTemplates {
  const first = i.memberName.split(" ")[0];
  const subject = `Your talk idea: ${i.topic}`;
  return {
    accept: {
      subject,
      body: `Hi ${first},\n\nThank you for pitching "${i.topic}". We'd love to have you speak at an upcoming Kolo event.\n\nCould you reply with a short bio, a headshot, and which months work best for you?\n\nLooking forward to it,\nKolo Founders Circle`,
    },
    sideline: {
      subject,
      body: `Hi ${first},\n\nThank you for pitching "${i.topic}". It isn't the right fit for our upcoming events, but we'll keep it in mind and reach out if a good opportunity comes up.\n\nWarmly,\nKolo Founders Circle`,
    },
    blank: { subject, body: `Hi ${first},\n\n` },
  };
}

function InquiryRow({ inquiry: i }: { inquiry: Inquiry }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<Reply | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function setStatus(status: string) {
    setBusy(true);
    setMessage(null);
    await api(`/api/admin/speaker-inquiries/${i.id}`, "PATCH", { status });
    setBusy(false);
    // Offer the matching email right away; nothing is sent until "Send".
    if (status === "accepted") setReply(templates(i).accept);
    if (status === "sidelined") setReply(templates(i).sideline);
    router.refresh();
  }

  async function remove() {
    if (!window.confirm(`Delete the talk idea "${i.topic}"?`)) return;
    await api(`/api/admin/speaker-inquiries/${i.id}`, "DELETE");
    router.refresh();
  }

  async function send() {
    if (!reply) return;
    setBusy(true);
    const { ok, data } = await api(`/api/admin/speaker-inquiries/${i.id}/reply`, "POST", reply);
    setBusy(false);
    if (!ok) {
      setMessage(data.error ?? "Couldn't send the email.");
      return;
    }
    setReply(null);
    setMessage(`Email sent to ${i.memberEmail}.`);
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{i.topic}</span>
            <StatusBadge status={i.status} />
          </div>
          <div className="text-sm text-muted">
            <a href={`/members/${i.memberId}`} className="text-brand hover:underline">
              {i.memberName}
            </a>
            {i.memberTitle ? ` · ${i.memberTitle}` : ""} · {i.memberEmail}
          </div>
          <div className="text-xs text-muted mt-0.5">
            Pitched on{" "}
            {new Date(i.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {i.status !== "accepted" && (
            <Button onClick={() => setStatus("accepted")} disabled={busy}>
              Accept
            </Button>
          )}
          {i.status !== "sidelined" && (
            <Button variant="outline" onClick={() => setStatus("sidelined")} disabled={busy}>
              Sideline
            </Button>
          )}
          {i.status !== "pending" && (
            <Button variant="ghost" onClick={() => setStatus("pending")} disabled={busy}>
              Undo
            </Button>
          )}
          <Button variant="outline" onClick={() => setReply(reply ? null : templates(i).blank)}>
            Reply by email
          </Button>
          <Button variant="ghost" onClick={remove}>
            Delete
          </Button>
        </div>
      </div>

      <p className="mt-3 text-sm whitespace-pre-line text-foreground/90">{i.description}</p>
      {i.mediaUrl && (
        <p className="mt-2 text-sm">
          <span className="text-muted">Video / demo: </span>
          <a
            href={i.mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand hover:underline break-all"
          >
            {i.mediaUrl} ↗
          </a>
        </p>
      )}

      {reply && (
        <ReplyBox
          to={i.memberEmail}
          reply={reply}
          setReply={setReply}
          templates={templates(i)}
          busy={busy}
          onSend={send}
        />
      )}
      {message && <p className="mt-3 text-sm text-brand">{message}</p>}
    </div>
  );
}
