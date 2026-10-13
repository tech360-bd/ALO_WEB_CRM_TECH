import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, pagination } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/audit-logs — filterable audit log */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "audit_logs.view");
  if (guard.denied) return guard.response;

  const url = new URL(req.url);
  const actorId = url.searchParams.get("actorId");
  const action = url.searchParams.get("action");
  const resource = url.searchParams.get("resource");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  const { skip, take, page, pageSize } = pagination(req);

  const where: Record<string, unknown> = {};
  if (actorId) where.actorId = actorId;
  if (action) where.action = { contains: action };
  if (resource) where.resource = resource;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
    if (endDate) (where.createdAt as Record<string, unknown>).lte = new Date(endDate);
  }

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { actor: { select: { id: true, name: true, email: true } } },
    }),
    db.auditLog.count({ where }),
  ]);

  return ok(items, "Audit logs loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}
