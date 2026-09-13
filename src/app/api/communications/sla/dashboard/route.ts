import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Aggregate the canonical SLA and communication records for operations dashboards. */
export async function GET() {
  try {
    const [slaEvents, justifications, escalations, incidentCounters, topUnresolved] = await Promise.all([
      db.slaEvent.findMany({ orderBy: { createdAt: "desc" } }),
      db.slaJustification.findMany({ orderBy: { createdAt: "desc" } }),
      db.escalationEvent.findMany({ orderBy: { createdAt: "desc" } }),
      db.slaIncidentCounter.findMany({ orderBy: { createdAt: "desc" } }),
      db.communicationMessage.findMany({
        where: { isRead: false, direction: "INBOUND" },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    const totalAssigned = slaEvents.length;
    const responded = slaEvents.filter((event) => Boolean(event.responseAt)).length;
    const pending = slaEvents.filter((event) => !event.responseAt && !event.resolvedAt).length;
    const overdue = slaEvents.filter((event) => event.eventType.toUpperCase().includes("ESCALAT") || event.eventType.toUpperCase().includes("MISSED")).length;
    const slaCompliancePct = totalAssigned > 0 ? Math.round((responded / totalAssigned) * 100) : 100;
    const respondedEvents = slaEvents.filter((event) => event.responseAt);
    const avgResponseTime = respondedEvents.length === 0 ? 0 : Math.round(respondedEvents.reduce((total, event) => total + Math.max(0, event.responseAt!.getTime() - event.firstMessageAt.getTime()) / 60000, 0) / respondedEvents.length);

    const totalBreaches = incidentCounters.reduce((total, counter) => total + counter.slaBreaches, 0);
    const totalValidExclusions = incidentCounters.reduce((total, counter) => total + counter.validExclusions, 0);
    return NextResponse.json({
      stats: {
        totalAssigned, responded, pending, overdue, slaCompliancePct, avgResponseTime,
        escalations: escalations.length,
        openEscalations: escalations.filter((event) => event.status === "OPEN").length,
        acknowledgedEscalations: escalations.filter((event) => event.status === "ACKNOWLEDGED").length,
        justifications: {
          pending: justifications.filter((item) => item.status === "PENDING").length,
          accepted: justifications.filter((item) => item.status === "ACCEPTED").length,
          total: justifications.length,
        },
        incidentCounters: incidentCounters.length,
        totalBreaches,
        totalValidExclusions,
      },
      topUnresolvedConversations: topUnresolved,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to fetch SLA dashboard" }, { status: 500 });
  }
}
