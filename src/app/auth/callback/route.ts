import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/";
  // Prevent open redirect by only allowing local relative paths
  const nextPath =
    nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/";

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(`${origin}/login?error=supabase_unconfigured`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      const encoded = encodeURIComponent(error.message);
      return NextResponse.redirect(`${origin}/login?error=${encoded}`);
    }
  }

  return NextResponse.redirect(`${origin}${nextPath}`);
}
