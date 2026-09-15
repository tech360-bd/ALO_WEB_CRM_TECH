import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// ─── Public page routes (no auth required) ────────────────────
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/verify-otp",
  "/forgot-password",
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/cookies",
  "/communication-policy",
  "/lead-data-usage-policy",
  "/user-guide",
  "/accessibility",
  "/destinations",
  "/universities",
  "/courses",
  "/course-finder",
  "/services",
  "/scholarships",
  "/resources",
  "/blog",
  "/success-stories",
  "/team",
  "/faqs",
  "/book-consultation",
  "/language-prep",
  "/visa-support",
  "/application-guide",
  "/portals",
  "/student-login",
  "/partner-login",
  "/employee-login",
  "/account-suspended",
  "/account-pending",
  "/unauthorized",
];

// Truly public API routes — accessible without authentication.
const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/portal-auth/login",
  "/api/portal-auth/register",
  "/api/portal-auth/forgot-password",
  "/api/portal-auth/reset-password",
  "/api/portal-auth/verify-otp",
  "/api/countries",
  "/api/universities",
  "/api/courses",
  "/api/exams",
  "/api/course-finder",
  "/api/scholarships",
  "/api/services",
  "/api/resources",
  "/api/content-relationships",
  "/api/homepage",
  "/api/website/",
  "/api/lead-forms",
  "/api/leads",
  "/api/search",
  "/api/chat",
  "/api/ai/eligibility",
  "/api/ai/match",
  "/api/stats",
  "/api/blog",
  "/api/news",
  "/api/events",
  "/api/reviews/submit",
  "/api/reviews/invitation",
  "/api/whatsapp/webhook",
  "/api/whatsapp/status",
  "/api/facebook/webhook",
  "/api/facebook/auth",
  "/api/facebook/callback",
  "/api/integrations/3cx/webhooks",
  "/api/integrations/3cx/call/journal",
  "/api/integrations/3cx/sms/journal",
  "/api/integrations/3cx/whatsapp/journal",
  "/api/integrations/3cx/chat/journal",
  "/api/behavior/track",
  "/api/marketing/consent",
  "/api/marketing/consent/revoke",
  "/api/marketing/webhooks",
  "/api/reviews/feedback",
  "/api/referrals/track",
  "/api/live-edit",
  "/api/automation/schedule",
  "/api/dashboard-alarm",
  "/api/automation/dashboard",
  "/api/health",
  "/api/brand-assets",
  "/api/learning-posts",
  "/api/approval-center",
  "/api/communications",
  "/api/storage",
  "/api/destinations",
  "/api/course-finder",
];

const PUBLIC_PREFIXES = [
  "/api/portal-auth/login",
  "/api/portal-auth/register",
  "/api/portal-auth/forgot-password",
  "/api/portal-auth/reset-password",
  "/api/portal-auth/verify-otp",
  "/api/website/",
  "/api/health",
  "/api/course-finder",
  "/api/universities",
  "/api/scholarships",
  "/api/destinations",
  "/api/chat",
  "/api/marketing/webhooks",
  "/_next/static",
  "/_next/image",
  "/favicon",
  "/robots",
  "/sitemap",
];

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

