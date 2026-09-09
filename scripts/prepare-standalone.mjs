// Safe Next.js standalone preparation.
// Never search inside node_modules for server.js.
// Never overwrite a valid Next.js standalone server.js.

import { existsSync, mkdirSync, cpSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const NEXT_DIR = join(ROOT, ".next");
const STANDALONE_DIR = join(NEXT_DIR, "standalone");
const STANDALONE_NEXT_DIR = join(STANDALONE_DIR, ".next");

const STATIC_SOURCE = join(NEXT_DIR, "static");
const PUBLIC_SOURCE = join(ROOT, "public");

const STATIC_TARGET = join(STANDALONE_NEXT_DIR, "static");
const PUBLIC_TARGET = join(STANDALONE_DIR, "public");

const SERVER_JS = join(STANDALONE_DIR, "server.js");

console.log("============================================================");
console.log(" ALO EDUCATION — SAFE STANDALONE PREPARATION");
console.log("============================================================");

if (!existsSync(STANDALONE_DIR)) {
  throw new Error("Next.js did not create .next/standalone");
}

if (!existsSync(SERVER_JS)) {
  throw new Error(
    "CRITICAL: Next.js standalone server.js was not generated at .next/standalone/server.js"
  );
}

console.log("PASS: Next.js generated standalone/server.js");
console.log("PASS: refusing recursive server.js relocation");

mkdirSync(STANDALONE_NEXT_DIR, { recursive: true });

if (existsSync(STATIC_SOURCE)) {
  rmSync(STATIC_TARGET, { recursive: true, force: true });
  cpSync(STATIC_SOURCE, STATIC_TARGET, { recursive: true });
  console.log("PASS: .next/static copied");
}

if (existsSync(PUBLIC_SOURCE)) {
  rmSync(PUBLIC_TARGET, { recursive: true, force: true });
  cpSync(PUBLIC_SOURCE, PUBLIC_TARGET, { recursive: true });
  console.log("PASS: public copied");
}

const SERVER_APP_SOURCE = join(NEXT_DIR, "server", "app");
const SERVER_CHUNKS_SOURCE = join(NEXT_DIR, "server", "chunks");

if (existsSync(SERVER_APP_SOURCE)) {
  cpSync(
    SERVER_APP_SOURCE,
    join(STANDALONE_NEXT_DIR, "server", "app"),
    { recursive: true }
  );
  console.log("PASS: server/app copied");
}

if (existsSync(SERVER_CHUNKS_SOURCE)) {
  cpSync(
    SERVER_CHUNKS_SOURCE,
    join(STANDALONE_NEXT_DIR, "server", "chunks"),
    { recursive: true }
  );
  console.log("PASS: server/chunks copied");
}

console.log("");
console.log("===== FINAL SERVER CHECK =====");

if (!existsSync(SERVER_JS)) {
  throw new Error("FAIL: standalone server.js disappeared");
}

console.log("PASS: .next/standalone/server.js");
console.log("");
console.log("Standalone preparation complete.");
