import { NextResponse } from "next/server";

/**
 * API root — metadata endpoint.
 * Returns service information for discovery / debugging.
 * Not a health check (use /api/health for that).
 */
export async function GET() {
  return NextResponse.json({
    name: "Alaminn.info API",
    version: "1.0.0",
    description:
      "Executive authority platform + Higher Study + English Learning + CRM. Public endpoints under /api/v1/public/*, admin endpoints require HMAC-signed session cookies.",
    documentation: "/api/health",
    health: "/api/health",
    readiness: "/api/readiness",
    endpoints: {
      public: ["/api/v1/public/articles", "/api/v1/public/projects", "/api/v1/inquiries", "/api/v1/newsletter", "/api/v1/meetings"],
      auth: ["/api/v1/auth/login", "/api/v1/auth/logout", "/api/v1/auth/session"],
      admin: ["/api/v1/admin/dashboard", "/api/v1/admin/users", "/api/v1/admin/contacts", "/api/v1/admin/projects"],
      higherStudy: ["/api/v1/higher-study/universities", "/api/v1/higher-study/courses", "/api/v1/higher-study/scholarships"],
      englishLearning: ["/api/v1/english-learning/courses", "/api/v1/english-learning/tutors"],
      cron: ["/api/cron/email-queue", "/api/cron/backup", "/api/cron/health-monitor"],
    },
    timestamp: new Date().toISOString(),
  });
}
