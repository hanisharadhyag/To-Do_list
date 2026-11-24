# Taskline — Full-Stack To-Do List (Next.js App Router + Supabase)

A full-stack task management application built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, and **Supabase (PostgreSQL + Auth)** with Row Level Security (RLS).

## Features

- **Supabase Auth**: Email/password sign-up, sign-in, sign-out, PKCE callback route, and automatic route protection via Next.js `proxy.ts` + server-side `supabase.auth.getUser()` checks.
- **Row Level Security (RLS)**: Dedicated `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies scoped to `auth.uid() = user_id`, plus an automatic `updated_at` trigger and database-level non-blank title check.
- **Complete CRUD**:
  - **Create**: Title (required, client & server/DB whitespace validation), optional description, priority (`low` / `medium` / `high`), and optional due date.
  - **Read**: Ordered server & client views (incomplete first, due date, newest), status filter (`All`, `Active`, `Completed`), priority filter, and live keyword search.
  - **Update**: Direct completion toggle from the task row plus an edit modal for title, description, priority, and due date.
  - **Delete**: Inline confirmation before deletion so tasks are removed cleanly without accidental clicks.
- **Explicit Error & Loading States**: All Supabase queries check `if (error)` explicitly, surface user-facing error banners, render loading skeletons during initial fetch, and disable buttons during in-flight mutations.

## Setup Guide

### 1. Create a Supabase Project & Run the SQL Schema

1. Create a free project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** in your Supabase Dashboard.
3. Paste and run the contents of [`supabase/schema.sql`](./supabase/schema.sql).
4. In **Authentication → Providers**, ensure **Email** is enabled. (For immediate local sign-in without waiting on email verification, you can optionally toggle off *Confirm email* in **Authentication → Providers → Email** during development, or configure your site redirect URL `http://localhost:3000/auth/callback` in **Authentication → URL Configuration**.)

### 2. Configure Environment Variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY"
```

*(Both `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are supported.)*

### 3. Install & Start the Dev Server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visitors are redirected to `/login` automatically.
