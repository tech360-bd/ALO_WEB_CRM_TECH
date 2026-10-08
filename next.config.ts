import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
  poweredByHeader: false,
  // Dev-only origin allowlist. Next.js refuses HMR and dev-chunk requests from
  // any Origin not listed here, so a sandbox/preview host would render the
  // server HTML without hydrating. Set NEXT_DEV_ALLOWED_ORIGINS to a
  // comma-separated list of hostnames. Unset means no extra origins (no effect
  // on production builds).
  allowedDevOrigins: (process.env.NEXT_DEV_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((h) => h.trim())
    .filter(Boolean),
  // Public content uses curated Unsplash images through next/image. Keep the
  // allowlist hostname-scoped rather than disabling image optimization.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  compress: true,
  experimental: {
    workerThreads: false,
    cpus: 1,
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Content-Type", value: "application/manifest+json" },
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
          // Minimal CSP — allow self, inline styles/scripts needed for Next/Tailwind, block object
          // PWA: allow manifest, service worker, icons, blob for media
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://api.groq.com https://openrouter.ai; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
        ],
      },
    ];
  },
  // Permanent (308) redirects are configured here, not in page components. A
  // page-level redirect can be streamed as a 200 HTML response after the shell
  // has started rendering, so the legacy URLs would not return a real 308.
  async redirects() {
    return [
      // Legacy alias. /eligibility-check is the canonical route.
      { source: "/eligibility-checker", destination: "/eligibility-check", permanent: true },
    ];
  },

  async rewrites() {
    return [
      // Only legacy aliases that do not have a real App Router page remain
      // here. Real pages must not be rewritten to the homepage: doing so loses
      // their metadata, canonical URL, route-level loading/error states, and
      // dynamic content.
      { source: "/book-appointment", destination: "/book-consultation" },
      // Spec-named IA aliases: the specification's /consultation and
      // /test-preparation paths map onto the existing implementations.
      { source: "/consultation", destination: "/book-consultation" },
      { source: "/test-preparation", destination: "/english-test-prep" },
      { source: "/test-preparation/:slug", destination: "/english-test-prep/:slug" },
      // Portal roots without their own page.tsx map to their canonical
      // dashboard so direct URL access never 404s (no-404 acceptance gate).
      { source: "/super-admin", destination: "/super-admin/dashboard" },
      { source: "/counselor", destination: "/counselor/dashboard" },
      { source: "/application-manager", destination: "/application-manager/applications" },
      { source: "/staff/login", destination: "/employee/login" },
      { source: "/admin", destination: "/admin/login" },
      { source: "/admin/students", destination: "/admin/crm-command" },
      { source: "/admin/partners", destination: "/admin/access-control-center" },
      { source: "/admin/tasks", destination: "/admin/crm-command" },
      { source: "/portal", destination: "/portal/login" },
      { source: "/auth/login", destination: "/login" },
      { source: "/course-finder/saved", destination: "/?p=saved-courses" },

    ];
  },
};

export default nextConfig;

