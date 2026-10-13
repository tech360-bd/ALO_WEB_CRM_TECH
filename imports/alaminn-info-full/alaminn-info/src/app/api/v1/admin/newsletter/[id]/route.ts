import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { ok, fail, writeAudit } from "@/lib/admin-api";

export const dynamic = "force-dynamic";

interface RouteCtx { params: Promise<{ id: string }> }

/**
 * GET /api/v1/admin/newsletter/[id]
 * Single-subscriber lookup. Requires `newsletter.view`.
 */
export async function GET(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "newsletter.view");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const item = await db.newsletterSubscriber.findUnique({ where: { id } });
  if (!item) return fail("Subscriber not found.", ["not_found"], 404);
  return ok(item);
}

/**
 * PUT /api/v1/admin/newsletter/[id]
 * Update a subscriber's status (e.g. subscribe / unsubscribe / mark confirmed)
 * or interest tag. Requires `newsletter.send`.
 */
export async function PUT(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "newsletter.send");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body) return fail("Invalid JSON body.");

  const { status, name, interest, consent } = body as Record<string, unknown>;
  try {
    const updated = await db.newsletterSubscriber.update({
      where: { id },
      data: {
        ...(typeof status === "string" ? { status } : {}),
        ...(typeof name === "string" ? { name: name || null } : {}),
        ...(typeof interest === "string" ? { interest } : {}),
        ...(typeof consent === "boolean" ? { consent } : {}),
      },
    });
    await writeAudit(guard.session, "newsletter.update", "NewsletterSubscriber", id, { fields: Object.keys(body as object) });
    return ok(updated, "Subscriber updated.");
  } catch (e) {
    return fail("Failed to update subscriber.", [(e as Error).message], 500);
  }
}

/**
 * DELETE /api/v1/admin/newsletter/[id]
 * Permanently delete a subscriber. Requires `newsletter.send`.
 */
export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const guard = await requirePermission(req, "newsletter.send");
  if (guard.denied) return guard.response;
  const { id } = await ctx.params;
  try {
    await db.newsletterSubscriber.delete({ where: { id } });
    await writeAudit(guard.session, "newsletter.delete", "NewsletterSubscriber", id);
    return NextResponse.json({ success: true, message: "Subscriber deleted.", data: null, meta: {}, errors: [] });
  } catch (e) {
    return fail("Failed to delete subscriber.", [(e as Error).message], 500);
  }
}
