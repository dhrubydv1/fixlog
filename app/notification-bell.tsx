"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export const NOTIFICATIONS_UPDATED_EVENT = "fixlog:notifications-updated";

export default function NotificationBell({
  initialUnreadCount = null,
}: {
  initialUnreadCount?: number | null;
}) {
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let controller: AbortController | null = null;

    async function refreshUnreadCount() {
      if (document.visibilityState === "hidden") return;

      controller?.abort();
      const requestController = new AbortController();
      controller = requestController;

      try {
        const response = await fetch("/api/notifications?unreadCountOnly=true", {
          cache: "no-store",
          signal: requestController.signal,
        });

        if (!response.ok) throw new Error("Unable to load unread count");

        const data: { unreadCount: number } = await response.json();

        if (!requestController.signal.aborted) {
          setUnreadCount(data.unreadCount);
          setHasError(false);
        }
      } catch {
        if (!requestController.signal.aborted) setHasError(true);
      }
    }

    void refreshUnreadCount();
    window.addEventListener("focus", refreshUnreadCount);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshUnreadCount);
    document.addEventListener("visibilitychange", refreshUnreadCount);
    const interval = window.setInterval(refreshUnreadCount, 60_000);

    return () => {
      controller?.abort();
      window.removeEventListener("focus", refreshUnreadCount);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refreshUnreadCount);
      document.removeEventListener("visibilitychange", refreshUnreadCount);
      window.clearInterval(interval);
    };
  }, []);

  const label = hasError
    ? "Notifications, unread count unavailable"
    : unreadCount === null
      ? "Notifications, loading unread count"
      : `Notifications, ${unreadCount} unread`;

  return (
    <Link
      href="/notifications"
      aria-label={label}
      title={label}
      className="relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4" />
      </svg>
      <span aria-live="polite" className="sr-only">{label}</span>
      {unreadCount !== null && unreadCount > 0 && !hasError ? (
        <span aria-hidden="true" className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-900 px-1 text-[10px] font-semibold leading-none text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
      {hasError ? <span aria-hidden="true" className="absolute right-0 top-0 size-1.5 rounded-full bg-amber-500" /> : null}
    </Link>
  );
}
