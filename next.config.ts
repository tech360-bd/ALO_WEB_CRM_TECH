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
      // Portals (login/register/admin)
      { source: "/student/login", destination: "/?p=student-login" },
      { source: "/student/register", destination: "/?p=student-register" },
      { source: "/partner/login", destination: "/?p=partner-login" },
      { source: "/partner/register", destination: "/?p=partner-register" },
      { source: "/employee/login", destination: "/?p=employee-login" },
      { source: "/staff/login", destination: "/?p=employee-login" },
      { source: "/admin/login", destination: "/?p=admin-login" },
      { source: "/admin", destination: "/?p=admin-login" },
      // Legal
      { source: "/privacy-policy", destination: "/?p=privacy" },
      { source: "/terms", destination: "/?p=terms" },
      { source: "/cookies", destination: "/?p=cookies" },
    ];
  },
};

export default nextConfig;

