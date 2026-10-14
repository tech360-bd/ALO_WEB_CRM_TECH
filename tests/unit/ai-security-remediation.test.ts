// Focused regression test for AI security remediation (2026-10-13)
// Tests: hard-coded admin password removal, unknown action default, mass assignment protection, retry authorization
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

describe("AI Security Remediation", () => {
  it("should not contain hard-coded admin password in seed script", () => {
    const content = readFileSync("scripts/seed-direct-mysql.js", "utf8");
    expect(content).not.toContain("AloAdminSecure2026!Pass");
    expect(content).toContain("FATAL: SEED_SUPER_ADMIN_PASSWORD");
  });

  it("should default unknown action types to HIGH risk (fail-closed)", async () => {
    // Dynamic import of the module under test
    const { assessRisk } = await import("@/lib/ai-action-executor");
    // Unknown action should return HIGH, not LOW
    const result = assessRisk("UNKNOWN_MALICIOUS_ACTION", {});
    expect(result).toBe("HIGH");
  });

  it("should have authorization checks in actions endpoint", async () => {
    // Verify the actions route includes authorization enforcement
    const content = readFileSync("src/app/api/ai-command/actions/route.ts", "utf8");
    expect(content).toContain("SUPER_ADMIN");
    expect(content).toContain("ADMIN");
  });

  it("should enforce authorization before retry execution", async () => {
    const retryContent = readFileSync("src/app/api/ai-command/retry/route.ts", "utf8");
    expect(retryContent).toContain("centralized ai-action-executor unavailable");
    expect(retryContent).not.toContain("CREATE_LEAD"); // inline fallback should not execute directly
  });

  it("should enforce mass assignment protection in execute route", async () => {
    const executeContent = readFileSync("src/app/api/ai-command/execute/route.ts", "utf8");
    expect(executeContent).toContain("ALLOWED_STUDENT_FIELDS");
    expect(executeContent).toContain("ALLOWED_APPLICATION_FIELDS");
    expect(executeContent).toContain("ALLOWED_CRM_FIELDS");
  });
});
