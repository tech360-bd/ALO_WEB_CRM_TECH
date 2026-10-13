import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, searchWhere, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/companies — list organizations */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "contacts.view");
  if (guard.denied) return guard.response;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || null;
  const status = url.searchParams.get("status");
  const { skip, take, page, pageSize } = pagination(req);
  const where = {
    ...searchWhere(q, ["name", "country", "website"]),
    ...(status && status !== "all" ? { status } : {}),
  };
  const [items, total] = await Promise.all([
    db.organization.findMany({ where, orderBy: { createdAt: "desc" }, skip, take, include: { _count: { select: { partnerships: true } } } }),
    db.organization.count({ where }),
  ]);
  return ok(items, "Companies loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

/** POST /api/v1/admin/companies — create organization */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "contacts.create");
  if (guard.denied) return guard.response;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const { name, type, country, website, status } = body as Record<string, string>;
  if (!name) return fail("name is required.", ["missing_fields"]);
  try {
    const org = await db.organization.create({
      data: {
        name,
        type: type || null,
        country: country || null,
        website: website || null,
        status: status || "active",
      },
    });
    await writeAudit(guard.session, "organization.create", "Organization", org.id, { name });
    return ok(org, "Organization created.", {}, 201);
  } catch (e) {
    return fail("Failed to create organization.", [(e as Error).message], 500);
  }
}
