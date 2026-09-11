import { NextRequest, NextResponse } from "next/server";
import { queryEvents } from "@/lib/event-bus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/event-bus/events — query events with filters.
// Query params: eventType, aggregateType, aggregateId, studentId, leadId, actorType, actorId, agentId, correlationId, since, until, limit, offset
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const events = await queryEvents({
      eventType: sp.get("eventType") || undefined,
      aggregateType: sp.get("aggregateType") || undefined,
      aggregateId: sp.get("aggregateId") || undefined,
      studentId: sp.get("studentId") || undefined,
      leadId: sp.get("leadId") || undefined,
      actorType: (sp.get("actorType") as any) || undefined,
      actorId: sp.get("actorId") || undefined,
      agentId: sp.get("agentId") || undefined,
      correlationId: sp.get("correlationId") || undefined,
      since: sp.get("since") ? new Date(sp.get("since")!) : undefined,
      until: sp.get("until") ? new Date(sp.get("until")!) : undefined,
      limit: sp.get("limit") ? parseInt(sp.get("limit")!) : undefined,
      offset: sp.get("offset") ? parseInt(sp.get("offset")!) : undefined,
    });
    return NextResponse.json({ events, count: events.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
