import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function FixDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth");
  }

  const { id } = await params;
  const fixId = Number(id);

  if (!Number.isInteger(fixId) || fixId < 1) {
    notFound();
  }

  const fix = await prisma.fix.findFirst({
    where: {
      id: fixId,
      userId: session.user.id,
    },
  });

  if (!fix) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900">
      <nav className="border-b border-zinc-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 rounded-md focus:outline-none focus:ring-4 focus:ring-zinc-900/10">
            <span className="grid size-8 place-items-center rounded-lg bg-zinc-900 text-sm font-bold text-white shadow-sm">F</span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">FixLog</span>
              <span className="block text-xs text-zinc-500">Developer memory</span>
            </span>
          </Link>
          <Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 hover:text-zinc-950 focus:outline-none focus:ring-4 focus:ring-zinc-900/10">
            Back to fixes
          </Link>
        </div>
      </nav>

      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <article className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
          <header className="border-b border-zinc-200 bg-zinc-50/70 px-5 py-5 sm:px-6 sm:py-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{fix.category ?? "Uncategorized"}</span>
              {fix.isFavorite && <span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">★ Favorite</span>}
            </div>
            <h1 className="mt-4 break-words text-2xl font-semibold tracking-tight text-zinc-950 sm:text-3xl">{fix.title}</h1>
          </header>

          <dl className="grid gap-6 px-5 py-6 sm:px-6">
            <div>
              <dt className="text-sm font-medium text-zinc-500">Problem</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{fix.problem}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500">Error Message</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{fix.errorMessage || "Not provided"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500">Cause</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{fix.cause || "Not provided"}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500">Solution</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-zinc-800">{fix.solution}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-zinc-500">Tags</dt>
              <dd className="mt-1 break-words text-sm text-zinc-800">{fix.tags || "Not provided"}</dd>
            </div>
            <div className="grid gap-2 border-t border-zinc-200 pt-6 text-sm text-zinc-500 sm:grid-cols-2">
              <p>Created: {fix.createdAt.toLocaleString()}</p>
              <p>Last updated: {fix.updatedAt.toLocaleString()}</p>
            </div>
          </dl>
        </article>
      </div>
    </main>
  );
}
