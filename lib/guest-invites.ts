import { prisma } from "@/lib/prisma";
import { parseEmails, MAX_GUESTS_PER_SEND } from "@/lib/guests";

/**
 * Cleans the non-member emails an admin entered: drops invalid ones and
 * anyone who already has an account (members get the member version).
 */
export async function resolveGuestEmails(
  input: unknown
): Promise<{ guests: string[]; skippedExisting: number; error?: string }> {
  if (input == null) return { guests: [], skippedExisting: 0 };
  if (!Array.isArray(input)) return { guests: [], skippedExisting: 0, error: "Invalid guest list" };

  const { valid } = parseEmails(input.filter((v) => typeof v === "string").join("\n"));
  if (valid.length > MAX_GUESTS_PER_SEND) {
    return {
      guests: [],
      skippedExisting: 0,
      error: `You can invite up to ${MAX_GUESTS_PER_SEND} non-members at a time`,
    };
  }

  const existing = await prisma.user.findMany({
    where: { email: { in: valid, mode: "insensitive" } },
    select: { email: true },
  });
  const taken = new Set(existing.map((u) => u.email.toLowerCase()));
  const guests = valid.filter((e) => !taken.has(e));
  return { guests, skippedExisting: valid.length - guests.length };
}
