import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

export const dynamic = "force-dynamic";

function ok(data: unknown, message = "OK", meta: Record<string, unknown> = {}) {
  return NextResponse.json({ success: true, message, data, meta, errors: [] });
}

/**
 * GET /api/v1/admin/dashboard
 *
 * Returns the full Command Center dataset (inquiries, opportunities,
 * AI tasks, meetings, contacts count, newsletter count, pending approvals,
 * recent audit logs, KPI summary, privacy-friendly analytics summary).
 *
 * Requires an authenticated session with `dashboard.view` permission.
 * Returns 401 if unauthenticated, 403 if the role lacks the permission.
 */
export async function GET(req: NextRequest) {
  const guard = await requirePermission(req, "dashboard.view");
  if (guard.denied) return guard.response;

  const [
    inquiries,
    opportunities,
    aiTasks,
    meetings,
    contactsCount,
    newslettersCount,
    pendingApprovalsCount,
    articlesPublishedCount,
    tasksDueCount,
    openOpportunitiesValue,
    recentAuditLogs,
    analyticsSummary,
  ] = await Promise.all([
    db.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { contact: { select: { fullName: true, organization: true } } },
    }),
    db.opportunity.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      include: { contact: { select: { fullName: true } } },
    }),
    db.aiTask.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { requester: { select: { name: true } } },
    }),
    db.meetingRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.contact.count(),
    db.newsletterSubscriber.count(),
    db.aiTask.count({ where: { status: "awaiting-approval" } }),
    db.article.count({ where: { status: "published" } }),
    db.task.count({
      where: {
        status: { in: ["open", "in-progress"] },
        dueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
    }),
    db.opportunity.aggregate({
      _sum: { value: true },
      where: { stage: { notIn: ["won", "lost", "archived"] } },
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { actor: { select: { name: true, email: true } } },
    }),
    computeAnalyticsSummary(),
  ]);

  return ok(
    {
      inquiries: inquiries.map((i) => ({
        id: i.id,
        type: i.type,
        status: i.status,
        reference: i.reference,
        createdAt: i.createdAt.toISOString(),
        contact: { fullName: i.contact.fullName, organization: i.contact.organization },
      })),
      opportunities: opportunities.map((o) => ({
        id: o.id,
        title: o.title,
        stage: o.stage,
        priority: o.priority,
        contact: { fullName: o.contact.fullName },
      })),
      aiTasks: aiTasks.map((t) => ({
        id: t.id,
        workflow: t.workflow,
        objective: t.objective,
        status: t.status,
        sensitivity: t.sensitivity,
        createdAt: t.createdAt.toISOString(),
        requesterName: t.requester?.name || null,
      })),
      meetings: meetings.map((m) => ({
        id: m.id,
        reference: m.reference,
        meetingType: m.meetingType,
        requestedDate: m.requestedDate.toISOString(),
        requestedTime: m.requestedTime,
        contactName: m.contactName,
        contactEmail: m.contactEmail,
        organization: m.organization,
        topic: m.topic,
        status: m.status,
        timezone: m.timezone,
        createdAt: m.createdAt.toISOString(),
      })),
      contacts: contactsCount,
      newsletters: newslettersCount,
      pendingApprovals: pendingApprovalsCount,
      auditLogs: recentAuditLogs.map((a) => ({
        id: a.id,
        action: a.action,
        resource: a.resource,
        resourceId: a.resourceId,
        actorName: a.actor?.name || "system",
        createdAt: a.createdAt.toISOString(),
        meta: a.meta,
      })),
      kpis: {
        inquiries: inquiries.length,
        opportunitiesValue: openOpportunitiesValue._sum.value || 0,
        tasksDue: tasksDueCount,
        articlesPublished: articlesPublishedCount,
        contacts: contactsCount,
        pendingApprovals: pendingApprovalsCount,
        newsletterSubscribers: newslettersCount,
      },
      session: {
        userId: guard.session.userId,
        email: guard.session.email,
        name: guard.session.name,
        role: guard.session.role,
        expiresAt: guard.session.expiresAt,
      },
      analytics: analyticsSummary,
    },
    "Dashboard data loaded."
  );
}

