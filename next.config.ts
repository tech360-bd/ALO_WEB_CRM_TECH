import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
  poweredByHeader: false,
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
  async redirects() {
    return [
      // Index URLs that only have [slug] children — redirect to the real
      // listing pages instead of 404ing (live-production defect, 2026-09-28
      // audit: https://aloeducation.com/courses returned 404).
      { source: "/courses", destination: "/course-finder", permanent: true },
      { source: "/english-tests", destination: "/english-test-prep", permanent: true },
    ];
  },
  async rewrites() {
    return [
      // Booking / consultation
      { source: "/book-consultation", destination: "/?p=consultation" },
      { source: "/book-consultation/:service", destination: "/?p=consultation&service=:service" },
      { source: "/book-appointment", destination: "/?p=consultation" },
      { source: "/contact", destination: "/?p=contact" },
      // About / static pages
      { source: "/about", destination: "/?p=about" },
      { source: "/success-stories", destination: "/?p=success-stories" },
      { source: "/team", destination: "/?p=team" },
      { source: "/faqs", destination: "/?p=faqs" },
      { source: "/resources/faqs", destination: "/?p=faqs" },
      { source: "/resources/:slug", destination: "/?p=resources&slug=:slug" },
      // Language prep - fix dead destinations from audit
      { source: "/language-prep", destination: "/?p=language-prep" },
      { source: "/language-prep/comparison", destination: "/?p=language-prep&slug=comparison" },
      { source: "/language-prep/ielts", destination: "/language-prep/ielts" },
      { source: "/language-prep/pte-academic", destination: "/language-prep/pte-academic" },
      { source: "/language-prep/:slug", destination: "/?p=language-prep&slug=:slug" },
      // Portals (login/register/admin) - fix audit dead links
      { source: "/student/login", destination: "/?p=student-login" },
      { source: "/student/register", destination: "/?p=student-register" },
      { source: "/student/mock-tests", destination: "/student-portal/mock-tests" },
      { source: "/partner/login", destination: "/?p=partner-login" },
      { source: "/partner/register", destination: "/?p=partner-register" },
      { source: "/employee/login", destination: "/?p=employee-login" },
      { source: "/staff/login", destination: "/?p=employee-login" },
      { source: "/admin/login", destination: "/?p=admin-login" },
      { source: "/admin", destination: "/?p=admin-login" },
      { source: "/portal/login", destination: "/?p=portals" },
      { source: "/portal", destination: "/?p=portals" },
      { source: "/login", destination: "/?p=portals" },
      { source: "/register", destination: "/?p=student-register" },
      // Course finder saved - SPA
      { source: "/course-finder/saved", destination: "/?p=saved-courses" },
      // Legal
      { source: "/privacy-policy", destination: "/?p=privacy" },
      { source: "/terms", destination: "/?p=terms" },
      { source: "/cookies", destination: "/?p=cookies" },
      // Destinations & courses
      { source: "/destinations/:slug", destination: "/destinations/:slug" },
      { source: "/universities/:slug", destination: "/universities/:slug" },
      { source: "/courses/:slug", destination: "/courses/:slug" },
    ];
  },
};

export default nextConfig;

