import PublicFixCard from "@/app/components/public-fix-card";
import SiteHeader from "@/app/components/site-header";
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
    <main className="fl-page">
      <SiteHeader />

      <div className="fl-container">
        <header className="fl-page-heading">
          <p className="fl-eyebrow">The shared knowledge base</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Good solutions. Worth sharing.</h1>
          <p className="mt-3 text-base leading-7 text-zinc-600">Browse real development problems and practical solutions. Public fixes are read-only; private workspaces remain private.</p>
        </header>

        <section aria-labelledby="community-search-heading" className="fl-panel p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><h2 id="community-search-heading" className="text-base font-semibold text-zinc-950">Search the community</h2><p className="mt-1 text-sm text-zinc-600">Community search is available from your signed-in FixLog workspace.</p></div>
            <Link href="/auth" className="fl-button w-fit">Log in to search the community</Link>
          </div>
          <label htmlFor="community-search" className="sr-only">Search the community</label>
          <input id="community-search" type="search" disabled placeholder="Log in to search public fixes" className="mt-4 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-sm text-zinc-500 placeholder:text-zinc-400 disabled:cursor-not-allowed" />
        </section>

        {!hasPublicFixes ? (
          <section className="fl-empty mt-8" aria-labelledby="empty-community-heading"><h2 id="empty-community-heading" className="mt-4 text-lg font-semibold text-zinc-950">No public fixes have been shared yet.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">Sign in to create your FixLog and share a carefully reviewed solution when you are ready.</p><Link href="/auth" className="fl-button fl-button-primary mt-5">Create your FixLog</Link></section>
        ) : (
          <div className="fl-community-sections mt-10">
            <nav aria-label="Browse community sections" className="fl-section-tabs"><a href="#trending-heading">Trending</a><a href="#most-helpful-heading">Most helpful</a><a href="#recently-shared-heading">Recently shared</a><a href="#popular-categories-heading">Categories</a></nav>
            <CommunitySection title="Trending" description="Useful fixes from recent community activity." fixes={trending} />
            <CommunitySection title="Most Helpful" description="Public fixes with the most helpful votes." fixes={mostHelpful} />
            <CommunitySection title="Recently Shared" description="Public fixes most recently updated by their authors." fixes={recentlyShared} />
            <section aria-labelledby="popular-categories-heading"><div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-zinc-500">Explore by topic</p><h2 id="popular-categories-heading" className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">Popular Categories</h2></div><p className="text-sm text-zinc-500">Counts include public fixes only.</p></div><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{categories.map((category) => <div key={category.category} className="fl-category-card"><p className="text-sm font-medium text-zinc-800">{category.category}</p><p className="text-sm font-semibold text-zinc-700">{category._count.category}</p><p className="mt-1 text-xs text-zinc-500">public {category._count.category === 1 ? "fix" : "fixes"}</p></div>)}</div></section>
          </div>
        )}
      </div>
    </main>
  );
}

function CommunitySection({ title, description, fixes }: { title: string; description: string; fixes: PublicFix[] }) {
  return (
    <section aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}>
      <div className="fl-section-heading"><div><h2 id={`${title.toLowerCase().replaceAll(" ", "-")}-heading`} className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{title}</h2><p className="mt-2 text-sm text-zinc-600">{description}</p></div></div>
      <div className="fl-community-grid">{fixes.map((fix) => <PublicFixCard key={fix.id} fix={fix} author={{ name: fix.user.name, href: `/community/users/${fix.user.id}` }} />)}</div>
    </section>
  );
}
