import "server-only";

import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const notificationSelect = {
  id: true,
  createdAt: true,
  readAt: true,
  type: true,
  title: true,
  message: true,
  link: true,
} as const;

const notificationTitles = {
  HELPFUL_VOTE: "Someone found your Fix helpful.",
  FIX_SAVED: "Someone saved your Fix to their FixLog.",
  MODERATION_HIDDEN: "One of your public Fixes was hidden by moderation.",
  MODERATION_DELETED: "One of your public Fixes was deleted by moderation.",
} as const;

type NotificationEvent = {
  ownerId: string;
  actorId: string;
  type: keyof typeof notificationTitles;
  fixId: number;
  fixTitle: string;
};

// Use the event's transaction so activity and its notification commit together.
export async function createOwnerNotification(
  tx: Pick<Prisma.TransactionClient, "notification">,
  event: NotificationEvent,
) {
  if (event.ownerId === event.actorId) {
    return;
  }

  await tx.notification.create({
    data: {
      userId: event.ownerId,
      type: event.type,
      title: notificationTitles[event.type],
      message: event.fixTitle.slice(0, 200),
      link: event.type === "HELPFUL_VOTE" || event.type === "FIX_SAVED"
        ? `/fixes/${event.fixId}`
        : "/dashboard",
    },
    select: { id: true },
  });
}

export async function getNotificationInbox(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      select: notificationSelect,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  return { notifications, unreadCount };
}
