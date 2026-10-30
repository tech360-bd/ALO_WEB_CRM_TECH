import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { resolveSessionRole } from "@/lib/session-roles";

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
  "/global-offices",
  "/privacy-policy",
  "/terms",
  "/cookies",
  "/communication-policy",
  "/lead-data-usage-policy",
  "/user-guide",
  "/accessibility",
  // Footer company column. Published policy/conduct pages — static content,
  // no database reads, no personal data: they must render for anonymous
  // visitors (and crawlers) without hitting the auth gate.
  "/code-of-conduct",
  "/student-complaint-policy",
  "/aqf-compliance",
  "/destinations",
  "/universities",
  "/all-university-information",
  "/courses",
  // Canonical public course-detail hub (/course/[slug]). It was missing from
  // this list while the plural /courses and /course-finder were present, so
  // matchesPath treated /course/{slug} as a portal route and redirected
  // anonymous visitors to /login?callbackUrl=... — including the crawlers that
  // sitemap.ts sends there, since it publishes exactly these URLs via
  // mapRows(databaseEntries.crmCourses, '/course'). src/app/course/ contains
  // only [slug]/page.tsx, and that page reads CrmCourse through its
  // published + VERIFIED + source-linked filter, so exposing the prefix leaks
  // nothing private. Kept separate from "/courses": matchesPath is
  // boundary-aware, so neither prefix subsumes the other.
  "/course",
  "/course-finder",
  // Form A — public Apply Now (/apply/[course-slug]). Anonymous visitors must
  // reach it so they can register/login and continue; the page renders course
  // facts only and the API still refuses to create anything until the student
  // is signed in AND their Form B profile is complete.
  "/apply",
  "/services",
  "/scholarships",
  "/resources",
  // Published editorial guides (/guides index + /guides/[slug]). Both read
  // only ContentAsset rows with status=PUBLISHED and the short-form-builder
  // tag, and sitemap.ts already advertises them, so anonymous visitors and
  // crawlers must reach them instead of the login gate.
  "/guides",
  "/blog",
  "/success-stories",
  "/team",
  "/faqs",
  "/book-consultation",
  // One-time, token-gated student review submission (token is hashed server-side).
  "/review",
  "/language-prep",
  // Legacy alias only. The /visa-support pages were removed because they
  // hard-coded visa fees, processing times and an unsourced visa success
  // percentage, with no citation and no verification date on any of it.
  // next.config.ts now permanently redirects this path (and its per-country
  // slugs) to the verified /visa and /destinations/[slug] routes. It must pass
  // the proxy for that redirect to run — same reason /eligibility-checker is
  // listed below.
  "/visa-support",
  "/application-guide",
  "/student-journey",
  "/research-opportunities",
  // Public marketing/SEO pages linked from the navbar, homepage CTAs and
  // sitemap. Production verification (2026-10-08, commit 61eca94) showed these
  // redirected anonymous visitors to /login?callbackUrl=... because they were
  // missing from this list — breaking the public funnel (homepage "Check
  // Eligibility" CTA, navbar "Application Tips", English-test prep hub, etc.).
  "/eligibility-check",
  // Legacy public alias; the page permanently redirects to the canonical
  // /eligibility-check route. It must pass the proxy for that redirect to run.
  "/eligibility-checker",
  "/english-test-prep",
  "/english-tests",
  // Public AI tools (spec §39–43). These are discovery/advisory tools on the
  // marketing site, not portal features: they take a self-declared profile and
  // return evidence-based matches. Every endpoint they call stays behind its
  // own guard, and none of them expose another user's data.
  "/ai",
  // Public visa support hub (spec §44), served by VisaSupportHub from
  // COUNTRY_DESTINATIONS with a source and lastVerifiedAt on every fact.
  // /visa-support is the legacy alias that redirects here.
  "/visa",
  "/news",
  "/events",
  "/compare",
  "/application-process",
  "/admission-requirements",
  "/portals",
  "/student-login",
  "/partner-login",
  "/employee-login",
  // Direct App Router portal auth pages (legacy aliases above target these
  // names, but real pages also need to be reachable without a session).
  "/student/login",
  "/student/register",
  "/verify-email",
  "/partner/login",
  "/partner/register",
  "/partner/activate",
  "/employee/login",
  "/employee/activate",
  "/counselor/login",
  "/admin/login",
  "/portal/login",
  // Offline fallback page. The service worker precaches it, so it must be
  // reachable without a session or the PWA offline shell cannot be cached.
  "/offline",
  "/account-suspended",
  "/account-pending",
  "/unauthorized",
  // Public content & lead-generation pages (real routes under src/app that
  // were previously — and wrongly — redirected to /login, breaking SEO and
  // lead capture; verified public-by-design 2026-09-28):
  "/news",
  "/events",
  "/eligibility-check",
  "/eligibility-checker",
  "/compare",
  "/student-journey",
  "/english-test-prep",
  "/english-tests",
  "/research-opportunities",
  "/admission-requirements",
  "/application-process",
  "/offline",
  // Auth entry points that live inside otherwise-gated portal prefixes:
  "/student/login",
  "/student/register",
  "/verify-email",
  // Spec-named student journey entry points (spec §23): the /student-* aliases
  // and the English-test candidate entry pages. They render the same shared
  // LoginPage/RegisterPage components as /student/login and /student/register,
  // so an anonymous visitor must reach them instead of bouncing to /login.
  "/student-register",
  "/english-test-login",
  "/english-test-register",
];

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// Route matching must respect path boundaries. A raw startsWith check would
// accidentally make /api/auth/change-password public when /api/auth is listed,
// and would make every internal /api/communications/* endpoint public when the
// webhook prefix is public. Keep these rules centralized and fail closed.
function matchesPath(pathname: string, prefix: string): boolean {
  const normalized = prefix.replace(/\/+$/, "");
  // A root prefix is an exact route, not a wildcard. Treating "/" as a
  // generic prefix would make every page public because every pathname starts
  // with "/".
  if (normalized === "") return pathname === "/";
  return pathname === normalized || pathname.startsWith(`${normalized}/`);
}

