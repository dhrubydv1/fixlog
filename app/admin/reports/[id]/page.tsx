import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

import ModerationActions from "@/app/admin/reports/moderation-actions";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user.email || !isAdmin(session.user.email)) {
    notFound();
  }

  const { id } = await params;
  const fixId = Number(id);

  if (!Number.isInteger(fixId) || fixId < 1) {
    notFound();
  }

  const fix = await prisma.fix.findFirst({
    where: {
      id: fixId,
      visibility: "PUBLIC",
      reports: { some: {} },
    },
    select: {
      id: true,
      title: true,
      problem: true,
      errorMessage: true,
      cause: true,
      solution: true,
      category: true,
      tags: true,
      visibility: true,
      user: { select: { name: true } },
      reports: {
        select: {
          reason: true,
          details: true,
          createdAt: true,
          status: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!fix) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900">
      <nav className="border-b border-zinc-200/80 bg-white/80 backdrop-blur"><div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8"><Link href="/admin/reports" className="flex items-center gap-2.5 rounded-md focus:outline-none focus:ring-4 focus:ring-zinc-900/10"><span className="grid size-8 place-items-center rounded-lg bg-zinc-900 text-sm font-bold text-white shadow-sm">F</span><span><span className="block text-sm font-semibold tracking-tight">FixLog</span><span className="block text-xs text-zinc-500">Administration</span></span></Link><Link href="/admin/reports" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">Back to reports</Link></div></nav>
      <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,1fr)_19rem]"><div className="grid gap-8"><section className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"><p className="text-sm font-medium text-zinc-500">Reported public Fix</p><h1 className="mt-2 break-words text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{fix.title}</h1><p className="mt-3 text-sm text-zinc-600">Author: {fix.user.name} · {fix.visibility}</p><dl className="mt-6 grid gap-6 border-t border-zinc-200 pt-6"><ReportField label="Problem" value={fix.problem} /><ReportField label="Error Message" value={fix.errorMessage || "Not provided"} /><ReportField label="Cause" value={fix.cause || "Not provided"} /><ReportField label="Solution" value={fix.solution} /><ReportField label="Category" value={fix.category || "Uncategorized"} /><ReportField label="Tags" value={fix.tags || "Not provided"} /></dl></section><section aria-labelledby="report-details-heading" className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"><p className="text-sm font-medium text-zinc-500">Private moderation data</p><h2 id="report-details-heading" className="mt-1 text-xl font-semibold tracking-tight text-zinc-950">Report details</h2><div className="mt-5 grid gap-4">{fix.reports.map((report, index) => <article key={`${report.createdAt.toISOString()}-${index}`} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-700">{report.reason.replaceAll("_", " ")}</span><span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-600">{report.status}</span></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">{report.details || "No additional details provided."}</p><p className="mt-3 text-xs text-zinc-500">Submitted {formatDate(report.createdAt)}</p></article>)}</div></section></div><ModerationActions fixId={fix.id} /></div>
    </main>
  );
}

function ReportField({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-sm font-medium text-zinc-500">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{value}</dd></div>;
}
