"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { validateTodoInput, type TodoFormPayload } from "@/lib/validation/todo";
import type { ActionResult, Todo } from "@/types/database";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatSupabaseError(message: string, code?: string): string {
  if (code === "42P01") {
    return "The todos table was not found. Please run supabase/schema.sql in your Supabase SQL Editor.";
  }
  if (code === "42501") {
    return "Permission denied by Row Level Security. Please sign in again.";
  }
  if (code === "23514") {
    return "Validation failed at the database level: title cannot be blank and priority must be low, medium, or high.";
  }
  return message || "An unexpected database error occurred.";
}

export async function fetchTodosAction(): Promise<ActionResult<Todo[]>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: "Supabase is not configured. Add environment variables in .env.local.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { data: null, error: authError.message };
  }
  if (!user) {
    return { data: null, error: "Your session has expired. Please sign in again." };
  }

  const { data, error } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", user.id)
    .order("is_completed", { ascending: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: formatSupabaseError(error.message, error.code) };
  }

  return { data: data ?? [], error: null };
}

export async function createTodoAction(
  payload: TodoFormPayload
): Promise<ActionResult<Todo>> {
  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: "Supabase is not configured. Add environment variables in .env.local.",
    };
  }

  const validation = validateTodoInput(payload);
  if (!validation.valid) {
    return { data: null, error: validation.error };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { data: null, error: authError.message };
  }
  if (!user) {
    return { data: null, error: "You must be signed in to create a task." };
  }

  const { data, error } = await supabase
    .from("todos")
    .insert({
      user_id: user.id,
      title: validation.data.title,
      description: validation.data.description,
      priority: validation.data.priority,
      due_date: validation.data.due_date,
      is_completed: false,
    })
    .select("*")
    .single();

  if (error) {
    return { data: null, error: formatSupabaseError(error.message, error.code) };
  }

  revalidatePath("/");
  return { data, error: null };
}

export async function toggleTodoAction(
  id: string,
  nextCompleted: boolean
): Promise<ActionResult<Todo>> {
  if (!UUID_REGEX.test(id)) {
    return { data: null, error: "Invalid task identifier." };
  }

  if (!isSupabaseConfigured()) {
    return { data: null, error: "Supabase is not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { data: null, error: authError.message };
  }
  if (!user) {
    return { data: null, error: "You must be signed in to update tasks." };
  }

  const { data, error } = await supabase
    .from("todos")
    .update({ is_completed: Boolean(nextCompleted) })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: formatSupabaseError(error.message, error.code) };
  }

  revalidatePath("/");
  return { data, error: null };
}

export async function updateTodoAction(
  id: string,
  payload: TodoFormPayload
): Promise<ActionResult<Todo>> {
  if (!UUID_REGEX.test(id)) {
    return { data: null, error: "Invalid task identifier." };
  }

  if (!isSupabaseConfigured()) {
    return { data: null, error: "Supabase is not configured." };
  }

  const validation = validateTodoInput(payload);
  if (!validation.valid) {
    return { data: null, error: validation.error };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { data: null, error: authError.message };
  }
  if (!user) {
    return { data: null, error: "You must be signed in to edit tasks." };
  }

  const { data, error } = await supabase
    .from("todos")
    .update({
      title: validation.data.title,
      description: validation.data.description,
      priority: validation.data.priority,
      due_date: validation.data.due_date,
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: formatSupabaseError(error.message, error.code) };
  }

  revalidatePath("/");
  return { data, error: null };
}

export async function deleteTodoAction(
  id: string
): Promise<ActionResult<{ id: string }>> {
  if (!UUID_REGEX.test(id)) {
    return { data: null, error: "Invalid task identifier." };
  }

  if (!isSupabaseConfigured()) {
    return { data: null, error: "Supabase is not configured." };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) {
    return { data: null, error: authError.message };
  }
  if (!user) {
    return { data: null, error: "You must be signed in to delete tasks." };
  }

  const { error } = await supabase
    .from("todos")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { data: null, error: formatSupabaseError(error.message, error.code) };
  }

  revalidatePath("/");
  return { data: { id }, error: null };
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/login");
}
