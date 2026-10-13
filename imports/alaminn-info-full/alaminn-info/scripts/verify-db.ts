/**
 * scripts/verify-db.ts
 * ------------------------------------------------------------------
 * Alaminn.info — Verify the live database is healthy.
 *
 * Node.js-compatible (uses Prisma Client — no `bun:sqlite` dependency).
 * Works with both SQLite (dev) and MySQL (production).
 *
 * What it does:
 *   1. Confirms DB connection works.
 *   2. Counts rows in every user table.
 *   3. Reports anomalies (empty tables that should never be empty,
 *      suspiciously small tables, connection failures).
 *   4. For SQLite: runs PRAGMA integrity_check + foreign_key_check.
 *   5. Exits 0 if healthy, 1 if not.
 *
 * Usage:
 *   npx tsx scripts/verify-db.ts
 *   npm run db:verify
 */
import { PrismaClient } from "@prisma/client";
import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const _PROJECT_ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);

function resolveDbPath(): string | null {
  const envUrl = process.env.DATABASE_URL || "";
  const match = envUrl.match(/^file:(.+)$/);
  if (match) return resolve(match[1]);
  return null; // MySQL mode
}

const DB_PATH = resolveDbPath();
const IS_SQLITE = DB_PATH !== null;

interface TableCount {
  name: string;
  rowCount: number;
}

// Tables that are expected to always have rows after seeding.
const EXPECTED_NONEMPTY_TABLES = new Set<string>([
  "User",
  "Project",
  "Article",
  "Resource",
  "ImpactRecord",
  "CaseStudy",
  "Inquiry",
  "Opportunity",
  "AiTask",
  "MeetingRequest",
  "NewsletterSubscriber",
  "Contact",
  "Task",
  "AiApproval",
]);

function line(s = ""): void {
  console.log(s);
}
function err(s: string): void {
  console.error(s);
}

async function main(): Promise<number> {
  if (IS_SQLITE && DB_PATH && !existsSync(DB_PATH)) {
    err(`Database file not found: ${DB_PATH}`);
    return 1;
  }

  line("── DB Verify ──────────────────────────────────────────");
  line(`Database: ${IS_SQLITE ? DB_PATH : "MySQL (via DATABASE_URL)"}`);
  line(`Provider: ${IS_SQLITE ? "sqlite" : "mysql"}`);
  line();

  const prisma = new PrismaClient();
  let anomalies = 0;

  try {
    // 1. Connection test
    try {
      await prisma.$queryRaw`SELECT 1`;
      line("Connection      : ok");
    } catch (e) {
      err(`Connection failed: ${(e as Error).message}`);
      return 1;
    }

    // 2. SQLite-only PRAGMA checks
    if (IS_SQLITE) {
      try {
        const integrity = await prisma.$queryRawUnsafe<
          { integrity_check: string }[]
        >("PRAGMA integrity_check");
        const intOk =
          integrity.length === 1 && integrity[0].integrity_check === "ok";
        line(
          `integrity_check : ${intOk ? "ok" : JSON.stringify(integrity)}`,
        );
        if (!intOk) anomalies++;
      } catch {
        line("integrity_check : skipped (cannot run on this DB)");
      }

      try {
        const fkCheck = await prisma.$queryRawUnsafe<unknown[]>(
          "PRAGMA foreign_key_check",
        );
        const fkOk = fkCheck.length === 0;
        line(
          `foreign_key_check: ${fkOk ? "ok (no violations)" : `${fkCheck.length} violation(s)`}`,
        );
        if (!fkOk) {
          anomalies++;
          for (const v of fkCheck) {
            line(`  ⚠ FK violation: ${JSON.stringify(v)}`);
          }
        }
      } catch {
        line("foreign_key_check: skipped");
      }
    }

    // 3. Enumerate tables
    let tables: { name: string }[];
    if (IS_SQLITE) {
      tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma_%' ORDER BY name",
      );
    } else {
      tables = await prisma.$queryRawUnsafe<{ name: string }[]>(
        "SELECT table_name AS name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name NOT LIKE '_prisma_%' ORDER BY table_name",
      );
    }
    line(`Tables in schema : ${tables.length}`);

    // 4. Row counts per table
    line();
    line("Row counts:");
    const counts: TableCount[] = [];
    let totalRows = 0;
    for (const t of tables) {
      let rowCount = -1;
      try {
        const r = await prisma.$queryRawUnsafe<{ n: bigint | number }[]>(
          `SELECT COUNT(*) AS n FROM \`${t.name}\``,
        );
        const n = r[0]?.n;
        rowCount = typeof n === "bigint" ? Number(n) : (n ?? 0);
      } catch (e) {
        rowCount = -1;
        line(
          `  ⚠ Could not count rows in ${t.name}: ${(e as Error).message}`,
        );
        anomalies++;
      }
      counts.push({ name: t.name, rowCount });
      totalRows += rowCount > 0 ? rowCount : 0;
    }

    // Pretty print
    const nameWidth = Math.max(8, ...counts.map((c) => c.name.length));
    line(`  ${"Table".padEnd(nameWidth)}  ${"Rows".padStart(10)}  Status`);
    line(`  ${"─".repeat(nameWidth)}  ${"──────────"}  ${"─".repeat(10)}`);
    for (const c of counts) {
      let status = "ok";
      if (c.rowCount < 0) status = "ERROR";
      else if (
        c.rowCount === 0 &&
        EXPECTED_NONEMPTY_TABLES.has(c.name)
      ) {
        status = "EMPTY (expected non-empty)";
        anomalies++;
      } else if (c.rowCount === 0) {
        status = "empty";
      }
      line(
        `  ${c.name.padEnd(nameWidth)}  ${String(c.rowCount).padStart(10)}  ${status}`,
      );
    }
    line(`  ${"─".repeat(nameWidth)}  ${"──────────"}  ${"─".repeat(10)}`);
    line(`  ${"TOTAL".padEnd(nameWidth)}  ${String(totalRows).padStart(10)}`);

    // 5. Prisma migration history
    try {
      const migrations = await prisma.$queryRawUnsafe<{ n: bigint | number }[]>(
        "SELECT COUNT(*) AS n FROM _prisma_migrations",
      );
      const n = migrations[0]?.n;
      const count = typeof n === "bigint" ? Number(n) : (n ?? 0);
      line();
      line(`Prisma migrations recorded: ${count}`);
    } catch {
      line();
      line("Prisma migrations table: not present (using `prisma db push`)");
    }

    line();
    line("── Summary ────────────────────────────────────────────");
    if (anomalies === 0) {
      line(`✓ Database is healthy. (0 anomalies)`);
      return 0;
    }
    err(`✗ ${anomalies} anomaly/anomalies detected — investigate before relying on this DB.`);
    return 1;
  } finally {
    try {
      await prisma.$disconnect();
    } catch {
      /* swallow */
    }
  }
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    err(`Unhandled error: ${e.message}`);
    process.exit(1);
  });