export function isPublicPageRequest(pathname: string): boolean {
  // Only the standalone DreamFrame landing page is public; do not implicitly
  // expose any future nested studio or account routes.
  if (pathname.replace(/\/+$/, '') === "/dreamframe") return true;
  return PUBLIC_ROUTES.some((route) => matchesPath(pathname, route));
}

// Public API reads are deliberately explicit. Mutating endpoints are public
// only when listed in PUBLIC_API_WRITE_ROUTES; everything else reaches the
// authentication/RBAC gate below.
const PUBLIC_API_READ_ROUTES = [
  // Email unsubscribe confirmation page (GET changes nothing; the token is verified server-side)
  "/api/email/unsubscribe",
  // Outbox worker. Auth is enforced by requireCron inside the route (CRON_SECRET or admin session).
  "/api/cron/email-outbox",
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
  "/api/website",
  "/api/search",
  "/api/chat",
  "/api/blog",
  "/api/news",
  "/api/events",
  "/api/faqs",
  "/api/reviews/submit",
  "/api/whatsapp/status",
  "/api/facebook/auth",
  "/api/facebook/callback",
  "/api/health",
  "/api/destinations",
  "/api/ai/eligibility",
  "/api/ai/match",
  "/api/ai/sop",
  "/api/ai/student-intake",
  // Public language-prep pages (/language-prep, /language-prep/[slug],
  // /language-prep/comparison) load their data from these read-only endpoints.
  // Without them the public test pages render "Test not found" / empty
  // comparison tables (verified in production 2026-10-08). student-profile and
  // the staff leads list stay protected.
  "/api/language-prep/tests",
  "/api/language-prep/comparison",
  "/api/language-prep/requirements",
  // Public verified-metrics payload (documented as public in its route) used by
  // the public consultation page, and the public related-content engine used by
  // the public course/university/scholarship/service/resource detail hubs.
  "/api/metrics",
  "/api/related-content",
  "/api/research/provider-status",
  "/api/seo/health",
  "/api/marketing/webhooks/google-business",
  "/api/automation/schedule",
  "/api/live-edit",
];

