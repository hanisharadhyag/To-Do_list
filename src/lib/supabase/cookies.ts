import type { CookieOptions } from "@supabase/ssr";

export function isRequestHttps(headers: Headers, requestUrl?: string): boolean {
  const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  if (forwardedProto === "https") return true;

  const forwardedHost = headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedHost?.endsWith(".run.app")) return true;

  const origin = headers.get("origin");
  if (origin?.startsWith("https://")) return true;

  const referer = headers.get("referer");
  if (referer?.startsWith("https://")) return true;

  if (requestUrl?.startsWith("https://")) return true;

  const appUrl = process.env.APP_URL;
  if (appUrl?.startsWith("https://")) return true;

  return false;
}

export function getServerCookieOptions(isHttps: boolean): CookieOptions {
  if (isHttps) {
    return {
      path: "/",
      sameSite: "none",
      secure: true,
      partitioned: true,
    };
  }

  return {
    path: "/",
    sameSite: "lax",
    secure: false,
  };
}

export function getBrowserCookieOptions(): CookieOptions {
  const isHttps =
    typeof window !== "undefined" && window.location.protocol === "https:";

  if (isHttps) {
    return {
      path: "/",
      sameSite: "none",
      secure: true,
      partitioned: true,
    };
  }

  return {
    path: "/",
    sameSite: "lax",
    secure: false,
  };
}
