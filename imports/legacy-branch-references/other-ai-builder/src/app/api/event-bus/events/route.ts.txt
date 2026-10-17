import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/event-bus/events
// Returns recent event-bus events.
// Auth: any logged-in user.
// Query params: type?, targetType?, targetId?, actor?, since?, limit?
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sp = req.nextUrl.searchParams;
    const filters: any = {
      type: sp.get("type") || undefined,
      targetType: sp.get("targetType") || undefined,
      targetId: sp.get("targetId") || undefined,
      actor: sp.get("actor") || undefined,
      since: sp.get("since") ? new Date(sp.get("since")!) : undefined,
      limit: sp.get("limit") ? parseInt(sp.get("limit")!, 10) : undefined,
    };

    const { getRecentEvents } = await import("@/lib/event-bus");
    const events = await getRecentEvents(filters);
    return NextResponse.json({ events });
  } catch (err: any) {
    console.error("[event-bus/events] error", err);
    return NextResponse.json({ error: err?.message || "Failed to load events" }, { status: 500 });
  }
}
