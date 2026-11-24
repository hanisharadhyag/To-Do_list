import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckSquare } from "lucide-react";
import { SetupGuidePanel } from "@/components/setup/SetupGuideCard";
import { TodoWorkspace } from "@/components/todos/TodoWorkspace";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-8 px-6 py-4">
            <div className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0">
              <CheckSquare className="h-5 w-5 text-blue-600" />
              <span>Taskline</span>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 whitespace-nowrap shrink-0"
              >
                Sign in page
              </Link>
            </div>
          </div>
        </header>
        <SetupGuidePanel isConfigured={false} />
      </div>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", user.id)
    .order("is_completed", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  const initialError = error
    ? error.code === "42P01"
      ? "The todos table does not exist yet. Run supabase/schema.sql in your Supabase SQL Editor."
      : error.message
    : null;

  return (
    <TodoWorkspace
      initialTodos={data ?? []}
      initialError={initialError}
      userEmail={user.email ?? "Signed-in user"}
    />
  );
}
