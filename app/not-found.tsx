import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-10 sm:px-6">
        <section className="w-full rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-10" aria-labelledby="not-found-heading">
          <p className="text-sm font-medium text-zinc-500">404</p>
          <h1 id="not-found-heading" className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">We couldn&apos;t find that page.</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-600">
            The page may have moved, or you may not have access to it.
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20">
            Return to FixLog
          </Link>
        </section>
      </div>
    </main>
  );
}
