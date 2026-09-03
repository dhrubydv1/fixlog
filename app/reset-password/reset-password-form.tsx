"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

export default function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const tokenError = searchParams.get("error");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const hasInvalidToken = !token || tokenError === "INVALID_TOKEN";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (hasInvalidToken) {
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("Your new password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await authClient.resetPassword({
        newPassword,
        token,
      });

      if (result.error) {
        setErrorMessage("This reset link is invalid or has expired. Request a new one and try again.");
        return;
      }

      setIsSubmitted(true);
      setNewPassword("");
      setConfirmPassword("");
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
        <section className="mx-auto w-full max-w-md" aria-labelledby="reset-password-heading">
          <div className="mb-7 text-center">
            <p className="text-sm font-medium text-zinc-500">Account recovery</p>
            <h1 id="reset-password-heading" className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              Choose a new password
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Use a strong, unique password to protect your saved solutions.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            {isSubmitted ? (
              <div className="grid gap-5">
                <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
                  Your password has been reset. You can now log in with your new password.
                </p>
                <Link
                  href="/auth"
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20"
                >
                  Go to log in
                </Link>
              </div>
            ) : hasInvalidToken ? (
              <div className="grid gap-5">
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  This reset link is invalid or has expired. Request a new link to continue.
                </p>
                <Link
                  href="/forgot-password"
                  className="rounded-lg bg-zinc-900 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20"
                >
                  Request a new link
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
                <PasswordField
                  id="new-password"
                  label="New password"
                  value={newPassword}
                  onChange={setNewPassword}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                <PasswordField
                  id="confirm-password"
                  label="Confirm new password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />

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
                  {isSubmitting ? "Resetting password..." : "Reset password"}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  disabled,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  autoComplete: "new-password";
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium text-zinc-800">
        {label}
      </label>
      <input
        id={id}
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        placeholder="At least 8 characters"
        disabled={disabled}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10"
      />
    </div>
  );
}
