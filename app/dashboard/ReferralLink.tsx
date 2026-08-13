"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";

export default function ReferralLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail on insecure origins — ignore for MVP.
    }
  }

  return (
    <div className="flex gap-2">
      <Input readOnly value={url} onFocus={(e) => e.currentTarget.select()} />
      <Button onClick={copy} variant="outline" className="shrink-0">
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}
