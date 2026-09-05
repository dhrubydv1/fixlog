import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

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
    <main className="min-h-screen bg-[#fafafa] text-zinc-900">
      <nav className="border-b border-zinc-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 rounded-md focus:outline-none focus:ring-4 focus:ring-zinc-900/10"><span className="grid size-8 place-items-center rounded-lg bg-zinc-900 text-sm font-bold text-white shadow-sm">F</span><span><span className="block text-sm font-semibold tracking-tight">FixLog</span><span className="block text-xs text-zinc-500">Developer memory</span></span></Link>
          <Link href="/auth" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Open FixLog</Link>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <header className="border-b border-zinc-200 bg-zinc-50/70 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">🌐 Public Fix</span><span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-600">{fix.category ?? "Uncategorized"}</span></div>
            <h1 className="mt-4 break-words text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{fix.title}</h1>
            <p className="mt-3 text-sm text-zinc-600">Shared by <Link href={`/community/users/${fix.userId}`} className="rounded-sm font-medium text-zinc-700 underline underline-offset-4 transition hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">{fix.user.name}</Link></p>
            <p className="mt-3 text-sm font-medium text-zinc-600">👍 {helpfulCount} Helpful</p>
            {fix.tags && <div className="mt-4 flex flex-wrap gap-2">{fix.tags.split(/[\s,]+/).filter(Boolean).map((tag) => <span key={tag} className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600">{tag.startsWith("#") ? tag : `#${tag}`}</span>)}</div>}
            {session?.user.id === fix.userId ? (
              <Link href={`/fixes/${fix.id}`} className="mt-5 inline-flex rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">View in my FixLog</Link>
            ) : session ? (
              <div className="flex flex-wrap gap-3"><SaveFixButton fixId={fix.id} /><HelpfulVoteButton fixId={fix.id} initialHelpful={Boolean(currentVote)} initialHelpfulCount={helpfulCount} /><ReportFixButton fixId={fix.id} initialReported={Boolean(currentReport)} /></div>
            ) : (
              <div className="mt-5 flex flex-wrap items-center gap-3"><Link href="/auth" className="inline-flex rounded-lg bg-zinc-900 px-3.5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20">Log in to save this Fix</Link><Link href="/auth" className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Log in to vote</Link><Link href="/auth" className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Log in to report</Link></div>
            )}
          </header>
          <dl className="grid gap-6 px-5 py-6 sm:px-6">
            <PublicField label="Problem" value={fix.problem} />
            <PublicField label="Error Message" value={fix.errorMessage || "Not provided"} />
            <PublicField label="Cause" value={fix.cause || "Not provided"} />
            <PublicField label="Solution" value={fix.solution} />
            <div className="grid gap-2 border-t border-zinc-200 pt-6 text-sm text-zinc-500 sm:grid-cols-2"><p>Created: {formatDate(fix.createdAt)}</p><p>Updated: {formatDate(fix.updatedAt)}</p></div>
          </dl>
        </article>
      </div>
    </main>
  );
}

function PublicField({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-sm font-medium text-zinc-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{value}</dd></div>;
}
