#!/usr/bin/env node
// Validate deployment configuration for ALO Education
// Checks: package manager, build script, next standalone, ecosystem port/host, nginx target, required files

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
let failed = false;

function fail(msg) {
  console.error(`✗ ${msg}`);
  failed = true;
}
function ok(msg) {
  console.log(`✓ ${msg}`);
}
function checkFile(path, desc) {
  if (!existsSync(join(ROOT, path))) {
    fail(`${desc} missing: ${path}`);
    return false;
  }
  ok(`${desc} exists: ${path}`);
  return true;
}

// 1. Lockfile
if (existsSync(join(ROOT, "bun.lock"))) {
  fail("bun.lock must be removed — npm is the selected package manager (package-lock.json)");
} else {
  ok("bun.lock absent (correct, npm selected)");
}
if (!existsSync(join(ROOT, "package-lock.json"))) {
  fail("package-lock.json missing");
} else {
  ok("package-lock.json present");
}

// 2. package.json
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf-8"));
if (pkg.packageManager && !pkg.packageManager.startsWith("npm@")) {
  fail(`packageManager should be npm, got ${pkg.packageManager}`);
} else {
  ok(`packageManager: ${pkg.packageManager || "npm (engines)"}`);
}
if (!pkg.scripts?.build?.includes("prisma generate")) {
  fail("package.json build script must contain 'prisma generate' (with space, not prismagenerate)");
} else {
  ok("build script contains 'prisma generate'");
}
if (pkg.scripts?.build?.includes("prismagenerate")) {
  fail("build script contains typo 'prismagenerate'");
}
if (!pkg.scripts?.build?.includes("prepare-standalone")) {
  fail("build script must run prepare-standalone.mjs to ensure .next/standalone/server.js");
} else {
  ok("build script runs prepare-standalone");
}
if (pkg.scripts?.start !== "NODE_ENV=production node .next/standalone/server.js") {
  fail(`start script should be "NODE_ENV=production node .next/standalone/server.js", got "${pkg.scripts?.start}"`);
} else {
  ok("start script correct");
}

// 3. Next config
if (!checkFile("next.config.ts", "Next config")) {}
else {
  const cfg = readFileSync(join(ROOT, "next.config.ts"), "utf-8");
  if (!cfg.includes('output: "standalone"') && !cfg.includes("output: 'standalone'") && !cfg.includes('output:"standalone"')) {
    fail('next.config.ts must have output: "standalone"');
  } else {
    ok('next.config.ts has output: "standalone"');
  }
}

// 4. Prisma
if (!checkFile("prisma/schema.prisma", "Prisma schema")) {}
else {
  const schema = readFileSync(join(ROOT, "prisma/schema.prisma"), "utf-8");
  if (!schema.includes('provider = "mysql"')) fail("Prisma provider should be mysql");
  else ok("Prisma provider mysql");
}

// 5. Standalone prepare script
if (!checkFile("scripts/prepare-standalone.mjs", "prepare-standalone script")) {}
else {
  const s = readFileSync(join(ROOT, "scripts/prepare-standalone.mjs"), "utf-8");
  if (!s.includes("server.js")) fail("prepare-standalone should verify server.js");
  else ok("prepare-standalone verifies server.js");
}

// 6. Ecosystem
if (!checkFile("ecosystem.config.cjs", "PM2 ecosystem")) {}
else {
  const eco = readFileSync(join(ROOT, "ecosystem.config.cjs"), "utf-8");
  if (!eco.includes('PORT: "3044"') && !eco.includes("PORT: '3044'") && !eco.includes('PORT:3044') && !eco.includes('"3044"')) {
    fail('ecosystem.config.cjs must set PORT to "3044"');
  } else {
    ok("ecosystem PORT 3044");
  }
  if (!eco.includes('HOSTNAME: "0.0.0.0"') && !eco.includes("HOSTNAME: '0.0.0.0'")) {
    fail('ecosystem.config.cjs must set HOSTNAME to "0.0.0.0"');
  } else {
    ok("ecosystem HOSTNAME 0.0.0.0");
  }
  if (eco.includes('127.0.0.1') && eco.includes('HOSTNAME')) {
    // Should not have 127.0.0.1 for HOSTNAME anymore
    if (eco.match(/HOSTNAME:\s*"127\.0\.0\.1"/)) fail('HOSTNAME should be 0.0.0.0 not 127.0.0.1');
  }
  if (eco.includes('alo-github-main-new')) {
    // Not necessarily in ecosystem, but app dir should be noted
    ok("ecosystem references deploy dir");
  }
}

// 7. Required production dir
const prodDir = "/root/alo-github-main-new";
console.log(`ℹ Expected production dir: ${prodDir} (PORT 3044)`);

// 8. Nginx config check (local repo nginx.conf example)
if (existsSync(join(ROOT, "nginx.conf"))) {
  const nginx = readFileSync(join(ROOT, "nginx.conf"), "utf-8");
  if (nginx.includes("app:3000") && !nginx.includes("3044")) {
    console.log("ℹ nginx.conf example still points to app:3000 — production Nginx must proxy to 127.0.0.1:3044 after deploy (workflow handles)");
  }
}

// 9. Health endpoint
if (!checkFile("src/app/api/health/route.ts", "Health endpoint")) {}

if (failed) {
  console.error("\n✗ Deployment config validation FAILED");
  process.exit(1);
}
console.log("\n✓ All deployment config checks passed");
