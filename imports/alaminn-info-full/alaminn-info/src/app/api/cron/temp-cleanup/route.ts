import { NextResponse, type NextRequest } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { promises as fs } from "fs";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/temp-cleanup
 *
 * Deletes files older than 24 hours under `storage/temporary/`. The
 * directory is created on first run if missing. Subdirectories are NOT
 * recursed into — only top-level files in `storage/temporary/` are scanned
 * to keep the operation fast and predictable.
 *
 * Recommended cPanel cron schedule: `0 4 * * *` (daily at 04:00).
 *
 * Auth: requires `x-cron-secret` header (or `?secret=` query) matching the
 * `CRON_SECRET` environment variable. Returns 401 on auth failure, 503 if
 * the server is misconfigured (no CRON_SECRET).
 */
export async function GET(request: NextRequest) {
  const auth = verifyCronAuth(request);
  if (!auth.ok) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
        data: null,
        meta: {},
        errors: [auth.error],
      },
      { status: auth.status }
    );
  }

  try {
    const now = Date.now();
    const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24h
    const tempDir = path.resolve(process.cwd(), "storage", "temporary");

    // Ensure the directory exists — create if missing.
    try {
      await fs.mkdir(tempDir, { recursive: true });
    } catch {
      // mkdir with recursive doesn't throw if it already exists, but guard
      // against any other FS error (e.g. read-only FS) by treating the
      // whole cleanup as a no-op.
      return NextResponse.json({
        success: true,
        message: "Temp cleanup skipped — storage directory unavailable.",
        data: {
          deleted: 0,
          path: "storage/temporary",
          note: "Could not create/access storage/temporary — cleanup skipped.",
        },
        meta: { scannedAt: new Date(now).toISOString() },
        errors: [],
      });
    }

    let entries: string[] = [];
    try {
      entries = await fs.readdir(tempDir);
    } catch {
      entries = [];
    }

    let deleted = 0;
    let failed = 0;
    for (const entry of entries) {
      const fullPath = path.join(tempDir, entry);
      try {
        const stat = await fs.stat(fullPath);
        if (!stat.isFile()) continue; // skip subdirectories
        if (now - stat.mtimeMs > MAX_AGE_MS) {
          await fs.unlink(fullPath);
          deleted++;
        }
      } catch {
        // File may have been removed between readdir+stat, or unlink may
        // fail due to permissions. Count and move on — fail soft.
        failed++;
      }
    }

    console.log(
      `[cron:temp-cleanup] deleted=${deleted} failed=${failed} from ${tempDir}`
    );

    return NextResponse.json({
      success: true,
      message: "Temp cleanup complete.",
      data: {
        deleted,
        failed,
        maxAgeHours: 24,
        path: "storage/temporary",
      },
      meta: {
        scannedAt: new Date(now).toISOString(),
      },
      errors: [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Cron job failed",
        data: null,
        meta: {},
        errors: [String(error)],
      },
      { status: 500 }
    );
  }
}
