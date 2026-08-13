"use client";

import { useState } from "react";

export default function PartnerLogo({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="text-xs font-semibold text-muted text-center leading-tight max-w-[120px]">
        {alt}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-10 w-auto max-w-[120px] object-contain"
    />
  );
}
