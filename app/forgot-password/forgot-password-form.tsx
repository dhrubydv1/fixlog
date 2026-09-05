"use client";

import Link from "next/link";
import AuthShell from "@/app/components/auth-shell";
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
    <AuthShell>
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

          <div className="fl-auth-card">
            {isSubmitted ? (
              <div className="grid gap-5">
                <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
                  If an account exists for that email, a reset link has been sent.
                </p>
                <Link
                  href="/auth"
                  className="fl-button fl-button-primary"
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
                    className="fl-field"
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
                  className="fl-button fl-button-primary"
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
      
    </AuthShell>
  );
}
