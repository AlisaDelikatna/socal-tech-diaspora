"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/lib/resources";

export default function ResourcesDropdown() {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    if (timer.current) clearTimeout(timer.current);
    setOpen(true);
  }

  function hide() {
    timer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <Link
        href="/resources"
        className="hover:text-brand flex items-center gap-1"
        onClick={() => setOpen(false)}
      >
        Resources
        <svg className="w-3 h-3 mt-px" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </Link>

      {open && (
        <div className="absolute left-0 top-full pt-2 z-50">
          <div className="bg-white border border-border rounded-xl shadow-lg py-2 min-w-[220px]">
            {Object.entries(CATEGORIES).map(([catKey, cat]) => (
              <div key={catKey}>
                <Link
                  href={`/resources/${catKey}`}
                  className="block px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted hover:text-brand hover:bg-surface"
                  onClick={() => setOpen(false)}
                >
                  {cat.label}
                </Link>
                {Object.entries(cat.subcategories).map(([subKey, subLabel]) => (
                  <Link
                    key={subKey}
                    href={`/resources/${catKey}/${subKey}`}
                    className="block px-6 py-1.5 text-sm hover:text-brand hover:bg-surface"
                    onClick={() => setOpen(false)}
                  >
                    {subLabel}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
