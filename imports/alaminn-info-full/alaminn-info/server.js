/**
 * server.js — Production entry point (cPanel Node.js App + VPS).
 * ----------------------------------------------------------------------------
 * This file is the "Application startup file" for cPanel's "Setup Node.js App"
 * UI and also works as a plain `node server.js` entry on a VPS.
 *
 * It does five things:
 *   1. Loads .env from the app root (so secrets stay OUTSIDE public_html).
 *      Next.js standalone does NOT auto-load .env, so we parse it manually
 *      here — no dotenv dependency needed.
 *   2. Ensures NODE_ENV=production is set.
 *   3. Validates that the standalone build exists.
 *   4. Installs graceful shutdown handlers (SIGTERM, SIGINT) for clean exits
 *      under systemd / PM2 / Docker / cPanel Passenger.
 *   5. Requires and boots the Next.js standalone server at
 *      `.next/standalone/server.js`.
 *
 * cPanel setup:
 *   Application root:          /home/aloeduca/alaminn.info
 *   Application startup file:  server.js
 *   .env location:             /home/aloeduca/alaminn.info/.env  (secure)
 *
 * VPS / standalone:
 *   NODE_ENV=production node server.js
 */
"use strict";

process.env.NODE_ENV = process.env.NODE_ENV || "production";

const path = require("path");
const fs = require("fs");

// ── 1. Load .env from the app root (if present) ────────────────────────────
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, "utf8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    // Don't override vars already set by the environment (cPanel UI wins)
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

// ── 2. Locate the Next.js standalone server ────────────────────────────────
const standalonePath = path.join(__dirname, ".next", "standalone", "server.js");

if (!fs.existsSync(standalonePath)) {
  console.error(
    "[alaminn.info] FATAL: .next/standalone/server.js not found.\n" +
      "Run `npm install` then `npm run build` before starting the app.\n" +
      "If you're on cPanel, use the Terminal to run the build commands in the app root."
  );
  process.exit(1);
}

// ── 3. Graceful shutdown handlers ──────────────────────────────────────────
// Under systemd (SIGTERM), PM2 (SIGINT), Docker (SIGTERM), or cPanel Passenger
// reloads, we give the Next.js server 10 seconds to finish in-flight requests
// before forcing exit. The standalone server exposes `process` signals natively
// but we add a safety net so the process never hangs.
let shuttingDown = false;
function gracefulShutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`[alaminn.info] Received ${signal}, shutting down gracefully...`);
  // Give Next.js 10s to drain in-flight requests, then force exit.
  setTimeout(() => {
    console.log("[alaminn.info] Forcing exit after timeout.");
    process.exit(0);
  }, 10000);
}
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGHUP", () => gracefulShutdown("SIGHUP"));

// ── 4. Hand off to the Next.js standalone server ───────────────────────────
// Next.js standalone reads process.env.PORT and process.env.HOSTNAME.
// cPanel/Passenger sets PORT automatically; on a VPS, set PORT=3000.
require(standalonePath);
