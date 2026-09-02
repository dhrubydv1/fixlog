'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

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

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-800">
        {label}
      </label>
      {children}
    </div>
  );
}

function formatUpdatedDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function getTags(tags: string) {
  return tags.split(/[\s,]+/).filter(Boolean);
}

type DashboardProps = {
  user: {
    name: string;
    email: string;
  };
};

export default function Dashboard({ user }: DashboardProps) {
  const router = useRouter();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

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

  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError(null);

    try {
      const result = await authClient.signOut();

      if (result.error) {
        throw new Error(result.error.message ?? "Unable to log out");
      }

      router.replace("/auth");
      router.refresh();
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : "Unable to log out");
    } finally {
      setIsSigningOut(false);
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

  const filteredFixes = fixes.filter((fix) => {
    const searchText = [fix.title, fix.problem, fix.errorMessage, fix.tags]
      .filter((value): value is string => Boolean(value))
      .join(" ")
      .toLowerCase();

    return searchText.includes(searchQuery.toLowerCase());
  });

  const hasSearchQuery = searchQuery.trim().length > 0;
  const inputClassName =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10";

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900">
      <nav className="border-b border-zinc-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="group flex items-center gap-2.5 rounded-md focus:outline-none focus:ring-4 focus:ring-zinc-900/10">
            <span className="grid size-8 place-items-center rounded-lg bg-zinc-900 text-sm font-bold text-white shadow-sm">F</span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">FixLog</span>
              <span className="block text-xs text-zinc-500">Developer memory</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-40 truncate text-sm font-medium text-zinc-800">{user.name}</p>
              <p className="max-w-40 truncate text-xs text-zinc-500">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-lg px-2.5 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3"
            >
              {isSigningOut ? "Logging out..." : "Log out"}
            </button>
            <button
              type="button"
              onClick={startCreatingFix}
              className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20 sm:px-4"
            >
              <PlusIcon />
              <span className="hidden sm:inline">New Fix</span>
              <span className="sm:hidden">New</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {signOutError && <p role="alert" className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{signOutError}</p>}
        <header className="mb-8 max-w-2xl sm:mb-10">
          <p className="mb-3 text-sm font-medium text-zinc-500">FixLog workspace</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Your Fixes</h1>
          <p className="mt-3 text-base leading-7 text-zinc-600">
            Save solutions once. Find them when you need them.
          </p>
        </header>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="mb-10 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm"
          >
            <div className="flex flex-col gap-2 border-b border-zinc-200 bg-zinc-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div>
                <p className="text-sm font-semibold text-zinc-950">
                  {editingFixId === null ? "Add a new fix" : "Edit fix"}
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  {editingFixId === null
                    ? "Capture the context you will want later."
                    : "Update the details of this saved solution."}
                </p>
              </div>
              <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-medium ${editingFixId === null ? "bg-zinc-200 text-zinc-700" : "bg-amber-100 text-amber-800"}`}>
                {editingFixId === null ? "Creating" : "Editing"}
              </span>
            </div>

            <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
              <div className="sm:col-span-2">
                <FormField label="Title" htmlFor="fix-title">
                  <input id="fix-title" type="text" value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="e.g. Vercel login issue" className={inputClassName} />
                </FormField>
              </div>
              <FormField label="Problem" htmlFor="fix-problem">
                <textarea id="fix-problem" rows={4} value={problem} onChange={(event) => setProblem(event.target.value)} required placeholder="What happened, and where did it happen?" className={inputClassName} />
              </FormField>
              <FormField label="Error Message" htmlFor="fix-error-message">
                <textarea id="fix-error-message" rows={4} value={errorMessage} onChange={(event) => setErrorMessage(event.target.value)} placeholder="Paste the relevant error, if there was one" className={`${inputClassName} font-mono text-xs leading-5`} />
              </FormField>
              <FormField label="Cause" htmlFor="fix-cause">
                <textarea id="fix-cause" rows={4} value={cause} onChange={(event) => setCause(event.target.value)} placeholder="What caused the issue?" className={inputClassName} />
              </FormField>
              <FormField label="Tags" htmlFor="fix-tags">
                <input id="fix-tags" type="text" value={tags} onChange={(event) => setTags(event.target.value)} placeholder="vercel, auth, deployment" className={inputClassName} />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Solution" htmlFor="fix-solution">
                  <textarea id="fix-solution" rows={7} value={solution} onChange={(event) => setSolution(event.target.value)} required placeholder="Write the steps that solved it, so future you can move faster." className={inputClassName} />
                </FormField>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-zinc-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              <button type="button" onClick={closeForm} disabled={isSaving} className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60">
                Cancel
              </button>
              <button type="submit" disabled={isSaving} className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-60">
                {isSaving ? "Saving..." : editingFixId === null ? "Save Fix" : "Update Fix"}
              </button>
            </div>
            {saveError && <p role="alert" className="border-t border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-6">{saveError}</p>}
          </form>
        )}

        <section aria-labelledby="recent-fixes-heading">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="recent-fixes-heading" className="text-lg font-semibold tracking-tight text-zinc-950">Recent Fixes</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {isLoading ? "Loading fixes..." : `${filteredFixes.length} ${filteredFixes.length === 1 ? "fix" : "fixes"}`}
              </p>
            </div>
            {!showForm && fixes.length > 0 && (
              <button type="button" onClick={startCreatingFix} className="hidden text-sm font-medium text-zinc-700 underline-offset-4 transition hover:text-zinc-950 hover:underline focus:outline-none focus:ring-4 focus:ring-zinc-900/10 sm:inline">
                Add another fix
              </button>
            )}
          </div>

          <div className="relative mt-5">
            <label htmlFor="fix-search" className="sr-only">Search fixes</label>
            <input id="fix-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search fixes, errors, causes, or tags..." className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-10 pr-20 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10" />
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400"><SearchIcon /></span>
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")} className="absolute inset-y-0 right-2 my-auto rounded-md px-2 py-1 text-xs font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">
                Clear
              </button>
            )}
          </div>

          {isLoading && <p className="mt-6 text-sm text-zinc-500">Loading your saved fixes...</p>}
          {loadError && <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>}
          {deleteError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{deleteError}</p>}

          {!isLoading && !loadError && (
            <div className="mt-5 grid gap-3">
              {filteredFixes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center shadow-sm">
                  <div className="mx-auto grid size-10 place-items-center rounded-xl bg-zinc-100 text-lg font-semibold text-zinc-600">{hasSearchQuery ? "?" : "F"}</div>
                  <h3 className="mt-4 text-base font-semibold text-zinc-900">{hasSearchQuery ? "No fixes found" : "No fixes yet"}</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                    {hasSearchQuery ? "Try a different search term." : "Save your first solution so you never have to solve the same problem twice."}
                  </p>
                  {!hasSearchQuery && (
                    <button type="button" onClick={startCreatingFix} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20">
                      <PlusIcon />
                      Add your first fix
                    </button>
                  )}
                </div>
              ) : (
                filteredFixes.map((fix) => (
                  <article key={fix.id} className="group rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition duration-200 hover:border-zinc-300 hover:shadow-md sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold tracking-tight text-zinc-950 sm:text-lg">
                          <Link href={`/fixes/${fix.id}`} className="rounded-sm outline-none transition hover:text-zinc-600 focus:ring-4 focus:ring-zinc-900/10">
                            {fix.title}
                          </Link>
                        </h3>
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-600">{fix.problem}</p>
                      </div>
                      <p className="shrink-0 text-xs font-medium text-zinc-400">Updated {formatUpdatedDate(fix.updatedAt)}</p>
                    </div>

                    {fix.errorMessage && (
                      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3 font-mono text-xs leading-5 text-zinc-700">
                        <span className="mr-2 select-none text-zinc-400">error</span>
                        {fix.errorMessage}
                      </div>
                    )}

                    <div className="mt-5 flex flex-col gap-4 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2">
                        {fix.tags && getTags(fix.tags).map((tag) => (
                          <span key={tag} className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600">
                            {tag.startsWith("#") ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-auto">
                        <Link href={`/fixes/${fix.id}`} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">View</Link>
                        <button type="button" onClick={() => startEditingFix(fix)} disabled={deletingFixId === fix.id} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60">Edit</button>
                        <button type="button" onClick={() => deleteFix(fix)} disabled={deletingFixId === fix.id} className="rounded-md px-2.5 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-red-500/10 disabled:cursor-not-allowed disabled:opacity-60">{deletingFixId === fix.id ? "Deleting..." : "Delete"}</button>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

