import { describe, expect, it } from "vitest";
import { isPublicApiRequest, isPublicPageRequest } from "@/proxy";

describe("proxy page exposure policy", () => {
  it("does not treat the root route as a wildcard public prefix", () => {
    expect(isPublicPageRequest("/")).toBe(true);
    expect(isPublicPageRequest("/admin/dashboard")).toBe(false);
    expect(isPublicPageRequest("/employee/dashboard")).toBe(false);
    expect(isPublicPageRequest("/not-a-public-page")).toBe(false);
  });
});

describe("proxy API exposure policy", () => {
  it("keeps NextAuth public but protects custom password changes", () => {
    expect(isPublicApiRequest("/api/auth/session", "GET")).toBe(true);
    expect(isPublicApiRequest("/api/auth/signin", "POST")).toBe(true);
    expect(isPublicApiRequest("/api/auth/change-password", "POST")).toBe(false);
  });

  it("protects internal dashboards, approval, communications, storage and content writes", () => {
    for (const path of [
      "/api/approval-center",
      "/api/automation/dashboard",
      "/api/communications/tasks",
      "/api/storage/list",
      "/api/storage/download/file-1",
      "/api/omnichannel/dashboard",
      "/api/marketing/user-access",
      "/api/quota/usage",
      "/api/reviews/dashboard",
      "/api/official-sources",
      "/api/interviews",
      "/api/brand-assets",
      "/api/learning-posts",
      "/api/leads",
    ]) {
      expect(isPublicApiRequest(path, "GET"), path).toBe(false);
    }
    expect(isPublicApiRequest("/api/brand-assets", "POST")).toBe(false);
    expect(isPublicApiRequest("/api/learning-posts", "PATCH")).toBe(false);
  });

  it("allows only intended public reads and lead/webhook writes", () => {
    expect(isPublicApiRequest("/api/universities", "GET")).toBe(true);
    expect(isPublicApiRequest("/api/courses/search", "GET")).toBe(true);
    expect(isPublicApiRequest("/api/resources", "GET")).toBe(true);
    expect(isPublicApiRequest("/api/services", "GET")).toBe(true);
    expect(isPublicApiRequest("/api/faqs", "GET")).toBe(true);
    expect(isPublicApiRequest("/api/scholarships", "POST")).toBe(false);
    expect(isPublicApiRequest("/api/lead-forms", "POST")).toBe(true);
    expect(isPublicApiRequest("/api/leads", "POST")).toBe(true);
    expect(isPublicApiRequest("/api/whatsapp/status", "POST")).toBe(true);
    expect(isPublicApiRequest("/api/marketing/webhooks", "GET")).toBe(false);
    expect(isPublicApiRequest("/api/faqs", "POST")).toBe(false);
    expect(isPublicApiRequest("/api/students", "GET")).toBe(false);
    expect(isPublicApiRequest("/api/course-finder/saved", "GET")).toBe(false);
  });

  it("does not confuse a similar path with a protected route", () => {
    expect(isPublicApiRequest("/api/authentication", "GET")).toBe(false);
    expect(isPublicApiRequest("/api/administer", "GET")).toBe(false);
  });

  it("keeps staff/partner API prefixes role-restricted while preserving the public lead capture", () => {
    // Public lead capture must remain anonymous-accessible despite /api/crm being role-gated.
    expect(isPublicApiRequest("/api/crm/leads/public", "POST")).toBe(true);
    // Staff CRM surface is no longer "any authenticated token".
    for (const path of [
      "/api/crm/tasks",
      "/api/crm/appointments",
      "/api/crm/users",
      "/api/crm/settings",
      "/api/crm/partners",
      "/api/crm/inbox",
      "/api/crm/hrm",
    ]) {
      expect(isPublicApiRequest(path, "GET"), path).toBe(false);
      expect(isPublicApiRequest(path, "POST"), path).toBe(false);
    }
    // Employee, partner, application and marketing surfaces.
    for (const path of [
      "/api/employee/tasks",
      "/api/employee-access/audit-logs",
      "/api/partner/referrals",
      "/api/partner/settings",
      "/api/applications",
      "/api/documents",
      "/api/social/posts",
      "/api/app-manager/b2b-providers",
      "/api/international-officer/agreements",
      "/api/knowledge-sharing",
      "/api/unified-communication",
      "/api/interview",
    ]) {
      expect(isPublicApiRequest(path, "GET"), path).toBe(false);
      expect(isPublicApiRequest(path, "POST"), path).toBe(false);
    }
    // Boundary safety: the /api/partner rule must not shadow other partner prefixes.
    expect(isPublicApiRequest("/api/partner-admin/seat-requests", "GET")).toBe(false);
    expect(isPublicApiRequest("/api/partner-packages", "GET")).toBe(false);
  });
});