const PUBLIC_API_WRITE_ROUTES = [
  // Provider authentication (HS256 JWT), bounded body and dedupe enforced by route.
  "/api/integrations/httpsms/webhook",
  // RFC 8058 one-click unsubscribe POST and confirm form. Token-verified in the route.
  "/api/email/unsubscribe",
  // Outbox worker trigger (Bearer CRON_SECRET, verified by requireCron).
  "/api/cron/email-outbox",
  "/api/portal-auth/login",
  "/api/portal-auth/register",
  "/api/portal-auth/forgot-password",
  "/api/portal-auth/reset-password",
  "/api/portal-auth/verify-otp",
  "/api/student/auth/login",
  "/api/student/auth/otp",
  "/api/automation/schedule",
  "/api/lead-forms",
  "/api/leads",
  "/api/crm/leads/public",
  "/api/chat",
  "/api/ai/eligibility",
  "/api/ai/match",
  "/api/ai/sop",
  "/api/ai/student-intake",
  // Public course/eligibility matcher. The public /eligibility-check and
  // /ai/course-match pages POST here while the visitor is still anonymous. The
  // handler only reads published, verified courses and writes an anonymous
  // assessment record — it never touches another user's data — and it is rate
  // limited inside the route handler.
  "/api/course-finder/eligibility-engine",
  // Deterministic scholarship matcher used by the public /ai/scholarship-match
  // tool. Read-only over published scholarship records; rate limited in-route.
  "/api/ai/scholarship-match",
  "/api/events",
  "/api/reviews/submit",
  "/api/reviews/feedback",
  "/api/whatsapp/status",
  "/api/whatsapp/webhook",
  "/api/facebook/webhook",
  "/api/integrations/3cx/webhooks",
  "/api/integrations/3cx/call/journal",
  "/api/integrations/3cx/sms/journal",
  "/api/integrations/3cx/whatsapp/journal",
  "/api/integrations/3cx/chat/journal",
  "/api/behavior/track",
  "/api/marketing/consent",
  "/api/marketing/consent/revoke",
  "/api/marketing/webhooks/google-business",
  "/api/language-prep/leads",
  "/api/referrals/track",
  "/api/website/search-log",
  // Public consultation booking (homepage consultation form and public
  // consultation pages POST here). The route implements the documented
  // public 10-step consultation workflow with 30-day duplicate suppression;
  // staff-facing GET/PUT on the same path stay behind the route handler's
  // own withAuth checks.
  "/api/website/lead",
];

