import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  // Legacy branch variants are inert review material, never deployable runtime.
  outputFileTracingExcludes: {
    '*': ['./imports/legacy-branch-references/**/*'],
  },
  // The official seal is a server-only asset (never under /public, so it has
  // no downloadable URL). Exactly the routes that may embed or serve it —
  // each Super-Admin-gated and audited — trace the file into their bundle.
  outputFileTracingIncludes: {
    '/api/employee/salary': ['./src/lib/documents/assets/alo-official-seal.png'],
    '/api/applications/[id]/offer-letter': ['./src/lib/documents/assets/alo-official-seal.png'],
    '/api/official-documents/seal': ['./src/lib/documents/assets/alo-official-seal.png'],
  },
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
    // Only curated public images may enter the optimizer. Private documents
    // and legacy /uploads never become optimizer cache entries.
    localPatterns: [
      { pathname: '/images/**' },
      { pathname: '/icons/**' },
      { pathname: '/logo.svg' },
      { pathname: '/public/images/**' },
      { pathname: '/public/icons/**' },
      { pathname: '/public/logo.svg' },
    ],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
    ],
  },
  compress: true,
  // Production compilation of the CRM's large route graph must not retain a
  // second Webpack cache in constrained build hosts. Development keeps HMR's
  // default cache. This changes build memory only, not HTTP/runtime caching.
  webpack(config, { dev }) {
    if (!dev) config.cache = false;
    return config;
  },
  experimental: {
    workerThreads: false,
    cpus: 1,
    webpackBuildWorker: true,
    webpackMemoryOptimizations: true,
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
          //
          // Google Free Stack (docs/GOOGLE-FREE-STACK.md) — the tag loader and
          // the YouTube facade are the ONLY third-party origins added, and each
          // is listed for the minimum directive it actually needs:
          //   script-src  googletagmanager.com (GTM container + gtag.js) and
          //               google-analytics.com (analytics.js shim / plugins).
          //   connect-src the GA4 collect endpoints. Wildcards are scoped to
          //               *.google-analytics.com and *.analytics.google.com so
          //               regional collect hosts (region1…) are reachable
          //               without opening all of google.com.
          //   frame-src   youtube-nocookie.com first (privacy-enhanced embeds,
          //               which is all ALO uses), youtube.com only as a
          //               fallback for the rare video that refuses it.
          //               www.google.com is present for the optional Maps
          //               iframe embed, which ALO does not enable by default
          //               because Maps Platform requires Cloud billing.
          // Nothing here grants Google access to ALO's own API, and no
          // credential or secret is referenced.
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://ssl.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://api.groq.com https://openrouter.ai https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://www.googletagmanager.com; frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://www.google.com; worker-src 'self' blob:; manifest-src 'self'; frame-ancestors 'self'; object-src 'none'; base-uri 'self'" },
        ],
      },
    ];
  },
  // Permanent (308) redirects are configured here, not in page components. A
  // page-level redirect can be streamed as a 200 HTML response after the shell
  // has started rendering, so the legacy URLs would not return a real 308.
  async redirects() {
    return [
      { source: "/english-tests", destination: "/english-test-prep", permanent: true },
      { source: "/courses", destination: "/course-finder", permanent: true },
      { source: "/english-tests", destination: "/english-test-prep", permanent: true },
      // Bare /course has no index page — src/app/course/ contains only
      // [slug]/page.tsx, the canonical public course-detail hub. Send the
      // listing intent to the Course Finder exactly as the plural alias above
      // does, instead of 404ing. Source matching is exact (no wildcard), so this
      // never touches /course/{slug}.
      { source: "/course", destination: "/course-finder", permanent: true },
      // Legacy alias. /eligibility-check is the canonical route.
      { source: "/eligibility-checker", destination: "/eligibility-check", permanent: true },

      // /visa-support carried hard-coded visa fees, processing times and a
      // "98% visa success rate" with no source and no verification date, which
      // the data policy forbids. The verified equivalents already exist:
      // /visa (VisaSupportHub) and /destinations/[slug], both built on
      // COUNTRY_DESTINATIONS, which records a source and lastVerifiedAt per
      // fact. These pages are redirected rather than kept as a third copy.
      //
      // Slugs differ between the old and new routes, so each is mapped
      // explicitly; a wildcard would send /visa-support/united-kingdom to a
      // /destinations/united-kingdom that does not exist.
      { source: "/visa-support/united-kingdom", destination: "/destinations/uk", permanent: true },
      { source: "/visa-support/dubai-uae", destination: "/destinations/dubai", permanent: true },
      { source: "/visa-support/usa", destination: "/destinations/usa", permanent: true },
      { source: "/visa-support/canada", destination: "/destinations/canada", permanent: true },
      { source: "/visa-support/australia", destination: "/destinations/australia", permanent: true },
      { source: "/visa-support/ireland", destination: "/destinations/ireland", permanent: true },
      { source: "/visa-support/new-zealand", destination: "/destinations/new-zealand", permanent: true },
      { source: "/visa-support/germany", destination: "/destinations/germany", permanent: true },
      { source: "/visa-support", destination: "/visa", permanent: true },
    ];
  },

  async rewrites() {
    return [
      // The duplicated `public/public/**` asset tree (byte-identical copies
      // of `public/**`) was removed; legacy `/public/...` URLs that older
      // pages, emails and image-optimizer patterns still reference resolve
      // to the single canonical asset instead of 404ing.
      { source: "/public/:path*", destination: "/:path*" },
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
      { source: "/course-finder/saved", destination: "/student/saved" },
      // Spec-named marketing IA aliases. The implementations already exist
      // under their canonical CRM paths; these keep the specification's URLs
      // working without duplicating a second dashboard.
      { source: "/marketing", destination: "/crm/marketing" },
      { source: "/marketing/dashboard", destination: "/crm/marketing" },
      { source: "/crm/social-inbox", destination: "/crm/communications/social-inbox" },
      { source: "/crm/ai-command-center", destination: "/admin/ai-command-center" },


    ];
  },
};

export default nextConfig;
