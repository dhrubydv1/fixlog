'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { authClient } from "@/lib/auth-client";
import { FIX_CATEGORIES } from "@/lib/fix-categories";
import { type FixVisibility } from "@/lib/fix-visibility";

type Fix = {
  id: number;
  title: string;
  problem: string;
  errorMessage: string | null;
  cause: string | null;
  solution: string;
  tags: string | null;
  category: string | null;
  isFavorite: boolean;
  visibility: FixVisibility;
  createdAt: string;
  updatedAt: string;
};

type FixSuggestion = {
  title?: string;
  problem?: string;
  errorMessage?: string;
  cause?: string;
  solution?: string;
  category?: string;
  tags?: string[];
};

type AiSuggestionResponse = {
  configured: boolean;
  suggestions?: FixSuggestion;
  message?: string;
  error?: string;
};

type SimilarFixMatch = {
  id: number;
  title: string;
  problem: string;
  errorMessage: string | null;
  category: string | null;
  tags: string | null;
  score: number;
};

type SimilarFixResponse = {
  matches?: SimilarFixMatch[];
  error?: string;
};

type SemanticSearchMatch = SimilarFixMatch & {
  reason: string;
};

type SemanticSearchResponse = {
  configured?: boolean;
  matches?: SemanticSearchMatch[];
  message?: string;
  error?: string;
};

type CommunitySearchMatch = SimilarFixMatch & {
  updatedAt: string;
  authorName?: string;
  helpfulCount?: number;
};

type CommunitySearchResponse = {
  ownMatches?: CommunitySearchMatch[];
  communityMatches?: CommunitySearchMatch[];
  error?: string;
};

type CategoryFilter = "all" | "uncategorized" | (typeof FIX_CATEGORIES)[number];
type FavoriteFilter = "all" | "favorites" | "non-favorites";
type SortOption = "newest" | "oldest" | "updated" | "title-asc" | "title-desc";

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

function SettingsIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.04 1.56V20.3h-3v-.08A1.7 1.7 0 0 0 10.66 18.66a1.7 1.7 0 0 0-1.88.34l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.56-1.04h-.08v-3h.08A1.7 1.7 0 0 0 7 9.92a1.7 1.7 0 0 0-.34-1.88L6.6 7.98l2.12-2.12.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.7 4.7v-.08h3v.08a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.04h.08v3h-.08A1.7 1.7 0 0 0 19.4 15Z" />
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
  aiSuggestionsConfigured: boolean;
};

