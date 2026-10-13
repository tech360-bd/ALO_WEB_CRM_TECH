/**
 * tests/lib/rbac.test.ts — RBAC role & permission matrix
 *
 * Covers the critical paths of src/lib/rbac.ts:
 *   - 11 canonical roles are exported in ALL_ROLES
 *   - SUPER_ADMIN / OWNER receive every permission (expanded at runtime)
 *   - VIEWER receives only the minimal dashboard.view permission
 *   - normalizeRole accepts canonical uppercase roles and rejects unknown
 *     values, non-strings, and lowercase/mixed-case variants
 *
 * NOTE ON CASE-INSENSITIVITY:
 *   The current `normalizeRole` implementation is case-sensitive — it only
 *   accepts the canonical uppercase role strings. A lowercase or mixed-case
 *   variant (e.g. "viewer" or "Viewer") is rejected. This is a known
 *   hardening gap and is documented in tests/README.md. The tests below
 *   assert the *actual* current behavior; a future ticket should make the
 *   lookup case-insensitive (single-line change to `normalizeRole`).
 */
import { describe, it, expect } from "vitest";
import {
  ALL_ROLES,
  SELECTABLE_ROLES,
  ROLE_LABELS,
  rolePermissions,
  hasPermission,
  normalizeRole,
  type UserRole,
  type Permission,
} from "@/lib/rbac";

const EXPECTED_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "OWNER",
  "EXECUTIVE_ASSISTANT",
  "CRM_MANAGER",
  "PARTNERSHIP_MANAGER",
  "CONTENT_MANAGER",
  "MARKETING_MANAGER",
  "PROJECT_MANAGER",
  "AI_REVIEWER",
  "SECURITY_AUDITOR",
  "VIEWER",
];

describe("ALL_ROLES — canonical role registry", () => {
  it("exposes exactly 11 roles", () => {
    expect(ALL_ROLES).toHaveLength(11);
  });

  it("includes every expected role", () => {
    for (const r of EXPECTED_ROLES) {
      expect(ALL_ROLES).toContain(r);
    }
  });

  it("has no duplicate entries", () => {
    expect(new Set(ALL_ROLES).size).toBe(ALL_ROLES.length);
  });
});

describe("SELECTABLE_ROLES — login picklist", () => {
  it("excludes OWNER (provisioned out-of-band)", () => {
    expect(SELECTABLE_ROLES).not.toContain("OWNER");
  });

  it("contains all other 10 roles", () => {
    expect(SELECTABLE_ROLES).toHaveLength(10);
    for (const r of ALL_ROLES) {
      if (r === "OWNER") continue;
      expect(SELECTABLE_ROLES).toContain(r);
    }
  });
});

describe("ROLE_LABELS — human-readable labels", () => {
  it("has a label for every role", () => {
    for (const r of ALL_ROLES) {
      expect(ROLE_LABELS[r]).toBeTruthy();
      expect(typeof ROLE_LABELS[r]).toBe("string");
    }
  });
});

describe("rolePermissions — SUPER_ADMIN & OWNER (full grant)", () => {
  // A representative cross-section of permissions drawn from each major
  // resource area. If SUPER_ADMIN lacks any of these, the matrix is broken.
  const SAMPLE_PERMISSIONS: Permission[] = [
    "dashboard.view",
    "contacts.view",
    "contacts.create",
    "contacts.update",
    "contacts.delete",
    "contacts.export",
    "inquiries.view",
    "inquiries.delete",
    "meetings.view",
    "meetings.update",
    "meetings.delete",
    "ai_tasks.view",
    "ai_tasks.create",
    "ai_tasks.update",
    "ai_tasks.delete",
    "ai_approvals.view",
    "ai_approvals.decide",
    "articles.view",
    "articles.create",
    "articles.update",
    "articles.publish",
    "articles.delete",
    "resources.view",
    "projects.view",
    "projects.create",
    "case_studies.view",
    "impact_records.view",
    "newsletter.view",
    "newsletter.export",
    "newsletter.send",
    "partnerships.view",
    "partnerships.update",
    "student_referrals.view",
    "student_referrals.update",
    "audit_logs.view",
    "audit_logs.export",
    "security_settings.view",
    "security_settings.update",
    "integration_settings.view",
    "integration_settings.update",
    "users.view",
    "users.create",
    "users.update",
    "users.delete",
    "users.role_assign",
  ];

  it("SUPER_ADMIN has every permission in the sample", () => {
    const perms = rolePermissions("SUPER_ADMIN");
    for (const p of SAMPLE_PERMISSIONS) {
      expect(perms.has(p), `SUPER_ADMIN should have ${p}`).toBe(true);
    }
  });

  it("OWNER has every permission in the sample (same as SUPER_ADMIN)", () => {
    const perms = rolePermissions("OWNER");
    for (const p of SAMPLE_PERMISSIONS) {
      expect(perms.has(p), `OWNER should have ${p}`).toBe(true);
    }
  });

  it("SUPER_ADMIN and OWNER have identical permission sets", () => {
    const superAdmin = rolePermissions("SUPER_ADMIN");
    const owner = rolePermissions("OWNER");
    expect(superAdmin.size).toBe(owner.size);
    for (const p of owner) {
      expect(superAdmin.has(p)).toBe(true);
    }
  });
});

