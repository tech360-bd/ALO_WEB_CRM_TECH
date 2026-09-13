import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: false,
  experimental: {
    workerThreads: false,
    cpus: 1,
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

