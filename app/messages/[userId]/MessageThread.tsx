"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Textarea } from "@/components/ui";

type Msg = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
};

export default function MessageThread({
  currentUserId,
  partnerId,
  initialMessages,
}: {
  currentUserId: string;
  partnerId: string;
  initialMessages: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initialMessages);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;

    setSending(true);
    setError(null);

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientId: partnerId, body: trimmed }),
    });

    setSending(false);

    if (!res.ok) {
      const b = await res.json().catch(() => ({}));
      setError(b.error ?? "Could not send message.");
      return;
    }

    const { id } = await res.json();
    setMessages((prev) => [
      ...prev,
      {
        id: id ?? crypto.randomUUID(),
        body: trimmed,
        senderId: currentUserId,
        createdAt: new Date().toISOString(),
      },
    ]);
    setBody("");
  }

  return (
    <div>
      <div className="rounded-xl border border-border bg-white p-4 max-h-[55vh] overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted py-8">
            No messages yet. Say hello 👋
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === currentUserId;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "bg-brand text-white rounded-br-sm"
                      : "bg-surface rounded-bl-sm"
                  }`}
                >
                  <p className="whitespace-pre-line">{m.body}</p>
                  <span
                    className={`block mt-1 text-[10px] ${
                      mine ? "text-white/70" : "text-muted"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2 items-end">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Write a message…"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) send(e);
          }}
        />
        <Button type="submit" disabled={sending || !body.trim()}>
          {sending ? "…" : "Send"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </div>
  );
}
