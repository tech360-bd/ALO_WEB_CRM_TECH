import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET — list SLA incident counters (joined with User for counselor name)
export async function GET(req: NextRequest) {
  try {
    const counselorId = req.nextUrl.searchParams.get("counselorId");
    const period = req.nextUrl.searchParams.get("period");

    const where: any = {};
    if (counselorId) where.counselorId = counselorId;
    if (period) where.period = period;

    const incidents = await db.slaIncidentCounter.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Resolve counselor names via User lookup
    const counselorIds = Array.from(new Set(incidents.map((i) => i.counselorId)));
    const users = counselorIds.length > 0 ? await db.user.findMany({ where: { id: { in: counselorIds } }, select: { id: true, name: true, role: true } }) : [];
    const userMap = new Map(users.map((u) => [u.id, u]));

    const enriched = incidents.map((i) => ({
      ...i,
      counselor: userMap.get(i.counselorId) || null,
    }));
    return NextResponse.json({ incidents: enriched });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch incidents" }, { status: 500 });
  }
}

// POST — §152/§153: recompute a counselor's incident counter for a rolling
// period (idempotent) and issue the COUNSELOR PERFORMANCE WARNING exactly
// once when the configured threshold is reached. Exclusions honored:
// provider/system outage windows (ProviderErrorLog), holidays, approved
// (ACCEPTED) justifications, manager-excluded events.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, counselorId, period, threshold } = body;

    if (action !== "evaluate") {
      return NextResponse.json({ error: 'action must be "evaluate"' }, { status: 400 });
    }
    if (!counselorId || !period || !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json({ error: "counselorId and period (YYYY-MM) are required" }, { status: 400 });
    }

    const { evaluateIncidentPeriod, buildPerformanceWarning, SLA_INCIDENT_THRESHOLD_DEFAULT } =
      await import("@/lib/sla-incidents");
    const { HOLIDAYS_2026_BD } = await import("@/lib/sla-holiday");
    const periodStart = new Date(`${period}-01T00:00:00.000Z`);
    const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1);
    const holidayDates = HOLIDAYS_2026_BD.filter((d) => d.startsWith(period));

    // Period events (all counselors — evaluator filters + counts exclusions).
    const events = await db.slaEvent.findMany({
      where: { createdAt: { gte: periodStart, lt: periodEnd } },
    });

    // Outage windows from provider error logs within the period.
    const outageSources = await db.providerErrorLog.findMany({
      where: { createdAt: { gte: periodStart, lt: periodEnd } },
    });
    const outageWindows = outageSources.map((e) => ({
      outageFrom: e.createdAt,
      outageTo: e.resolvedAt || new Date(e.createdAt.getTime() + 60 * 60 * 1000),
    }));

    // ACCEPTED justifications map event ids to exclusion reasons.
    const acceptedJustifications = await db.slaJustification.findMany({
      where: { counselorId, period, status: "ACCEPTED" },
    });
    const byEventId = new Map<string, string>(
      acceptedJustifications
        .filter((j) => j.slaEventId)
        .map((j): [string, string] => [j.slaEventId as string, j.category]),
    );

    const evaluation = evaluateIncidentPeriod({
      counselorId,
      period,
      events: events.map((e) => ({
        id: e.id,
        threadId: e.threadId,
        counselorId: e.counselorId,
        channel: e.channel,
        eventType: e.eventType,
        resolvedAt: e.resolvedAt,
        resolution: e.resolution,
        createdAt: e.createdAt,
      })),
      outageWindows,
      assertedExclusions: { byEventId },
      threshold: typeof threshold === "number" && threshold > 0 ? threshold : SLA_INCIDENT_THRESHOLD_DEFAULT,
      holidayDates,
    });

    // Idempotent upsert of the counters.
    const existing = await db.slaIncidentCounter.findUnique({
      where: { counselorId_period: { counselorId, period } },
    });
    const counter = await db.slaIncidentCounter.upsert({
      where: { counselorId_period: { counselorId, period } },
      create: {
        counselorId,
        period,
        totalAssigned: evaluation.totalAssigned,
        requiredResponses: evaluation.requiredResponses,
        slaBreaches: evaluation.slaBreaches,
        validExclusions: Object.keys(evaluation.validExclusionsPerEvent).length,
        relatedMessageIds: JSON.stringify(evaluation.breachEventIds),
      },
      update: {
        totalAssigned: evaluation.totalAssigned,
        requiredResponses: evaluation.requiredResponses,
        slaBreaches: evaluation.slaBreaches,
        validExclusions: Object.keys(evaluation.validExclusionsPerEvent).length,
        relatedMessageIds: JSON.stringify(evaluation.breachEventIds),
      },
    });

    // Issue the warning exactly once.
    let warningIssuedNow = false;
    if (evaluation.warningRequired && !(existing?.warningIssued)) {
      const warning = buildPerformanceWarning(evaluation);
      await db.slaIncidentCounter.update({
        where: { counselorId_period: { counselorId, period } },
        data: { warningIssued: true, warningAt: new Date() },
      });
      await db.counselorTask.create({
        data: {
          employeeId: counselorId,
          title: warning.title,
          description: warning.description,
          type: "sla_justification_required",
          priority: "high",
          status: "pending",
          dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        },
      }).catch(() => {});
      // Notify supervisors (role-family recipients; user ids are resolved by
      // the portal notification fan-out of the recipient role).
      await db.portalNotification.create({
        data: {
          userId: counselorId,
          title: warning.title,
          message: warning.description,
          type: "sla_performance_warning",
          isRead: false,
          actionUrl: "/crm/communications/sla",
        },
      }).catch(() => {});
      const supervisors = await db.user.findMany({
        where: { role: { in: ["SUPER_ADMIN", "ADMIN", "BRANCH_MANAGER"] } },
        select: { id: true },
        take: 10,
      });
      for (const supervisor of supervisors) {
        await db.portalNotification.create({
          data: {
            userId: supervisor.id,
            title: warning.title,
            message: warning.description,
            type: "sla_performance_warning_supervisor",
            isRead: false,
            actionUrl: "/crm/communications/sla",
          },
        }).catch(() => {});
      }
      warningIssuedNow = true;
    }

    return NextResponse.json({
      evaluation,
      counter,
      warningPreviouslyIssued: Boolean(counter.warningIssued) && !warningIssuedNow,
      warningIssuedNow,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to evaluate SLA incidents" }, { status: 500 });
  }
}