const SENSITIVE_API_ROUTES: Record<string, string[]> = {
  "/api/finance": ["SUPER_ADMIN", "ADMIN", "FINANCE"],
  "/api/hrm": ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"],
  "/api/hr": ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"],
  "/api/employees": ["SUPER_ADMIN", "ADMIN", "HR_MANAGER"],
  "/api/audit": ["SUPER_ADMIN", "ADMIN"],
  "/api/access-control": ["SUPER_ADMIN"],
  "/api/permissions": ["SUPER_ADMIN", "ADMIN"],
  "/api/storage": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER"],
  "/api/approval-center": ["SUPER_ADMIN", "ADMIN"],
  "/api/automation/dashboard": ["SUPER_ADMIN", "ADMIN"],
  "/api/application-team": ["SUPER_ADMIN", "ADMIN", "APPLICATION_TEAM"],
  "/api/crm/course-import": ["SUPER_ADMIN", "ADMIN", "APPLICATION_TEAM"],
  "/api/counselor": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "BRANCH_MANAGER"],
  "/api/crm/seed": ["SUPER_ADMIN", "ADMIN"],
  "/api/communications": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "FRONT_DESK", "BRANCH_MANAGER", "SUPPORT_STAFF", "PARTNER"],
  "/api/omnichannel": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "FRONT_DESK", "BRANCH_MANAGER", "SUPPORT_STAFF"],
  "/api/campaigns": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER", "MARKETING"],
  "/api/email/campaigns": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER", "MARKETING"],
  "/api/marketing/content-generate": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER", "MARKETING"],
  "/api/marketing/user-access": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER"],
  "/api/faqs": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER"],
  "/api/student-migration": ["SUPER_ADMIN", "ADMIN"],
  "/api/quota": ["SUPER_ADMIN", "ADMIN", "PARTNER"],
  "/api/reviews/dashboard": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER"],
  "/api/interviews": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER"],
  "/api/official-sources": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER"],
  "/api/inbox/ai-suggest": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "FRONT_DESK", "BRANCH_MANAGER", "SUPPORT_STAFF"],
  "/api/students": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "BRANCH_MANAGER", "FRONT_DESK", "SUPPORT_STAFF", "STUDENT"],
  "/api/course-finder/admin": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER"],
  "/api/course-finder/saved": ["SUPER_ADMIN", "ADMIN", "STUDENT"],
  "/api/course-finder/shortlist": ["SUPER_ADMIN", "ADMIN", "STUDENT"],
  "/api/course-finder/compare": ["SUPER_ADMIN", "ADMIN", "STUDENT"],
  "/api/course-finder/eligible": ["SUPER_ADMIN", "ADMIN", "STUDENT"],
  "/api/import-center": ["SUPER_ADMIN", "ADMIN"],
  "/api/csv-import": ["SUPER_ADMIN", "ADMIN"],
  "/api/partner-admin": ["SUPER_ADMIN", "ADMIN", "PARTNER"],
  "/api/partner-portal": ["SUPER_ADMIN", "ADMIN", "PARTNER"],
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
  "/api/knowledge-center": ["SUPER_ADMIN", "ADMIN", "EMPLOYEE", "HR_MANAGER", "BRANCH_MANAGER", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "MARKETING_MANAGER", "MARKETING", "FRONT_DESK", "SUPPORT_STAFF", "ENGLISH_TRAINER"],
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
  "/api/whatsapp/ai-reply": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "FRONT_DESK", "SUPPORT_STAFF"],
  "/api/whatsapp/document-upload": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM"],
  "/api/lead-scoring": ["SUPER_ADMIN", "ADMIN", "COUNSELOR"],
  "/api/reviews/request": ["SUPER_ADMIN", "ADMIN", "COUNSELOR"],
  "/api/reviews/google": ["SUPER_ADMIN", "ADMIN", "COUNSELOR"],
  "/api/reviews/stats": ["SUPER_ADMIN", "ADMIN"],
  "/api/referrals/create": ["SUPER_ADMIN", "ADMIN", "STUDENT"],
  "/api/referrals/stats": ["SUPER_ADMIN", "ADMIN", "STUDENT"],
  "/api/marketing/profile": ["SUPER_ADMIN", "ADMIN"],
  "/api/sop/generate": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "STUDENT"],
  "/api/timeline": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "STUDENT"],
  "/api/student-benefits": ["STUDENT"],
  "/api/marketing/webhooks": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER", "MARKETING"],
  "/api/admin": ["SUPER_ADMIN", "ADMIN"],
  // ── Server-side RBAC closure (2026-10-02): staff/partner API prefixes that
  // previously required only "any authenticated token" now enforce their role
  // families, mirroring the page-level ROLE_ROUTES rules. Handlers with their
  // own checks keep them as defense-in-depth.
  "/api/crm": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "VISA_INTERVIEW_OFFICER", "BRANCH_MANAGER", "FRONT_DESK", "SUPPORT_STAFF", "MARKETING_MANAGER", "MARKETING", "FINANCE", "HR_MANAGER"],
  "/api/employee-access": ["SUPER_ADMIN", "ADMIN", "EMPLOYEE", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "VISA_INTERVIEW_OFFICER", "BRANCH_MANAGER", "FRONT_DESK", "SUPPORT_STAFF", "MARKETING_MANAGER", "MARKETING", "FINANCE", "HR_MANAGER", "ENGLISH_TRAINER"],
  "/api/employee": ["SUPER_ADMIN", "ADMIN", "EMPLOYEE", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "VISA_INTERVIEW_OFFICER", "BRANCH_MANAGER", "FRONT_DESK", "SUPPORT_STAFF", "MARKETING_MANAGER", "MARKETING", "FINANCE", "HR_MANAGER", "ENGLISH_TRAINER"],
  "/api/partner": ["SUPER_ADMIN", "ADMIN", "PARTNER"],
  "/api/applications": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "BRANCH_MANAGER"],
  "/api/documents": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "FRONT_DESK", "PARTNER", "STUDENT"],
  "/api/social": ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER", "MARKETING"],
  "/api/app-manager": ["SUPER_ADMIN", "ADMIN", "APPLICATION_TEAM"],
  "/api/international-officer": ["SUPER_ADMIN", "ADMIN", "INTERNATIONAL_OFFICER"],
  "/api/knowledge-sharing": ["SUPER_ADMIN", "ADMIN", "EMPLOYEE", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER", "BRANCH_MANAGER", "FRONT_DESK", "SUPPORT_STAFF", "MARKETING_MANAGER", "MARKETING", "HR_MANAGER", "ENGLISH_TRAINER", "INTERNATIONAL_OFFICER"],
  "/api/unified-communication": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "FRONT_DESK", "SUPPORT_STAFF", "BRANCH_MANAGER"],
  "/api/interview": ["SUPER_ADMIN", "ADMIN", "COUNSELOR", "APPLICATION_TEAM", "VISA_OFFICER"],
};

