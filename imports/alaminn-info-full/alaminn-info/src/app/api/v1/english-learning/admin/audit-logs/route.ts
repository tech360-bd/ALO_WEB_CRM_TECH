/**
 * GET /api/v1/english-learning/admin/audit-logs
 * --------------------------------------------------------------------
 * Paginated list of English Learning audit logs, newest first.
 *
 * Query params:
 *  - actorUserId — filter by actor
 *  - action      — filter by action (create / update / delete / publish ...)
 *  - entityType  — filter by entity type
 *  - entityId    — filter by entity ID
 *  - page, limit
 *
 * Permission: `english-learning.audit.view`.
 */
import type { NextRequest } from "next/server";
import { requirePermission } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  jsonResponse,
  parsePaginationParams,
  paginationSkipTake,
  buildPaginationMeta,
  safeString,
} from "@/lib/english-learning/api-helpers";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "english-learning.audit.view");
  if (guard.denied) return guard.response;

  try {
    const url = new URL(req.url);
    const params = parsePaginationParams(req);
    const { skip, take } = paginationSkipTake(params);

    const actorUserId = safeString(url.searchParams.get("actorUserId"));
    const action = safeString(url.searchParams.get("action"));
    const entityType = safeString(url.searchParams.get("entityType"));
    const entityId = safeString(url.searchParams.get("entityId"));

    const where: Record<string, unknown> = {};
    if (actorUserId) where.actorUserId = actorUserId;
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    const [items, total] = await Promise.all([
      db.englishLearningAuditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      db.englishLearningAuditLog.count({ where }),
    ]);

    return jsonResponse(
      true,
      "Audit logs retrieved.",
      { items },
      { pagination: buildPaginationMeta(params, total) },
    );
  } catch (err) {
    console.error("[english-learning/admin/audit-logs] error", err);
    return jsonResponse(
      false,
      "Internal server error.",
      null,
      {},
      ["internal"],
      500,
    );
  }
}
