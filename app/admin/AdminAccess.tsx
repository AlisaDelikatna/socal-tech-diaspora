"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input } from "@/components/ui";

type Member = {
  id: string;
  name: string;
  email: string;
  title: string;
  company: string | null;
  isAdmin: boolean;
};

export default function AdminAccess({
  members,
  currentUserId,
}: {
  members: Member[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setRole(userId: string, isAdmin: boolean) {
    setBusyId(userId);
    setError(null);
    const res = await fetch("/api/admin/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, isAdmin }),
    }).catch(() => null);
    setBusyId(null);
    if (res?.ok) {
      router.refresh();
    } else {
      const body = await res?.json().catch(() => null);
      setError(body?.error || "Could not update admin access. Please try again.");
    }
  }

  const q = query.trim().toLowerCase();
  const admins = members.filter((m) => m.isAdmin);
  // Admins are always listed; other members show up when searched.
  const matches = q
    ? members.filter(
        (m) =>
          !m.isAdmin &&
          (m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q))
      )
    : [];

  function Row({ m }: { m: Member }) {
    const isSelf = m.id === currentUserId;
    return (
      <li className="flex justify-between items-center gap-3 py-2">
        <span className="text-sm">
          <span className="font-medium">{m.name}</span>
          <span className="text-muted">
            {m.title ? ` · ${m.title}` : ""}
            {m.company ? ` @ ${m.company}` : ""} · {m.email}
          </span>
        </span>
        {m.isAdmin ? (
          isSelf ? (
            <span className="text-xs text-muted shrink-0">You</span>
          ) : (
            <Button
              variant="outline"
              onClick={() => setRole(m.id, false)}
              disabled={busyId === m.id}
            >
              Remove admin
            </Button>
          )
        ) : (
          <Button onClick={() => setRole(m.id, true)} disabled={busyId === m.id}>
            Make admin
          </Button>
        )}
      </li>
    );
  }

  return (
    <Card className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-muted mb-1">
          Current admins ({admins.length})
        </div>
        <ul className="divide-y divide-border">
          {admins.map((m) => (
            <Row key={m.id} m={m} />
          ))}
        </ul>
      </div>

      <div>
        <Input
          placeholder="Search members by name or email to grant admin access"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {q && (
          <ul className="divide-y divide-border mt-2">
            {matches.map((m) => (
              <Row key={m.id} m={m} />
            ))}
            {matches.length === 0 && (
              <li className="text-sm text-muted py-2">No matching members.</li>
            )}
          </ul>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
    </Card>
  );
}
