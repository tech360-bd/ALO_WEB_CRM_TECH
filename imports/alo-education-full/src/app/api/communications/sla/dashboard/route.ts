import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — SLA dashboard aggregates
export async function GET() {
  try {
    const [slaEvents, justifications, escalations, incidentCounters, topUnresolved] = await Promise.all([
      db.slaEvent.findMany({ orderBy: { receivedAt: "desc" } }),
      db.slaJustification.findMany({ orderBy: { createdAt: "desc" } }),
      db.escalationEvent.findMany({ orderBy: { createdAt: "desc" } }),
      db.slaIncidentCounter.findMany({ orderBy: { createdAt: "desc" } }),
      db.communicationMessage.findMany({
        where: { read: false, direction: "INBOUND" },
        orderBy: { receivedAt: "desc" },
        take: 10,
      }),
    ]);

    const totalAssigned = slaEvents.length;
    const responded = slaEvents.filter((e) => e.status === "RESPONDED" || e.firstResponseAt).length;
    const pending = slaEvents.filter((e) => e.status === "UNREAD" || e.status === "PENDING").length;
    const overdue = slaEvents.filter((e) => e.status === "ESCALATED_40" || e.status === "ESCALATED_50" || e.status === "MISSED").length;
    const slaCompliancePct = totalAssigned > 0 ? Math.round((responded / totalAssigned) * 100) : 100;

    // Average response time among events that have firstResponseAt
    const respondedEvents = slaEvents.filter((e) => e.firstResponseAt);
    let avgResponseTime = 0;
    if (respondedEvents.length > 0) {
      const totalMinutes = respondedEvents.reduce((acc, e) => {
        const diffMs = new Date(e.firstResponseAt!).getTime() - new Date(e.receivedAt).getTime();
        return acc + Math.max(0, Math.round(diffMs / 60000));
      }, 0);
      avgResponseTime = Math.round(totalMinutes / respondedEvents.length);
    }

    const pendingJustifications = justifications.filter((j) => j.status === "PENDING").length;
    const acceptedJustifications = justifications.filter((j) => j.status === "ACCEPTED").length;

    const openEscalations = escalations.filter((e) => e.status === "OPEN").length;
    const acknowledgedEscalations = escalations.filter((e) => e.status === "ACKNOWLEDGED").length;

    const totalBreaches = incidentCounters.reduce((acc, i) => acc + i.slaBreaches, 0);
    const totalValidExclusions = incidentCounters.reduce((acc, i) => acc + i.validExclusions, 0);

    return NextResponse.json({
      stats: {
        totalAssigned,
        responded,
        pending,
        overdue,
        slaCompliancePct,
        avgResponseTime,
        escalations: escalations.length,
        openEscalations,
        acknowledgedEscalations,
        justifications: {
          pending: pendingJustifications,
          accepted: acceptedJustifications,
          total: justifications.length,
        },
        incidentCounters: incidentCounters.length,
        totalBreaches,
        totalValidExclusions,
      },
      topUnresolvedConversations: topUnresolved,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch SLA dashboard" }, { status: 500 });
  }
}
