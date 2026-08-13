"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input, Button } from "@/components/ui";

const ROLE_PRESETS = [
  "Founder",
  "Engineer",
  "Designer",
  "Product",
  "Investor",
  "Recruiter",
  "Data",
  "Marketing",
];

export default function MembersFilter({
  defaultQ,
  defaultRole,
}: {
  defaultQ: string;
  defaultRole: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQ);
  const [role, setRole] = useState(defaultRole);

  function apply(nextRole = role, nextQ = q) {
    const sp = new URLSearchParams();
    if (nextQ) sp.set("q", nextQ);
    if (nextRole) sp.set("role", nextRole);
    router.push(`/members${sp.toString() ? `?${sp.toString()}` : ""}`);
  }

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
        className="flex gap-2"
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, skill, what they need or offer…"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setRole("");
            apply("");
          }}
          className={`rounded-full px-3 py-1 text-sm border ${
            role === ""
              ? "bg-brand text-white border-brand"
              : "border-border hover:bg-surface"
          }`}
        >
          All roles
        </button>
        {ROLE_PRESETS.map((r) => (
          <button
            key={r}
            onClick={() => {
              setRole(r);
              apply(r);
            }}
            className={`rounded-full px-3 py-1 text-sm border ${
              role === r
                ? "bg-brand text-white border-brand"
                : "border-border hover:bg-surface"
            }`}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
