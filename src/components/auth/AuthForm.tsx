"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, Lock, Mail } from "lucide-react";

interface AuthFormProps {
  mode: "login" | "signup";
  isConfigured: boolean;
  initialError?: string | null;
  redirectedFrom?: string | null;
}

export function AuthForm({
  mode,
  isConfigured,
  initialError = null,
  redirectedFrom = null,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(initialError);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignUp = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isConfigured) {
      setErrorMessage(
        "Supabase environment variables are missing. Configure .env.local before signing in."
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (isSignUp && password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isSignUp ? "/api/auth/signup" : "/api/auth/login";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const payload = (await response.json()) as {
        error?: string;
        hasSession?: boolean;
      };

      if (!response.ok) {
        setErrorMessage(payload.error || "Authentication failed.");
        return;
      }

      if (isSignUp && !payload.hasSession) {
        setSuccessMessage(
          "Account created. Check your email inbox to confirm your address before signing in."
        );
        setPassword("");
        return;
      }

      const safeDestination =
        redirectedFrom &&
        redirectedFrom.startsWith("/") &&
        !redirectedFrom.startsWith("//")
          ? redirectedFrom
          : "/";

      window.location.assign(safeDestination);
    } catch (err) {
      const fallback =
        err instanceof Error ? err.message : "Authentication request failed.";
      setErrorMessage(fallback);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full rounded-xl border border-slate-200 bg-white p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {isSignUp ? "Create your account" : "Sign in to Taskline"}
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          {isSignUp
            ? "Start organizing your tasks with private, row-level protected storage."
            : "Enter your email and password to access your task workspace."}
        </p>
      </div>

      {!isConfigured && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div className="space-y-1">
            <p className="font-medium">Supabase not connected yet</p>
            <p className="text-xs text-amber-800">
              Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="font-mono">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>{" "}
              in <code className="font-mono">.env.local</code>.{" "}
              <Link href="/" className="font-medium underline hover:text-amber-950">
                View setup guide
              </Link>
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-800"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div
          role="status"
          className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-900"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="auth-email"
            className="mb-1.5 block text-xs font-medium text-slate-700"
          >
            Email address
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="auth-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={isSubmitting || !isConfigured}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="auth-password"
            className="mb-1.5 block text-xs font-medium text-slate-700"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="auth-password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              required
              minLength={isSignUp ? 6 : undefined}
              disabled={isSubmitting || !isConfigured}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignUp ? "At least 6 characters" : "Enter your password"}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !isConfigured}
          className="mt-2 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{isSignUp ? "Creating account..." : "Signing in..."}</span>
            </>
          ) : (
            <span>{isSignUp ? "Create account" : "Sign in"}</span>
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-5 text-center text-sm text-slate-600">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Sign in
            </Link>
          </>
        ) : (
          <>
            New to Taskline?{" "}
            <Link
              href="/signup"
              className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
            >
              Create an account
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
