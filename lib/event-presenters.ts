import { prisma } from "@/lib/prisma";

/** Keeps only approved members, in the order given, without repeats. */
export async function approvedPresenterIds(ids: string[]): Promise<string[]> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return [];
  const found = await prisma.user.findMany({
    where: { id: { in: unique }, isApproved: true },
    select: { id: true },
  });
  const ok = new Set(found.map((u) => u.id));
  return unique.filter((id) => ok.has(id));
}

/** Nested write rows for an event's presenters. */
export function presenterRows(ids: string[]) {
  return ids.map((userId, position) => ({ userId, position }));
}
