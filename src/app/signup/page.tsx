import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckSquare, ShieldCheck } from "lucide-react";
import { AuthForm } from "@/components/auth/AuthForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export default async function SignUpPage() {
  const configured = isSupabaseConfigured();

  if (configured) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/");
    }
  }

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
              href="/login"
              className="hover:text-slate-900 hover:underline whitespace-nowrap shrink-0"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-12 lg:grid-cols-12 lg:py-20">
        <section className="space-y-6 lg:col-span-6">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span>Email & Password Auth</span>
            <span aria-hidden="true">·</span>
            <span>Supabase SSR Sessions</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Create your private task ledger.
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-slate-600">
            Sign up with your email and password to unlock a synced task list with due dates, priority levels, and explicit database validation.
          </p>
        </section>

        <section className="lg:col-span-6 lg:pl-8">
          <AuthForm mode="signup" isConfigured={configured} />
        </section>
      </main>
    </div>
  );
}
