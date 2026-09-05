import Link from "next/link";

type PublicFix = { id: number; title: string; problem: string; errorMessage: string | null; category: string | null; tags: string | null; updatedAt: Date; _count: { helpfulVotes: number } };

export default function PublicFixCard({ fix, author }: { fix: PublicFix; author?: { name: string; href: string } }) {
  const preview = fix.errorMessage || fix.problem;
  return <article className="fl-community-card">
    <div className="mb-3"><span className="fl-badge">{fix.category ?? "Uncategorized"}</span></div>
    <h3><Link href={`/community/fixes/${fix.id}`}>{fix.title}</Link></h3>
    <p className="fl-card-preview">{preview.length > 180 ? `${preview.slice(0, 180)}…` : preview}</p>
    {fix.tags && <div className="mt-4 flex flex-wrap gap-1.5">{fix.tags.split(/[\s,]+/).filter(Boolean).slice(0, 4).map((tag) => <span key={tag} className="text-[10px] text-zinc-500">{tag.startsWith("#") ? tag : `#${tag}`}</span>)}</div>}
    <div className="mt-auto pt-5"><div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-[10px] text-zinc-500">
      {author ? <Link href={author.href} className="font-medium text-zinc-600">{author.name}</Link> : <span>Public Fix</span>}
      <span>{fix._count.helpfulVotes} helpful</span>
      <time dateTime={fix.updatedAt.toISOString()}>{new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(fix.updatedAt)}</time>
    </div></div>
  </article>;
}
