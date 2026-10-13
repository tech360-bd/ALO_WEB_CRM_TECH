import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, searchWhere, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "case_studies.view");
  if (guard.denied) return guard.response;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || null;
  const category = url.searchParams.get("category");
  const { skip, take, page, pageSize } = pagination(req);
  const where = {
    ...searchWhere(q, ["title", "slug"]),
    ...(category && category !== "all" ? { category } : {}),
  };
  const [items, total] = await Promise.all([
    db.caseStudy.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.caseStudy.count({ where }),
  ]);
  return ok(items, "Case studies loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "case_studies.create");
  if (guard.denied) return guard.response;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  if (!b.title || !b.slug || !b.category) return fail("title, slug, category are required.", ["missing_fields"]);
  try {
    const cs = await db.caseStudy.create({
      data: {
        slug: String(b.slug),
        title: String(b.title),
        category: String(b.category),
        context: b.context ? String(b.context) : "",
        challenge: b.challenge ? String(b.challenge) : "",
        role: b.role ? String(b.role) : "",
        intervention: b.intervention ? String(b.intervention) : "",
        systemBuilt: b.systemBuilt ? String(b.systemBuilt) : "",
        outcome: b.outcome ? String(b.outcome) : "",
        featured: b.featured === true,
        readTime: b.readTime ? Number(b.readTime) : 8,
      },
    });
    await writeAudit(guard.session, "case_study.create", "CaseStudy", cs.id, { slug: cs.slug });
    return ok(cs, "Case study created.", {}, 201);
  } catch (e) {
    return fail("Failed to create case study.", [(e as Error).message], 500);
  }
}
