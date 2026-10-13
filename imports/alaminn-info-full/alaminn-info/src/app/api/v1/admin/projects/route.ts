import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, pagination, searchWhere, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/projects — list projects */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "projects.view");
  if (guard.denied) return guard.response;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() || null;
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");
  const { skip, take, page, pageSize } = pagination(req);
  const where = {
    ...searchWhere(q, ["name", "slug", "shortDescription"]),
    ...(category && category !== "all" ? { category } : {}),
    ...(status && status !== "all" ? { status } : {}),
  };
  const [items, total] = await Promise.all([
    db.project.findMany({ where, orderBy: { createdAt: "desc" }, skip, take }),
    db.project.count({ where }),
  ]);
  return ok(items, "Projects loaded.", { total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
}

/** POST /api/v1/admin/projects — create project */
export async function POST(req: NextRequest) {
  const guard = await requirePermission(req, "projects.create");
  if (guard.denied) return guard.response;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  if (!b.name || !b.slug || !b.category || !b.shortDescription) {
    return fail("name, slug, category, shortDescription are required.", ["missing_fields"]);
  }
  try {
    const project = await db.project.create({
      data: {
        slug: String(b.slug),
        name: String(b.name),
        subtitle: b.subtitle ? String(b.subtitle) : null,
        category: String(b.category),
        shortDescription: String(b.shortDescription),
        fullDescription: b.fullDescription ? String(b.fullDescription) : "",
        status: b.status ? String(b.status) : "planned",
        featured: b.featured === true,
        visibility: b.visibility ? String(b.visibility) : "public",
        technologies: b.technologies ? String(b.technologies) : null,
      },
    });
    await writeAudit(guard.session, "project.create", "Project", project.id, { slug: project.slug });
    return ok(project, "Project created.", {}, 201);
  } catch (e) {
    return fail("Failed to create project.", [(e as Error).message], 500);
  }
}
