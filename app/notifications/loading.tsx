export default function NotificationsLoading() {
  return (
    <main className="min-h-screen bg-[#fafafa] px-4 py-10 text-zinc-900 sm:py-14">
      <div className="mx-auto max-w-3xl" role="status" aria-busy="true">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">Notifications</h1>
        <p className="mt-3 text-sm text-zinc-500">Loading your notifications...</p>
        <div aria-hidden="true" className="mt-8 grid gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-xl border border-zinc-200 bg-white p-6 motion-safe:animate-pulse">
              <div className="h-3 w-32 rounded bg-zinc-100" />
              <div className="mt-4 h-4 w-3/4 rounded bg-zinc-100" />
              <div className="mt-3 h-3 w-1/2 rounded bg-zinc-100" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