/**
 * Compute a 7-day privacy-friendly analytics summary.
 */
async function computeAnalyticsSummary() {
  const windowStartsAt = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    const [
      totalEvents,
      topEventTypesRaw,
      topUtmSourcesRaw,
      topPagesRaw,
      pageViewCount,
      inquirySubmittedCount,
      newsletterSignupCount,
      meetingRequestedCount,
    ] = await Promise.all([
      db.analyticsEvent.count({
        where: { createdAt: { gte: windowStartsAt } },
      }),
      db.analyticsEvent.groupBy({
        by: ["eventName"],
        where: { createdAt: { gte: windowStartsAt } },
        _count: { eventName: true },
        orderBy: { _count: { eventName: "desc" } },
        take: 5,
      }),
      db.analyticsEvent.groupBy({
        by: ["utmSource"],
        where: {
          createdAt: { gte: windowStartsAt },
          utmSource: { not: null },
        },
        _count: { utmSource: true },
        orderBy: { _count: { utmSource: "desc" } },
        take: 5,
      }),
      db.analyticsEvent.groupBy({
        by: ["page"],
        where: {
          createdAt: { gte: windowStartsAt },
          page: { not: null },
        },
        _count: { page: true },
        orderBy: { _count: { page: "desc" } },
        take: 5,
      }),
      db.analyticsEvent.count({
        where: { eventName: "page_view", createdAt: { gte: windowStartsAt } },
      }),
      db.analyticsEvent.count({
        where: { eventName: "inquiry_submitted", createdAt: { gte: windowStartsAt } },
      }),
      db.analyticsEvent.count({
        where: { eventName: "newsletter_signup", createdAt: { gte: windowStartsAt } },
      }),
      db.analyticsEvent.count({
        where: { eventName: "meeting_requested", createdAt: { gte: windowStartsAt } },
      }),
    ]);

    const topEventTypes = topEventTypesRaw.map((row) => ({
      eventName: row.eventName,
      count: row._count.eventName,
    }));
    const topUtmSources = topUtmSourcesRaw
      .filter((row) => row.utmSource && row.utmSource.trim().length > 0)
      .map((row) => ({ source: row.utmSource as string, count: row._count.utmSource }));
    const topPages = topPagesRaw
      .filter((row) => row.page && row.page.trim().length > 0)
      .map((row) => ({ page: row.page as string, count: row._count.page }));

    const safeRate = (num: number, denom: number): number =>
      denom === 0 ? 0 : Math.round((num / denom) * 10000) / 10000;

    return {
      totalEvents,
      windowDays: 7,
      windowStartsAt: windowStartsAt.toISOString(),
      topEventTypes,
      topUtmSources,
      topPages,
      funnel: {
        page_view: pageViewCount,
        inquiry_submitted: inquirySubmittedCount,
        newsletter_signup: newsletterSignupCount,
        meeting_requested: meetingRequestedCount,
        inquiry_rate: safeRate(inquirySubmittedCount, pageViewCount),
        newsletter_rate: safeRate(newsletterSignupCount, pageViewCount),
        meeting_rate: safeRate(meetingRequestedCount, pageViewCount),
      },
    };
  } catch {
    return {
      totalEvents: 0,
      windowDays: 7,
      windowStartsAt: windowStartsAt.toISOString(),
      topEventTypes: [],
      topUtmSources: [],
      topPages: [],
      funnel: {
        page_view: 0,
        inquiry_submitted: 0,
        newsletter_signup: 0,
        meeting_requested: 0,
        inquiry_rate: 0,
        newsletter_rate: 0,
        meeting_rate: 0,
      },
    };
  }
}
