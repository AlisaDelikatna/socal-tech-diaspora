"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button } from "@/components/ui";

type Pending = {
  id: string;
  name: string;
  email: string;
  title: string;
  company: string | null;
  linkedinUrl: string;
  whatINeed: string;
  howICanHelp: string;
  createdAt: string;
};

export default function PendingMembers({ members }: { members: Pending[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function moderate(userId: string, action: "approve" | "reject") {
    setBusyId(userId);
    await fetch("/api/admin/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action }),
    });
    setBusyId(null);
    router.refresh();
  }

  if (members.length === 0) {
    return (
      <p className="text-muted text-sm">No pending applications. All caught up.</p>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((m) => (
        <Card key={m.id}>
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <div className="font-semibold">{m.name}</div>
              <div className="text-sm text-muted">
                {m.title}
                {m.company ? ` · ${m.company}` : ""} · {m.email}
              </div>
              <a
                href={m.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand hover:underline"
              >
                LinkedIn ↗
              </a>
              <div className="mt-2 text-sm">
                <p>
                  <span className="font-medium">Needs:</span> {m.whatINeed}
                </p>
                <p>
                  <span className="font-medium">Can help:</span> {m.howICanHelp}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => moderate(m.id, "approve")}
                disabled={busyId === m.id}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => moderate(m.id, "reject")}
                disabled={busyId === m.id}
              >
                Reject
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
