import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getServerCookieOptions, isRequestHttps } from "@/lib/supabase/cookies";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

function mapLoginError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed")) {
    return "Email not confirmed. Check your inbox for the verification link, or disable 'Confirm email' under Authentication → Providers → Email in your Supabase Dashboard.";
  }
  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password. Double-check your credentials or create an account first.";
  }
  return message;
}

export async function POST(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 500 }
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email) {
    return NextResponse.json(
      { error: "Please enter your email address." },
      { status: 400 }
    );
  }
  if (!password) {
    return NextResponse.json(
      { error: "Please enter your password." },
      { status: 400 }
    );
  }

  const serverCookieOpts = getServerCookieOptions(
    isRequestHttps(request.headers, request.url)
  );
  const cookiesToApply: Array<{
    name: string;
    value: string;
    options: Record<string, unknown>;
  }> = [];

  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
    cookieOptions: serverCookieOpts,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookiesToApply.push({
            name,
            value,
            options: { ...options, ...serverCookieOpts },
          });
        });
      },
    },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return NextResponse.json(
      { error: mapLoginError(error.message) },
      { status: 401 }
    );
  }

  const response = NextResponse.json(
    { user: { id: data.user.id, email: data.user.email } },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );

  for (const cookie of cookiesToApply) {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  }

  return response;
}
