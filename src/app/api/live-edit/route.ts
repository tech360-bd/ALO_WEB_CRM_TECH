import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/live-edit — PUBLIC. Returns ACTIVE overrides.
// Query: ?route=/uk/universities/oxford
export async function GET(req: NextRequest) {
  try {
    const route = req.nextUrl.searchParams.get("route");
    const where: Record<string, unknown> = { status: "ACTIVE" };
    if (route) where.pageRoute = route;

    const overrides = await db.liveEditOverride.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ overrides, count: overrides.length, route: route || null });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/live-edit — SUPER_ADMIN/ADMIN only. Create a new override.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const {
      pageRoute,
      selector,
      selectorIndex,
      attribute,
      originalValue,
      newValue,
      previewOnly,
      notes,
    } = body;

    if (!pageRoute || !selector || !newValue) {
      return NextResponse.json(
        { error: "pageRoute, selector, and newValue are required" },
        { status: 400 }
      );
    }

    // Capture originalValue automatically if not provided
    let original = originalValue;
    if (original === undefined) {
      const existing = await db.liveEditOverride.findFirst({
        where: { pageRoute, selector, selectorIndex: selectorIndex || 0, status: "ACTIVE" },
      });
      original = existing?.newValue || null;
    }

    const override = await db.liveEditOverride.create({
      data: {
        pageRoute,
        selector,
        selectorIndex: selectorIndex || 0,
        attribute: attribute || "textContent",
        originalValue: original || null,
        newValue,
        editedBy: (session.user as any).id,
        status: "ACTIVE",
        previewOnly: previewOnly || false,
        notes: notes || null,
      },
    });

    await db.auditLog
      .create({
        data: {
          userId: (session.user as any).id,
          action: "LIVE_EDIT_CREATE",
          resource: "LiveEditOverride",
          resourceId: override.id,
          details: JSON.stringify({ pageRoute, selector, attribute, previewOnly }),
        },
      })
      .catch(() => {});

    return NextResponse.json({ success: true, override });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
