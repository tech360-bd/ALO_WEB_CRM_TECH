/**
 * GET /api/v1/higher-study/admin/audit-logs
 * --------------------------------------------------------------------
 * Paginated list of HigherStudyAuditLog entries.
 *
 * Query: ?entityType&entityId&action&actorUserId&page&limit
 *
 * Permission: `higher-study.audit.view`
 */
import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import {
  jsonResponse,
  parsePaginationParams,
  paginationSkipTake,
  buildPaginationMeta,
  safeString,
} from "@/lib/higher-study/api-helpers";
import { internalError } from "@/lib/higher-study/admin-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "higher-study.audit.view");
  if (guard.denied) return guard.response;

  try {
    const url = new URL(req.url);
    const params = parsePaginationParams(req);
    const { skip, take } = paginationSkipTake(params);

    const entityType = safeString(url.searchParams.get("entityType"));
    const entityId = safeString(url.searchParams.get("entityId"));
    const action = safeString(url.searchParams.get("action"));
    const actorUserId = safeString(url.searchParams.get("actorUserId"));

    const where: Prisma.HigherStudyAuditLogWhereInput = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (action) where.action = action;
    if (actorUserId) where.actorUserId = actorUserId;

    const [items, total] = await Promise.all([
      db.higherStudyAuditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      db.higherStudyAuditLog.count({ where }),
    ]);

    return jsonResponse(
      true,
      "Audit logs retrieved.",
      { items },
      { pagination: buildPaginationMeta(params, total) },
    );
  } catch (err) {
    console.error("[admin/audit-logs GET] error", err);
    return internalError();
  }
}
