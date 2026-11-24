"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  Flag,
  Loader2,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Todo, TodoPriority } from "@/types/database";

interface TodoItemRowProps {
  todo: Todo;
  isToggling: boolean;
  isDeleting: boolean;
  isUpdating: boolean;
  onToggle: (todo: Todo) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (todo: Todo) => Promise<void>;
}

const PRIORITY_META: Record<
  TodoPriority,
  { label: string; textClass: string }
> = {
  high: { label: "High priority", textClass: "text-red-600" },
  medium: { label: "Medium priority", textClass: "text-amber-700" },
  low: { label: "Low priority", textClass: "text-slate-500" },
};

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function TodoItemRow({
  todo,
  isToggling,
  isDeleting,
  isUpdating,
  onToggle,
  onEdit,
  onDelete,
}: TodoItemRowProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isBusy = isToggling || isDeleting || isUpdating;
  const priorityInfo = PRIORITY_META[todo.priority] ?? PRIORITY_META.medium;

  const isOverdue =
    !todo.is_completed &&
    todo.due_date !== null &&
    new Date(todo.due_date).getTime() < Date.now();

  return (
    <article
      className={`group flex flex-col gap-3 px-5 py-4 transition-colors sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${
        todo.is_completed ? "bg-slate-50/70" : "bg-white hover:bg-slate-50/50"
      }`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3.5">
        <button
          type="button"
          role="checkbox"
          aria-checked={todo.is_completed}
          aria-label={
            todo.is_completed
              ? `Mark "${todo.title}" as active`
              : `Mark "${todo.title}" as completed`
          }
          disabled={isBusy}
          onClick={() => onToggle(todo)}
          className="mt-0.5 flex h-10 w-10 -m-2.5 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed"
        >
          <span
            className={`flex h-5 w-5 items-center justify-center rounded border transition-colors ${
              todo.is_completed
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-slate-300 bg-white text-transparent group-hover:border-blue-500"
            }`}
          >
            {isToggling ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            ) : (
              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            )}
          </span>
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-baseline gap-2">
            <h3
              className={`text-sm font-medium leading-snug break-words ${
                todo.is_completed
                  ? "text-slate-500 line-through"
                  : "text-slate-900"
              }`}
            >
              {todo.title}
            </h3>
          </div>

          {todo.description && (
            <p
              className={`text-sm leading-relaxed break-words ${
                todo.is_completed ? "text-slate-400" : "text-slate-600"
              }`}
            >
              {todo.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 pt-0.5 text-xs text-slate-500">
            <span
              className={`inline-flex items-center gap-1 font-medium ${
                todo.is_completed ? "text-slate-400" : priorityInfo.textClass
              }`}
            >
              <Flag className="h-3 w-3 shrink-0" />
              <span>{priorityInfo.label}</span>
            </span>

            {todo.due_date && (
              <>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span
                  className={`inline-flex items-center gap-1 tabular-nums ${
                    isOverdue
                      ? "font-medium text-red-600"
                      : todo.is_completed
                        ? "text-slate-400"
                        : "text-slate-600"
                  }`}
                >
                  {isOverdue ? (
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                  ) : (
                    <Calendar className="h-3 w-3 shrink-0" />
                  )}
                  <span>
                    {isOverdue ? "Overdue, " : "Due "}
                    {formatDateTime(todo.due_date)}
                  </span>
                </span>
              </>
            )}

            <span aria-hidden="true" className="text-slate-300">
              ·
            </span>
            <span className="tabular-nums text-slate-400">
              Added {formatShortDate(todo.created_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-1.5 pl-7 sm:pl-0 shrink-0">
        {confirmingDelete ? (
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-xs font-medium text-red-700">
              Delete?
            </span>
            <button
              type="button"
              disabled={isBusy}
              onClick={async () => {
                await onDelete(todo);
                setConfirmingDelete(false);
              }}
              className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting</span>
                </>
              ) : (
                <span>Confirm</span>
              )}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setConfirmingDelete(false)}
              className="inline-flex min-h-[34px] items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => onEdit(todo)}
              aria-label={`Edit "${todo.title}"`}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => setConfirmingDelete(true)}
              aria-label={`Delete "${todo.title}"`}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete</span>
            </button>
          </>
        )}
      </div>
    </article>
  );
}
