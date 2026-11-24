import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getBrowserCookieOptions } from "./cookies";
import { requireSupabaseEnv } from "./env";

export function createClient() {
  const { url, publishableKey } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey, {
    cookieOptions: getBrowserCookieOptions(),
  });
}