export function isPublicApiRequest(pathname: string, method: string): boolean {
  const normalizedMethod = method.toUpperCase();
  const isWrite = WRITE_METHODS.has(normalizedMethod);
  const isRead = normalizedMethod === "GET" || normalizedMethod === "HEAD";
  const matchedSensitive = Object.keys(SENSITIVE_API_ROUTES).some((prefix) => matchesPath(pathname, prefix));

  // Explicit bearer-capability/token flows that are intentionally public.
  // Handlers must still validate and consume their respective token.
  if (pathname === "/api/crm/leads/public") return true;
  if ((pathname === "/api/employee/activate" || pathname === "/api/partner/activate") && normalizedMethod === "POST") return true;

  // NextAuth's catch-all is public, but the custom password-change handler is
  // explicitly excluded from this rule.
  if (matchesPath(pathname, "/api/auth") && !matchesPath(pathname, "/api/auth/change-password")) return true;
  if (isRead && PUBLIC_API_READ_ROUTES.some((prefix) => matchesPath(pathname, prefix))) {
    if (!matchedSensitive) return true;
    if (["/api/services", "/api/scholarships", "/api/resources", "/api/content-relationships", "/api/live-edit", "/api/faqs"].some((prefix) => matchesPath(pathname, prefix))) return true;
  }
  if (isWrite && PUBLIC_API_WRITE_ROUTES.some((prefix) => matchesPath(pathname, prefix)) && !matchedSensitive) return true;
  return false;
}