describe("rolePermissions — VIEWER (minimal grant)", () => {
  it("VIEWER has exactly one permission: dashboard.view", () => {
    const perms = rolePermissions("VIEWER");
    expect(perms.size).toBe(1);
    expect(perms.has("dashboard.view")).toBe(true);
  });

  it("VIEWER cannot perform any write/export/delete action", () => {
    const perms = rolePermissions("VIEWER");
    const denied: Permission[] = [
      "contacts.create",
      "contacts.update",
      "contacts.delete",
      "contacts.export",
      "inquiries.create",
      "inquiries.delete",
      "ai_tasks.create",
      "ai_approvals.decide",
      "articles.create",
      "articles.publish",
      "users.create",
      "users.delete",
      "users.role_assign",
      "audit_logs.export",
      "security_settings.update",
    ];
    for (const p of denied) {
      expect(perms.has(p), `VIEWER must NOT have ${p}`).toBe(false);
    }
  });
});

describe("hasPermission — null/undefined role", () => {
  it("returns false for null role", () => {
    expect(hasPermission(null, "dashboard.view")).toBe(false);
  });

  it("returns false for undefined role", () => {
    expect(hasPermission(undefined, "dashboard.view")).toBe(false);
  });

  it("returns true for VIEWER + dashboard.view", () => {
    expect(hasPermission("VIEWER", "dashboard.view")).toBe(true);
  });

  it("returns false for VIEWER + contacts.create", () => {
    expect(hasPermission("VIEWER", "contacts.create")).toBe(false);
  });

  it("returns true for SUPER_ADMIN + users.role_assign", () => {
    expect(hasPermission("SUPER_ADMIN", "users.role_assign")).toBe(true);
  });
});

describe("normalizeRole — input normalization", () => {
  it("accepts every canonical uppercase role", () => {
    for (const r of ALL_ROLES) {
      expect(normalizeRole(r)).toBe(r);
    }
  });

  it("rejects an unknown role string", () => {
    expect(normalizeRole("ADMIN")).toBeNull();
    expect(normalizeRole("ROOT")).toBeNull();
    expect(normalizeRole("GUEST")).toBeNull();
    expect(normalizeRole("super-admin")).toBeNull();
  });

  it("rejects non-string inputs", () => {
    expect(normalizeRole(undefined)).toBeNull();
    expect(normalizeRole(null)).toBeNull();
    expect(normalizeRole(123)).toBeNull();
    expect(normalizeRole({ role: "VIEWER" })).toBeNull();
    expect(normalizeRole(["VIEWER"])).toBeNull();
  });

  it("rejects empty string and whitespace-only strings", () => {
    expect(normalizeRole("")).toBeNull();
    expect(normalizeRole("   ")).toBeNull();
  });

  // KNOWN GAP — documented in tests/README.md. The current implementation
  // is case-sensitive; these tests pin the actual behavior so a future
  // case-insensitive change is a deliberate, visible update.
  it("currently rejects lowercase variants (case-sensitive lookup)", () => {
    expect(normalizeRole("viewer")).toBeNull();
    expect(normalizeRole("super_admin")).toBeNull();
  });

  it("currently rejects mixed-case variants (case-sensitive lookup)", () => {
    expect(normalizeRole("Viewer")).toBeNull();
    expect(normalizeRole("SuperAdmin")).toBeNull();
  });
});
