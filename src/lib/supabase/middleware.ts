import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";
import { getServerCookieOptions, isRequestHttps } from "./cookies";
import { getSupabaseEnv } from "./env";

const PUBLIC_ROUTES = new Set([
  "/login",
  "/signup",
  "/auth/callback",
  "/api/auth/login",
  "/api/auth/signup",
]);

export async function updateSession(request: NextRequest) {
  const env = getSupabaseEnv();

  // Allow the setup guide / diagnostic state to render cleanly if Supabase env vars aren't set yet
  if (!env) {
    return NextResponse.next({ request });
  }

  const serverCookieOpts = getServerCookieOptions(
    isRequestHttps(request.headers, request.url)
  );

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(env.url, env.publishableKey, {
    cookieOptions: serverCookieOpts,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, {
            ...options,
            ...serverCookieOpts,
          })
        );
      },
    },
  });

  // Always call getUser() to validate the auth token with Supabase Auth server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);

  if (!user && !isPublicRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (user && (pathname === "/login" || pathname === "/signup")) {
    const appUrl = request.nextUrl.clone();
    appUrl.pathname = "/";
    appUrl.search = "";
    return NextResponse.redirect(appUrl);
  }

  return supabaseResponse;
}
