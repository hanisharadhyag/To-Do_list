"use client";

import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, Loader2, X } from "lucide-react";
import { formatIsoToLocalInput, validateTodoInput } from "@/lib/validation/todo";
import type { Todo, TodoPriority } from "@/types/database";

interface TodoEditModalProps {
  todo: Todo | null;
  isSaving: boolean;
  serverError: string | null;
  onClose: () => void;
  onSave: (
    id: string,
    payload: {
      title: string;
      description: string | null;
      priority: TodoPriority;
      due_date: string | null;
    }
  ) => Promise<void>;
}

const PRIORITY_OPTIONS: { value: TodoPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export function TodoEditModal({
  todo,
  isSaving,
  serverError,
  onClose,
  onSave,
}: TodoEditModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (todo) {
      setTitle(todo.title);
      setDescription(todo.description ?? "");
      setPriority(todo.priority);
      setDueDate(formatIsoToLocalInput(todo.due_date));
      setValidationError(null);
    }
  }, [todo]);

  useEffect(() => {
    if (!todo) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !isSaving) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [todo, isSaving, onClose]);

  if (!todo) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!todo || isSaving) return;

    setValidationError(null);
    const check = validateTodoInput({
      title,
      description,
      priority,
      due_date: dueDate || null,
    });

    if (!check.valid) {
      setValidationError(check.error);
      return;
    }

    await onSave(todo.id, check.data);
  }

  const displayedError = validationError || serverError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-todo-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <h2
            id="edit-todo-title"
            className="text-lg font-semibold text-slate-900"
          >
            Edit task
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Close modal"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {displayedError && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <span>{displayedError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div>
            <label
              htmlFor="edit-task-title"
              className="mb-1.5 block text-xs font-medium text-slate-700"
            >
              Title <span className="text-red-600">*</span>
            </label>
            <input
              id="edit-task-title"
              type="text"
              required
              maxLength={200}
              disabled={isSaving}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to get done?"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 disabled:bg-slate-50"
            />
          </div>

          <div>
            <label
              htmlFor="edit-task-description"
              className="mb-1.5 block text-xs font-medium text-slate-700"
            >
              Description
            </label>
            <textarea
              id="edit-task-description"
              rows={3}
              maxLength={2000}
              disabled={isSaving}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional context, links, or checklist notes"
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 disabled:bg-slate-50"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-slate-700">
                Priority
              </span>
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
                {PRIORITY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={isSaving}
                    onClick={() => setPriority(option.value)}
                    className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      priority === option.value
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="edit-task-due"
                  className="text-xs font-medium text-slate-700"
                >
                  Due date
                </label>
                {dueDate && (
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setDueDate("")}
                    className="text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                id="edit-task-due"
                type="datetime-local"
                disabled={isSaving}
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 tabular-nums focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-w-[120px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap shrink-0"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
