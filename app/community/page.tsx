import type { Metadata } from "next";
import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "FixLog Community",
  description: "Discover real development problems and solutions shared by developers.",
};

export const dynamic = "force-dynamic";

const publicFixSelect = {
  id: true,
  title: true,
  problem: true,
  errorMessage: true,
  category: true,
  tags: true,
  updatedAt: true,
  user: { select: { id: true, name: true } },
  _count: { select: { helpfulVotes: true } },
} as const;

type PublicFix = {
  id: number;
  title: string;
  problem: string;
  errorMessage: string | null;
  category: string | null;
  tags: string | null;
  updatedAt: Date;
  user: { id: string; name: string };
  _count: { helpfulVotes: number };
};

function trendingScore(fix: PublicFix, referenceTime: number) {
  const ageInDays = Math.max(0, (referenceTime - fix.updatedAt.getTime()) / 86_400_000);
  const recencyScore = Math.max(0, 1 - ageInDays / 30);
  const helpfulnessScore = Math.min(1, Math.log10(fix._count.helpfulVotes + 1) / 2);

  return recencyScore * 0.7 + helpfulnessScore * 0.3;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function tags(tagsValue: string | null) {
  return tagsValue?.split(/[\s,]+/).filter(Boolean).slice(0, 4) ?? [];
}

export default async function CommunityPage() {
  const [trendingCandidates, mostHelpful, recentlyShared, categories] = await Promise.all([
    prisma.fix.findMany({
      where: { visibility: "PUBLIC" },
      select: publicFixSelect,
      orderBy: { updatedAt: "desc" },
      take: 50,
    }),
    prisma.fix.findMany({
      where: { visibility: "PUBLIC" },
      select: publicFixSelect,
      orderBy: [
        { helpfulVotes: { _count: "desc" } },
        { updatedAt: "desc" },
      ],
      take: 10,
    }),
    prisma.fix.findMany({
      where: { visibility: "PUBLIC" },
      select: publicFixSelect,
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
    prisma.fix.groupBy({
      by: ["category"],
      where: {
        visibility: "PUBLIC",
        category: { not: null },
      },
      _count: { category: true },
      orderBy: [
        { _count: { category: "desc" } },
        { category: "asc" },
      ],
      take: 8,
    }),
  ]);

  const referenceTime = trendingCandidates.reduce(
    (latestUpdatedAt, fix) => Math.max(latestUpdatedAt, fix.updatedAt.getTime()),
    0,
  );
  const trending = trendingCandidates
    .map((fix) => ({ fix, score: trendingScore(fix, referenceTime) }))
    .sort((left, right) => right.score - left.score || right.fix.updatedAt.getTime() - left.fix.updatedAt.getTime())
    .slice(0, 10)
    .map(({ fix }) => fix);
  const hasPublicFixes = recentlyShared.length > 0;

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900">
      <nav aria-label="Primary navigation" className="border-b border-zinc-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 rounded-md focus:outline-none focus:ring-4 focus:ring-zinc-900/10"><span className="grid size-8 place-items-center rounded-lg bg-zinc-900 text-sm font-bold text-white shadow-sm">F</span><span><span className="block text-sm font-semibold tracking-tight">FixLog</span><span className="block text-xs text-zinc-500">Developer memory</span></span></Link>
          <div className="flex items-center gap-2 sm:gap-4"><Link href="/community" aria-current="page" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-950 transition hover:bg-zinc-100 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Community</Link><Link href="/auth" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Log in</Link><Link href="/auth" className="hidden rounded-lg bg-zinc-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20 sm:inline-flex">Get Started</Link></div>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <header className="max-w-3xl">
          <p className="text-sm font-medium text-zinc-500">FixLog Community</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Learn from fixes developers chose to share.</h1>
          <p className="mt-3 text-base leading-7 text-zinc-600">Browse real development problems and practical solutions. Public fixes are read-only; private workspaces remain private.</p>
        </header>

        <section aria-labelledby="community-search-heading" className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 id="community-search-heading" className="text-base font-semibold text-zinc-950">Search the community</h2><p className="mt-1 text-sm text-zinc-600">Community search is available from your signed-in FixLog workspace.</p></div>
            <Link href="/auth" className="inline-flex w-fit rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Log in to search the community</Link>
          </div>
          <label htmlFor="community-search" className="sr-only">Search the community</label>
          <input id="community-search" type="search" disabled placeholder="Log in to search public fixes" className="mt-4 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 placeholder:text-zinc-400 disabled:cursor-not-allowed" />
        </section>

        {!hasPublicFixes ? (
          <section className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center shadow-sm" aria-labelledby="empty-community-heading"><div className="mx-auto grid size-10 place-items-center rounded-xl bg-zinc-100 text-lg">🌐</div><h2 id="empty-community-heading" className="mt-4 text-lg font-semibold text-zinc-950">No public fixes have been shared yet.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">Sign in to create your FixLog and share a carefully reviewed solution when you are ready.</p><Link href="/auth" className="mt-5 inline-flex rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20">Create your FixLog</Link></section>
        ) : (
          <div className="mt-10 grid gap-10">
            <CommunitySection title="Trending" description="Recent activity carries most of the weight, with a modest helpfulness signal." fixes={trending} />
            <CommunitySection title="Most Helpful" description="Public fixes with the most helpful votes." fixes={mostHelpful} />
            <CommunitySection title="Recently Shared" description="Public fixes most recently updated by their authors." fixes={recentlyShared} />
            <section aria-labelledby="popular-categories-heading"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-zinc-500">Explore by topic</p><h2 id="popular-categories-heading" className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">Popular Categories</h2></div><p className="text-sm text-zinc-500">Counts include public fixes only.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{categories.map((category) => <div key={category.category} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"><p className="text-sm font-medium text-zinc-800">{category.category}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">{category._count.category}</p><p className="mt-1 text-xs text-zinc-500">public {category._count.category === 1 ? "fix" : "fixes"}</p></div>)}</div></section>
          </div>
        )}
      </div>
    </main>
  );
}

function CommunitySection({ title, description, fixes }: { title: string; description: string; fixes: PublicFix[] }) {
  return (
    <section aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}>
      <div><p className="text-sm font-medium text-zinc-500">Community discovery</p><h2 id={`${title.toLowerCase().replaceAll(" ", "-")}-heading`} className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{title}</h2><p className="mt-2 text-sm text-zinc-600">{description}</p></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{fixes.map((fix) => <PublicFixCard key={fix.id} fix={fix} />)}</div>
    </section>
  );
}

function PublicFixCard({ fix }: { fix: PublicFix }) {
  const preview = fix.errorMessage || fix.problem;
  const truncatedPreview = preview.length > 170 ? `${preview.slice(0, 170)}…` : preview;

  return (
    <article className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md">
      <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{fix.category ?? "Uncategorized"}</span><span className="text-xs font-medium text-zinc-600">👍 {fix._count.helpfulVotes} Helpful</span></div>
      <h3 className="mt-4 text-base font-semibold tracking-tight text-zinc-950"><Link href={`/community/fixes/${fix.id}`} className="rounded-sm transition hover:text-zinc-600 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">{fix.title}</Link></h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{truncatedPreview}</p>
      <div className="mt-4 flex flex-wrap gap-2">{tags(fix.tags).map((tag) => <span key={tag} className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs text-zinc-600">{tag.startsWith("#") ? tag : `#${tag}`}</span>)}</div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-4 text-xs text-zinc-500"><Link href={`/community/users/${fix.user.id}`} className="rounded-sm font-medium text-zinc-600 transition hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Shared by {fix.user.name}</Link><span>Updated {formatDate(fix.updatedAt)}</span></div>
    </article>
  );
}