export default function Dashboard({ user, aiSuggestionsConfigured }: DashboardProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [problem, setProblem] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [cause, setCause] = useState("");
  const [solution, setSolution] = useState("");
  const [tags, setTags] = useState("");
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState<FixVisibility>("PRIVATE");
  const [aiSuggestions, setAiSuggestions] = useState<FixSuggestion | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [aiSuggestionError, setAiSuggestionError] = useState<string | null>(null);
  const [similarFixes, setSimilarFixes] = useState<SimilarFixMatch[] | null>(null);
  const [isFindingSimilarFixes, setIsFindingSimilarFixes] = useState(false);
  const [similarFixesError, setSimilarFixesError] = useState<string | null>(null);
  const [fixes, setFixes] = useState<Fix[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [editingFixId, setEditingFixId] = useState<number | null>(null);
  const [deletingFixId, setDeletingFixId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [updatingFavoriteFixId, setUpdatingFavoriteFixId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [semanticSearchMatches, setSemanticSearchMatches] = useState<SemanticSearchMatch[] | null>(null);
  const [isSemanticSearching, setIsSemanticSearching] = useState(false);
  const [semanticSearchError, setSemanticSearchError] = useState<string | null>(null);
  const [communitySearchResults, setCommunitySearchResults] = useState<{ ownMatches: CommunitySearchMatch[]; communityMatches: CommunitySearchMatch[] } | null>(null);
  const [isCommunitySearching, setIsCommunitySearching] = useState(false);
  const [communitySearchError, setCommunitySearchError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [favoriteFilter, setFavoriteFilter] = useState<FavoriteFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest");
  const [recentReferenceTime] = useState(() => Date.now());
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  function clearForm() {
    setTitle("");
    setProblem("");
    setErrorMessage("");
    setCause("");
    setSolution("");
    setTags("");
    setCategory("");
    setVisibility("PRIVATE");
    setAiSuggestions(null);
    setAiSuggestionError(null);
    setSimilarFixes(null);
    setSimilarFixesError(null);
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
    setCategory(fix.category ?? "");
    setVisibility(fix.visibility);
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
            category,
            visibility,
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

  async function generateSuggestions() {
    setIsGeneratingSuggestions(true);
    setAiSuggestionError(null);
    setAiSuggestions(null);

    try {
      const response = await fetch("/api/ai/fix-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problem,
          errorMessage,
          existingSolution: solution,
        }),
      });
      const data: AiSuggestionResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Unable to generate suggestions");
      }

      if (!data.configured || !data.suggestions) {
        throw new Error(data.message || "AI setup required");
      }

      setAiSuggestions(data.suggestions);
    } catch (error) {
      setAiSuggestionError(
        error instanceof Error ? error.message : "Unable to generate suggestions",
      );
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }

  function applySuggestions() {
    if (!aiSuggestions) {
      return;
    }

    if (aiSuggestions.title) setTitle(aiSuggestions.title);
    if (aiSuggestions.problem) setProblem(aiSuggestions.problem);
    if (aiSuggestions.errorMessage) setErrorMessage(aiSuggestions.errorMessage);
    if (aiSuggestions.cause) setCause(aiSuggestions.cause);
    if (aiSuggestions.solution) setSolution(aiSuggestions.solution);
    if (aiSuggestions.category) setCategory(aiSuggestions.category);
    if (aiSuggestions.tags) setTags(aiSuggestions.tags.join(", "));

    setAiSuggestions(null);
  }

  async function findSimilarFixes() {
    setIsFindingSimilarFixes(true);
    setSimilarFixesError(null);
    setSimilarFixes(null);

    try {
      const response = await fetch("/api/fixes/similar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, problem, errorMessage, cause, solution, tags, category }),
      });
      const data: SimilarFixResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to find similar fixes");
      }

      setSimilarFixes(data.matches ?? []);
    } catch (error) {
      setSimilarFixesError(
        error instanceof Error ? error.message : "Unable to find similar fixes",
      );
    } finally {
      setIsFindingSimilarFixes(false);
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

  async function toggleFavorite(fix: Fix) {
    setUpdatingFavoriteFixId(fix.id);
    setFavoriteError(null);

    try {
      const response = await fetch(`/api/fixes/${fix.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !fix.isFavorite }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to update favorite");
      }

      const updatedFix: Fix = data;
      setFixes((currentFixes) =>
        currentFixes.map((item) => (item.id === updatedFix.id ? updatedFix : item)),
      );
    } catch (error) {
      setFavoriteError(error instanceof Error ? error.message : "Unable to update favorite");
    } finally {
      setUpdatingFavoriteFixId(null);
    }
  }

  function clearFilters() {
    setSearchQuery("");
    setCategoryFilter("all");
    setFavoriteFilter("all");
    setSortOption("newest");
  }

  async function searchWithAi() {
    const query = searchQuery.trim();

    if (!query) {
      return;
    }

    setIsSemanticSearching(true);
    setSemanticSearchError(null);
    setSemanticSearchMatches(null);

    try {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data: SemanticSearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Unable to search with AI");
      }

      if (!data.configured) {
        throw new Error(data.message || "AI setup required");
      }

      setSemanticSearchMatches(data.matches ?? []);
    } catch (error) {
      setSemanticSearchError(
        error instanceof Error ? error.message : "Unable to search with AI",
      );
    } finally {
      setIsSemanticSearching(false);
    }
  }

  function returnToRegularSearch() {
    setSemanticSearchMatches(null);
    setSemanticSearchError(null);
  }

  async function searchCommunity() {
    const query = searchQuery.trim();

    if (!query) {
      return;
    }

    setIsCommunitySearching(true);
    setCommunitySearchError(null);
    setCommunitySearchResults(null);

    try {
      const response = await fetch("/api/community/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data: CommunitySearchResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to search community fixes");
      }

      setCommunitySearchResults({
        ownMatches: data.ownMatches ?? [],
        communityMatches: data.communityMatches ?? [],
      });
    } catch (error) {
      setCommunitySearchError(
        error instanceof Error ? error.message : "Unable to search community fixes",
      );
    } finally {
      setIsCommunitySearching(false);
    }
  }

  function returnToRegularCommunitySearch() {
    setCommunitySearchResults(null);
    setCommunitySearchError(null);
  }

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const hasActiveFilters = Boolean(normalizedSearchQuery)
    || categoryFilter !== "all"
    || favoriteFilter !== "all"
    || sortOption !== "newest";
  const updatedRecentlyThreshold = recentReferenceTime - 7 * 24 * 60 * 60 * 1000;
  const statistics = {
    total: fixes.length,
    favorites: fixes.filter((fix) => fix.isFavorite).length,
    categoriesUsed: new Set(
      fixes.flatMap((fix) => (fix.category ? [fix.category] : [])),
    ).size,
    updatedRecently: fixes.filter(
      (fix) => new Date(fix.updatedAt).getTime() >= updatedRecentlyThreshold,
    ).length,
  };
  const visibleFixes = fixes
    .filter((fix) => {
      const searchText = [
        fix.title,
        fix.problem,
        fix.errorMessage,
        fix.cause,
        fix.solution,
        fix.tags,
        fix.category,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" ")
        .toLowerCase();

      return !normalizedSearchQuery || searchText.includes(normalizedSearchQuery);
    })
    .filter((fix) => {
      if (categoryFilter === "all") {
        return true;
      }

      return categoryFilter === "uncategorized"
        ? fix.category === null
        : fix.category === categoryFilter;
    })
    .filter((fix) => {
      if (favoriteFilter === "all") {
        return true;
      }

      return favoriteFilter === "favorites" ? fix.isFavorite : !fix.isFavorite;
    })
    .sort((left, right) => {
      switch (sortOption) {
        case "oldest":
          return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        case "updated":
          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
        case "title-asc":
          return left.title.localeCompare(right.title);
        case "title-desc":
          return right.title.localeCompare(left.title);
        case "newest":
        default:
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
      }
    });
  const inputClassName =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10";

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900">
      <nav className="border-b border-zinc-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/dashboard" className="group flex items-center gap-2.5 rounded-md focus:outline-none focus:ring-4 focus:ring-zinc-900/10">
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
            <Link
              href="/settings"
              aria-label="Open settings"
              title="Settings"
              className="inline-flex size-9 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 sm:w-auto sm:gap-2 sm:px-3 sm:text-sm sm:font-medium"
            >
              <SettingsIcon />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-lg px-2 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60 sm:px-3"
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

            {editingFixId === null && (
              <div className="flex flex-col gap-2 border-b border-zinc-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <div>
                  <p className="text-sm font-medium text-zinc-800">Need a starting point?</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    {aiSuggestionsConfigured
                      ? "Generate a draft from the problem details, then review it before applying."
                      : "AI suggestions will be available once AI setup is complete."}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={findSimilarFixes}
                    disabled={isFindingSimilarFixes || (!problem.trim() && !errorMessage.trim())}
                    className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                  >
                    {isFindingSimilarFixes ? "Finding..." : "Find similar fixes"}
                  </button>
                  <button
                    type="button"
                    onClick={generateSuggestions}
                    disabled={!aiSuggestionsConfigured || isGeneratingSuggestions || (!problem.trim() && !errorMessage.trim())}
                    title={aiSuggestionsConfigured ? "Generate Fix suggestions" : "AI setup required"}
                    aria-describedby="ai-suggestions-status"
                    className="inline-flex items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
                  >
                    {isGeneratingSuggestions ? "Generating..." : "Generate with AI"}
                  </button>
                </div>
                <span id="ai-suggestions-status" className="sr-only">
                  {!aiSuggestionsConfigured
                    ? "AI setup required"
                    : !problem.trim() && !errorMessage.trim()
                      ? "Add a problem or error message to generate suggestions"
                      : "AI suggestions are ready to generate"}
                </span>
              </div>
            )}

            {aiSuggestionError && (
              <p role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-6">
                {aiSuggestionError}
              </p>
            )}

            {similarFixesError && (
              <p role="alert" className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-700 sm:px-6">
                {similarFixesError}
              </p>
            )}

            {similarFixes && (
              <section aria-labelledby="similar-fixes-heading" className="border-b border-zinc-200 bg-zinc-50/70 px-5 py-5 sm:px-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Personal workspace</p>
                    <h2 id="similar-fixes-heading" className="mt-1 text-base font-semibold text-zinc-950">Similar fixes</h2>
                  </div>
                  <button type="button" onClick={() => setSimilarFixes(null)} className="rounded-md px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-200 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Dismiss</button>
                </div>
                {similarFixes.length === 0 ? (
                  <p className="mt-3 text-sm leading-6 text-zinc-600">No meaningful matches in your saved fixes yet.</p>
                ) : (
                  <div className="mt-4 grid gap-3">
                    {similarFixes.map((fix) => (
                      <article key={fix.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0"><h3 className="font-medium text-zinc-950">{fix.title}</h3><p className="mt-1 text-sm leading-6 text-zinc-600">{(fix.errorMessage || fix.problem).slice(0, 180)}{(fix.errorMessage || fix.problem).length > 180 ? "…" : ""}</p></div>
                          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{Math.round(fix.score * 100)}% similar</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2"><span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{fix.category ?? "Uncategorized"}</span>{fix.tags && getTags(fix.tags).slice(0, 4).map((tag) => <span key={tag} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600">{tag.startsWith("#") ? tag : `#${tag}`}</span>)}<Link href={`/fixes/${fix.id}`} className="ml-auto rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">View Fix</Link></div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            )}

            {aiSuggestions && (
              <section aria-labelledby="ai-suggestions-heading" className="border-b border-blue-100 bg-blue-50/60 px-5 py-5 sm:px-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">AI draft</p>
                    <h2 id="ai-suggestions-heading" className="mt-1 text-base font-semibold text-zinc-950">Review suggestions before applying</h2>
                    <p className="mt-1 text-sm text-zinc-600">Nothing has been saved. You can apply, edit, or discard this draft.</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => setAiSuggestions(null)} className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Discard</button>
                    <button type="button" onClick={applySuggestions} className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20">Apply suggestions</button>
                  </div>
                </div>
                <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                  {aiSuggestions.title && <SuggestionDetail label="Title" value={aiSuggestions.title} />}
                  {aiSuggestions.category && <SuggestionDetail label="Category" value={aiSuggestions.category} />}
                  {aiSuggestions.problem && <SuggestionDetail label="Problem" value={aiSuggestions.problem} />}
                  {aiSuggestions.errorMessage && <SuggestionDetail label="Error message" value={aiSuggestions.errorMessage} />}
                  {aiSuggestions.cause && <SuggestionDetail label="Cause" value={aiSuggestions.cause} />}
                  {aiSuggestions.solution && <SuggestionDetail label="Solution" value={aiSuggestions.solution} />}
                  {aiSuggestions.tags && <SuggestionDetail label="Tags" value={aiSuggestions.tags.map((tag) => `#${tag}`).join(" ")} />}
                </dl>
              </section>
            )}

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
              <FormField label="Category" htmlFor="fix-category">
                <select id="fix-category" value={category} onChange={(event) => setCategory(event.target.value)} className={inputClassName}>
                  <option value="">Select category</option>
                  {FIX_CATEGORIES.map((categoryOption) => (
                    <option key={categoryOption} value={categoryOption}>{categoryOption}</option>
                  ))}
                </select>
              </FormField>
              <fieldset className="sm:col-span-2">
                <legend className="text-sm font-medium text-zinc-800">Visibility</legend>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  <label className={`cursor-pointer rounded-lg border p-4 transition ${visibility === "PRIVATE" ? "border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900/10" : "border-zinc-200 bg-white hover:border-zinc-300"}`}>
                    <input type="radio" name="fix-visibility" value="PRIVATE" checked={visibility === "PRIVATE"} onChange={() => setVisibility("PRIVATE")} className="sr-only" />
                    <span className="block text-sm font-semibold text-zinc-900">🔒 Private</span>
                    <span className="mt-1 block text-sm leading-5 text-zinc-600">Only you can access this Fix.</span>
                  </label>
                  <label className={`cursor-pointer rounded-lg border p-4 transition ${visibility === "PUBLIC" ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10" : "border-zinc-200 bg-white hover:border-zinc-300"}`}>
                    <input type="radio" name="fix-visibility" value="PUBLIC" checked={visibility === "PUBLIC"} onChange={() => setVisibility("PUBLIC")} className="sr-only" />
                    <span className="block text-sm font-semibold text-zinc-900">🌐 Public</span>
                    <span className="mt-1 block text-sm leading-5 text-zinc-600">Other developers can view and discover this Fix.</span>
                  </label>
                </div>
                {visibility === "PUBLIC" && <p role="note" className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-6 text-amber-800">Make sure this Fix does not contain API keys, passwords, tokens, database credentials, or other secrets.</p>}
              </fieldset>
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
              <h2 id="recent-fixes-heading" className="text-lg font-semibold tracking-tight text-zinc-950">{semanticSearchMatches ? "Keyword results" : "Recent Fixes"}</h2>
              <p className="mt-1 text-sm text-zinc-500">
                {isLoading ? "Loading fixes..." : `Showing ${visibleFixes.length} of ${fixes.length} ${fixes.length === 1 ? "fix" : "fixes"}`}
              </p>
            </div>
            {!showForm && fixes.length > 0 && (
              <button type="button" onClick={startCreatingFix} className="hidden text-sm font-medium text-zinc-700 underline-offset-4 transition hover:text-zinc-950 hover:underline focus:outline-none focus:ring-4 focus:ring-zinc-900/10 sm:inline">
                Add another fix
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-3">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatisticCard label="Total Fixes" value={statistics.total} isLoading={isLoading} />
              <StatisticCard label="Favorites" value={statistics.favorites} isLoading={isLoading} />
              <StatisticCard label="Categories Used" value={statistics.categoriesUsed} isLoading={isLoading} />
              <StatisticCard label="Updated Recently" value={statistics.updatedRecently} isLoading={isLoading} />
            </div>

            <div className="relative">
              <label htmlFor="fix-search" className="sr-only">Search fixes</label>
              <input id="fix-search" type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search fixes, errors, causes, solutions, tags, or categories..." className="w-full rounded-xl border border-zinc-300 bg-white py-3 pl-10 pr-4 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10" />
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400"><SearchIcon /></span>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-zinc-50/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-600">Search your memory first. Learn from the community when you haven&apos;t solved it yet.</p>
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={searchCommunity}
                  disabled={isCommunitySearching || !normalizedSearchQuery}
                  className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-400"
                >
                  {isCommunitySearching ? "Searching..." : "Search community"}
                </button>
                <button
                  type="button"
                  onClick={searchWithAi}
                  disabled={!aiSuggestionsConfigured || isSemanticSearching || !normalizedSearchQuery}
                  title={aiSuggestionsConfigured ? "Search your FixLog with AI" : "AI setup required"}
                  className="rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
                >
                  {isSemanticSearching ? "Searching..." : "Search with AI"}
                </button>
                {semanticSearchMatches && (
                  <button type="button" onClick={returnToRegularSearch} className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Back to regular search</button>
                )}
                {communitySearchResults && (
                  <button type="button" onClick={returnToRegularCommunitySearch} className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Back to regular search</button>
                )}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect label="Category" htmlFor="category-filter" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)}>
                <option value="all">All Categories</option>
                {FIX_CATEGORIES.map((categoryOption) => (
                  <option key={categoryOption} value={categoryOption}>{categoryOption}</option>
                ))}
                <option value="uncategorized">Uncategorized</option>
              </FilterSelect>
              <FilterSelect label="Favorite status" htmlFor="favorite-filter" value={favoriteFilter} onChange={(event) => setFavoriteFilter(event.target.value as FavoriteFilter)}>
                <option value="all">All Fixes</option>
                <option value="favorites">Favorites Only</option>
                <option value="non-favorites">Non-Favorites</option>
              </FilterSelect>
              <FilterSelect label="Sort fixes" htmlFor="sort-fixes" value={sortOption} onChange={(event) => setSortOption(event.target.value as SortOption)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="updated">Recently Updated</option>
                <option value="title-asc">Title A-Z</option>
                <option value="title-desc">Title Z-A</option>
              </FilterSelect>
              <div className="flex items-end">
                {hasActiveFilters && (
                  <button type="button" onClick={clearFilters} className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {isLoading && <p role="status" className="mt-6 text-sm text-zinc-500">Loading your FixLog…</p>}
          {loadError && <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</p>}
          {deleteError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{deleteError}</p>}
          {favoriteError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{favoriteError}</p>}
          {semanticSearchError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{semanticSearchError}</p>}
          {communitySearchError && <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{communitySearchError}</p>}

          {communitySearchResults && (
            <section aria-labelledby="community-search-results-heading" className="mt-5 grid gap-5">
              <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Your fixes</p><h3 id="community-search-results-heading" className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">Search your memory first</h3><p className="mt-1 text-sm text-zinc-600">Best matches from your private workspace for “{searchQuery.trim()}”.</p></div>
                <CommunityResultList matches={communitySearchResults.ownMatches} own />
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-5 shadow-sm sm:p-6">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Community fixes</p><h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">Learn from public solutions</h3><p className="mt-1 text-sm text-zinc-600">Only public Fixes from other developers are shown.</p></div>
                <CommunityResultList matches={communitySearchResults.communityMatches} />
              </div>
            </section>
          )}

          {semanticSearchMatches && (
            <section aria-labelledby="ai-search-results-heading" className="mt-5 rounded-xl border border-violet-100 bg-violet-50/50 p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="text-xs font-semibold uppercase tracking-wide text-violet-700">AI search results</p><h3 id="ai-search-results-heading" className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">Results for “{searchQuery.trim()}”</h3><p className="mt-1 text-sm text-zinc-600">Ranked by meaning from your private FixLog.</p></div>
                <span className="w-fit rounded-full bg-white px-2.5 py-1 text-xs font-medium text-zinc-600 shadow-sm">{semanticSearchMatches.length} {semanticSearchMatches.length === 1 ? "match" : "matches"}</span>
              </div>
              {semanticSearchMatches.length === 0 ? (
                <p className="mt-4 text-sm leading-6 text-zinc-600">No relevant AI matches were found in your saved fixes. Try a different description or return to keyword search.</p>
              ) : (
                <div className="mt-4 grid gap-3">
                  {semanticSearchMatches.map((fix) => (
                    <article key={fix.id} className="rounded-lg border border-violet-100 bg-white p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h4 className="font-medium text-zinc-950">{fix.title}</h4><p className="mt-1 text-sm leading-6 text-zinc-600">{fix.reason}</p></div><span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-800">{Math.round(fix.score * 100)}% relevant</span></div>
                      <div className="mt-3 flex flex-wrap items-center gap-2"><span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{fix.category ?? "Uncategorized"}</span>{fix.tags && getTags(fix.tags).slice(0, 4).map((tag) => <span key={tag} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600">{tag.startsWith("#") ? tag : `#${tag}`}</span>)}<Link href={`/fixes/${fix.id}`} className="ml-auto rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">View Fix</Link></div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {!isLoading && !loadError && (
            <div className="mt-5 grid gap-3">
              {visibleFixes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-12 text-center shadow-sm">
                  <div className="mx-auto grid size-10 place-items-center rounded-xl bg-zinc-100 text-lg font-semibold text-zinc-600">{hasActiveFilters ? "?" : "F"}</div>
                  <h3 className="mt-4 text-base font-semibold text-zinc-900">{fixes.length === 0 ? "Your FixLog is empty." : "No fixes match your current filters."}</h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
                    {fixes.length === 0 ? "Save your first solution so you never have to solve the same problem twice." : "Try changing your search or filters."}
                  </p>
                  {hasActiveFilters ? (
                    <button type="button" onClick={clearFilters} className="mt-5 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">
                      Clear filters
                    </button>
                  ) : (
                    <button type="button" onClick={startCreatingFix} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20">
                      <PlusIcon />
                      Add your first fix
                    </button>
                  )}
                </div>
              ) : (
                visibleFixes.map((fix) => (
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
                      <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(fix)}
                          disabled={updatingFavoriteFixId === fix.id}
                          title={fix.isFavorite ? "Remove from favorites" : "Add to favorites"}
                          aria-label={fix.isFavorite ? `Remove ${fix.title} from favorites` : `Add ${fix.title} to favorites`}
                          aria-busy={updatingFavoriteFixId === fix.id}
                          className="grid size-8 place-items-center rounded-md text-lg leading-none text-amber-500 transition hover:bg-amber-50 hover:text-amber-600 focus:outline-none focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <span aria-hidden="true">{fix.isFavorite ? "★" : "☆"}</span>
                          <span className="sr-only">{updatingFavoriteFixId === fix.id ? "Updating favorite" : fix.isFavorite ? "Favorite" : "Not favorite"}</span>
                        </button>
                        <p className="text-xs font-medium text-zinc-400">Updated {formatUpdatedDate(fix.updatedAt)}</p>
                      </div>
                    </div>

                    {fix.errorMessage && (
                      <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3 font-mono text-xs leading-5 text-zinc-700">
                        <span className="mr-2 select-none text-zinc-400">error</span>
                        {fix.errorMessage}
                      </div>
                    )}

                    <div className="mt-5 flex flex-col gap-4 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {fix.category ?? "Uncategorized"}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${fix.visibility === "PUBLIC" ? "border-blue-100 bg-blue-50 text-blue-700" : "border-zinc-200 bg-zinc-50 text-zinc-600"}`}>
                          {fix.visibility === "PUBLIC" ? "🌐 Public" : "🔒 Private"}
                        </span>
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

function CommunityResultList({
  matches,
  own = false,
}: {
  matches: CommunitySearchMatch[];
  own?: boolean;
}) {
  if (matches.length === 0) {
    return (
      <p className="mt-4 text-sm leading-6 text-zinc-600">
        {own
          ? "No meaningful matches were found in your saved fixes."
          : "No relevant public community fixes were found."}
      </p>
    );
  }

  return (
    <div className="mt-4 grid gap-3">
      {matches.map((fix) => {
        const preview = fix.errorMessage || fix.problem;
        const truncatedPreview = preview.length > 180 ? `${preview.slice(0, 180)}…` : preview;

        return (
          <article key={fix.id} className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h4 className="font-medium text-zinc-950">{fix.title}</h4>
                {truncatedPreview && (
                  <p className="mt-1 text-sm leading-6 text-zinc-600">{truncatedPreview}</p>
                )}
                {!own && fix.authorName && (
                  <p className="mt-2 text-xs font-medium text-zinc-500">
                    Shared by {fix.authorName}
                  </p>
                )}
              </div>
              <span className="w-fit shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                {Math.round(fix.score * 100)}% relevant
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                {fix.category ?? "Uncategorized"}
              </span>
              {fix.tags && getTags(fix.tags).slice(0, 4).map((tag) => (
                <span key={tag} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600">
                  {tag.startsWith("#") ? tag : `#${tag}`}
                </span>
              ))}
              {!own && typeof fix.helpfulCount === "number" && (
                <span className="text-xs font-medium text-zinc-600">👍 {fix.helpfulCount} Helpful</span>
              )}
              <span className="text-xs text-zinc-500">Updated {formatUpdatedDate(fix.updatedAt)}</span>
              <Link
                href={own ? `/fixes/${fix.id}` : `/community/fixes/${fix.id}`}
                className="ml-auto rounded-md px-2.5 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
              >
                {own ? "View Fix" : "View public Fix"}
              </Link>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function StatisticCard({ label, value, isLoading }: { label: string; value: number; isLoading: boolean }) {
  return (
    <div aria-busy={isLoading} className="rounded-xl border border-zinc-200 bg-white px-4 py-3.5 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p>
      {isLoading ? (
        <span className="mt-2 block h-7 w-10 animate-pulse rounded bg-zinc-100" />
      ) : (
        <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{value}</p>
      )}
    </div>
  );
}

function SuggestionDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-white/80 px-3 py-2.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap leading-6 text-zinc-700">{value}</dd>
    </div>
  );
}

function FilterSelect({
  label,
  htmlFor,
  children,
  ...selectProps
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-medium text-zinc-600">{label}</label>
      <select
        id={htmlFor}
        {...selectProps}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
      >
        {children}
      </select>
    </div>
  );
}