export const ROLE_ROUTES: Record<string, string[]> = {
  SUPER_ADMIN: ["/super-admin", "/admin", "/crm", "/student", "/partner", "/visa", "/marketing", "/finance", "/hrm"],
  ADMIN: ["/admin", "/crm", "/student", "/visa", "/marketing", "/finance", "/hrm"],
  COUNSELOR: ["/counselor", "/crm", "/employee"],
  APPLICATION_TEAM: ["/crm", "/application-team", "/application-manager", "/employee"],
  EMPLOYEE: ["/employee"],
  VISA_OFFICER: ["/visa", "/employee"],
  VISA_INTERVIEW_OFFICER: ["/visa", "/employee"],
  MARKETING_MANAGER: ["/marketing", "/employee"],
  MARKETING: ["/marketing", "/employee"],
  FINANCE: ["/finance", "/employee"],
  HR_MANAGER: ["/hrm", "/employee"],
  BRANCH_MANAGER: ["/crm", "/counselor", "/employee"],
  FRONT_DESK: ["/crm", "/counselor", "/employee"],
  SUPPORT_STAFF: ["/crm", "/employee"],
  PARTNER: ["/partner-admin", "/partner"],
  STUDENT: ["/student"],
  ENGLISH_TRAINER: ["/student"],
  MOCK_TEST_ADMIN: ["/student"],
};

/**
 * Where the proxy sends a role that hit a route outside its allow-list (and
 * where an already-authenticated user hitting /login or /register lands).
 *
 * Every target MUST be a route that (a) actually exists and (b) sits inside the
 * same role's ROLE_ROUTES allow-list. Violating (b) causes an infinite redirect
 * loop, because the fallback itself would fail the allow-list check and redirect
 * back to itself. Violating (a) 404s the user.
 *
 * The VISA_OFFICER, FINANCE and HR_MANAGER targets were corrected from
 * /visa/dashboard, /finance/dashboard and /hrm/dashboard: no such pages exist
 * (src/app/visa has only page.tsx and readiness/; there is no src/app/finance or
 * src/app/hrm at all), so those roles 404ed instead of reaching their dashboard.
 * The replacements live under /employee, which all three roles already allow,
 * and were verified to render.
 *
 * MARKETING_MANAGER / MARKETING intentionally keep /marketing/dashboard. That
 * path is a next.config.ts rewrite to /crm/marketing, and /crm is NOT in their
 * allow-list — pointing the fallback directly at /crm/marketing would loop.
 *
 * The `default` branch returns "/" on purpose. An unrecognised role has an empty
 * allow-list, so any authenticated fallback would fail the check and loop;
 * redirecting to a public route terminates instead. Roles should not reach this
 * branch: pageSessionRole() now fails back to EMPLOYEE rather than minting a
 * role the proxy cannot resolve.
 */
export function getDashboardRoute(role: string): string {
  switch (role) {
    case "SUPER_ADMIN": return "/super-admin/dashboard";
    case "ADMIN": return "/admin/dashboard";
    case "COUNSELOR": return "/counselor/dashboard";
    case "APPLICATION_TEAM": return "/crm/dashboard";
    case "EMPLOYEE": return "/employee/dashboard";
    case "BRANCH_MANAGER": return "/crm/dashboard";
    case "FRONT_DESK": return "/crm/dashboard";
    case "SUPPORT_STAFF": return "/crm/dashboard";
    case "VISA_OFFICER":
    case "VISA_INTERVIEW_OFFICER": return "/employee/visa-dashboard";
    case "MARKETING_MANAGER":
    case "MARKETING": return "/marketing/dashboard";
    case "FINANCE": return "/employee/finance-dashboard";
    case "HR_MANAGER": return "/employee/hr-dashboard";
    case "PARTNER": return "/partner-admin/dashboard";
    case "STUDENT": return "/student/dashboard";
    case "ENGLISH_TRAINER": return "/student/dashboard";
    case "MOCK_TEST_ADMIN": return "/student/dashboard";
    default: return "/";
  }
}

