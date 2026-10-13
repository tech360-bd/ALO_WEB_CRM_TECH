/**
 * scripts/restore-db.ts
 * ------------------------------------------------------------------
 * Alaminn.info — Restore the database from a backup file (Node.js-compatible).
 *
 * Supports BOTH SQLite (dev) and MySQL (production):
 *   - SQLite: atomically replaces the live DB file with the backup.
 *   - MySQL:  pipes the SQL dump through `mysql` CLI.
 *
 * Safety:
 *   - SQLite: creates a pre-restore snapshot BEFORE overwriting.
 *   - Requires explicit confirmation unless --yes is passed.
 *   - The live Next.js server should be stopped before restore.
 *
 * Usage:
 *   npx tsx scripts/restore-db.ts <backup-file>
 *   npx tsx scripts/restore-db.ts alaminn-2026-07-12-030100.db --yes
 *   npm run db:restore -- alaminn-2026-07-12-030100.db --yes
 *
 * Exit codes:
 *   0 — restore completed and verified
 *   1 — restore aborted
 */
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
} from "node:fs";
import { join, resolve, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { gunzipSync } from "node:zlib";
import { PrismaClient } from "@prisma/client";
import * as readline from "node:readline";

const PROJECT_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

interface ParsedDbUrl {
  provider: "sqlite" | "mysql";
  filePath?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
}

function parseDbUrl(): ParsedDbUrl {
  const url = process.env.DATABASE_URL || "";
  if (url.startsWith("file:")) {
    return { provider: "sqlite", filePath: resolve(url.slice(5)) };
  }
  if (url.startsWith("mysql://")) {
    const m = url.match(/^mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)$/);
    if (m) {
      return {
        provider: "mysql",
        user: decodeURIComponent(m[1]),
        password: decodeURIComponent(m[2]),
        host: m[3],
        port: parseInt(m[4], 10),
        database: m[5],
      };
    }
  }
  return { provider: "sqlite", filePath: join(PROJECT_ROOT, "db", "custom.db") };
}

const PARSED = parseDbUrl();
const DB_PATH = PARSED.filePath || null;
const BACKUP_DIR = join(PROJECT_ROOT, "db", "backups");
const LOG_FILE = join(BACKUP_DIR, "backup.log");

function pad(n: number, w = 2): string {
  return String(n).padStart(w, "0");
}
function timestamp(): string {
  const d = new Date();
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  );
}
function isoTimestamp(): string {
  return new Date().toISOString();
}
function logLine(line: string): void {
  console.log(line);
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  try {
    appendFileSync(LOG_FILE, `[${isoTimestamp()}] ${line}\n`, "utf8");
  } catch { /* best-effort */ }
}
function logError(line: string): void {
  console.error(line);
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  try {
    appendFileSync(LOG_FILE, `[${isoTimestamp()}] [ERROR] ${line}\n`, "utf8");
  } catch { /* best-effort */ }
}

function resolveBackupPath(arg: string): string {
  if (isAbsolute(arg)) return arg;
  const candidate = join(BACKUP_DIR, arg);
  if (existsSync(candidate)) return candidate;
  if (existsSync(arg)) return resolve(arg);
  return candidate; // let the existsSync check downstream report it
}

async function confirm(question: string, skip: boolean): Promise<boolean> {
  if (skip) return true;
  if (!process.stdin.isTTY) {
    // non-interactive — require --yes
    logError("Refusing to restore non-interactively without --yes flag.");
    return false;
  }
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^(y|yes)$/i.test(answer.trim()));
    });
  });
}

