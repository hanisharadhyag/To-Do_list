"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  CheckSquare,
  Database,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import {
  createTodoAction,
  deleteTodoAction,
  fetchTodosAction,
  signOutAction,
  toggleTodoAction,
  updateTodoAction,
} from "@/app/actions/todos";
import { SetupGuidePanel } from "@/components/setup/SetupGuideCard";
import { TodoEditModal } from "@/components/todos/TodoEditModal";
import { TodoItemRow } from "@/components/todos/TodoItemRow";
import { TodoSkeletonList } from "@/components/todos/TodoSkeletonList";
import { validateTodoInput } from "@/lib/validation/todo";
import type {
  Todo,
  TodoPriority,
  TodoPriorityFilter,
  TodoSortOption,
  TodoStatusFilter,
} from "@/types/database";

interface TodoWorkspaceProps {
  initialTodos: Todo[];
  initialError: string | null;
  userEmail: string;
}

const PRIORITY_WEIGHT: Record<TodoPriority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function sortTodos(list: Todo[], sortBy: TodoSortOption): Todo[] {
  const copy = [...list];
  copy.sort((a, b) => {
    if (sortBy === "smart") {
      if (a.is_completed !== b.is_completed) {
        return a.is_completed ? 1 : -1;
      }
      if (a.due_date && b.due_date) {
        const diff =
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (diff !== 0) return diff;
      } else if (a.due_date !== b.due_date) {
        return a.due_date ? -1 : 1;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    if (sortBy === "due_date") {
      if (a.due_date && b.due_date) {
        return (
          new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        );
      }
      if (a.due_date !== b.due_date) return a.due_date ? -1 : 1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    if (sortBy === "priority") {
      const weightDiff =
        PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority];
      if (weightDiff !== 0) return weightDiff;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }

    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  return copy;
}

export function TodoWorkspace({
  initialTodos,
  initialError,
  userEmail,
}: TodoWorkspaceProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [errorBanner, setErrorBanner] = useState<string | null>(initialError);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Filters & search
  const [statusFilter, setStatusFilter] = useState<TodoStatusFilter>("all");
  const [priorityFilter, setPriorityFilter] =
    useState<TodoPriorityFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<TodoSortOption>("smart");

  // Create form state
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<TodoPriority>("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [createValidationError, setCreateValidationError] = useState<
    string | null
  >(null);
  const [isCreating, setIsCreating] = useState(false);

  // Mutation & refresh states
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [togglingIds, setTogglingIds] = useState<Set<string>>(new Set());
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editServerError, setEditServerError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [showSchemaModal, setShowSchemaModal] = useState(false);

  function showSuccessNotice(message: string) {
    setStatusNotice(message);
    setTimeout(() => {
      setStatusNotice((prev) => (prev === message ? null : prev));
    }, 3000);
  }

  const metrics = useMemo(() => {
    const now = Date.now();
    let active = 0;
    let completed = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let overdue = 0;

    for (const item of todos) {
      if (item.is_completed) {
        completed += 1;
      } else {
        active += 1;
        if (item.due_date && new Date(item.due_date).getTime() < now) {
          overdue += 1;
        }
      }
      if (item.priority === "high") high += 1;
      else if (item.priority === "medium") medium += 1;
      else low += 1;
    }

    return {
      total: todos.length,
      active,
      completed,
      high,
      medium,
      low,
      overdue,
    };
  }, [todos]);

  const filteredTodos = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = todos.filter((todo) => {
      if (statusFilter === "active" && todo.is_completed) return false;
      if (statusFilter === "completed" && !todo.is_completed) return false;
      if (priorityFilter !== "all" && todo.priority !== priorityFilter) {
        return false;
      }
      if (query) {
        const titleMatch = todo.title.toLowerCase().includes(query);
        const descMatch = (todo.description ?? "")
          .toLowerCase()
          .includes(query);
        if (!titleMatch && !descMatch) return false;
      }
      return true;
    });

    return sortTodos(filtered, sortBy);
  }, [todos, statusFilter, priorityFilter, searchQuery, sortBy]);

  async function handleRefresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    setErrorBanner(null);

    const result = await fetchTodosAction();
    if (result.error) {
      setErrorBanner(result.error);
    } else if (result.data) {
      setTodos(result.data);
      showSuccessNotice("Tasks synced with Supabase.");
    }
    setIsRefreshing(false);
  }

  async function handleCreateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isCreating) return;

    setCreateValidationError(null);
    setErrorBanner(null);

    const check = validateTodoInput({
      title: newTitle,
      description: newDescription,
      priority: newPriority,
      due_date: newDueDate || null,
    });

    if (!check.valid) {
      setCreateValidationError(check.error);
      return;
    }

    setIsCreating(true);
    const result = await createTodoAction(check.data);
    setIsCreating(false);

    if (result.error) {
      setErrorBanner(result.error);
      return;
    }

    if (result.data) {
      setTodos((prev) => [result.data!, ...prev]);
      setNewTitle("");
      setNewDescription("");
      setNewPriority("medium");
      setNewDueDate("");
      showSuccessNotice("Task created.");
    }
  }

  async function handleToggle(todo: Todo) {
    if (togglingIds.has(todo.id)) return;
    setErrorBanner(null);

    setTogglingIds((prev) => new Set(prev).add(todo.id));
    const result = await toggleTodoAction(todo.id, !todo.is_completed);
    setTogglingIds((prev) => {
      const next = new Set(prev);
      next.delete(todo.id);
      return next;
    });

    if (result.error) {
      setErrorBanner(result.error);
      return;
    }

    if (result.data) {
      setTodos((prev) =>
        prev.map((item) => (item.id === todo.id ? result.data! : item))
      );
    }
  }

  async function handleSaveEdit(
    id: string,
    payload: {
      title: string;
      description: string | null;
      priority: TodoPriority;
      due_date: string | null;
    }
  ) {
    if (isSavingEdit) return;
    setIsSavingEdit(true);
    setEditServerError(null);
    setErrorBanner(null);

    const result = await updateTodoAction(id, payload);
    setIsSavingEdit(false);

    if (result.error) {
      setEditServerError(result.error);
      return;
    }

    if (result.data) {
      setTodos((prev) =>
        prev.map((item) => (item.id === id ? result.data! : item))
      );
      setEditingTodo(null);
      showSuccessNotice("Task updated.");
    }
  }

  async function handleDelete(todo: Todo) {
    if (deletingIds.has(todo.id)) return;
    setErrorBanner(null);

    setDeletingIds((prev) => new Set(prev).add(todo.id));
    const result = await deleteTodoAction(todo.id);
    setDeletingIds((prev) => {
      const next = new Set(prev);
      next.delete(todo.id);
      return next;
    });

    if (result.error) {
      setErrorBanner(result.error);
      return;
    }

    setTodos((prev) => prev.filter((item) => item.id !== todo.id));
    showSuccessNotice(`Removed "${todo.title}".`);
  }

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);
    await signOutAction();
  }

  const hasActiveFilters =
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-8 px-6 py-3.5">
          <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            <span className="font-display text-lg font-bold tracking-tight text-slate-900">
              Taskline
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setPriorityFilter("all");
              }}
              className="hover:text-slate-900 hover:underline whitespace-nowrap shrink-0"
            >
              All Tasks
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className="hover:text-slate-900 hover:underline whitespace-nowrap shrink-0"
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("completed")}
              className="hover:text-slate-900 hover:underline whitespace-nowrap shrink-0"
            >
              Completed
            </button>
            <button
              type="button"
              onClick={() => setShowSchemaModal(true)}
              className="hover:text-slate-900 hover:underline whitespace-nowrap shrink-0"
            >
              SQL Schema
            </button>
          </nav>

          <div className="flex items-center gap-4 shrink-0">
            <span
              title={userEmail}
              className="hidden max-w-[220px] truncate text-xs text-slate-500 sm:inline"
            >
              {userEmail}
            </span>
            <button
              type="button"
              disabled={isSigningOut}
              onClick={handleSignOut}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {isSigningOut ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <LogOut className="h-3.5 w-3.5" />
              )}
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px] flex-col gap-8 px-6 py-8 lg:flex-row">
        <aside className="w-full shrink-0 space-y-6 lg:w-[250px]">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-xs font-semibold text-slate-500">
              Views
            </h2>
            <div className="space-y-1">
              {(
                [
                  { id: "all", label: "All Tasks", count: metrics.total },
                  { id: "active", label: "Active", count: metrics.active },
                  {
                    id: "completed",
                    label: "Completed",
                    count: metrics.completed,
                  },
                ] as const
              ).map((item) => {
                const isSelected = statusFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setStatusFilter(item.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="whitespace-nowrap">{item.label}</span>
                    <span className="tabular-nums text-xs text-slate-500">
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-3 text-xs font-semibold text-slate-500">
              Priority
            </h2>
            <div className="space-y-1">
              {(
                [
                  { id: "all", label: "All Priorities", count: metrics.total },
                  { id: "high", label: "High", count: metrics.high },
                  { id: "medium", label: "Medium", count: metrics.medium },
                  { id: "low", label: "Low", count: metrics.low },
                ] as const
              ).map((item) => {
                const isSelected = priorityFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPriorityFilter(item.id)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span className="whitespace-nowrap">{item.label}</span>
                    <span
                      className={`tabular-nums text-xs ${
                        isSelected ? "text-slate-300" : "text-slate-500"
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="mb-2 text-xs font-semibold text-slate-500">
              Summary
            </h2>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Open tasks</dt>
                <dd className="font-medium text-slate-900 tabular-nums">
                  {metrics.active}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Overdue</dt>
                <dd
                  className={`font-medium tabular-nums ${
                    metrics.overdue > 0 ? "text-red-600" : "text-slate-900"
                  }`}
                >
                  {metrics.overdue}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Completed</dt>
                <dd className="font-medium text-emerald-700 tabular-nums">
                  {metrics.completed}
                </dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={() => setShowSchemaModal(true)}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 md:hidden"
            >
              <Database className="h-3.5 w-3.5" />
              <span>View SQL Schema</span>
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Tasks
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Create, prioritize, and track your work stored securely in Supabase.
              </p>
            </div>
            <button
              type="button"
              disabled={isRefreshing}
              onClick={handleRefresh}
              className="inline-flex min-h-[38px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>{isRefreshing ? "Syncing..." : "Refresh"}</span>
            </button>
          </div>

          {errorBanner && (
            <div
              role="alert"
              className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              <div className="flex items-start gap-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <span>{errorBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorBanner(null)}
                aria-label="Dismiss error"
                className="rounded p-1 text-red-600 hover:bg-red-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {statusNotice && (
            <div
              role="status"
              className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{statusNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusNotice(null)}
                aria-label="Dismiss notice"
                className="rounded p-1 text-emerald-700 hover:bg-emerald-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <section
            aria-label="Create new task"
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <form onSubmit={handleCreateSubmit} className="space-y-4" noValidate>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <div className="min-w-0 flex-1">
                  <label htmlFor="new-todo-title" className="sr-only">
                    Task title
                  </label>
                  <input
                    ref={titleInputRef}
                    id="new-todo-title"
                    type="text"
                    required
                    maxLength={200}
                    disabled={isCreating}
                    value={newTitle}
                    onChange={(e) => {
                      setNewTitle(e.target.value);
                      if (createValidationError) setCreateValidationError(null);
                    }}
                    placeholder="Add a new task title..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 disabled:bg-slate-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Add Task</span>
                    </>
                  )}
                </button>
              </div>

              {createValidationError && (
                <p role="alert" className="text-xs font-medium text-red-600">
                  {createValidationError}
                </p>
              )}

              <div className="grid gap-3 sm:grid-cols-12">
                <div className="sm:col-span-6">
                  <label htmlFor="new-todo-description" className="sr-only">
                    Description (optional)
                  </label>
                  <input
                    id="new-todo-description"
                    type="text"
                    maxLength={2000}
                    disabled={isCreating}
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Optional description or notes"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="new-todo-priority" className="sr-only">
                    Priority
                  </label>
                  <select
                    id="new-todo-priority"
                    disabled={isCreating}
                    value={newPriority}
                    onChange={(e) =>
                      setNewPriority(e.target.value as TodoPriority)
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60"
                  >
                    <option value="low">Low priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="high">High priority</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="new-todo-due" className="sr-only">
                    Due date
                  </label>
                  <input
                    id="new-todo-due"
                    type="datetime-local"
                    disabled={isCreating}
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    aria-label="Due date (optional)"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm text-slate-700 tabular-nums focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15 disabled:opacity-60"
                  />
                </div>
              </div>
            </form>
          </section>

          <section
            aria-label="Filter and search tasks"
            className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="relative min-w-0 flex-1 sm:max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by keyword..."
                aria-label="Search tasks"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div
                role="group"
                aria-label="Status filter"
                className="inline-flex items-center gap-1 rounded-lg bg-slate-200/70 p-1"
              >
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "active", label: "Active" },
                    { id: "completed", label: "Completed" },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setStatusFilter(tab.id)}
                    className={`rounded-md px-3 py-1 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      statusFilter === tab.id
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <select
                aria-label="Filter by priority"
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(e.target.value as TodoPriorityFilter)
                }
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              >
                <option value="all">All priorities</option>
                <option value="high">High only</option>
                <option value="medium">Medium only</option>
                <option value="low">Low only</option>
              </select>

              <select
                aria-label="Sort tasks"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as TodoSortOption)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              >
                <option value="smart">Smart order</option>
                <option value="due_date">Due date</option>
                <option value="priority">Priority</option>
                <option value="newest">Newest first</option>
              </select>
            </div>
          </section>

          {isRefreshing ? (
            <TodoSkeletonList count={5} />
          ) : filteredTodos.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center">
              <h2 className="text-base font-semibold text-slate-900">
                {hasActiveFilters ? "No matching tasks" : "Your task list is empty"}
              </h2>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
                {hasActiveFilters
                  ? "No tasks match the current status, priority, or keyword filter."
                  : "Add your first task above with a priority and optional due date to begin tracking."}
              </p>
              <div className="mt-5 flex justify-center">
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStatusFilter("all");
                      setPriorityFilter("all");
                      setSearchQuery("");
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => titleInputRef.current?.focus()}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create First Task</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white divide-y divide-slate-200">
              {filteredTodos.map((todo) => (
                <TodoItemRow
                  key={todo.id}
                  todo={todo}
                  isToggling={togglingIds.has(todo.id)}
                  isDeleting={deletingIds.has(todo.id)}
                  isUpdating={isSavingEdit && editingTodo?.id === todo.id}
                  onToggle={handleToggle}
                  onEdit={(selected) => {
                    setEditServerError(null);
                    setEditingTodo(selected);
                  }}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <TodoEditModal
        todo={editingTodo}
        isSaving={isSavingEdit}
        serverError={editServerError}
        onClose={() => {
          if (!isSavingEdit) {
            setEditingTodo(null);
            setEditServerError(null);
          }
        }}
        onSave={handleSaveEdit}
      />

      {showSchemaModal && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Supabase SQL Schema and Setup Guide"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSchemaModal(false);
            }
          }}
        >
          <div className="mx-auto my-8 max-w-4xl rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 rounded-t-xl">
              <span className="text-sm font-semibold text-slate-900">
                Supabase Schema & Setup Reference
              </span>
              <button
                type="button"
                onClick={() => setShowSchemaModal(false)}
                aria-label="Close setup modal"
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <SetupGuidePanel isConfigured={true} />
          </div>
        </div>
      )}
    </div>
  );
}
