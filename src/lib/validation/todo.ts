import type { TodoPriority } from "@/types/database";

const VALID_PRIORITIES: ReadonlySet<TodoPriority> = new Set([
  "low",
  "medium",
  "high",
]);

export interface TodoFormPayload {
  title: string;
  description?: string | null;
  priority?: string;
  due_date?: string | null;
}

export interface ValidatedTodoData {
  title: string;
  description: string | null;
  priority: TodoPriority;
  due_date: string | null;
}

export function validateTodoInput(
  input: TodoFormPayload
): { valid: true; data: ValidatedTodoData } | { valid: false; error: string } {
  const trimmedTitle = typeof input.title === "string" ? input.title.trim() : "";

  if (!trimmedTitle) {
    return { valid: false, error: "Task title is required and cannot be blank." };
  }

  if (trimmedTitle.length > 200) {
    return {
      valid: false,
      error: "Task title must be 200 characters or fewer.",
    };
  }

  const rawDescription =
    typeof input.description === "string" ? input.description.trim() : "";
  if (rawDescription.length > 2000) {
    return {
      valid: false,
      error: "Description must be 2,000 characters or fewer.",
    };
  }
  const description = rawDescription.length > 0 ? rawDescription : null;

  const rawPriority = (input.priority ?? "medium") as TodoPriority;
  if (!VALID_PRIORITIES.has(rawPriority)) {
    return {
      valid: false,
      error: "Priority must be low, medium, or high.",
    };
  }

  let dueDate: string | null = null;
  if (input.due_date && input.due_date.trim().length > 0) {
    const parsed = new Date(input.due_date);
    if (Number.isNaN(parsed.getTime())) {
      return {
        valid: false,
        error: "Please enter a valid due date.",
      };
    }
    dueDate = parsed.toISOString();
  }

  return {
    valid: true,
    data: {
      title: trimmedTitle,
      description,
      priority: rawPriority,
      due_date: dueDate,
    },
  };
}

export function formatIsoToLocalInput(isoString: string | null): string {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
