import SiteHeader from "@/app/components/site-header";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import FixContent from "@/app/components/fix-content";
import SimilarFixes from "@/app/fixes/[id]/similar-fixes";
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
    <main className="fl-page">
      <SiteHeader workspace userName={session.user.name} />
      <div className="fl-container fl-container-narrow">
        <Link href="/dashboard" className="fl-reading-back"><span aria-hidden="true">←</span> Your Fixes</Link>
        <article className="fl-panel">
          <header className="fl-reading-header">
            <div className="flex flex-wrap items-center gap-2"><span className="fl-badge">{fix.category ?? "Uncategorized"}</span><span className="fl-badge fl-badge-accent">{fix.visibility === "PUBLIC" ? "Public" : "Private"}</span>{fix.isFavorite && <span className="fl-badge">★ Favorite</span>}</div>
            <h1>{fix.title}</h1>
            {fix.tags && <div className="mt-4 flex flex-wrap gap-2">{fix.tags.split(/[\s,]+/).filter(Boolean).map((tag) => <span key={tag} className="fl-badge">{tag.startsWith("#") ? tag : `#${tag}`}</span>)}</div>}
            {fix.visibility === "PUBLIC" && <Link href={`/community/fixes/${fix.id}`} className="fl-button mt-5">View public page <span aria-hidden="true">↗</span></Link>}
          </header>
          <FixContent problem={fix.problem} errorMessage={fix.errorMessage} cause={fix.cause} solution={fix.solution} />
          <footer className="fl-reading-meta"><p>Created {fix.createdAt.toLocaleString()}</p><p>Updated {fix.updatedAt.toLocaleString()}</p></footer>
        </article>
        <SimilarFixes fix={{ id: fix.id, title: fix.title, problem: fix.problem, errorMessage: fix.errorMessage, cause: fix.cause, solution: fix.solution, tags: fix.tags, category: fix.category }} />
      </div>
    </main>
  );
}
