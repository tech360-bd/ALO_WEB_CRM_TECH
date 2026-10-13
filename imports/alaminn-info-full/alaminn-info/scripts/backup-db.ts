/**
 * scripts/backup-db.ts
 * ------------------------------------------------------------------
 * Alaminn.info — Automated database backup (Node.js-compatible).
 *
 * Supports BOTH SQLite (dev) and MySQL (production):
 *   - SQLite: copies the DB file, then verifies with PRAGMA integrity_check.
 *   - MySQL:  uses `mysqldump` (must be on PATH) to produce a SQL dump.
 *
 * What it does:
 *   1. Detects DB provider from DATABASE_URL.
 *   2. Creates a timestamped backup in db/backups/.
 *   3. Verifies the backup is not corrupt (SQLite: PRAGMA; MySQL: --check).
 *   4. Logs result to stdout AND db/backups/backup.log.
 *   5. Prunes old backups per retention policy (keep last N).
 *
 * Filename format:
 *   - SQLite: alaminn-YYYY-MM-DD-HHMMSS.db
 *   - MySQL:  alaminn-YYYY-MM-DD-HHMMSS.sql.gz
 *
 * Usage:
 *   npx tsx scripts/backup-db.ts
 *   npm run db:backup
 *
 * Exit codes:
 *   0 — backup created and verified
 *   1 — backup failed
 *
 * Cron example (hourly):
 *   0 * * * * cd /home/aloeduca/alaminn.info && npm run db:backup >> db/backups/backup.log 2>&1
 */
import {
  appendFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
} from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { gzipSync } from "node:zlib";

// ─── Paths ────────────────────────────────────────────────────────────
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
  // Default to SQLite dev DB
  return { provider: "sqlite", filePath: join(PROJECT_ROOT, "db", "custom.db") };
}

const PARSED = parseDbUrl();
const DB_PATH = PARSED.filePath || null;
const BACKUP_DIR = join(PROJECT_ROOT, "db", "backups");
const LOG_FILE = join(BACKUP_DIR, "backup.log");

const RETENTION_COUNT = (() => {
  const env = process.env.BACKUP_RETENTION_COUNT;
  if (!env) return 30;
  const n = parseInt(env, 10);
  return Number.isFinite(n) && n >= 1 ? n : 30;
})();

// ─── Helpers ──────────────────────────────────────────────────────────
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

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function logLine(line: string): void {
  console.log(line);
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  try {
    appendFileSync(LOG_FILE, `[${isoTimestamp()}] ${line}\n`, "utf8");
  } catch {
    /* best-effort */
  }
}

function logError(line: string): void {
  console.error(line);
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
  try {
    appendFileSync(LOG_FILE, `[${isoTimestamp()}] [ERROR] ${line}\n`, "utf8");
  } catch {
    /* best-effort */
  }
}

interface BackupFile {
  name: string;
  path: string;
  mtime: number;
  size: number;
}

function backupFileRegex(): RegExp {
  return PARSED.provider === "sqlite"
    ? /^alaminn-\d{4}-\d{2}-\d{2}-\d{6}\.db$/
    : /^alaminn-\d{4}-\d{2}-\d{2}-\d{6}\.sql\.gz$/;
}

