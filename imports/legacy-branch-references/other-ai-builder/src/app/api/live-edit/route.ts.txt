import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/live-edit
// PUBLIC — lists active LiveEditOverride rows.
// Query params: pageRoute?, previewOnly?
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const where: any = { status: "ACTIVE" };
    if (sp.get("pageRoute")) where.pageRoute = sp.get("pageRoute");
    if (sp.get("previewOnly") === "true") where.previewOnly = true;

    const overrides = await db.liveEditOverride.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    return NextResponse.json({ overrides });
  } catch (err: any) {
    console.error("[live-edit GET] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load overrides" }, { status: 500 });
  }
}

// POST /api/live-edit
// Create a new LiveEditOverride. Auth: admin only.
// Body: { pageRoute, selector, selectorIndex?, attribute?, originalValue?, newValue, previewOnly?, notes? }
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = (session.user as any).role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.pageRoute || !body?.selector || !body?.newValue) {
      return NextResponse.json(
        { error: "pageRoute, selector, newValue are required" },
        { status: 400 }
      );
    }

    const override = await db.liveEditOverride.create({
      data: {
        pageRoute: String(body.pageRoute),
        selector: String(body.selector),
        selectorIndex: Number(body.selectorIndex) || 0,
        attribute: body.attribute || "textContent",
        originalValue: body.originalValue ?? null,
        newValue: String(body.newValue),
        editedBy: (session.user as any).id || "ADMIN",
        status: "ACTIVE",
        previewOnly: body.previewOnly === true,
        notes: body.notes ?? null,
      },
    });
    return NextResponse.json({ override }, { status: 201 });
  } catch (err: any) {
    console.error("[live-edit POST] error", err);
    return NextResponse.json({ error: err?.message || "Failed to create override" }, { status: 500 });
  }
}
