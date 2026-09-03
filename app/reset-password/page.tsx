import { Suspense } from "react";

import ResetPasswordForm from "@/app/reset-password/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordPageFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordPageFallback() {
  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <p className="mx-auto text-sm text-zinc-600">Loading password reset…</p>
      </div>
    </main>
  );
}
