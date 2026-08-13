import { prisma } from "@/lib/prisma";

export type ConversationSummary = {
  partnerId: string;
  partnerName: string;
  partnerPhotoUrl: string | null;
  lastBody: string;
  lastAt: Date;
  unread: boolean;
};

/**
 * Returns a de-duplicated list of conversation partners for a user,
 * most recent first. Grouping is done in JS — fine for MVP volumes.
 */
export async function getConversations(
  userId: string
): Promise<ConversationSummary[]> {
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { recipientId: userId }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, name: true, photoUrl: true } },
      recipient: { select: { id: true, name: true, photoUrl: true } },
    },
  });

  const byPartner = new Map<string, ConversationSummary>();

  for (const m of messages) {
    const partner = m.senderId === userId ? m.recipient : m.sender;
    if (byPartner.has(partner.id)) {
      // Already have the most recent (messages are desc); just track unread.
      if (m.recipientId === userId && !m.readAt) {
        byPartner.get(partner.id)!.unread = true;
      }
      continue;
    }
    byPartner.set(partner.id, {
      partnerId: partner.id,
      partnerName: partner.name,
      partnerPhotoUrl: partner.photoUrl,
      lastBody: m.body,
      lastAt: m.createdAt,
      unread: m.recipientId === userId && !m.readAt,
    });
  }

  return Array.from(byPartner.values());
}

/** Fetch a single thread between two users and mark inbound messages read. */
export async function getThread(userId: string, partnerId: string) {
  const partner = await prisma.user.findFirst({
    where: { id: partnerId, isApproved: true },
    select: { id: true, name: true, photoUrl: true, title: true },
  });
  if (!partner) return null;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: partnerId },
        { senderId: partnerId, recipientId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  // Mark inbound unread messages as read.
  await prisma.message.updateMany({
    where: { senderId: partnerId, recipientId: userId, readAt: null },
    data: { readAt: new Date() },
  });

  return { partner, messages };
}
