import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import type { Database } from "@/types/database";
import { getServerCookieOptions, isRequestHttps } from "./cookies";
import { requireSupabaseEnv } from "./env";

export async function createClient() {
  const { url, publishableKey } = requireSupabaseEnv();
  const cookieStore = await cookies();
  const headerStore = await headers();
  const serverCookieOpts = getServerCookieOptions(isRequestHttps(headerStore));

  return createServerClient<Database>(url, publishableKey, {
    cookieOptions: serverCookieOpts,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, {
              ...options,
              ...serverCookieOpts,
            })
          );
        } catch {
          // Server Components cannot mutate cookies directly; proxy.ts refreshes sessions.
        }
      },
    },
  });
}