const SENSITIVE_API_ROUTES: Record<string, string[]> = {
  "/api/finance": ["SUPER_ADMIN", "ADMIN", "FINANCE"],
  "/api/hrm": ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"],
  "/api/hr": ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"],
  "/api/employees": ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"],
  "/api/audit": ["SUPER_ADMIN", "ADMIN"],
  "/api/access-control": ["SUPER_ADMIN"],
  "/api/permissions": ["SUPER_ADMIN", "ADMIN"],
  "/api/storage": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "STUDENT"],
  "/api/student-migration": ["SUPER_ADMIN", "ADMIN"],
  "/api/import-center": ["SUPER_ADMIN", "ADMIN"],
  "/api/csv-import": ["SUPER_ADMIN", "ADMIN"],
  "/api/partner-admin": ["SUPER_ADMIN", "ADMIN", "PARTNER"],
  "/api/partner-packages": ["SUPER_ADMIN", "ADMIN", "PARTNER"],
  "/api/enterprise-ai": ["SUPER_ADMIN", "ADMIN"],
  "/api/ai-registry": ["SUPER_ADMIN", "ADMIN"],
  "/api/university-monitoring": ["SUPER_ADMIN", "ADMIN"],
  "/api/delete-request": ["SUPER_ADMIN", "ADMIN"],
  "/api/agent-tasks": ["SUPER_ADMIN", "ADMIN"],
  "/api/agent-tools": ["SUPER_ADMIN", "ADMIN"],
  "/api/note-versions": ["SUPER_ADMIN", "ADMIN", "COUNSELOR"],
  "/api/brand-assets": ["SUPER_ADMIN", "ADMIN"],
  "/api/learning-posts": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER"],
  "/api/commissions": ["SUPER_ADMIN", "ADMIN", "FINANCE"],
  "/api/university-agreements": ["SUPER_ADMIN", "ADMIN"],
  "/api/b2b-contacts": ["SUPER_ADMIN", "ADMIN"],
  "/api/official-emails": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER"],
  "/api/interview-questions": ["SUPER_ADMIN", "ADMIN", "COUNSELOR"],
  "/api/services": ["SUPER_ADMIN", "ADMIN"],
  "/api/scholarships": ["SUPER_ADMIN", "ADMIN"],
  "/api/resources": ["SUPER_ADMIN", "ADMIN"],
  "/api/content-relationships": ["SUPER_ADMIN", "ADMIN"],
  "/api/ai-command": ["SUPER_ADMIN", "ADMIN"],
  "/api/ai-safety": ["SUPER_ADMIN"],
  "/api/automation/run": ["SUPER_ADMIN", "ADMIN"],
  "/api/automation/test-runner": ["SUPER_ADMIN", "ADMIN"],
  "/api/brains": ["SUPER_ADMIN", "ADMIN"],
  "/api/live-edit": ["SUPER_ADMIN", "ADMIN"],
  "/api/source-intelligence": ["SUPER_ADMIN", "ADMIN"],
  "/api/content-engine": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER"],
  "/api/seo": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER"],
  "/api/employee-learning": ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"],
  "/api/knowledge-base": ["SUPER_ADMIN", "ADMIN"],
  "/api/event-bus": ["SUPER_ADMIN", "ADMIN"],
  "/api/agentos": ["SUPER_ADMIN", "ADMIN"],
  "/api/integrations/3cx/config": ["SUPER_ADMIN"],
  "/api/integrations/3cx/test-connection": ["SUPER_ADMIN", "ADMIN"],
  "/api/integrations/3cx/dashboard": ["SUPER_ADMIN", "ADMIN"],
  "/api/integrations/3cx/extensions": ["SUPER_ADMIN", "ADMIN", "COUNSELOR"],
  "/api/integrations/3cx/health": ["SUPER_ADMIN", "ADMIN", "COUNSELOR"],
  "/api/integrations/3cx/contact-lookup": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "FRONT_DESK"],
  "/api/integrations/3cx/contact-search": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "FRONT_DESK"],
  "/api/integrations/3cx/click-to-call": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "FRONT_DESK"],
  "/api/whatsapp/send": ["SUPER_ADMIN", "ADMIN", "COUNSELOR"],
  "/api/lead-scoring": ["SUPER_ADMIN", "ADMIN", "COUNSELOR"],
  "/api/reviews/request": ["SUPER_ADMIN", "ADMIN", "COUNSELOR"],
  "/api/reviews/google": ["SUPER_ADMIN", "ADMIN", "COUNSELOR"],
  "/api/reviews/stats": ["SUPER_ADMIN", "ADMIN"],
  "/api/referrals/create": ["SUPER_ADMIN", "ADMIN", "STUDENT"],
  "/api/referrals/stats": ["SUPER_ADMIN", "ADMIN", "STUDENT"],
  "/api/marketing/profile": ["SUPER_ADMIN", "ADMIN"],
  "/api/admin": ["SUPER_ADMIN", "ADMIN"],
};