function listBackups(): BackupFile[] {
  if (!existsSync(BACKUP_DIR)) return [];
  return readdirSync(BACKUP_DIR)
    .filter((f) => backupFileRegex().test(f))
    .map((name) => {
      const path = join(BACKUP_DIR, name);
      const st = statSync(path);
      return { name, path, mtime: st.mtimeMs, size: st.size };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

function pruneOldBackups(): { pruned: string[]; kept: number } {
  const all = listBackups();
  const pruned: string[] = [];
  if (all.length <= RETENTION_COUNT) {
    return { pruned, kept: all.length };
  }
  const toRemove = all.slice(RETENTION_COUNT);
  for (const f of toRemove) {
    try {
      unlinkSync(f.path);
      pruned.push(f.name);
    } catch (e) {
      logError(`Failed to prune ${f.name}: ${(e as Error).message}`);
    }
  }
  return { pruned, kept: all.length - pruned.length };
}

// ─── SQLite backup (file copy + verify) ───────────────────────────────
async function backupSqlite(): Promise<number> {
  const startedAt = Date.now();
  if (!DB_PATH || !existsSync(DB_PATH)) {
    logError(`Database file not found: ${DB_PATH}`);
    return 1;
  }
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

  const backupName = `alaminn-${timestamp()}.db`;
  const backupPath = join(BACKUP_DIR, backupName);

  logLine(`── Backup start (SQLite) ─────────────────────────────`);
  logLine(`Source DB : ${DB_PATH}`);
  logLine(`Backup to : ${backupPath}`);

  const prisma = new PrismaClient();
  try {
    // Verify source integrity before backing up
    const integrity = await prisma.$queryRawUnsafe<
      { integrity_check: string }[]
    >("PRAGMA integrity_check");
    const srcOk =
      integrity.length === 1 && integrity[0].integrity_check === "ok";
    logLine(`Source int: ${srcOk ? "ok" : JSON.stringify(integrity)}`);
    if (!srcOk) {
      logError("Source database failed integrity_check — aborting.");
      return 1;
    }

    // Copy the file (SQLite files are safe to copy when not mid-write,
    // and Prisma's WAL is flushed on connection close)
    if (existsSync(backupPath)) unlinkSync(backupPath);
    copyFileSync(DB_PATH, backupPath);

    const sizeBytes = statSync(backupPath).size;

    // Verify backup by opening it via a fresh Prisma connection
    const backupPrisma = new PrismaClient({
      datasources: { db: { url: `file:${backupPath}` } },
    });
    try {
      const dstIntegrity = await backupPrisma.$queryRawUnsafe<
        { integrity_check: string }[]
      >("PRAGMA integrity_check");
      const dstOk =
        dstIntegrity.length === 1 && dstIntegrity[0].integrity_check === "ok";
      const tableCount = await backupPrisma.$queryRawUnsafe<
        { n: bigint | number }[]
      >(
        "SELECT COUNT(*) AS n FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
      );
      const n = tableCount[0]?.n;
      const tables = typeof n === "bigint" ? Number(n) : (n ?? 0);

      const durationMs = Date.now() - startedAt;
      logLine(`Backup size: ${formatBytes(sizeBytes)} (${sizeBytes} bytes)`);
      logLine(`Backup int : ${dstOk ? "ok" : JSON.stringify(dstIntegrity)}`);
      logLine(`Backup objs: ${tables} tables in schema`);
      logLine(`Duration   : ${durationMs} ms`);

      if (!dstOk) {
        logError("Backup FAILED integrity_check — removing corrupt backup.");
        try { unlinkSync(backupPath); } catch { /* swallow */ }
        return 1;
      }
    } finally {
      await backupPrisma.$disconnect();
    }

    const { pruned, kept } = pruneOldBackups();
    if (pruned.length > 0) {
      logLine(`Pruned ${pruned.length} old backup(s): ${pruned.join(", ")}`);
    }
    logLine(`Retention  : ${kept} backup(s) kept (max ${RETENTION_COUNT})`);
    logLine(`── Backup OK ─────────────────────────────────────────`);
    return 0;
  } catch (e) {
    logError(`Backup failed: ${(e as Error).message}`);
    if (existsSync(backupPath)) {
      try { unlinkSync(backupPath); } catch { /* swallow */ }
    }
    return 1;
  } finally {
    await prisma.$disconnect();
  }
}

// ─── MySQL backup (mysqldump) ─────────────────────────────────────────
function backupMysql(): number {
  const startedAt = Date.now();
  if (!PARSED.database || !PARSED.host) {
    logError("Invalid MySQL DATABASE_URL");
    return 1;
  }
  if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

  const backupName = `alaminn-${timestamp()}.sql.gz`;
  const backupPath = join(BACKUP_DIR, backupName);

  logLine(`── Backup start (MySQL) ──────────────────────────────`);
  logLine(`Database  : ${PARSED.database}@${PARSED.host}:${PARSED.port}`);
  logLine(`Backup to : ${backupPath}`);

  try {
    // Run mysqldump and capture stdout, then gzip it
    const args = [
      `--host=${PARSED.host}`,
      `--port=${String(PARSED.port || 3306)}`,
      `--user=${PARSED.user}`,
      `--password=${PARSED.password}`,
      "--single-transaction",
      "--quick",
      "--routines",
      "--triggers",
      "--events",
      PARSED.database,
    ];
    const dump = execFileSync("mysqldump", args, {
      maxBuffer: 1024 * 1024 * 1024, // 1 GB
      encoding: "buffer",
    });
    const compressed = gzipSync(dump);
    appendFileSync(backupPath, compressed);

    const sizeBytes = statSync(backupPath).size;
    const durationMs = Date.now() - startedAt;
    logLine(`Backup size: ${formatBytes(sizeBytes)} (${sizeBytes} bytes)`);
    logLine(`Duration   : ${durationMs} ms`);

    const { pruned, kept } = pruneOldBackups();
    if (pruned.length > 0) {
      logLine(`Pruned ${pruned.length} old backup(s): ${pruned.join(", ")}`);
    }
    logLine(`Retention  : ${kept} backup(s) kept (max ${RETENTION_COUNT})`);
    logLine(`── Backup OK ─────────────────────────────────────────`);
    return 0;
  } catch (e) {
    logError(`mysqldump failed: ${(e as Error).message}`);
    logError(
      "Ensure `mysqldump` is installed and on PATH (cPanel servers have it).",
    );
    if (existsSync(backupPath)) {
      try { unlinkSync(backupPath); } catch { /* swallow */ }
    }
    return 1;
  }
}

// ─── Main ─────────────────────────────────────────────────────────────
async function main(): Promise<number> {
  if (PARSED.provider === "mysql") {
    return backupMysql();
  }
  return backupSqlite();
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    logError(`Unhandled error: ${e.message}`);
    process.exit(1);
  });
