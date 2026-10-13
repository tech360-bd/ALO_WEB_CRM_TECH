import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, searchWhere, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/contacts — list with search, status filter, pagination */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "contacts.view");
  if (guard.denied) return guard.response;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || null;
  const status = url.searchParams.get("status");
  const { skip, take, page, pageSize } = pagination(req);

  const where = {
    ...searchWhere(q, ["fullName", "email", "organization", "phone"]),
    ...(status && status !== "all" ? { status } : {}),
  };

  const [items, total] = await Promise.all([
    db.contact.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.contact.count({ where }),
  ]);

  return ok(items, "Contacts loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

/** POST /api/v1/admin/contacts — create */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "contacts.create");
  if (guard.denied) return guard.response;

  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");

  const { fullName, email, phone, organization, role, country, status, tags } = body as Record<string, string>;
  if (!fullName || !email) return fail("fullName and email are required.", ["missing_fields"]);

  const existing = await db.contact.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return fail("A contact with that email already exists.", ["duplicate_email"], 409);

  try {
    const contact = await db.contact.create({
      data: {
        fullName,
        email: email.toLowerCase(),
        phone: phone || null,
        organization: organization || null,
        role: role || null,
        country: country || null,
        status: status || "active",
        tags: tags || null,
      },
    });
    await writeAudit(guard.session, "contact.create", "Contact", contact.id, { email });
    return ok(contact, "Contact created.", {}, 201);
  } catch (e) {
    return fail("Failed to create contact.", [(e as Error).message], 500);
  }
}