const ROLE_ROUTES: Record<string, string[]> = {
  SUPER_ADMIN: ["/super-admin", "/admin", "/crm", "/student", "/partner", "/visa", "/marketing", "/finance", "/hrm"],
  ADMIN: ["/admin", "/crm", "/student", "/visa", "/marketing", "/finance", "/hrm"],
  COUNSELOR: ["/counselor", "/crm"],
  APPLICATION_TEAM: ["/crm", "/application-team"],
  VISA_OFFICER: ["/visa"],
  VISA_INTERVIEW_OFFICER: ["/visa"],
  MARKETING_MANAGER: ["/marketing"],
  MARKETING: ["/marketing"],
  FINANCE: ["/finance"],
  HR_MANAGER: ["/hrm"],
  BRANCH_MANAGER: ["/crm", "/counselor"],
  FRONT_DESK: ["/crm", "/counselor"],
  SUPPORT_STAFF: ["/crm"],
  PARTNER: ["/partner-admin", "/partner"],
  STUDENT: ["/student"],
  ENGLISH_TRAINER: ["/student"],
  MOCK_TEST_ADMIN: ["/student"],
};

function getDashboardRoute(role: string): string {
  switch (role) {
    case "SUPER_ADMIN": return "/super-admin/dashboard";
    case "ADMIN": return "/admin/dashboard";
    case "COUNSELOR": return "/counselor/dashboard";
    case "APPLICATION_TEAM": return "/crm/dashboard";
    case "BRANCH_MANAGER": return "/crm/dashboard";
    case "FRONT_DESK": return "/crm/dashboard";
    case "SUPPORT_STAFF": return "/crm/dashboard";
    case "VISA_OFFICER":
    case "VISA_INTERVIEW_OFFICER": return "/visa/dashboard";
    case "MARKETING_MANAGER":
    case "MARKETING": return "/marketing/dashboard";
    case "FINANCE": return "/finance/dashboard";
    case "HR_MANAGER": return "/hrm/dashboard";
    case "PARTNER": return "/partner-admin/dashboard";
    case "STUDENT": return "/student/dashboard";
    case "ENGLISH_TRAINER": return "/student/dashboard";
    case "MOCK_TEST_ADMIN": return "/student/dashboard";
    default: return "/";
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and Next internals
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.endsWith(".js") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".woff") ||
    pathname.endsWith(".woff2")
  ) {
    return NextResponse.next();
  }

  if (PUBLIC_PREFIXES.some(prefix => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });

  // Allow public page routes
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    if (token && (pathname === "/login" || pathname === "/register")) {
      const dashboard = getDashboardRoute(token.role as string);
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    return NextResponse.next();
  }

  // Public API handling with write-method guard
  const isWrite = WRITE_METHODS.has(request.method.toUpperCase());
  const matchedSensitive = Object.entries(SENSITIVE_API_ROUTES).find(([prefix]) => pathname.startsWith(prefix));
  if (isWrite && matchedSensitive) {
    if (pathname.startsWith("/api/storage/upload") || pathname.startsWith("/api/storage/download")) {
      return NextResponse.next();
    }
  } else if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Protect all other /api routes
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized — authentication required" }, { status: 401 });
    }
    for (const [prefix, allowedRoles] of Object.entries(SENSITIVE_API_ROUTES)) {
      if (pathname.startsWith(prefix)) {
        if (!allowedRoles.includes(token.role as string)) {
          return NextResponse.json({ error: "Forbidden — insufficient permissions for this endpoint" }, { status: 403 });
        }
        break;
      }
    }
    return NextResponse.next();
  }

  // Protect portal page routes
  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoutes = ROLE_ROUTES[token.role as string] || [];
  const isAllowed = allowedRoutes.some((r) => pathname.startsWith(r));

  if (!isAllowed) {
    const dashboard = getDashboardRoute(token.role as string);
    return NextResponse.redirect(new URL(dashboard, request.url));
  }

  if ((token as any).status && (token as any).status !== "ACTIVE") {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("error", "AccountSuspended");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\..*).*)",
  ],
};
