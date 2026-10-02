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
