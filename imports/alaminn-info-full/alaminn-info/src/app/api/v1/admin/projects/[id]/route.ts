import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface RouteCtx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "projects.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const item = await db.project.findUnique({ where: { id } });
  if (!item) return fail("Project not found.", ["not_found"], 404);
  return ok(item);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "projects.update");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  try {
    const updated = await db.project.update({
      where: { id },
      data: {
        ...(b.name !== undefined ? { name: String(b.name) } : {}),
        ...(b.subtitle !== undefined ? { subtitle: b.subtitle ? String(b.subtitle) : null } : {}),
        ...(b.category !== undefined ? { category: String(b.category) } : {}),
        ...(b.shortDescription !== undefined ? { shortDescription: String(b.shortDescription) } : {}),
        ...(b.fullDescription !== undefined ? { fullDescription: String(b.fullDescription) } : {}),
        ...(b.status !== undefined ? { status: String(b.status) } : {}),
        ...(b.featured !== undefined ? { featured: b.featured === true } : {}),
        ...(b.visibility !== undefined ? { visibility: String(b.visibility) } : {}),
        ...(b.technologies !== undefined ? { technologies: b.technologies ? String(b.technologies) : null } : {}),
      },
    });
    await writeAudit(guard.session, "project.update", "Project", id);
    return ok(updated, "Project updated.");
  } catch (e) {
    return fail("Failed to update project.", [(e as Error).message], 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "projects.delete");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.project.delete({ where: { id } });
    await writeAudit(guard.session, "project.delete", "Project", id);
    return NextResponse.json({ success: true, message: "Project deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete project.", [(e as Error).message], 500);
  }
}
