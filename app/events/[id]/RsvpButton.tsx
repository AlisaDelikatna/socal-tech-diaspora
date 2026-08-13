"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export default function RsvpButton({
  eventId,
  initialGoing,
}: {
  eventId: string;
  initialGoing: boolean;
}) {
  const router = useRouter();
  const [going, setGoing] = useState(initialGoing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    const res = await fetch("/api/rsvp", {
      method: going ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setGoing(data.going);
      router.refresh();
    }
  }

  return (
    <Button
      onClick={toggle}
      disabled={loading}
      variant={going ? "outline" : "primary"}
    >
      {loading ? "…" : going ? "✓ Going — cancel?" : "RSVP"}
    </Button>
  );
}
