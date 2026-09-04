"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type SimilarFixMatch = {
  id: number;
  title: string;
  problem: string;
  errorMessage: string | null;
  category: string | null;
  tags: string | null;
  score: number;
};

type SimilarFixesProps = {
  fix: {
    id: number;
    title: string;
    problem: string;
    errorMessage: string | null;
    cause: string | null;
    solution: string;
    tags: string | null;
    category: string | null;
  };
};

function getTags(tags: string) {
  return tags.split(/[\s,]+/).filter(Boolean).slice(0, 4);
}

export default function SimilarFixes({ fix }: SimilarFixesProps) {
  const [matches, setMatches] = useState<SimilarFixMatch[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSimilarFixes() {
      try {
        const response = await fetch("/api/fixes/similar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fix.title,
            problem: fix.problem,
            errorMessage: fix.errorMessage,
            cause: fix.cause,
            solution: fix.solution,
            tags: fix.tags,
            category: fix.category,
            excludeFixId: fix.id,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load similar fixes");
        }

        const data: { matches?: SimilarFixMatch[] } = await response.json();
        setMatches((data.matches ?? []).slice(0, 3));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setMatches([]);
        }
      }
    }

    loadSimilarFixes();

    return () => controller.abort();
  }, [fix]);

  if (matches === null) {
    return <p role="status" className="mt-6 text-sm text-zinc-500">Finding related fixes…</p>;
  }

  if (matches.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="related-fixes-heading" className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Personal workspace</p>
        <h2 id="related-fixes-heading" className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">Similar fixes</h2>
        <p className="mt-1 text-sm text-zinc-600">Related solutions from your own saved FixLog.</p>
      </header>
      <div className="mt-4 grid gap-3">
        {matches.map((match) => {
          const preview = match.errorMessage || match.problem;

          return (
            <article key={match.id} className="rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0"><h3 className="font-medium text-zinc-950">{match.title}</h3><p className="mt-1 text-sm leading-6 text-zinc-600">{preview.slice(0, 160)}{preview.length > 160 ? "…" : ""}</p></div>
                <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{Math.round(match.score * 100)}% similar</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2"><span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{match.category ?? "Uncategorized"}</span>{match.tags && getTags(match.tags).map((tag) => <span key={tag} className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs text-zinc-600">{tag.startsWith("#") ? tag : `#${tag}`}</span>)}<Link href={`/fixes/${match.id}`} className="ml-auto rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">View Fix</Link></div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
