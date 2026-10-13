import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, readJson, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface RouteCtx { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "case_studies.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const item = await db.caseStudy.findUnique({ where: { id } });
  if (!item) return fail("Case study not found.", ["not_found"], 404);
  return ok(item);
}

export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "case_studies.update");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const body = await readJson(req);
  if (!body) return fail("Invalid JSON body.");
  const b = body as Record<string, unknown>;
  try {
    const updated = await db.caseStudy.update({
      where: { id },
      data: {
        ...(b.title !== undefined ? { title: String(b.title) } : {}),
        ...(b.category !== undefined ? { category: String(b.category) } : {}),
        ...(b.context !== undefined ? { context: String(b.context) } : {}),
        ...(b.challenge !== undefined ? { challenge: String(b.challenge) } : {}),
        ...(b.role !== undefined ? { role: String(b.role) } : {}),
        ...(b.intervention !== undefined ? { intervention: String(b.intervention) } : {}),
        ...(b.systemBuilt !== undefined ? { systemBuilt: String(b.systemBuilt) } : {}),
        ...(b.outcome !== undefined ? { outcome: String(b.outcome) } : {}),
        ...(b.featured !== undefined ? { featured: b.featured === true } : {}),
      },
    });
    await writeAudit(guard.session, "case_study.update", "CaseStudy", id);
    return ok(updated, "Case study updated.");
  } catch (e) {
    return fail("Failed to update case study.", [(e as Error).message], 500);
  }
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "case_studies.delete");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.caseStudy.delete({ where: { id } });
    await writeAudit(guard.session, "case_study.delete", "CaseStudy", id);
    return NextResponse.json({ success: true, message: "Case study deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete case study.", [(e as Error).message], 500);
  }
}
