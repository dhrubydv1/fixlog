"use client";

import Link from "next/link";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: "/reset-password",
      });

      if (result.error) {
        setErrorMessage("Unable to request a reset link. Please try again.");
        return;
      }

      setIsSubmitted(true);
    } catch {
      setErrorMessage("Unable to reach FixLog. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fafafa] text-zinc-900">
      <nav className="border-b border-zinc-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-md focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-zinc-900 text-sm font-bold text-white shadow-sm">
              F
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight">FixLog</span>
              <span className="block text-xs text-zinc-500">Developer memory</span>
            </span>
          </Link>
        </div>
      </nav>

      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="mx-auto w-full max-w-md" aria-labelledby="forgot-password-heading">
          <div className="mb-7 text-center">
            <p className="text-sm font-medium text-zinc-500">Account recovery</p>
            <h1 id="forgot-password-heading" className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Reset your password
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            {isSubmitted ? (
              <div className="grid gap-5">
                <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
                  If an account exists for that email, a reset link has been sent.
                </p>
                <Link
                  href="/auth"
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20"
                >
                  Back to log in
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
                <div className="grid gap-2">
                  <label htmlFor="email" className="text-sm font-medium text-zinc-800">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="you@example.com"
                    disabled={isSubmitting}
                    className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
                  />
                </div>

                {errorMessage && (
                  <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                    {errorMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? "Sending link..." : "Send reset link"}
                </button>
              </form>
            )}

            {!isSubmitted && (
              <p className="mt-6 text-center text-sm text-zinc-600">
                Remembered your password?{" "}
                <Link
                  href="/auth"
                  className="font-medium text-zinc-900 underline underline-offset-4 transition hover:text-zinc-600 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
                >
                  Back to log in
                </Link>
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
