"use client";

import { useState } from "react";
import { Check, Copy, Database, KeyRound, Terminal } from "lucide-react";

const SCHEMA_SQL_SNIPPET = `create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null default auth.uid(),
  title text not null,
  description text,
  is_completed boolean not null default false,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  due_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint todos_title_not_blank check (char_length(btrim(title)) > 0)
);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_todos_updated_at
  before update on public.todos
  for each row execute function public.handle_updated_at();

alter table public.todos enable row level security;

create policy "Users can view their own todos"
  on public.todos for select to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own todos"
  on public.todos for insert to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own todos"
  on public.todos for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can delete their own todos"
  on public.todos for delete to authenticated
  using (auth.uid() = user_id);`;

const ENV_SNIPPET = `NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"`;

interface SetupGuidePanelProps {
  isConfigured: boolean;
}

export function SetupGuidePanel({ isConfigured }: SetupGuidePanelProps) {
  const [copiedTarget, setCopiedTarget] = useState<"sql" | "env" | null>(null);

  async function handleCopy(text: string, target: "sql" | "env") {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTarget(target);
      setTimeout(() => setCopiedTarget(null), 2000);
    } catch {
      // Clipboard API may be restricted in some preview iframes
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-2 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Database className="h-3.5 w-3.5 text-blue-600" />
          <span>Supabase Configuration</span>
          <span aria-hidden="true">·</span>
          <span>PostgreSQL + Row Level Security</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Connect your Supabase project to launch Taskline
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          {isConfigured
            ? "Your environment variables are active. Make sure the SQL schema below has been executed in your Supabase SQL Editor."
            : "Environment variables NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY are not set yet. Follow the three steps below to enable authentication and persistent PostgreSQL storage."}
        </p>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Database className="h-4 w-4 text-slate-700" />
              <h2 className="text-base font-semibold text-slate-900">
                1. Create table, trigger, and RLS policies
              </h2>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(SCHEMA_SQL_SNIPPET, "sql")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0"
            >
              {copiedTarget === "sql" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied SQL</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
          </div>
          <p className="mb-4 text-sm text-slate-600">
            Open your Supabase Dashboard → <strong className="font-medium text-slate-900">SQL Editor</strong> and run{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
              supabase/schema.sql
            </code>
            .
          </p>
          <pre className="max-h-72 overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
            <code>{SCHEMA_SQL_SNIPPET}</code>
          </pre>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <KeyRound className="h-4 w-4 text-slate-700" />
              <h2 className="text-base font-semibold text-slate-900">
                2. Add credentials to .env.local
              </h2>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(ENV_SNIPPET, "env")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0"
            >
              {copiedTarget === "env" ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy .env.local</span>
                </>
              )}
            </button>
          </div>
          <p className="mb-4 text-sm text-slate-600">
            Copy your Project URL and Publishable (or Anon) Key from{" "}
            <strong className="font-medium text-slate-900">Project Settings → API</strong> into{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
              .env.local
            </code>{" "}
            (or AI Studio Secrets).
          </p>
          <pre className="overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
            <code>{ENV_SNIPPET}</code>
          </pre>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="mb-2 flex items-center gap-2.5">
            <Terminal className="h-4 w-4 text-slate-700" />
            <h2 className="text-base font-semibold text-slate-900">
              3. Restart the dev server
            </h2>
          </div>
          <p className="text-sm text-slate-600">
            Run{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
              npm run dev
            </code>{" "}
            and refresh this page. Unauthenticated requests will automatically redirect to{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800">
              /login
            </code>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
