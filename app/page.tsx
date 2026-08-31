'use client';

import { useState } from "react";

type Fix = {
  id: number;
  title: string;
  problem: string;
  errorMessage: string;
  cause: string;
  solution: string;
  tags: string[];
};

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [cause, setCause] = useState("");
  const [solution, setSolution] = useState("");
  const [tags, setTags] = useState("");
  const [fixes, setFixes] = useState<Fix[]>([
    {
      id: 1,
      title: "Vercel login issue",
      problem: "Login worked locally but failed in production",
      errorMessage: "",
      cause: "",
      solution: "",
      tags: ["#vercel", "#auth"],
    },
  ]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newFix: Fix = {
      id: Date.now(),
      title,
      problem,
      errorMessage,
      cause,
      solution,
      tags: tags
        .split(/[\s,]+/)
        .filter(Boolean)
        .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)),
    };

    setFixes([...fixes, newFix]);
    setShowForm(false);
    setTitle("");
    setProblem("");
    setErrorMessage("");
    setCause("");
    setSolution("");
    setTags("");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6 py-16 text-zinc-900">
      <div className="w-full max-w-2xl">
        <header className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">FixLog</h1>
            <p className="mt-2 text-zinc-600">
              Save problems. Remember solutions.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Add Fix
          </button>
        </header>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-12 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="grid gap-4">
              <label className="grid gap-1.5 text-sm font-medium">
                Title
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  className="rounded-lg border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-zinc-500"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Problem
                <textarea
                  rows={3}
                  value={problem}
                  onChange={(event) => setProblem(event.target.value)}
                  required
                  className="rounded-lg border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-zinc-500"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Error Message
                <textarea
                  rows={3}
                  value={errorMessage}
                  onChange={(event) => setErrorMessage(event.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-zinc-500"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Cause
                <textarea
                  rows={3}
                  value={cause}
                  onChange={(event) => setCause(event.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-zinc-500"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Solution
                <textarea
                  rows={3}
                  value={solution}
                  onChange={(event) => setSolution(event.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-zinc-500"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Tags
                <input
                  type="text"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 font-normal outline-none focus:border-zinc-500"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                Save Fix
              </button>
            </div>
          </form>
        )}

        <section>
          <h2 className="text-lg font-semibold">Recent Fixes</h2>
          <div className="mt-4 grid gap-4">
            {fixes.map((fix) => (
              <article
                key={fix.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-base font-semibold">{fix.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{fix.problem}</p>
                {fix.tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium text-zinc-500">
                    {fix.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
