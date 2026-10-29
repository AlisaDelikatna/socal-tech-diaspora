"use client";

import { useState } from "react";
import { Button, Field, Textarea } from "@/components/ui";
import { REPLY_TO } from "@/lib/email-config";
import { MEMBER_ROLES, INDUSTRIES, inferRoleFromTitle } from "@/lib/member-fields";

// Pick members to email by role and industry, review the exact recipient
// list, and send. Shared by event and speaker-opportunity invites.

export type InviteMember = {
  id: string;
  name: string;
  title: string;
  company: string | null;
  role: string | null;
  industries: string[];
};

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={`rounded-full border px-2.5 py-0.5 text-xs transition ${
              on ? "border-brand bg-brand text-white" : "border-border bg-white hover:bg-surface"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

export default function MemberInvitePanel({
  endpoint,
  what,
  members,
  alreadyIn = [],
  alreadyInLabel = "",
  showFilters = true,
  onCancel,
  onSent,
}: {
  // POST target; receives { userIds, note } and returns { sent, total }.
  endpoint: string;
  // e.g. "speaker invite", used in the confirm prompt.
  what: string;
  members: InviteMember[];
  // Members who don't need this invite (e.g. already RSVP'd): unchecked by
  // default and labeled with alreadyInLabel.
  alreadyIn?: string[];
  alreadyInLabel?: string;
  // Hide the role/industry filters (e.g. when the list is already a fixed
  // group like an event's attendees).
  showFilters?: boolean;
  onCancel: () => void;
  onSent: (message: string) => void;
}) {
  const [roles, setRoles] = useState<string[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  // Most existing members haven't filled these in yet, so include them by default.
  const [includeUnset, setIncludeUnset] = useState(true);
  // Members unchecked by hand, kept across filter changes.
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set(alreadyIn));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleIn = (list: string[], set: (v: string[]) => void) => (value: string) =>
    set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

  // Fall back to a role guessed from the job title for members who haven't
  // picked one yet.
  const withRoles = members.map((m) => {
    const guessed = m.role ? null : inferRoleFromTitle(m.title);
    return { ...m, effectiveRole: m.role ?? guessed, roleGuessed: !!guessed };
  });

  const matches = withRoles.filter((m) => {
    const roleOk =
      roles.length === 0 || (m.effectiveRole ? roles.includes(m.effectiveRole) : includeUnset);
    const industryOk =
      industries.length === 0 ||
      (m.industries.length > 0
        ? m.industries.some((i) => industries.includes(i))
        : includeUnset);
    return roleOk && industryOk;
  });
  const recipients = matches.filter((m) => !excluded.has(m.id));
  const filtering = roles.length > 0 || industries.length > 0;

  function toggleMember(id: string) {
    setExcluded((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Check or uncheck everyone currently shown by the filters.
  function setAllMatches(checked: boolean) {
    setExcluded((cur) => {
      const next = new Set(cur);
      for (const m of matches) {
        if (checked) next.delete(m.id);
        else next.add(m.id);
      }
      return next;
    });
  }

  async function send() {
    if (!window.confirm(`Email this ${what} to ${recipients.length} member${recipients.length === 1 ? "" : "s"}?`)) return;
    setBusy(true);
    setError(null);
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note, userIds: recipients.map((m) => m.id) }),
    });
    const ok = res.ok;
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!ok) {
      setError(data.error ?? "Couldn't send the invites.");
      return;
    }
    onSent(
      data.sent === data.total
        ? `Sent to ${data.sent} members.`
        : `Sent to ${data.sent} of ${data.total} members. Check the email settings.`
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-surface p-4 space-y-4">
      {showFilters && (
        <>
          <div>
            <div className="text-sm font-medium mb-1.5">Role</div>
            <Chips options={MEMBER_ROLES} selected={roles} onToggle={toggleIn(roles, setRoles)} />
          </div>
          <div>
            <div className="text-sm font-medium mb-1.5">Industry</div>
            <Chips
              options={INDUSTRIES}
              selected={industries}
              onToggle={toggleIn(industries, setIndustries)}
            />
          </div>
          {filtering && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={includeUnset}
                onChange={(e) => setIncludeUnset(e.target.checked)}
                className="accent-brand"
              />
              Also include members who haven&apos;t set their role or industry yet
            </label>
          )}
        </>
      )}

      <div>
        <div className="text-sm font-medium mb-1.5">
          Recipients: {recipients.length} of {members.length} members
        </div>
        {matches.length === 0 ? (
          <p className="text-sm text-muted">No members match these filters.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-white divide-y divide-border">
            <label className="sticky top-0 z-10 flex items-center gap-3 bg-surface px-3 py-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={recipients.length === matches.length}
                ref={(el) => {
                  if (el) el.indeterminate = recipients.length > 0 && recipients.length < matches.length;
                }}
                onChange={() => setAllMatches(recipients.length < matches.length)}
                className="accent-brand"
              />
              {recipients.length === matches.length ? "Uncheck all" : "Check all"}
            </label>
            {matches.map((m) => (
              <label key={m.id} className="flex items-start gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-surface">
                <input
                  type="checkbox"
                  checked={!excluded.has(m.id)}
                  onChange={() => toggleMember(m.id)}
                  className="mt-0.5 accent-brand"
                />
                <span>
                  <span className="font-medium">{m.name}</span>
                  <span className="text-muted">
                    {" "}· {m.title}
                    {m.company ? `, ${m.company}` : ""}
                  </span>
                  <span className="block text-xs text-muted">
                    {alreadyIn.includes(m.id) && (
                      <span className="mr-1.5 rounded-full bg-green-50 border border-green-200 px-1.5 text-green-700">
                        {alreadyInLabel}
                      </span>
                    )}
                    {m.effectiveRole
                      ? `${m.effectiveRole}${m.roleGuessed ? " (from title)" : ""}`
                      : "Role not set"}
                    {m.industries.length > 0 ? ` · ${m.industries.join(" · ")}` : ""}
                  </span>
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Field
        label="Personal note (optional)"
        hint={`Added at the top of the email. Each person gets their own copy; replies go to ${REPLY_TO}.`}
      >
        <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      </Field>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Button onClick={send} disabled={busy || recipients.length === 0}>
          {busy ? "Sending..." : `Send to ${recipients.length} member${recipients.length === 1 ? "" : "s"}`}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

