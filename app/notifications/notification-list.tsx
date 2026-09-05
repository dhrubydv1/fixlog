"use client";

import Link from "next/link";
import { useState } from "react";

import { NOTIFICATIONS_UPDATED_EVENT } from "@/app/notification-bell";

export type NotificationItem = {
  id: number;
  createdAt: string;
  readAt: string | null;
  type: string;
  title: string;
  message: string;
  link: string | null;
};

type NotificationInbox = {
  notifications: NotificationItem[];
  unreadCount: number;
};

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

function safeNotificationLink(link: string | null) {
  if (link === "/dashboard" || link === "/settings") return link;
  return link && /^\/fixes\/[1-9]\d*$/.test(link) ? link : null;
}

export default function NotificationList({
  initialInbox,
  initialError = null,
}: {
  initialInbox: NotificationInbox;
  initialError?: string | null;
}) {
  const [inbox, setInbox] = useState(initialInbox);
  const [error, setError] = useState(initialError);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [markingReadId, setMarkingReadId] = useState<number | null>(null);

  async function refreshNotifications() {
    setIsRefreshing(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(response.status === 401
          ? "Your session has expired. Please log in again."
          : "Unable to load notifications. Please try again.");
      }

      const data: NotificationInbox = await response.json();
      setInbox(data);
      window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
    } catch (refreshError) {
      setError(refreshError instanceof Error ? refreshError.message : "Unable to load notifications. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function markAsRead(notification: NotificationItem) {
    if (notification.readAt || markingReadId !== null || isRefreshing) return;

    setMarkingReadId(notification.id);
    setError(null);

    try {
      const response = await fetch(`/api/notifications/${notification.id}`, {
        method: "PATCH",
      });

      if (!response.ok) {
        throw new Error(response.status === 401
          ? "Your session has expired. Please log in again."
          : "Unable to mark this notification as read. Please try again.");
      }

      const data: { notification: NotificationItem } = await response.json();
      setInbox((current) => ({
        notifications: current.notifications.map((item) => item.id === notification.id ? data.notification : item),
        unreadCount: Math.max(0, current.unreadCount - 1),
      }));
      window.dispatchEvent(new Event(NOTIFICATIONS_UPDATED_EVENT));
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Unable to mark this notification as read. Please try again.");
    } finally {
      setMarkingReadId(null);
    }
  }

  return (
    <section className="mt-8" aria-label="Notification inbox">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p role="status" className="text-sm text-zinc-500">
          {error && inbox.notifications.length === 0 ? "Inbox unavailable" : inbox.unreadCount > 0 ? `${inbox.unreadCount} unread` : "You're all caught up"}
        </p>
        <button
          type="button"
          onClick={refreshNotifications}
          disabled={isRefreshing || markingReadId !== null}
          className="fl-button"
        >
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error ? <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      {inbox.notifications.length === 0 ? (
        !error ? <div className="fl-empty">
          <h2 className="text-lg font-semibold text-zinc-950">No notifications yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">When someone finds your public Fix helpful, saves it, or moderation takes action, you&apos;ll hear about it here.</p>
          <Link href="/dashboard" className="fl-button fl-button-primary mt-5">Go to your Fixes</Link>
        </div> : null
      ) : (
        <ul className="fl-notification-list" aria-busy={isRefreshing}>
          {inbox.notifications.map((notification) => {
            const link = safeNotificationLink(notification.link);
            const isUnread = notification.readAt === null;

            return (
              <li key={notification.id}>
                <article className={`fl-notification ${isUnread ? "fl-notification-unread" : ""}`}>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                    <span className={`inline-flex items-center gap-1.5 font-medium ${isUnread ? "text-blue-700" : "text-zinc-500"}`}>
                      {isUnread ? <span aria-hidden="true" className="size-1.5 rounded-full bg-blue-600" /> : null}
                      {isUnread ? "Unread" : "Read"}
                    </span>
                    <time dateTime={notification.createdAt} className="text-zinc-500">{dateFormatter.format(new Date(notification.createdAt))}</time>
                  </div>
                  <h2 className="mt-3 break-words text-base font-semibold tracking-tight text-zinc-950">{notification.title}</h2>
                  <p className="mt-1.5 break-words text-sm leading-6 text-zinc-600">{notification.message}</p>
                  {link || isUnread ? <div className="mt-4 flex flex-wrap items-center gap-3">
                    {link ? <Link href={link} className="rounded-md text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-4 transition hover:decoration-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">{link.startsWith("/fixes/") ? "View Fix" : link === "/settings" ? "Open settings" : "Go to dashboard"}</Link> : null}
                    {isUnread ? <button
                      type="button"
                      onClick={() => markAsRead(notification)}
                      disabled={markingReadId !== null || isRefreshing}
                      aria-label={`Mark notification as read: ${notification.title}`}
                      className="fl-button"
                    >{markingReadId === notification.id ? "Marking as read..." : "Mark as read"}</button> : null}
                  </div> : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
