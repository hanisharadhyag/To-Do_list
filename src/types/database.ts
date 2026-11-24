export type TodoPriority = "low" | "medium" | "high";

export type TodoStatusFilter = "all" | "active" | "completed";

export type TodoPriorityFilter = "all" | TodoPriority;

export type TodoSortOption = "smart" | "due_date" | "priority" | "newest";

export type Todo = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  priority: TodoPriority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type TodoInsert = {
  id?: string;
  user_id?: string;
  title: string;
  description?: string | null;
  is_completed?: boolean;
  priority?: TodoPriority;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type TodoUpdate = {
  id?: string;
  user_id?: string;
  title?: string;
  description?: string | null;
  is_completed?: boolean;
  priority?: TodoPriority;
  due_date?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      todos: {
        Row: Todo;
        Insert: TodoInsert;
        Update: TodoUpdate;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type ActionResult<T = null> = {
  data: T | null;
  error: string | null;
};
