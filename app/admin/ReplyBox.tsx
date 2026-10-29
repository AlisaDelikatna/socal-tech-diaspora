"use client";

import { Button, Field, Input, Textarea } from "@/components/ui";
import { REPLY_TO } from "@/lib/email-config";

export type Reply = { subject: string; body: string };
export type ReplyTemplates = Record<"accept" | "sideline" | "blank", Reply>;

// Editable email to one person, with accept / sideline / blank starting points.
export default function ReplyBox({
  to,
  reply,
  setReply,
  templates,
  busy,
  onSend,
}: {
  to: string;
  reply: Reply;
  setReply: (r: Reply | null) => void;
  templates: ReplyTemplates;
  busy: boolean;
  onSend: () => void;
}) {
  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4 space-y-3">
      <div className="flex gap-2 text-xs">
        <span className="text-muted">Start from:</span>
        {(["accept", "sideline", "blank"] as const).map((k) => (
          <button
            key={k}
            type="button"
            className="text-brand hover:underline capitalize"
            onClick={() => setReply(templates[k])}
          >
            {k}
          </button>
        ))}
      </div>
      <Field label={`To: ${to}`}>
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
      <p className="text-xs text-muted">Their reply will go to {REPLY_TO}.</p>
      <div className="flex gap-2">
        <Button onClick={onSend} disabled={busy}>
          {busy ? "Sending..." : "Send email"}
        </Button>
        <Button variant="ghost" onClick={() => setReply(null)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
