/**
 * Admin Opportunities API — list + create.
 * RBAC: requires `contacts.view` for GET, `contacts.create` for POST.
 */
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, searchWhere, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/opportunities — list with search, stage, priority filter, pagination */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "contacts.view");
  if (guard.denied) return guard.response;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || null;
  const stage = url.searchParams.get("stage");
  const priority = url.searchParams.get("priority");
  const { skip, take, page, pageSize } = pagination(req);

  const where = {
    ...searchWhere(q, ["title"]),
    ...(stage && stage !== "all" ? { stage } : {}),
    ...(priority && priority !== "all" ? { priority } : {}),
  };

  const [opportunities, total] = await Promise.all([
    db.opportunity.findMany({
      where,
      include: {
        contact: { select: { id: true, fullName: true, email: true, organization: true } },
        inquiry: { select: { id: true, reference: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.opportunity.count({ where }),
  ]);

  return ok(
    {
      opportunities,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    },
    "Opportunities loaded."
  );
}

/** POST /api/v1/admin/opportunities — create new opportunity */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "contacts.create");
  if (guard.denied) return guard.response;

  const body = await readJson(req);
  if (!body) return fail("Request body required.", ["body_required"], 400);
  if (!body.contactId || !body.title) {
    return fail("contactId and title required.", ["fields_required"], 422);
  }

  try {
    const created = await db.opportunity.create({
      data: {
        contactId: String(body.contactId),
        inquiryId: body.inquiryId ? String(body.inquiryId) : undefined,
        title: String(body.title).trim(),
        value: body.value ? Number(body.value) : undefined,
        currency: body.currency ? String(body.currency) : "USD",
        stage: body.stage ? String(body.stage) : "new",
        priority: body.priority ? String(body.priority) : "medium",
        closeDate: body.closeDate ? new Date(String(body.closeDate)) : undefined,
      },
      include: { contact: { select: { fullName: true, email: true } } },
    });

    await writeAudit(guard.session, "opportunity.create", "opportunity", created.id, {
      title: created.title,
      contactId: created.contactId,
    });

    return ok({ opportunity: created }, "Opportunity created.");
  } catch (e) {
    console.error("[admin/opportunities POST] error", e);
    return fail("Internal error.", ["server_error"], 500);
  }
}

/** PUT /api/v1/admin/opportunities — update existing opportunity (body must include id) */
export async function PUT(req: NextRequest) {
  const guard = await requirePermission(req, "contacts.update");
  if (guard.denied) return guard.response;

  const body = await readJson(req);
  if (!body?.id) return fail("Opportunity ID required.", ["id_required"], 400);

  const allowed = ["title", "value", "currency", "stage", "priority", "closeDate", "contactId", "inquiryId"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] === undefined) continue;
    if (key === "value") data.value = body.value ? Number(body.value) : undefined;
    else if (key === "closeDate") data.closeDate = body.closeDate ? new Date(String(body.closeDate)) : undefined;
    else if (key === "inquiryId") data.inquiryId = body.inquiryId ? String(body.inquiryId) : null;
    else data[key] = String(body[key]);
  }

  try {
    const updated = await db.opportunity.update({
      where: { id: String(body.id) },
      data,
      include: { contact: { select: { fullName: true, email: true } } },
    });

    await writeAudit(guard.session, "opportunity.update", "opportunity", updated.id, {
      changes: Object.keys(data),
    });

    return ok({ opportunity: updated }, "Opportunity updated.");
  } catch (e) {
    console.error("[admin/opportunities PUT] error", e);
    return fail("Internal error.", ["server_error"], 500);
  }
}
