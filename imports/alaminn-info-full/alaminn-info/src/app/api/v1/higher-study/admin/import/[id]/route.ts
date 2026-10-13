/**
 * GET /api/v1/higher-study/admin/import/[id]
 * --------------------------------------------------------------------
 * Returns the status of a HigherStudyImportJob by ID, including the
 * parsed errors JSON (if any).
 *
 * Permission: `higher-study.import`
 */
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { jsonResponse, safeString } from "@/lib/higher-study/api-helpers";
import { notFoundError, internalError } from "@/lib/higher-study/admin-helpers";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requirePermission(req, "higher-study.import");
  if (guard.denied) return guard.response;

  try {
    const { id } = await params;
    const cleanId = safeString(id);
    if (!cleanId) {
      return jsonResponse(false, "ID is required.", null, {}, ["id_required"], 400);
    }

    const job = await db.higherStudyImportJob.findUnique({
      where: { id: cleanId },
    });

    if (!job) return notFoundError();

    // Parse the errors JSON for convenience.
    let errors: unknown[] = [];
    if (job.errors) {
      try {
        errors = JSON.parse(job.errors) as unknown[];
      } catch {
        errors = [];
      }
    }

    return jsonResponse(true, "Import job retrieved.", {
      ...job,
      errors,
    });
  } catch (err) {
    console.error("[admin/import/[id] GET] error", err);
    return internalError();
  }
}
