import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckSquare, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

interface LoginPageProps {
  searchParams: Promise<{
    error?: string;
    redirectedFrom?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const configured = isSupabaseConfigured();
  const params = await searchParams;

  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/");
    }
  }

  const initialError =
    params.error === "supabase_unconfigured"
      ? "Supabase environment variables are not configured yet."
      : params.error
        ? decodeURIComponent(params.error)
        : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
          <Link
            href="/"
            prefetch={false}
            className="inline-flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            <CheckSquare className="h-5 w-5 text-blue-600" />
            <span>Taskline</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link
              href="/signup"
              className="hover:text-slate-900 hover:underline whitespace-nowrap shrink-0"
            >
              Create account
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-12 lg:py-20">
        <section className="space-y-6 lg:col-span-6">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>PostgreSQL Row Level Security</span>
            <span aria-hidden="true">·</span>
            <span>Private per-user workspace</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Structured tasks with reliable persistence.
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-slate-600">
            Organize active priorities, due dates, and detailed notes in a workspace backed by Supabase PostgreSQL and strict row-level policies.
          </p>
          <dl className="grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-slate-900">
                Scoped to your account
              </dt>
              <dd className="mt-1 text-sm text-slate-600">
                Every select, insert, update, and delete verifies your authenticated user ID in PostgreSQL.
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-slate-900">
                Instant filtering & search
              </dt>
              <dd className="mt-1 text-sm text-slate-600">
                Filter by status or priority, track overdue deadlines, and edit tasks inline without page reloads.
              </dd>
            </div>
          </dl>
        </section>

        <section className="lg:col-span-6 lg:pl-8">
          <AuthForm
            mode="login"
            isConfigured={configured}
            initialError={initialError}
            redirectedFrom={params.redirectedFrom ?? null}
          />
        </section>
      </main>
    </div>
  );
}
