import Link from "next/link";
import { notFound } from "next/navigation";

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
            <p className="mt-3 text-sm text-zinc-600">Shared by {fix.user.name}</p>
            {fix.tags && <div className="mt-4 flex flex-wrap gap-2">{fix.tags.split(/[\s,]+/).filter(Boolean).map((tag) => <span key={tag} className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-600">{tag.startsWith("#") ? tag : `#${tag}`}</span>)}</div>}
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
