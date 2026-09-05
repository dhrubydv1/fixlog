import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default async function AdminReportsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user.email || !isAdmin(session.user.email)) {
    notFound();
  }

  const reportedFixes = await prisma.fix.findMany({
    where: {
      visibility: "PUBLIC",
      reports: { some: { status: "OPEN" } },
    },
    select: {
      id: true,
      title: true,
      visibility: true,
      user: { select: { name: true } },
      reports: {
        where: { status: "OPEN" },
        select: { reason: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      _count: {
        select: {
          reports: { where: { status: "OPEN" } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900">
      <nav className="border-b border-zinc-200/80 bg-white/80 backdrop-blur"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/dashboard" className="flex items-center gap-2.5 rounded-md focus:outline-none focus:ring-4 focus:ring-zinc-900/10"><span className="grid size-8 place-items-center rounded-lg bg-zinc-900 text-sm font-bold text-white shadow-sm">F</span><span><span className="block text-sm font-semibold tracking-tight">FixLog</span><span className="block text-xs text-zinc-500">Administration</span></span></Link><Link href="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Dashboard</Link></div></nav>
      <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-14"><header><p className="text-sm font-medium text-zinc-500">Administration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Reported Fixes</h1><p className="mt-3 text-base leading-7 text-zinc-600">Review open reports for currently public Fixes.</p></header>{reportedFixes.length === 0 ? <section className="mt-8 rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-14 text-center shadow-sm"><h2 className="text-lg font-semibold text-zinc-950">No open reports.</h2><p className="mt-2 text-sm text-zinc-600">There are no reported public Fixes awaiting review.</p></section> : <div className="mt-8 grid gap-4">{reportedFixes.map((fix) => { const newestReport = fix.reports[0]; return <article key={fix.id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-blue-100 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">{fix.visibility}</span><span className="text-xs font-medium text-red-700">{fix._count.reports} open {fix._count.reports === 1 ? "report" : "reports"}</span></div><h2 className="mt-3 break-words text-lg font-semibold tracking-tight text-zinc-950">{fix.title}</h2><p className="mt-2 text-sm text-zinc-600">Author: {fix.user.name}</p><p className="mt-2 text-sm text-zinc-600">Latest reason: {newestReport?.reason.replaceAll("_", " ") ?? "Not available"}</p><p className="mt-1 text-xs text-zinc-500">Newest report: {newestReport ? formatDate(newestReport.createdAt) : "Not available"}</p></div><Link href={`/admin/reports/${fix.id}`} className="inline-flex w-fit rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Review</Link></div></article>; })}</div>}</div>
    </main>
  );
}
