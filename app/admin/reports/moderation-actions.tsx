"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ModerationAction = "KEEP" | "HIDE" | "DELETE";

export default function ModerationActions({ fixId }: { fixId: number }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState<ModerationAction | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function moderate(action: ModerationAction, confirmDelete = false) {
    setIsSubmitting(action);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/fixes/${fixId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, confirmDelete }),
      });
      const data: { action?: ModerationAction; error?: string } = await response.json();

      if (!response.ok || data.action !== action) {
        throw new Error(data.error || "Unable to complete moderation action");
      }

      if (action === "KEEP") {
        setMessage("Open reports were dismissed. The Fix remains public.");
        router.refresh();
      } else {
        router.push("/admin/reports");
        router.refresh();
      }
    } catch (moderationError) {
      setError(
        moderationError instanceof Error
          ? moderationError.message
          : "Unable to complete moderation action",
      );
    } finally {
      setIsSubmitting(null);
      setIsConfirmingDelete(false);
    }
  }

  return (
    <section aria-labelledby="moderation-actions-heading" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-zinc-500">Moderation</p>
      <h2 id="moderation-actions-heading" className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">Choose an action</h2>
      <p className="mt-2 text-sm leading-6 text-zinc-600">Actions apply to all currently open reports for this Fix.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => moderate("KEEP")} disabled={isSubmitting !== null} className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting === "KEEP" ? "Keeping..." : "Keep"}</button>
        <button type="button" onClick={() => moderate("HIDE")} disabled={isSubmitting !== null} className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-800 shadow-sm transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting === "HIDE" ? "Hiding..." : "Hide"}</button>
        <button type="button" onClick={() => setIsConfirmingDelete(true)} disabled={isSubmitting !== null} className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60">Delete</button>
      </div>
      {isConfirmingDelete && <div role="alertdialog" aria-labelledby="delete-fix-heading" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4"><h3 id="delete-fix-heading" className="font-medium text-red-900">Delete this Fix permanently?</h3><p className="mt-1 text-sm leading-6 text-red-800">This also removes its related helpful votes and reports through existing database cascades.</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => moderate("DELETE", true)} disabled={isSubmitting !== null} className="rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting === "DELETE" ? "Deleting..." : "Confirm delete"}</button><button type="button" onClick={() => setIsConfirmingDelete(false)} disabled={isSubmitting !== null} className="rounded-lg px-3 py-2 text-sm font-medium text-red-800 transition hover:bg-red-100 focus:outline-none focus:ring-4 focus:ring-red-500/20 disabled:cursor-not-allowed disabled:opacity-60">Cancel</button></div></div>}
      {message && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
    </section>
  );
}
