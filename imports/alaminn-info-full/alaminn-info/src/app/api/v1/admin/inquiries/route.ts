/**
 * Admin Inquiries API — list inquiries with filters + pagination.
 * RBAC: requires `inquiries.view` for GET, `inquiries.update` for PATCH.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, searchWhere, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/inquiries — list with search, status filter, type filter, pagination */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "inquiries.view");
  if (guard.denied) return guard.response;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || null;
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  const { skip, take, page, pageSize } = pagination(req);

  const where = {
    ...searchWhere(q, ["reference", "subject", "message", "currentChallenge", "desiredOutcome"]),
    ...(status && status !== "all" ? { status } : {}),
    ...(type && type !== "all" ? { type } : {}),
  };

  const [inquiries, total] = await Promise.all([
    db.inquiry.findMany({
      where,
      include: {
        contact: { select: { id: true, fullName: true, email: true, organization: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.inquiry.count({ where }),
  ]);

  return ok(
    {
      inquiries,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    },
    "Inquiries loaded."
  );
}

/** PUT /api/v1/admin/inquiries/[id] — update status / assignee / notes */
export async function PUT(req: NextRequest) {
  const guard = await requirePermission(req, "inquiries.update");
  if (guard.denied) return guard.response;

  const body = await readJson(req);
  if (!body?.id) return fail("Inquiry ID required.", ["id_required"], 400);

  const allowed = ["status", "assignedToId", "priority", "notes"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  try {
    const updated = await db.inquiry.update({
      where: { id: String(body.id) },
      data,
      include: { contact: { select: { fullName: true, email: true } } },
    });

    await writeAudit(guard.session, "inquiry.update", "inquiry", updated.id, {
      changes: Object.keys(data),
    });

    return ok({ inquiry: updated }, "Inquiry updated.");
  } catch (e) {
    console.error("[admin/inquiries PUT] error", e);
    return fail("Internal error.", ["server_error"], 500);
  }
}

/** PATCH /api/v1/admin/inquiries — alias for PUT (status / assignee / notes) */
export async function PATCH(req: NextRequest) {
  return PUT(req);
}
