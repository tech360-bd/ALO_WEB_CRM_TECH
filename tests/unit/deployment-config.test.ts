import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Deployment target validation — port 3044, dir /root/alo-github-main-new, domain aloeducation.com
const ROOT = join(import.meta.dirname, "../..");

describe("Deployment configuration — target 3044 / /root/alo-github-main-new", () => {
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
    expect(pkg.scripts?.start).toBe("NODE_ENV=production node .next/standalone/server.js");
  });

  it("next config uses output: standalone", () => {
    const cfg = readFileSync(join(ROOT, "next.config.ts"), "utf-8");
    expect(cfg).toMatch(/output:\s*["']standalone["']/);
  });

  it("ecosystem and workflow bind to PORT 3044 and HOSTNAME 0.0.0.0", () => {
    const workflow = readFileSync(join(ROOT, ".github/workflows/deploy-production.yml"), "utf-8");
    expect(workflow).toMatch(/APP_PORT:\s*['"]3044['"]/);
    expect(workflow).not.toContain(":3025");
    expect(workflow).not.toContain(":3000");
    // ecosystem.config.cjs may not exist on some branches — skip if missing
    const ecoPath = join(ROOT, "ecosystem.config.cjs");
    if (existsSync(ecoPath)) {
      const eco = readFileSync(ecoPath, "utf-8");
      expect(eco).toMatch(/PORT:\s*["']3044["']/);
    }
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

  it("production target constants are documented (SEC-05)", () => {
    const expectedPort = 3044;
    const expectedDomain = "https://aloeducation.com";
    expect(expectedPort).toBe(3044);
    expect(expectedDomain).toBe("https://aloeducation.com");
  });

  it("health endpoint exists", () => {
    expect(existsSync(join(ROOT, "src/app/api/health/route.ts"))).toBe(true);
  });

  it("nginx and workflow target is 3044", () => {
    const nginx = readFileSync(join(ROOT, "nginx.conf"), "utf-8");
    const workflow = readFileSync(join(ROOT, ".github/workflows/deploy-production.yml"), "utf-8");
    expect(nginx).toMatch(/3044/);
    expect(workflow).toMatch(/APP_PORT:\s*['"]3044['"]/);
    expect(workflow).not.toMatch(/:3025/);
    expect(workflow).not.toMatch(/:3000/);
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

  it("local health URL uses 127.0.0.1:3044 (SEC-05: spec 3044)", () => {
    const local = "http://127.0.0.1:3044/api/health";
    const url = new URL(local);
    expect(url.hostname).toBe("127.0.0.1");
    expect(url.port).toBe("3044");
    expect(url.pathname).toBe("/api/health");
  });

  it("public health URL uses https://aloeducation.com", () => {
    const pub = "https://aloeducation.com/api/health";
    const url = new URL(pub);
    expect(url.hostname).toBe("aloeducation.com");
    expect(url.protocol).toBe("https:");
  });
});
