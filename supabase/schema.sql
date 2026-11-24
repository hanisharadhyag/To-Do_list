-- Taskline Supabase PostgreSQL Schema & Row Level Security
-- Run this script in your Supabase Dashboard -> SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.todos (
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

-- Helpful index for ordered per-user queries
create index if not exists todos_user_order_idx
  on public.todos (user_id, is_completed asc, due_date asc nulls last, created_at desc);

-- Automatically update updated_at on row modifications
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_todos_updated_at on public.todos;
create trigger set_todos_updated_at
  before update on public.todos
  for each row
  execute function public.handle_updated_at();

-- Enable Row Level Security (RLS)
alter table public.todos enable row level security;

-- Clean up existing policies if re-running script
drop policy if exists "Users can view their own todos" on public.todos;
drop policy if exists "Users can insert their own todos" on public.todos;
drop policy if exists "Users can update their own todos" on public.todos;
drop policy if exists "Users can delete their own todos" on public.todos;

-- 1. SELECT policy
create policy "Users can view their own todos"
  on public.todos
  for select
  to authenticated
  using (auth.uid() = user_id);

-- 2. INSERT policy
create policy "Users can insert their own todos"
  on public.todos
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 3. UPDATE policy
create policy "Users can update their own todos"
  on public.todos
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 4. DELETE policy
create policy "Users can delete their own todos"
  on public.todos
  for delete
  to authenticated
  using (auth.uid() = user_id);
