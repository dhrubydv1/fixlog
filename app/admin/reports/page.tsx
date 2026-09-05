import SiteHeader from "@/app/components/site-header";
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
    <main className="fl-page">
      <SiteHeader workspace admin userName={session.user.name} />
      <div className="fl-container"><header className="fl-page-heading"><p className="fl-eyebrow">Administration</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Reported Fixes</h1><p className="mt-3 text-base leading-7 text-zinc-600">Review open reports for currently public Fixes.</p></header>{reportedFixes.length === 0 ? <section className="fl-empty mt-8"><h2 className="text-lg font-semibold text-zinc-950">No open reports.</h2><p className="mt-2 text-sm text-zinc-600">There are no reported public Fixes awaiting review.</p></section> : <div className="mt-8 grid gap-4">{reportedFixes.map((fix) => { const newestReport = fix.reports[0]; return <article key={fix.id} className="fl-panel p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="fl-badge fl-badge-accent">{fix.visibility}</span><span className="text-xs font-medium text-red-700">{fix._count.reports} open {fix._count.reports === 1 ? "report" : "reports"}</span></div><h2 className="mt-3 break-words text-lg font-semibold tracking-tight text-zinc-950">{fix.title}</h2><p className="mt-2 text-sm text-zinc-600">Author: {fix.user.name}</p><p className="mt-2 text-sm text-zinc-600">Latest reason: {newestReport?.reason.replaceAll("_", " ") ?? "Not available"}</p><p className="mt-1 text-xs text-zinc-500">Newest report: {newestReport ? formatDate(newestReport.createdAt) : "Not available"}</p></div><Link href={`/admin/reports/${fix.id}`} className="fl-button w-fit">Review</Link></div></article>; })}</div>}</div>
    </main>
  );
}