describe("proxy public marketing page exposure (2026-10-08 production regression)", () => {
  // Production verification on commit 61eca94 showed these public pages
  // redirecting anonymous visitors to /login?callbackUrl=... because they were
  // missing from PUBLIC_ROUTES — breaking the homepage "Check Eligibility"
  // CTA and the navbar "Application Tips" link.
  it("keeps public marketing/SEO pages reachable without a session", () => {
    for (const path of [
      "/eligibility-check",
      "/eligibility-checker",
      "/english-test-prep",
      "/english-test-prep/ielts",
      "/english-tests/ielts",
      "/news",
      "/news/some-article",
      "/events",
      "/compare",
      "/application-process",
      "/student-journey",
      "/research-opportunities",
      "/admission-requirements",
    ]) {
      expect(isPublicPageRequest(path), path).toBe(true);
    }
  });

  it("still gates authenticated portals and unknown pages", () => {
    for (const path of [
      "/student/dashboard",
      "/admin/dashboard",
      "/crm/leads",
      "/partner/students",
      "/counselor/inbox",
      "/application-manager/applications",
      "/super-admin/settings",
      "/not-a-public-page",
    ]) {
      expect(isPublicPageRequest(path), path).toBe(false);
    }
  });
});

describe("proxy public language-prep data APIs (2026-10-08 production regression)", () => {
  // The public /language-prep pages fetch these; when they were gated, every
  // test detail page rendered "Test not found" and the comparison table was
  // empty for anonymous visitors.
  it("allows anonymous reads of the public language-prep data endpoints", () => {
    expect(isPublicApiRequest("/api/language-prep/tests", "GET")).toBe(true);
    expect(isPublicApiRequest("/api/language-prep/tests/ielts", "GET")).toBe(true);
    expect(isPublicApiRequest("/api/language-prep/comparison", "GET")).toBe(true);
    expect(isPublicApiRequest("/api/language-prep/requirements", "GET")).toBe(true);
  });

  it("keeps student profiles and the staff leads list protected", () => {
    expect(isPublicApiRequest("/api/language-prep/student-profile", "GET")).toBe(false);
    expect(isPublicApiRequest("/api/language-prep/student-profile", "POST")).toBe(false);
    expect(isPublicApiRequest("/api/language-prep/leads", "GET")).toBe(false);
    // Lead capture stays publicly writable (existing funnel).
    expect(isPublicApiRequest("/api/language-prep/leads", "POST")).toBe(true);
  });
});

describe("proxy public metrics/related-content APIs (2026-10-08 production regression)", () => {
  it("allows anonymous reads of the documented-public content endpoints", () => {
    expect(isPublicApiRequest("/api/metrics", "GET")).toBe(true);
    expect(isPublicApiRequest("/api/related-content", "GET")).toBe(true);
  });

  it("does not open write methods or unrelated prefixes", () => {
    expect(isPublicApiRequest("/api/metrics", "POST")).toBe(false);
    expect(isPublicApiRequest("/api/related-content", "POST")).toBe(false);
    expect(isPublicApiRequest("/api/metrics-admin", "GET")).toBe(false);
  });
});

describe("proxy public consultation workflow", () => {
  it("allows anonymous POST to the public consultation lead endpoint", () => {
    expect(isPublicApiRequest("/api/website/lead", "POST")).toBe(true);
  });

  it("still protects neighbouring endpoints and sensitive prefixes", () => {
    // PUBLIC_API_WRITE_ROUTES is method-agnostic (any of POST/PUT/PATCH/DELETE
    // passes the proxy); the lead route's own withAuth/405 guards govern the
    // non-POST methods, exactly like the pre-existing /api/leads entry.
    expect(isPublicApiRequest("/api/crm/leads", "POST")).toBe(false);
    expect(isPublicApiRequest("/api/crm/leads", "GET")).toBe(false);
    expect(isPublicApiRequest("/api/crm/leads/public", "POST")).toBe(true);
    expect(isPublicApiRequest("/api/admin/student-benefits", "GET")).toBe(false);
    expect(isPublicApiRequest("/api/website/leads", "POST")).toBe(false);
  });

  it("keeps website reads public but leaves write methods unlisted endpoints closed", () => {
    expect(isPublicApiRequest("/api/website/homepage", "GET")).toBe(true);
    expect(isPublicApiRequest("/api/website/search-log", "POST")).toBe(true);
    expect(isPublicApiRequest("/api/website/unlisted", "POST")).toBe(false);
  });
});
