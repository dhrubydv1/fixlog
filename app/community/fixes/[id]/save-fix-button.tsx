"use client";

import Link from "next/link";
import { useState } from "react";

export default function SaveFixButton({ fixId }: { fixId: number }) {
  const [isSaving, setIsSaving] = useState(false);
  const [savedFixId, setSavedFixId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveFix() {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/community/fixes/${fixId}/save`, {
        method: "POST",
      });
      const data: { id?: number; error?: string } = await response.json();

      if (!response.ok || typeof data.id !== "number") {
        throw new Error(data.error || "Unable to save this Fix");
      }

      setSavedFixId(data.id);
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : "Unable to save this Fix",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (savedFixId) {
    return (
      <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <p className="font-medium">Saved privately to your FixLog.</p>
        <Link
          href={`/fixes/${savedFixId}`}
          className="mt-2 inline-flex rounded-md font-medium underline underline-offset-4 focus:outline-none focus:ring-4 focus:ring-emerald-500/20"
        >
          View saved Fix
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={saveFix}
        disabled={isSaving}
        aria-busy={isSaving}
        className="fl-button fl-button-primary"
      >
        {isSaving ? "Saving..." : "Save to my FixLog"}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
