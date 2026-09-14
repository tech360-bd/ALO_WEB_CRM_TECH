import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// ─── Middleware: Route Protection + RBAC ────────────────────
// Protects all /api routes (except truly public content + auth)
// Protects portal routes based on role
// Enforces sensitive-endpoint role checks

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/register",
  "/reset-password",
  "/verify-otp",
];

// Truly public API routes — accessible without authentication.
// These serve the public website (countries, universities, courses, etc.)
// and accept lead submissions / review submissions from anonymous visitors.
const PUBLIC_API_ROUTES = [
  "/api/auth",
  "/api/countries",
  "/api/universities",
  "/api/courses",
  "/api/exams",
  "/api/course-finder",
  "/api/scholarships",
  "/api/services",          // GET public; POST/PATCH/DELETE enforced via SENSITIVE_API_ROUTES below
  "/api/resources",        // GET public; POST/PATCH/DELETE enforced via SENSITIVE_API_ROUTES below
  "/api/content-relationships", // GET public; POST/DELETE enforced via SENSITIVE_API_ROUTES below
  "/api/homepage",
  "/api/lead-forms",
  "/api/leads",          // POST (lead creation from website) is public; GET requires auth via SENSITIVE check below
  "/api/search",
  "/api/chat",           // public AI chat widget
  "/api/ai/eligibility", // public eligibility checker on country pages
  "/api/ai/match",       // public course matcher
  "/api/stats",          // public homepage stats
  "/api/blog",
  "/api/news",
  "/api/events",
  "/api/reviews/submit", // public review submission via token
  "/api/reviews/invitation",
  "/api/whatsapp/webhook", // Meta webhook callback
  "/api/whatsapp/status",   // WhatsApp delivery status webhook
  "/api/facebook/webhook",  // Facebook lead webhook
  "/api/facebook/auth",     // Facebook OAuth start
  "/api/facebook/callback", // Facebook OAuth callback
  "/api/integrations/3cx/webhooks",
  "/api/integrations/3cx/call/journal",
  "/api/integrations/3cx/sms/journal",
  "/api/integrations/3cx/whatsapp/journal",
  "/api/integrations/3cx/chat/journal",
  "/api/behavior/track",       // First-party behavior tracking (public)
  "/api/marketing/consent",    // Marketing consent grant (public)
  "/api/marketing/consent/revoke",
  "/api/reviews/feedback",     // Student feedback (public via token)
  "/api/referrals/track",      // Referral tracking (public)
  "/api/live-edit",            // GET public (applier), POST admin
  "/api/automation/schedule",  // Cron scheduler
  "/api/dashboard-alarm",   // SLA monitor mini-service polls this
  "/api/automation/dashboard", // automation stats dashboard (GET only)
  "/api/health",               // health check endpoint
  "/api/brand-assets",         // GET public (brand info for AI/website); POST/PATCH admin-only
  "/api/learning-posts",       // GET public (approved posts); POST/PATCH admin-only
  "/api/approval-center",      // Human Approval Center (admin)
  "/api/communications",        // Unified Communication module
  "/api/storage",               // Storage upload/download (RBAC enforced via SENSITIVE_API_ROUTES for write ops)
];

// HTTP methods that mutate state — for routes in PUBLIC_API_ROUTES that are
// also in SENSITIVE_API_ROUTES, these methods bypass the public-route
// shortcut and require authentication + role check.
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Sensitive API routes — require specific roles (not just any authenticated user).
// Format: route prefix → array of allowed roles.
// For routes that ALSO appear in PUBLIC_API_ROUTES (services, scholarships,
// resources, content-relationships), GET/HEAD requests stay public while
// write methods (POST/PATCH/DELETE) require the role listed here.
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
  "/api/brand-assets": ["SUPER_ADMIN", "ADMIN"], // POST/PATCH only; GET is public
  "/api/learning-posts": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER"], // POST/PATCH only; GET is public
  "/api/commissions": ["SUPER_ADMIN", "ADMIN", "FINANCE"],
  "/api/university-agreements": ["SUPER_ADMIN", "ADMIN"],
  "/api/b2b-contacts": ["SUPER_ADMIN", "ADMIN"],
  "/api/official-emails": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER"],
  "/api/interview-questions": ["SUPER_ADMIN", "ADMIN", "COUNSELOR"],
  // Content management — write ops restricted to admins (GET stays public via PUBLIC_API_ROUTES)
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

// Role → allowed portal route prefixes (for page-level navigation)
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  // Allow public page routes
  if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    if (token && (pathname === "/login" || pathname === "/register")) {
      const dashboard = getDashboardRoute(token.role as string);
      return NextResponse.redirect(new URL(dashboard, req.url));
    }
    return NextResponse.next();
  }

  // Allow truly public API routes without auth — including write methods for
  // routes that handle their own auth (storage upload, ai-command, etc.)
  const isWrite = WRITE_METHODS.has(req.method.toUpperCase());
  const matchedSensitive = Object.entries(SENSITIVE_API_ROUTES).find(([prefix]) => pathname.startsWith(prefix));
  if (isWrite && matchedSensitive) {
    // For storage routes, allow through — the route itself handles auth via uploadedBy
    if (pathname.startsWith("/api/storage/upload") || pathname.startsWith("/api/storage/download")) {
      return NextResponse.next();
    }
    // fall through to the auth + role check below for other sensitive routes
  } else if (PUBLIC_API_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Protect all other /api routes
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized — authentication required" }, { status: 401 });
    }

    // Check sensitive endpoint role restrictions
    for (const [prefix, allowedRoles] of Object.entries(SENSITIVE_API_ROUTES)) {
      if (pathname.startsWith(prefix)) {
        if (!allowedRoles.includes(token.role as string)) {
          return NextResponse.json({ error: "Forbidden — insufficient permissions for this endpoint" }, { status: 403 });
        }
        break; // matched, no need to check further
      }
    }

    // Non-sensitive API routes: any authenticated user can access
    // (per-endpoint ownership checks like "student can only see own documents"
    //  are enforced inside the route handlers themselves)
    return NextResponse.next();
  }

  // Protect portal page routes
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // RBAC check for portal routes
  const allowedRoutes = ROLE_ROUTES[token.role as string] || [];
  const isAllowed = allowedRoutes.some((r) => pathname.startsWith(r));

  if (!isAllowed) {
    const dashboard = getDashboardRoute(token.role as string);
    return NextResponse.redirect(new URL(dashboard, req.url));
  }

  // Check if user is still active
  if (token.status && token.status !== "ACTIVE") {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("error", "AccountSuspended");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

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

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public|.*\\..*).*)",
  ],
};
