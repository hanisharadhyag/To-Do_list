import type { NextConfig } from "next";

const allowedHosts = ["**.run.app", "localhost:3000"];

if (process.env.APP_URL) {
  try {
    const appHost = new URL(process.env.APP_URL).host;
    if (appHost && !allowedHosts.includes(appHost)) {
      allowedHosts.push(appHost);
    }
  } catch {
    // Ignore malformed APP_URL
  }
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: allowedHosts,
  experimental: {
    serverActions: {
      allowedOrigins: allowedHosts,
    },
  },
};

export default nextConfig;
