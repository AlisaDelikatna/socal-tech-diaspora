import { z } from "zod";

export const MAX_GUESTS_PER_SEND = 200;

const email = z.string().email();

/**
 * Pulls email addresses out of pasted text (commas, semicolons, spaces or
 * new lines; "Name <a@b.com>" works too). Returns unique, lowercased valid
 * addresses plus anything that didn't look like an email.
 */
export function parseEmails(text: string): { valid: string[]; invalid: string[] } {
  const valid = new Set<string>();
  const invalid: string[] = [];
  for (const raw of text.split(/[\s,;]+/)) {
    const token = raw.replace(/^[<("']+|[>)"']+$/g, "").trim().toLowerCase();
    if (!token) continue;
    if (email.safeParse(token).success) valid.add(token);
    else if (token.includes("@")) invalid.push(raw);
  }
  return { valid: [...valid], invalid };
}
