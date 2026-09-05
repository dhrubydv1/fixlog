import PublicFixCard from "@/app/components/public-fix-card";
import SiteHeader from "@/app/components/site-header";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const getPublicProfileUser = cache(async (userId: string) => (
  prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })
));

const publicFixSelect = {
  id: true,
  title: true,
  problem: true,
  errorMessage: true,
  category: true,
  tags: true,
  updatedAt: true,
  _count: { select: { helpfulVotes: true } },
} as const;

type ProfileParams = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ProfileParams): Promise<Metadata> {
  const { id } = await params;
  const user = await getPublicProfileUser(id);

  if (!user) {
    return {
      title: "FixLog Community",
      description: "Development problems and solutions shared publicly on FixLog.",
    };
  }

  return {
    title: `${user.name}'s public fixes`,
    description: "Development problems and solutions shared publicly on FixLog.",
  };
}

export default async function PublicDeveloperProfile({ params }: ProfileParams) {
  const { id: userId } = await params;
  const user = await getPublicProfileUser(userId);

  if (!user) {
    notFound();
  }

  const publicFixWhere = {
    userId,
    visibility: "PUBLIC" as const,
  };
  const [publicFixCount, helpfulVotesReceived, topCategories, recentFixes] = await Promise.all([
    prisma.fix.count({ where: publicFixWhere }),
    prisma.helpfulVote.count({
      where: {
        fix: { is: publicFixWhere },
      },
    }),
    prisma.fix.groupBy({
      by: ["category"],
      where: {
        ...publicFixWhere,
        category: { not: null },
      },
      _count: { category: true },
      orderBy: [
        { _count: { category: "desc" } },
        { category: "asc" },
      ],
      take: 5,
    }),
    prisma.fix.findMany({
      where: publicFixWhere,
      select: publicFixSelect,
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <main className="fl-page">
      <SiteHeader />

      <div className="fl-container">
        <header className="fl-profile-header"><span className="fl-profile-monogram" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</span><div className="min-w-0">
          <p className="fl-eyebrow">Developer on FixLog</p>
          <h1 className="mt-2 break-words text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">{user.name}</h1>
          <div className="fl-profile-stats"><ProfileStatistic label="Public fixes" value={publicFixCount} /><ProfileStatistic label="Helpful votes received" value={helpfulVotesReceived} /></div>
        </div></header>

        {publicFixCount === 0 ? (
          <section className="fl-empty mt-8"><h2 className="mt-4 text-lg font-semibold text-zinc-950">No public fixes shared yet.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">This developer has not shared any public Fixes yet.</p></section>
        ) : (
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
            <section aria-labelledby="recent-public-fixes-heading"><div><p className="text-sm font-medium text-zinc-500">Public activity</p><h2 id="recent-public-fixes-heading" className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">Recently shared fixes</h2></div><div className="fl-fix-grid">{recentFixes.map((fix) => <PublicFixCard key={fix.id} fix={fix} />)}</div></section>
            <aside aria-labelledby="top-categories-heading" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"><p className="text-sm font-medium text-zinc-500">Public activity</p><h2 id="top-categories-heading" className="mt-1 text-lg font-semibold tracking-tight text-zinc-950">Top categories</h2>{topCategories.length === 0 ? <p className="mt-4 text-sm leading-6 text-zinc-600">No categorized public fixes yet.</p> : <ul className="mt-4 grid gap-3">{topCategories.map((category) => <li key={category.category} className="flex items-center justify-between gap-3 text-sm"><span className="min-w-0 truncate font-medium text-zinc-700">{category.category}</span><span className="shrink-0 text-zinc-500">{category._count.category}</span></li>)}</ul>}</aside>
          </div>
        )}
      </div>
    </main>
  );
}

function ProfileStatistic({ label, value }: { label: string; value: number }) {
  return <div className="fl-profile-stat"><p className="text-xs font-medium uppercase tracking-wide text-zinc-500">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-950">{value}</p></div>;
}
