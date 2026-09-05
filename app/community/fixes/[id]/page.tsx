import SiteHeader from "@/app/components/site-header";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import FixContent from "@/app/components/fix-content";
import HelpfulVoteButton from "@/app/community/fixes/[id]/helpful-vote-button";
import ReportFixButton from "@/app/community/fixes/[id]/report-fix-button";
import SaveFixButton from "@/app/community/fixes/[id]/save-fix-button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export default async function PublicFixPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { id } = await params;
  const fixId = Number(id);

  if (!Number.isInteger(fixId) || fixId < 1) {
    notFound();
  }

  const fix = await prisma.fix.findFirst({
    where: {
      id: fixId,
      visibility: "PUBLIC",
    },
    select: {
      id: true,
      userId: true,
      title: true,
      problem: true,
      errorMessage: true,
      cause: true,
      solution: true,
      category: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
      user: { select: { name: true } },
    },
  });

  if (!fix) {
    notFound();
  }

  const [helpfulCount, currentVote, currentReport] = await Promise.all([
    prisma.helpfulVote.count({ where: { fixId: fix.id } }),
    session?.user.id && session.user.id !== fix.userId
      ? prisma.helpfulVote.findUnique({
        where: {
          userId_fixId: {
            userId: session.user.id,
            fixId: fix.id,
          },
        },
        select: { id: true },
      })
      : Promise.resolve(null),
    session?.user.id && session.user.id !== fix.userId
      ? prisma.fixReport.findUnique({
        where: {
          reporterId_fixId: {
            reporterId: session.user.id,
            fixId: fix.id,
          },
        },
        select: { id: true },
      })
      : Promise.resolve(null),
  ]);

  return (
    <main className="fl-page">
      <SiteHeader workspace={Boolean(session)} userName={session?.user.name} />

      <div className="fl-container fl-container-narrow">
        <Link href="/community" className="fl-reading-back"><span aria-hidden="true">←</span> Community Fixes</Link>
        <article className="fl-panel">
          <header className="fl-reading-header">
            <div className="flex flex-wrap items-center gap-2"><span className="fl-badge fl-badge-accent">Public Fix</span><span className="fl-badge">{fix.category ?? "Uncategorized"}</span></div>
            <h1 className="mt-4 break-words text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{fix.title}</h1>
            <p className="mt-3 text-sm text-zinc-600">Shared by <Link href={`/community/users/${fix.userId}`} className="rounded-sm font-medium text-zinc-700 underline underline-offset-4 transition hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">{fix.user.name}</Link></p>
            <p className="mt-3 text-sm font-medium text-zinc-600">{helpfulCount} developers found this helpful</p>
            {fix.tags && <div className="mt-4 flex flex-wrap gap-2">{fix.tags.split(/[\s,]+/).filter(Boolean).map((tag) => <span key={tag} className="fl-badge">{tag.startsWith("#") ? tag : `#${tag}`}</span>)}</div>}
            {session?.user.id === fix.userId ? (
              <Link href={`/fixes/${fix.id}`} className="fl-button mt-5">View in my FixLog</Link>
            ) : session ? (
              <div className="flex flex-wrap gap-3"><SaveFixButton fixId={fix.id} /><HelpfulVoteButton fixId={fix.id} initialHelpful={Boolean(currentVote)} initialHelpfulCount={helpfulCount} /><ReportFixButton fixId={fix.id} initialReported={Boolean(currentReport)} /></div>
            ) : (
              <div className="mt-5 flex flex-wrap items-center gap-3"><Link href="/auth" className="fl-button fl-button-primary">Log in to save this Fix</Link><Link href="/auth" className="fl-button">Log in to vote</Link><Link href="/auth" className="fl-button">Log in to report</Link></div>
            )}
          </header>
          <FixContent problem={fix.problem} errorMessage={fix.errorMessage} cause={fix.cause} solution={fix.solution} />
          <footer className="fl-reading-meta"><p>Created {formatDate(fix.createdAt)}</p><p>Updated {formatDate(fix.updatedAt)}</p></footer>
        </article>
        {!session && <aside className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-zinc-200 px-5 py-4"><div><p className="text-sm font-medium">Useful fixes deserve a place to live.</p><p className="mt-1 text-xs text-zinc-500">FixLog is a developer memory for problems, causes, and solutions.</p></div><Link href="/community" className="fl-button">Explore more Fixes <span aria-hidden="true">↗</span></Link></aside>}
      </div>
    </main>
  );
}