// Static-asset bypass.
//
// Phase 1 (2026-10-12): the bypass previously applied to ANY path containing
// a dot, so a dynamic API or portal segment such as
// `/api/university-monitoring/changes/x.json` or
// `/admin/universities/edit/a.b` skipped authentication and role checks
// entirely; 85 API routes rely on the proxy alone. API routes and role-gated
// portal prefixes are never static files, so they are now always evaluated by
// the normal authentication/RBAC rules below, whatever their extension.
// Public static files (public/, /_next/, robots.txt, sitemap.xml, ...) are
// unaffected.
const NON_STATIC_PREFIXES = Array.from(new Set(Object.values(ROLE_ROUTES).flat()))
  .filter((prefix) => prefix !== "/" && !isPublicPageRequest(prefix));

// Top-level directories that contain only static files (Next internals and
// the folders shipped in /public). No page routes live under these.
// `fonts` holds the self-hosted brand webfonts (Montserrat, Poppins, Open Sans,
// Roboto) referenced by the @font-face rules in globals.css. There is no page
// route under /fonts, so the allow-list entry cannot expose gated content.
const STATIC_ROOT_SEGMENTS = new Set(["_next", "static", "public", "docs", "icons", "images", "fonts"]);

function decodePathForPolicy(pathname: string): string | null {
  let decoded = pathname;
  for (let attempt = 0; attempt < 5; attempt++) {
    let next: string;
    try { next = decodeURIComponent(decoded); } catch { return null; }
    if (next === decoded) return decoded.replace(/\\/g, "/").replace(/\/{2,}/g, "/").toLowerCase();
    decoded = next;
  }
  return null; // excessive encoding: treat as non-static (fail closed)
}

