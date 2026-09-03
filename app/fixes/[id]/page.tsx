import Link from "next/link";
import { headers } from "next/headers";
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
    <main className="min-h-screen bg-zinc-50 px-6 py-16 text-zinc-900">
      <article className="mx-auto w-full max-w-2xl rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
        >
          Back to FixLog
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">{fix.title}</h1>

        <dl className="mt-8 grid gap-6">
          <div>
            <dt className="text-sm font-medium text-zinc-500">Problem</dt>
            <dd className="mt-1 whitespace-pre-wrap">{fix.problem}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500">Error Message</dt>
            <dd className="mt-1 whitespace-pre-wrap">{fix.errorMessage || "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500">Cause</dt>
            <dd className="mt-1 whitespace-pre-wrap">{fix.cause || "Not provided"}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500">Solution</dt>
            <dd className="mt-1 whitespace-pre-wrap">{fix.solution}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500">Tags</dt>
            <dd className="mt-1">{fix.tags || "Not provided"}</dd>
          </div>
          <div className="grid gap-2 border-t border-zinc-200 pt-6 text-sm text-zinc-500">
            <p>Created: {fix.createdAt.toLocaleString()}</p>
            <p>Last updated: {fix.updatedAt.toLocaleString()}</p>
          </div>
        </dl>
      </article>
    </main>
  );
}
