import SiteHeader from "@/app/components/site-header";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import NotificationList, { type NotificationItem } from "@/app/notifications/notification-list";
import { auth } from "@/lib/auth";
import { getNotificationInbox } from "@/lib/notifications";

export const metadata: Metadata = {
  title: "Notifications",
};

export default async function NotificationsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/auth");

  let inbox: { notifications: NotificationItem[]; unreadCount: number } = {
    notifications: [],
    unreadCount: 0,
  };
  let error: string | null = null;

  try {
    const result = await getNotificationInbox(session.user.id);
    inbox = {
      notifications: result.notifications.map((notification) => ({
        id: notification.id,
        createdAt: notification.createdAt.toISOString(),
        readAt: notification.readAt?.toISOString() ?? null,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        link: notification.link,
      })),
      unreadCount: result.unreadCount,
    };
  } catch {
    error = "Unable to load notifications. Please try refreshing your inbox.";
  }

  return (
    <main className="fl-page">
      <SiteHeader workspace userName={session.user.name} />
      <div className="fl-container fl-container-narrow">
        <header className="fl-page-heading">
          <p className="fl-eyebrow">Your activity</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Notifications</h1>
          <p className="mt-3 text-base leading-7 text-zinc-600">Helpful votes, saves, and moderation updates for your Fixes.</p>
        </header>
        <NotificationList initialInbox={inbox} initialError={error} />
      </div>
    </main>
  );
}
