#!/usr/bin/env node
/**
 * scripts/prepare-standalone.mjs
 *
 * Post-build script that copies static assets and public files
 * into the .next/standalone directory for production deployment.
 *
 * Runs on macOS, Linux, and CI. Uses only Node.js built-ins.
 *
 * Usage:  node scripts/prepare-standalone.mjs
 * Exit codes: 0 = success, 1 = failure
 */

import { existsSync, mkdirSync, cpSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

const standaloneDir = join(projectRoot, ".next", "standalone");
const staticDir = join(projectRoot, ".next", "static");
const publicDir = join(projectRoot, "public");

let errors = 0;

function log(msg) { console.log(`[prepare-standalone] ${msg}`); }
function error(msg) { console.error(`[prepare-standalone] ERROR: ${msg}`); errors++; }

// 1. Verify standalone exists
if (!existsSync(standaloneDir)) {
  error(".next/standalone does not exist. Run 'next build' with output: 'standalone' first.");
  process.exit(1);
}

const standaloneServer = join(standaloneDir, "server.js");
if (!existsSync(standaloneServer)) {
  error(".next/standalone/server.js not found. Build may have failed.");
  process.exit(1);
}
log("Standalone server.js found.");

// 2. Copy .next/static → standalone/.next/static
const standaloneNextDir = join(standaloneDir, ".next");
const standaloneStaticDir = join(standaloneNextDir, "static");

if (!existsSync(standaloneNextDir)) {
  mkdirSync(standaloneNextDir, { recursive: true });
  log(`Created .next/standalone/.next directory.`);
}

if (existsSync(staticDir)) {
  if (existsSync(standaloneStaticDir)) {
    // Remove old static to avoid stale files
    cpSync(staticDir, standaloneStaticDir, { recursive: true, force: true });
    log("Refreshed .next/standalone/.next/static.");
  } else {
    cpSync(staticDir, standaloneStaticDir, { recursive: true });
    log("Copied .next/static → standalone/.next/static.");
  }
} else {
  error(".next/static not found. Build may not have generated static assets.");
}

// 3. Copy public → standalone/public (if public exists)
if (existsSync(publicDir)) {
  const standalonePublicDir = join(standaloneDir, "public");
  cpSync(publicDir, standalonePublicDir, { recursive: true, force: true });
  log("Copied public → standalone/public.");
} else {
  log("No public/ directory found. Skipping public copy.");
}

// 4. Summary
if (errors > 0) {
  console.error(`[prepare-standalone] Completed with ${errors} error(s).`);
  process.exit(1);
} else {
  log("All assets prepared successfully.");
  process.exit(0);
}
