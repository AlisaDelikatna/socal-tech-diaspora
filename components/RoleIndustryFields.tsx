"use client";

import { useState } from "react";
import { Field } from "@/components/ui";
import { MEMBER_ROLES, INDUSTRIES, MAX_INDUSTRIES } from "@/lib/member-fields";

// Role select + industry checkboxes. Submits as form fields "role" and
// "industries" (repeated); read the latter with FormData.getAll().
export default function RoleIndustryFields({
  initialRole = "",
  initialIndustries = [],
}: {
  initialRole?: string;
  initialIndustries?: string[];
}) {
  const [industries, setIndustries] = useState<string[]>(initialIndustries);

  function toggle(value: string) {
    setIndustries((cur) =>
      cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value]
    );
  }

  return (
    <>
      <Field label="Which best describes you?" required>
        <select
          name="role"
          required
          defaultValue={initialRole}
          className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        >
          <option value="" disabled>
            Choose one
          </option>
          {MEMBER_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Industries"
        hint={`Pick up to ${MAX_INDUSTRIES}. Helps us invite you to the right events and speaking spots.`}
      >
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((i) => {
            const checked = industries.includes(i);
            const disabled = !checked && industries.length >= MAX_INDUSTRIES;
            return (
              <label
                key={i}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
                  checked
                    ? "border-brand bg-brand text-white"
                    : "border-border hover:bg-surface"
                } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  name="industries"
                  value={i}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(i)}
                  className="sr-only"
                />
                {i}
              </label>
            );
          })}
        </div>
      </Field>
    </>
  );
}