// ─── SQLite restore ───────────────────────────────────────────────────
async function restoreSqlite(
  backupPath: string,
  skipConfirm: boolean,
): Promise<number> {
  if (!DB_PATH) {
    logError("No SQLite DB path resolved.");
    return 1;
  }
  if (!existsSync(backupPath)) {
    logError(`Backup file not found: ${backupPath}`);
    return 1;
  }

  logLine(`── Restore start (SQLite) ────────────────────────────`);
  logLine(`Backup    : ${backupPath}`);
  logLine(`Target DB : ${DB_PATH}`);

  // 1. Verify backup integrity via Prisma
  const backupPrisma = new PrismaClient({
    datasources: { db: { url: `file:${backupPath}` } },
  });
  try {
    const integrity = await backupPrisma.$queryRawUnsafe<
      { integrity_check: string }[]
    >("PRAGMA integrity_check");
    const ok =
      integrity.length === 1 && integrity[0].integrity_check === "ok";
    logLine(`Backup int: ${ok ? "ok" : JSON.stringify(integrity)}`);
    if (!ok) {
      logError("Backup failed integrity_check — aborting restore.");
      return 1;
    }
  } catch (e) {
    logError(`Could not verify backup: ${(e as Error).message}`);
    return 1;
  } finally {
    await backupPrisma.$disconnect();
  }

  // 2. Confirm
  const yes = await confirm(
    `This will OVERWRITE the live DB at ${DB_PATH}. Continue? [y/N] `,
    skipConfirm,
  );
  if (!yes) {
    logLine("Restore aborted by user.");
    return 1;
  }

  // 3. Pre-restore snapshot
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  const preRestoreName = `pre-restore-alaminn-${timestamp()}.db`;
  const preRestorePath = join(BACKUP_DIR, preRestoreName);
  if (existsSync(DB_PATH)) {
    logLine(`Creating pre-restore snapshot: ${preRestoreName}`);
    copyFileSync(DB_PATH, preRestorePath);
  }

  // 4. Atomic swap: rename current to .old, copy backup to target, verify, unlink .old
  const oldPath = `${DB_PATH}.pre-restore`;
  try {
    if (existsSync(DB_PATH)) renameSync(DB_PATH, oldPath);
    copyFileSync(backupPath, DB_PATH);

    // Verify the newly restored DB
    const verifyPrisma = new PrismaClient();
    try {
      const integrity = await verifyPrisma.$queryRawUnsafe<
        { integrity_check: string }[]
      >("PRAGMA integrity_check");
      const ok =
        integrity.length === 1 && integrity[0].integrity_check === "ok";
      if (!ok) {
        throw new Error(`integrity_check: ${JSON.stringify(integrity)}`);
      }
      logLine("Restored DB verified — integrity_check ok");
    } finally {
      await verifyPrisma.$disconnect();
    }

    if (existsSync(oldPath)) unlinkSync(oldPath);
    logLine(`── Restore OK ────────────────────────────────────────`);
    logLine(`Pre-restore snapshot: ${preRestoreName}`);
    return 0;
  } catch (e) {
    logError(`Restore failed: ${(e as Error).message}`);
    // Roll back
    if (existsSync(oldPath)) {
      try {
        if (existsSync(DB_PATH)) unlinkSync(DB_PATH);
        renameSync(oldPath, DB_PATH);
        logError("Rolled back to original DB.");
      } catch (rollbackErr) {
        logError(
          `ROLLBACK FAILED: ${(rollbackErr as Error).message} — ` +
            `original DB is at ${oldPath}`,
        );
      }
    }
    return 1;
  }
}

// ─── MySQL restore ────────────────────────────────────────────────────
function restoreMysql(
  backupPath: string,
  skipConfirm: boolean,
): number {
  if (!PARSED.database || !PARSED.host) {
    logError("Invalid MySQL DATABASE_URL");
    return 1;
  }
  if (!existsSync(backupPath)) {
    logError(`Backup file not found: ${backupPath}`);
    return 1;
  }

  logLine(`── Restore start (MySQL) ─────────────────────────────`);
  logLine(`Backup    : ${backupPath}`);
  logLine(`Target DB : ${PARSED.database}@${PARSED.host}:${PARSED.port}`);

  // Confirm (synchronous wrapper for mysql path)
  if (!skipConfirm) {
    if (process.stdin.isTTY) {
      logError(
        "Interactive confirmation not supported for MySQL restore in this mode — pass --yes.",
      );
      return 1;
    }
  }

  try {
    // Read backup (decompress if .gz)
    const raw = readFileSync(backupPath);
    const sql = backupPath.endsWith(".gz")
      ? gunzipSync(raw).toString("utf8")
      : raw.toString("utf8");

    // Pipe through mysql CLI
    const args = [
      `--host=${PARSED.host}`,
      `--port=${String(PARSED.port || 3306)}`,
      `--user=${PARSED.user}`,
      `--password=${PARSED.password}`,
      PARSED.database,
    ];
    execFileSync("mysql", args, {
      input: sql,
      maxBuffer: 1024 * 1024 * 1024,
      encoding: "utf8",
    });

    logLine(`── Restore OK ────────────────────────────────────────`);
    return 0;
  } catch (e) {
    logError(`mysql restore failed: ${(e as Error).message}`);
    return 1;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────
async function main(): Promise<number> {
  const args = process.argv.slice(2);
  const skipConfirm = args.includes("--yes") || args.includes("-y");
  const fileArg = args.find((a) => !a.startsWith("-"));
  if (!fileArg) {
    logError("Usage: npm run db:restore -- <backup-file> [--yes]");
    logError(
      `Backup files in ${BACKUP_DIR}: ` +
        (existsSync(BACKUP_DIR)
          ? readdirSync(BACKUP_DIR)
              .filter((f) => /^alaminn-|^pre-restore-/.test(f))
              .join(", ") || "(none)"
          : "(dir missing)"),
    );
    return 1;
  }
  const backupPath = resolveBackupPath(fileArg);
  if (PARSED.provider === "mysql") {
    return restoreMysql(backupPath, skipConfirm);
  }
  return restoreSqlite(backupPath, skipConfirm);
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    logError(`Unhandled error: ${e.message}`);
    process.exit(1);
  });

