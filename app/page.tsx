'use client';

import { useEffect, useState } from "react";

type Fix = {
  id: number;
  title: string;
  problem: string;
  errorMessage: string | null;
  cause: string | null;
  solution: string;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function Home() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [cause, setCause] = useState("");
  const [solution, setSolution] = useState("");
  const [tags, setTags] = useState("");
  const [fixes, setFixes] = useState<Fix[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingFixId, setEditingFixId] = useState<number | null>(null);
  const [deletingFixId, setDeletingFixId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function clearForm() {
    setTitle("");
    setProblem("");
    setErrorMessage("");
    setCause("");
    setSolution("");
    setTags("");
  }

  function closeForm() {
    setShowForm(false);
    setEditingFixId(null);
    setSaveError(null);
    clearForm();
  }

  function startCreatingFix() {
    setEditingFixId(null);
    setSaveError(null);
    clearForm();
    setShowForm(true);
  }

  function startEditingFix(fix: Fix) {
    setEditingFixId(fix.id);
    setTitle(fix.title);
    setProblem(fix.problem);
    setErrorMessage(fix.errorMessage ?? "");
    setCause(fix.cause ?? "");
    setSolution(fix.solution);
    setTags(fix.tags ?? "");
    setSaveError(null);
    setShowForm(true);
  }

  useEffect(() => {
    async function loadFixes() {
      try {
        const response = await fetch("/api/fixes");

        if (!response.ok) {
          throw new Error("Unable to load fixes");
        }

        const data: Fix[] = await response.json();
        setFixes(data);
      } catch {
        setLoadError("Unable to load fixes. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    loadFixes();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    const isEditing = editingFixId !== null;

    try {
      const response = await fetch(
        isEditing ? `/api/fixes/${editingFixId}` : "/api/fixes",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            problem,
            errorMessage,
            cause,
            solution,
            tags: tags
              .split(/[\s,]+/)
              .filter(Boolean)
              .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`))
              .join(" "),
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save fix");
      }

      const newFix: Fix = data;
      setFixes((currentFixes) =>
        isEditing
          ? currentFixes.map((fix) => (fix.id === newFix.id ? newFix : fix))
          : [newFix, ...currentFixes],
      );
      closeForm();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save fix");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteFix(fix: Fix) {
    const isConfirmed = window.confirm(`Delete "${fix.title}"? This cannot be undone.`);

    if (!isConfirmed) {
      return;
    }

    setDeletingFixId(fix.id);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/fixes/${fix.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to delete fix");
      }

      setFixes((currentFixes) => currentFixes.filter((item) => item.id !== fix.id));

      if (editingFixId === fix.id) {
        closeForm();
      }
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Unable to delete fix");
    } finally {
      setDeletingFixId(null);
    }
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
            onClick={startCreatingFix}
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
            {saveError && <p className="mt-4 text-sm text-red-600">{saveError}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeForm}
                disabled={isSaving}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
              >
                {isSaving ? "Saving..." : editingFixId === null ? "Save Fix" : "Update Fix"}
              </button>
            </div>
          </form>
        )}

        <section>
          <h2 className="text-lg font-semibold">Recent Fixes</h2>
          {isLoading && <p className="mt-4 text-sm text-zinc-600">Loading fixes...</p>}
          {loadError && <p className="mt-4 text-sm text-red-600">{loadError}</p>}
          {deleteError && <p className="mt-4 text-sm text-red-600">{deleteError}</p>}
          {!isLoading && !loadError && (
            <div className="mt-4 grid gap-4">
              {fixes.map((fix) => (
                <article
                  key={fix.id}
                  className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <h3 className="text-base font-semibold">{fix.title}</h3>
                  <p className="mt-2 text-sm text-zinc-600">{fix.problem}</p>
                  {fix.errorMessage && (
                    <p className="mt-3 text-sm text-zinc-600">
                      <span className="font-medium text-zinc-700">Error: </span>
                      {fix.errorMessage}
                    </p>
                  )}
                  {fix.tags && (
                    <div className="mt-4 text-sm font-medium text-zinc-500">
                      {fix.tags}
                    </div>
                  )}
                  <div className="mt-4 flex gap-4">
                    <button
                      type="button"
                      onClick={() => startEditingFix(fix)}
                      disabled={deletingFixId === fix.id}
                      className="text-sm font-medium text-zinc-700 transition-colors hover:text-zinc-500"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteFix(fix)}
                      disabled={deletingFixId === fix.id}
                      className="text-sm font-medium text-red-600 transition-colors hover:text-red-500"
                    >
                      {deletingFixId === fix.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
