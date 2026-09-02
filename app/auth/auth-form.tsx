'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-up" | "login";

function FormField({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-zinc-800">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("sign-up");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === "sign-up";
  const inputClassName =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/10";

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setErrorMessage(null);
    setPassword("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);

    if (isSignUp && !name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!email.trim() || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = isSignUp
        ? await authClient.signUp.email({
            name: name.trim(),
            email: email.trim(),
            password,
          })
        : await authClient.signIn.email({
            email: email.trim(),
            password,
          });

      if (result.error) {
        setErrorMessage(result.error.message ?? "Unable to continue. Please try again.");
        return;
      }

      router.replace("/");
      router.refresh();
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
        <section className="mx-auto w-full max-w-md" aria-labelledby="auth-heading">
          <div className="mb-7 text-center">
            <p className="text-sm font-medium text-zinc-500">Welcome to FixLog</p>
            <h1 id="auth-heading" className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">
              {isSignUp ? "Save your next solution." : "Welcome back."}
            </h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              {isSignUp
                ? "Create an account to keep your hard-won fixes close at hand."
                : "Sign in to access your saved solutions."}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 grid grid-cols-2 rounded-lg bg-zinc-100 p-1" aria-label="Authentication mode">
              <button
                type="button"
                onClick={() => switchMode("sign-up")}
                aria-pressed={isSignUp}
                className={`rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-zinc-900/10 ${
                  isSignUp ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => switchMode("login")}
                aria-pressed={!isSignUp}
                className={`rounded-md px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-4 focus:ring-zinc-900/10 ${
                  !isSignUp ? "bg-white text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                Log In
              </button>
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5" noValidate>
              {isSignUp && (
                <FormField label="Name" htmlFor="name">
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder="Ada Lovelace"
                    disabled={isSubmitting}
                    className={inputClassName}
                  />
                </FormField>
              )}

              <FormField label="Email" htmlFor="email">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  disabled={isSubmitting}
                  className={inputClassName}
                />
              </FormField>

              <FormField label="Password" htmlFor="password">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
                  disabled={isSubmitting}
                  className={inputClassName}
                />
              </FormField>

              {errorMessage && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-700 focus:outline-none focus:ring-4 focus:ring-zinc-900/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Please wait..." : isSignUp ? "Create account" : "Log in"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-600">
              {isSignUp ? "Already have an account?" : "Don’t have an account?"}{" "}
              <button
                type="button"
                onClick={() => switchMode(isSignUp ? "login" : "sign-up")}
                className="font-medium text-zinc-900 underline underline-offset-4 transition hover:text-zinc-600 focus:outline-none focus:ring-4 focus:ring-zinc-900/10"
              >
                {isSignUp ? "Log in" : "Sign up"}
              </button>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

