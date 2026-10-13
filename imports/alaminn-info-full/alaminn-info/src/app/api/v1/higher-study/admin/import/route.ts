/**
 * POST /api/v1/higher-study/admin/import
 * --------------------------------------------------------------------
 * Bulk import endpoint. Receives a CSV-parsed JSON payload (the
 * client parses CSV → JSON before sending) and either:
 *   - dryRun=true: validates each row, detects duplicates, returns a
 *     preview report WITHOUT writing to the DB.
 *   - dryRun=false: creates a HigherStudyImportJob record, inserts
 *     valid rows, records errors, returns the job ID + summary.
 *
 * Permission: `higher-study.import`
 *
 * Body: `{ entityType, fileName, dryRun, rows: object[] }`
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { jsonResponse, safeString } from "@/lib/higher-study/api-helpers";
import {
  writeAuditLog,
  resolveActor,
  parseBody,
  validationError,
  internalError,
} from "@/lib/higher-study/admin-helpers";

export const dynamic = "force-dynamic";

const VALID_ENTITY_TYPES = new Set([
  "university",
  "course",
  "scholarship",
  "research",
  "supervisor",
  "resource",
]);

interface ImportRow {
  row: number;
  slug: string;
  status: "ok" | "duplicate" | "error";
  error?: string;
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "higher-study.import");
  if (guard.denied) return guard.response;

  const body = await parseBody(req);
  if (!body) return validationError("Invalid request body.", ["invalid_body"]);

  try {
    const entityType = safeString(body.entityType as string);
    const fileName = safeString(body.fileName as string);
    const dryRun = body.dryRun === true;
    const rowsRaw = body.rows;
    const rows: Array<Record<string, unknown>> = Array.isArray(rowsRaw)
      ? (rowsRaw as Array<Record<string, unknown>>)
      : [];

    const errors: string[] = [];
    if (!entityType || !VALID_ENTITY_TYPES.has(entityType)) {
      errors.push("entityType_invalid");
    }
    if (!fileName) errors.push("fileName_required");
    if (!Array.isArray(rowsRaw)) errors.push("rows_must_be_array");
    if (rows.length === 0) {
      errors.push("rows_empty");
    }
    if (rows.length > 5000) {
      errors.push("rows_too_many");
    }
    if (errors.length > 0) {
      return validationError("Validation failed.", errors);
    }

    const results: ImportRow[] = [];
    let duplicateCount = 0;
    let errorCount = 0;

    // Detect duplicates by slug — every Higher Study entity has a slug.
    const seenSlugs = new Set<string>();
    const existingSlugs = new Set<string>();

    // Pre-fetch existing slugs in bulk for the entity type.
    const slugsInRows = rows
      .map((r) => safeString(r.slug as string))
      .filter(Boolean);
    if (slugsInRows.length > 0) {
      const existing = await fetchExistingSlugs(entityType, slugsInRows);
      for (const s of existing) existingSlugs.add(s);
    }

    rows.forEach((row, idx) => {
      const slug = safeString(row.slug as string);
      if (!slug) {
        results.push({
          row: idx + 1,
          slug: "",
          status: "error",
          error: "slug_required",
        });
        errorCount += 1;
        return;
      }
      if (existingSlugs.has(slug)) {
        results.push({
          row: idx + 1,
          slug,
          status: "duplicate",
          error: "slug_exists_in_db",
        });
        duplicateCount += 1;
        return;
      }
      if (seenSlugs.has(slug)) {
        results.push({
          row: idx + 1,
          slug,
          status: "duplicate",
          error: "slug_duplicate_in_upload",
        });
        duplicateCount += 1;
        return;
      }
      seenSlugs.add(slug);
      results.push({ row: idx + 1, slug, status: "ok" });
    });

    const successCount = results.filter((r) => r.status === "ok").length;

    if (dryRun) {
      return jsonResponse(
        true,
        "Dry-run preview complete.",
        {
          entityType,
          fileName,
          dryRun: true,
          totalRows: rows.length,
          successRows: successCount,
          duplicateRows: duplicateCount,
          errorRows: errorCount,
          results,
        },
      );
    }

    // Real import — create the job record first.
    const job = await db.higherStudyImportJob.create({
      data: {
        fileName,
        fileType: "csv",
        entityType,
        totalRows: rows.length,
        processedRows: 0,
        successRows: 0,
        errorRows: 0,
        status: "importing",
        dryRun: false,
        errors: null,
        startedAt: new Date(),
        createdBy: guard.session.userId,
      },
    });

    // Insert valid rows. Errors are recorded in the job.errors JSON column.
    const insertionErrors: Array<{ row: number; slug: string; error: string }> = [];
    let insertedCount = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const slug = safeString(row.slug as string);
      const result = results.find((r) => r.slug === slug && r.row === i + 1);
      if (!result || result.status !== "ok") continue;
      try {
        await insertRow(entityType, row);
        insertedCount += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "insert_failed";
        insertionErrors.push({
          row: i + 1,
          slug,
          error: msg.slice(0, 200),
        });
      }
    }

    await db.higherStudyImportJob.update({
      where: { id: job.id },
      data: {
        processedRows: rows.length,
        successRows: insertedCount,
        errorRows: insertionErrors.length,
        status: insertionErrors.length === 0 ? "completed" : "completed",
        errors: insertionErrors.length > 0 ? JSON.stringify(insertionErrors) : null,
        completedAt: new Date(),
      },
    });

    // Audit log
    const actor = resolveActor(req, guard.session.userId);
    await writeAuditLog({
      actorUserId: actor.userId,
      action: "import",
      entityType,
      entityId: job.id,
      afterData: {
        fileName,
        totalRows: rows.length,
        successRows: insertedCount,
        errorRows: insertionErrors.length,
      },
      ipHash: actor.ipHash,
      userAgent: actor.userAgent,
    });

    return jsonResponse(
      true,
      "Import completed.",
      {
        jobId: job.id,
        entityType,
        fileName,
        totalRows: rows.length,
        successRows: insertedCount,
        duplicateRows: duplicateCount,
        errorRows: insertionErrors.length,
        errors: insertionErrors,
      },
    );
  } catch (err) {
    console.error("[admin/import POST] error", err);
    return internalError();
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────

async function fetchExistingSlugs(
  entityType: string,
  slugs: string[],
): Promise<string[]> {
  switch (entityType) {
    case "university": {
      const rows = await db.higherStudyUniversity.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true },
      });
      return rows.map((r) => r.slug);
    }
    case "course": {
      const rows = await db.higherStudyCourse.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true },
      });
      return rows.map((r) => r.slug);
    }
    case "scholarship": {
      const rows = await db.higherStudyScholarship.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true },
      });
      return rows.map((r) => r.slug);
    }
    case "research": {
      const rows = await db.higherStudyResearchProject.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true },
      });
      return rows.map((r) => r.slug);
    }
    case "supervisor": {
      const rows = await db.higherStudySupervisor.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true },
      });
      return rows.map((r) => r.slug);
    }
    case "resource": {
      const rows = await db.higherStudyResource.findMany({
        where: { slug: { in: slugs } },
        select: { slug: true },
      });
      return rows.map((r) => r.slug);
    }
    default:
      return [];
  }
}

async function insertRow(
  entityType: string,
  row: Record<string, unknown>,
): Promise<void> {
  // Strip undefined fields + the slug duplicate-check fields.
  const data: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v !== undefined && v !== null && v !== "") data[k] = v;
  }

  switch (entityType) {
    case "university":
      await db.higherStudyUniversity.create({ data: data as never });
      break;
    case "course":
      await db.higherStudyCourse.create({ data: data as never });
      break;
    case "scholarship":
      await db.higherStudyScholarship.create({ data: data as never });
      break;
    case "research":
      await db.higherStudyResearchProject.create({ data: data as never });
      break;
    case "supervisor":
      await db.higherStudySupervisor.create({ data: data as never });
      break;
    case "resource":
      await db.higherStudyResource.create({ data: data as never });
      break;
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}
