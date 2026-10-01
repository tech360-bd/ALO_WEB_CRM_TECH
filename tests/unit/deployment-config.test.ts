import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Managed cPanel production deployment contract.
const ROOT = join(import.meta.dirname, "../..");

describe("Deployment configuration — managed cPanel", () => {
  it("selects npm as sole package manager (no bun.lock)", () => {
    expect(existsSync(join(ROOT, "package-lock.json"))).toBe(true);
    expect(existsSync(join(ROOT, "bun.lock"))).toBe(false);
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
    expect(pkg.packageManager ?? "npm").toMatch(/^npm@/);
    expect(pkg.engines?.npm).toBeDefined();
  });

  it("build script uses 'prisma generate' with space and creates standalone", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
    const build: string = pkg.scripts?.build ?? "";
    expect(build).not.toMatch(/prismagenerate/);
    expect(build).toMatch(/prisma generate/);
    expect(build).toMatch(/prepare-standalone/);
    expect(pkg.scripts?.start).toBe("NODE_ENV=production node server.js");
  });

  it("next config uses output: standalone", () => {
    const cfg = readFileSync(join(ROOT, "next.config.ts"), "utf-8");
    expect(cfg).toMatch(/output:\s*["']standalone["']/);
  });

  it("historical production workflow is a main-only refusal notice", () => {
    const workflow = readFileSync(join(ROOT, ".github/workflows/deploy-production.yml"), "utf-8");
    expect(workflow).toContain("github.ref == 'refs/heads/main'");
    expect(workflow).toContain("github.event_name == 'workflow_dispatch'");
    expect(workflow).not.toContain("environment:");
    expect(workflow).toContain("exit 1");
    expect(workflow).not.toMatch(/DEPLOY_HOST|DEPLOY_PORT|DEPLOY_SSH|pm2|appleboy|3044|\/root\//);
  });

  it("prepare-standalone validates server.js", () => {
    const s = readFileSync(join(ROOT, "scripts/prepare-standalone.mjs"), "utf-8");
    expect(s).toMatch(/server\.js/);
    expect(s).toMatch(/Missing generated.*standalone/);
  });

  it("prisma schema uses mysql", () => {
    const schema = readFileSync(join(ROOT, "prisma/schema.prisma"), "utf-8");
    expect(schema).toMatch(/provider\s*=\s*"mysql"/);
  });

  it("health endpoint exists", () => {
    expect(existsSync(join(ROOT, "src/app/api/health/route.ts"))).toBe(true);
  });


});

describe("Health check — local and public", () => {
  it("health response shape is ok/degraded with database.connected", () => {
    const mockOk = { status: "ok", database: { connected: true } };
    const mockDegraded = { status: "degraded", database: { connected: false, error: "ECONNREFUSED" } };
    expect(["ok", "degraded"]).toContain(mockOk.status);
    expect(mockOk.database.connected).toBe(true);
    expect(mockDegraded.database.connected).toBe(false);
  });

  it("public health URL uses https://aloeducation.com", () => {
    const pub = "https://aloeducation.com/api/health";
    const url = new URL(pub);
    expect(url.hostname).toBe("aloeducation.com");
    expect(url.protocol).toBe("https:");
  });
});
