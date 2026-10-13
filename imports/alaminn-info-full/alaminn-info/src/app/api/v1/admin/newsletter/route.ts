import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, searchWhere, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/newsletter
 * ---------------------------
 * Paginated list of newsletter subscribers. Searchable by email/name and
 * filterable by status. Requires the `newsletter.view` permission.
 */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "newsletter.view");
  if (guard.denied) return guard.response;

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || null;
  const status = url.searchParams.get("status");
  const interest = url.searchParams.get("interest");
  const { skip, take, page, pageSize } = pagination(req);

  const where = {
    ...searchWhere(q, ["email", "name"]),
    ...(status && status !== "all" ? { status } : {}),
    ...(interest && interest !== "all" ? { interest } : {}),
  };

  const [items, total] = await Promise.all([
    db.newsletterSubscriber.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.newsletterSubscriber.count({ where }),
  ]);

  return ok(items, "Newsletter subscribers loaded.", {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

/**
 * POST /api/v1/admin/newsletter
 * -----------------------------
 * Create a subscriber manually (e.g. imported from an external CSV).
 * Requires the `newsletter.send` permission (treats manual addition like
 * a send operation because it adds someone to the broadcast audience).
 */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "newsletter.send");
  if (guard.denied) return guard.response;

  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid JSON body.");

  const { email, name, interest, status, consent } = body as Record<string, unknown>;
  const cleanEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!cleanEmail) return fail("email is required.", ["missing_email"]);

  const existing = await db.newsletterSubscriber.findUnique({ where: { email: cleanEmail } });
  if (existing) return fail("A subscriber with that email already exists.", ["duplicate_email"], 409);

  try {
    const sub = await db.newsletterSubscriber.create({
      data: {
        email: cleanEmail,
        name: typeof name === "string" && name.trim() ? name.trim() : null,
        interest: typeof interest === "string" ? interest : null,
        status: typeof status === "string" ? status : "pending",
        consent: typeof consent === "boolean" ? consent : false,
      },
    });
    await writeAudit(guard.session, "newsletter.create", "NewsletterSubscriber", sub.id, { email: cleanEmail });
    return ok(sub, "Subscriber created.", {}, 201);
  } catch (e) {
    return fail("Failed to create subscriber.", [(e as Error).message], 500);
  }
}
