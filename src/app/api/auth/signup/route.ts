import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getServerCookieOptions, isRequestHttps } from "@/lib/supabase/cookies";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database";

export async function POST(request: NextRequest) {
  const env = getSupabaseEnv();
  if (!env) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 500 }
    );
  }

  let body: { email?: unknown; password?: unknown; origin?: unknown };
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
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters." },
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

  const requestOrigin =
    request.headers.get("origin") ||
    process.env.APP_URL ||
    request.nextUrl.origin;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${requestOrigin}/auth/callback`,
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const response = NextResponse.json(
    {
      hasSession: Boolean(data.session),
      user: data.user ? { id: data.user.id, email: data.user.email } : null,
    },
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