export function isStaticAssetBypass(pathname: string): boolean {
  const normalized = decodePathForPolicy(pathname);
  if (normalized === null) return false;
  if (normalized === "/api" || normalized.startsWith("/api/")) return false;
  if (NON_STATIC_PREFIXES.some((prefix) => matchesPath(normalized, prefix.toLowerCase()))) return false;
  // Phase 1 review: the bypass is an allow-list of real static locations,
  // not "any path containing a dot". Previously `/guides/x.pdf` (a gated page
  // outside every ROLE_ROUTES prefix) skipped the proxy entirely. Anything not
  // listed here still goes through the normal public-page / auth logic, so a
  // public page with a dot in its slug keeps working and an unlisted gated
  // page fails closed.
  const firstSegment = normalized.split("/")[1] || "";
  if (STATIC_ROOT_SEGMENTS.has(firstSegment) && normalized.length > firstSegment.length + 1) return true;
  // Single root-level files: /robots.txt, /sitemap.xml, /sw.js, /logo.svg,
  // /manifest.json, /favicon.ico.
  return /^\/[^/]+\.[a-z0-9]{1,8}$/.test(normalized);
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never serve legacy private uploads, including image extensions and nested
  // public copies. This must precede the static-asset bypass below and be
  // explicitly included in the matcher (which otherwise excludes extensions).
  function isPrivateUploadUrl(value: string): boolean {
    let decoded = value;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
        if (attempt === 4) return true; // excessive encoding: fail closed
      } catch { return true; }
    }
    if (/[\u0000-\u001f\u007f;]/.test(decoded)) return true;
    // Image optimizer URLs can be absolute or protocol-relative as well as local.
    if (/^(?:https?:)?\/\//i.test(decoded)) {
      try { decoded = new URL(decoded, 'https://local.invalid').pathname; }
      catch { return true; }
    }
    const segments: string[] = [];
    for (const segment of decoded.replace(/\\/g, '/').split('/')) {
      if (!segment || segment === '.') continue;
      if (segment === '..') segments.pop();
      else segments.push(segment.toLowerCase());
    }
    while (segments[0] === 'public') segments.shift();
    return segments[0] === 'uploads';
  }
  const imageSources = pathname === '/_next/image' ? request.nextUrl.searchParams.getAll('url') : [];
  if (isPrivateUploadUrl(pathname) || imageSources.some(isPrivateUploadUrl)) {
    return new NextResponse(null, {
      status: 403,
      headers: { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' },
    });
  }

  // Allow static assets and Next internals (see isStaticAssetBypass).
  if (isStaticAssetBypass(pathname)) {
    return NextResponse.next();
  }

  const method = request.method.toUpperCase();
  const userToken = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET });
  const navigationHint = await getToken({ req: request as any, secret: process.env.NEXTAUTH_SECRET, cookieName:'alo_page_session' });
  // A page role hint never becomes a canonical User session. Expire unlabelled
  // legacy JWTs by requiring re-login, rather than guessing their identity table.
  const token = userToken?.identityDomain === 'user' ? userToken
    : navigationHint && ['portal','student'].includes(String(navigationHint.identityDomain)) ? navigationHint : null;
  // Role claims are resolved through the shared vocabulary before any
  // authorisation decision. Tokens minted before the alias fix still carry
  // legacy claims (`HR`, `SUPPORT_AGENT`) that ROLE_ROUTES does not key on; left
  // unresolved they produced an empty allow-list, so every portal page
  // redirected to getDashboardRoute's default and dumped staff on the public
  // homepage. Resolving here is idempotent for canonical roles and keeps
  // existing 7-day sessions working without a forced re-login.
  const sessionRole = resolveSessionRole(token?.role as string | undefined);
  const matchedSensitive = Object.entries(SENSITIVE_API_ROUTES).find(([prefix]) => matchesPath(pathname, prefix));

  // Allow public page routes
  if (isPublicPageRequest(pathname)) {
    if (token && (pathname === "/login" || pathname === "/register")) {
      const dashboard = getDashboardRoute(sessionRole);
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    return NextResponse.next();
  }

  // Dedicated student-session endpoints authenticate their Bearer token or
  // HttpOnly cookie in the route handler (authenticateStudentRequest/requireStudentResource). Let that
  // server-side check run instead of requiring a NextAuth JWT at the proxy.
  // This is intentionally limited to the student namespace; it does not make
  // any endpoint public.
  const hasStudentBearer = /^Bearer\s+\S+$/i.test(request.headers.get("authorization") || "");
  const hasStudentCookie = /(?:^|;\s*)alo_student_session=[^;]+/.test(request.headers.get("cookie") || "");
  if ((matchesPath(pathname, "/api/student") || matchesPath(pathname, "/api/student-benefits") || matchesPath(pathname, "/api/visa/ai-interview")) && (hasStudentBearer || hasStudentCookie)) {
    return NextResponse.next();
  }

  // Public API requests are explicit. Protected-prefix matches are evaluated
  // first so internal data is never exposed by a broad public prefix.
  if (pathname.startsWith("/api/") && isPublicApiRequest(pathname, method)) {
    return NextResponse.next();
  }

  // Protect all other /api routes
  if (pathname.startsWith("/api/")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized — authentication required" }, { status: 401 });
    }
    for (const [prefix, allowedRoles] of Object.entries(SENSITIVE_API_ROUTES)) {
      if (matchesPath(pathname, prefix)) {
        if (!allowedRoles.includes(sessionRole)) {
          return NextResponse.json({ error: "Forbidden — insufficient permissions for this endpoint" }, { status: 403 });
        }
        break;
      }
    }
    return NextResponse.next();
  }

  // Protect portal page routes
  if (!token) {
    // Student journey pages send anonymous visitors to the student login, not
    // the staff login: the staff form cannot authenticate a student account, so
    // the old target was a dead end for every student deep link.
    const isStudentArea = matchesPath(pathname, "/student") || pathname === "/test-student";
    const loginUrl = new URL(isStudentArea ? "/student-login" : "/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const allowedRoutes = ROLE_ROUTES[sessionRole] || [];
  const isAllowed = allowedRoutes.some((route) => matchesPath(pathname, route));

  if (!isAllowed) {
    const dashboard = getDashboardRoute(sessionRole);
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
  matcher: ["/:path*"],
};
