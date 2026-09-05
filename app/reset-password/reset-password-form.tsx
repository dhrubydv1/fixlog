"use client";

import Link from "next/link";
import AuthShell from "@/app/components/auth-shell";
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
    <AuthShell>
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

          <div className="fl-auth-card">
            {isSubmitted ? (
              <div className="grid gap-5">
                <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">
                  Your password has been reset. You can now log in with your new password.
                </p>
                <Link
                  href="/auth"
                  className="fl-button fl-button-primary"
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
                  className="fl-button fl-button-primary"
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
                  className="fl-button fl-button-primary"
                >
                  {isSubmitting ? "Resetting password..." : "Reset password"}
                </button>
              </form>
            )}
          </div>
        </section>
      
    </AuthShell>
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
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-medium text-zinc-800">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={isVisible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder="At least 8 characters"
          disabled={disabled}
          className="fl-field"
        />
        <PasswordVisibilityButton visible={isVisible} onClick={() => setIsVisible((visible) => !visible)} disabled={disabled} />
      </div>
    </div>
  );
}

function PasswordVisibilityButton({ visible, onClick, disabled }: { visible: boolean; onClick: () => void; disabled: boolean }) {
  return <button type="button" onClick={onClick} disabled={disabled} aria-label={visible ? "Hide password" : "Show password"} title={visible ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-10 place-items-center rounded-r-lg text-zinc-500 transition hover:text-zinc-900 focus:outline-none focus:ring-4 focus:ring-zinc-900/10 disabled:cursor-not-allowed disabled:opacity-60">{visible ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="m3 3 18 18" /><path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" /><path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5.5 0 9.4 4.8 10 8-.2 1-1 2.8-3.1 4.5M6.6 6.6C4.2 8.2 2.7 10.7 2 12c.6 1.2 4.5 8 10 8 1.4 0 2.7-.3 3.8-.8" /></svg> : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-4"><path d="M2 12s3.6-8 10-8 10 8 10 8-3.6 8-10 8S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>}</button>;
}
