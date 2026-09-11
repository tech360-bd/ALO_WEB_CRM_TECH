import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  getContentOpportunities,
  identifyContentOpportunity,
  collectContentSignals,
} from "@/lib/brains/content-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/brains/content/opportunities — list with optional filters.
// ?collect=true — also runs collectContentSignals() and returns detected signals.
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const collect = sp.get("collect") === "true";

    const filters = {
      status: sp.get("status") || undefined,
      priority: sp.get("priority") || undefined,
      country: sp.get("country") || undefined,
      universitySlug: sp.get("universitySlug") || undefined,
      courseSlug: sp.get("courseSlug") || undefined,
      limit: sp.get("limit") ? parseInt(sp.get("limit")!) : undefined,
      offset: sp.get("offset") ? parseInt(sp.get("offset")!) : undefined,
    };

    const [opportunities, signals] = await Promise.all([
      getContentOpportunities(filters),
      collect ? collectContentSignals() : Promise.resolve(null),
    ]);

    return NextResponse.json({
      ...opportunities,
      ...(signals ? { detectedSignals: signals } : {}),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/brains/content/opportunities — create from a signal payload.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "MARKETING_MANAGER" && role !== "MARKETING") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const opportunity = await identifyContentOpportunity(body);
    return NextResponse.json({ success: true, opportunity });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
