"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

// Checks the member in as soon as the page opens; the button is only for
// retrying after a failure (e.g. a weak signal at the venue).
export default function CheckInNow({ eventId }: { eventId: string }) {
  const [state, setState] = useState<"working" | "done" | "error">("working");
  const [error, setError] = useState<string | null>(null);

  async function checkIn() {
    setState("working");
    const res = await fetch(`/api/events/${eventId}/checkin`, { method: "POST" }).catch(() => null);
    if (res?.ok) {
      setState("done");
      return;
    }
    const body = await res?.json().catch(() => null);
    setError(body?.error ?? "Couldn't reach the server. Check your connection and try again.");
    setState("error");
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkIn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (state === "done") {
    return <p className="text-2xl font-bold text-brand">You&apos;re checked in. Welcome!</p>;
  }
  if (state === "working") {
    return <p className="text-muted">Checking you in...</p>;
  }
  return (
    <div className="space-y-3">
      <p className="text-sm text-red-600">{error}</p>
      <Button onClick={checkIn}>Try again</Button>
    </div>
  );
}
