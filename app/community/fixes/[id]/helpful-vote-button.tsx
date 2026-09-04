"use client";

import { useState } from "react";

export default function HelpfulVoteButton({
  fixId,
  initialHelpful,
  initialHelpfulCount,
}: {
  fixId: number;
  initialHelpful: boolean;
  initialHelpfulCount: number;
}) {
  const [helpful, setHelpful] = useState(initialHelpful);
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleHelpfulVote() {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch(`/api/community/fixes/${fixId}/helpful`, {
        method: "POST",
      });
      const data: { helpful?: boolean; helpfulCount?: number; error?: string } = await response.json();

      if (!response.ok || typeof data.helpful !== "boolean" || typeof data.helpfulCount !== "number") {
        throw new Error(data.error || "Unable to update helpful vote");
      }

      setHelpful(data.helpful);
      setHelpfulCount(data.helpfulCount);
    } catch (voteError) {
      setError(
        voteError instanceof Error ? voteError.message : "Unable to update helpful vote",
      );
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={toggleHelpfulVote}
        disabled={isUpdating}
        aria-busy={isUpdating}
        aria-label={helpful ? "Remove helpful vote" : "Mark as helpful"}
        className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-sm font-medium shadow-sm transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${helpful ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 focus:ring-emerald-500/20" : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 focus:ring-zinc-900/10"}`}
      >
        <span aria-hidden="true">👍</span>
        {isUpdating ? "Updating..." : helpful ? "Helpful ✓" : "Helpful"}
        <span className="text-xs font-medium">{helpfulCount}</span>
      </button>
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    </div>
  );
}
