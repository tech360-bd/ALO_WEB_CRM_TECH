import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — unified analytics across all marketing channels + CRM pipeline
export const GET = withAuth(async (_req: Request, _auth: AuthContext) => {
  const [
    inboxMessages,
    campaignPosts,
    marketingLeads,
    outreachRecords,
    calendarItems,
    triggers,
    workflows,
    auditLogs,
  ] = await Promise.all([
    db.socialInboxMessage.findMany({ take: 500, orderBy: { receivedAt: "desc" } }).catch(() => []),
    db.campaignPost.findMany({}).catch(() => []),
    db.marketingLead.findMany({ take: 1000 }).catch(() => []),
    db.leadOutreach.findMany({ take: 500 }).catch(() => []),
    db.marketingCalendar.findMany({ take: 500 }).catch(() => []),
    db.keywordTrigger.findMany({}).catch(() => []),
    db.n8nWorkflow.findMany({}).catch(() => []),
    db.auditLog.findMany({ take: 100, orderBy: { createdAt: "desc" } }).catch(() => []),
  ]);

  // Inbox analytics
  const inboxByPlatform: Record<string, number> = {};
  let inboxUnread = 0, inboxAiHandled = 0, inboxInbound = 0;
  for (const m of inboxMessages) {
    inboxByPlatform[m.platform] = (inboxByPlatform[m.platform] || 0) + 1;
    if (!m.isRead && m.direction === "INBOUND") inboxUnread++;
    if (m.aiHandled) inboxAiHandled++;
    if (m.direction === "INBOUND") inboxInbound++;
  }
  // SLA overdue (20 min warn, 40 breached) — based on last inbound per conversation
  const convLast: Record<string, Date> = {};
  for (const m of inboxMessages) {
    if (m.direction !== "INBOUND") continue;
    const key = m.conversationId || `${m.platform}-${m.senderId}`;
    const d = new Date(m.receivedAt);
    if (!convLast[key] || d > convLast[key]) convLast[key] = d;
  }
  let slaWarn = 0, slaBreached = 0;
  const now = Date.now();
  for (const d of Object.values(convLast)) {
    const mins = (now - d.getTime()) / 60000;
    if (mins > 40) slaBreached++;
    else if (mins > 20) slaWarn++;
  }

  // Posts analytics
  const postsByStatus: Record<string, number> = {};
  const postsByPlatform: Record<string, number> = {};
  const postsByCategory: Record<string, number> = {};
  let brandApplied = 0;
  for (const p of campaignPosts) {
    postsByStatus[p.approvalStatus] = (postsByStatus[p.approvalStatus] || 0) + 1;
    postsByPlatform[p.platform] = (postsByPlatform[p.platform] || 0) + 1;
    postsByCategory[p.category] = (postsByCategory[p.category] || 0) + 1;
    if (p.brandAssetApplied) brandApplied++;
  }

  // Leads pipeline
  const leadsByStatus: Record<string, number> = {};
  const leadsBySource: Record<string, number> = {};
  let hotLeads = 0, counselorAssigned = 0, followUpOverdue = 0;
  for (const l of marketingLeads) {
    leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1;
    leadsBySource[l.source || "UNKNOWN"] = (leadsBySource[l.source || "UNKNOWN"] || 0) + 1;
    if (l.hotLead) hotLeads++;
    if (l.counselorId) counselorAssigned++;
    if (l.followUpDueAt && new Date(l.followUpDueAt) < new Date() && !l.followUpDone) followUpOverdue++;
  }

  // Outreach analytics
  const outreachByChannel: Record<string, number> = {};
  let optedIn = 0, optedOut = 0;
  for (const o of outreachRecords) {
    outreachByChannel[o.channel] = (outreachByChannel[o.channel] || 0) + 1;
    if (o.consentStatus === "OPTED_IN") optedIn++;
    if (o.consentStatus === "OPTED_OUT") optedOut++;
  }

  // Calendar
  const calendarByStatus: Record<string, number> = {};
  for (const c of calendarItems) calendarByStatus[c.status] = (calendarByStatus[c.status] || 0) + 1;

  const triggersActive = triggers.filter((t: any) => t.status === "ACTIVE").length;
  const totalTriggersFired = triggers.reduce((a: number, t: any) => a + (t.triggerCount || 0), 0);

  return NextResponse.json({
    success: true,
    generatedAt: new Date().toISOString(),
    inbox: {
      total: inboxMessages.length,
      inbound: inboxInbound,
      unread: inboxUnread,
      aiHandled: inboxAiHandled,
      byPlatform: inboxByPlatform,
      slaWarn20: slaWarn,
      slaBreached40: slaBreached,
      conversations: Object.keys(convLast).length,
    },
    posts: {
      total: campaignPosts.length,
      byStatus: postsByStatus,
      byPlatform: postsByPlatform,
      byCategory: postsByCategory,
      brandApplied,
      brandAppliedPct: campaignPosts.length ? Math.round((brandApplied / campaignPosts.length) * 100) : 0,
      pendingApproval: postsByStatus["PENDING_APPROVAL"] || 0,
    },
    leads: {
      total: marketingLeads.length,
      byStatus: leadsByStatus,
      bySource: leadsBySource,
      hot: hotLeads,
      counselorAssigned,
      followUpOverdue,
      conversionRate: marketingLeads.length ? Math.round(((leadsByStatus["converted"] || 0) / marketingLeads.length) * 100) : 0,
    },
    outreach: {
      total: outreachRecords.length,
      optedIn,
      optedOut,
      byChannel: outreachByChannel,
    },
    calendar: {
      total: calendarItems.length,
      byStatus: calendarByStatus,
      scheduled: calendarByStatus["scheduled"] || 0,
      published: calendarByStatus["published"] || 0,
    },
    triggers: {
      total: triggers.length,
      active: triggersActive,
      totalFires: totalTriggersFired,
    },
    workflows: {
      total: workflows.length,
      active: workflows.filter((w: any) => w.isActive).length,
      totalTriggers: workflows.reduce((a: number, w: any) => a + (w.triggerCount || 0), 0),
    },
    audit: auditLogs.slice(0, 20).map((a: any) => ({
      id: a.id,
      action: a.action,
      resource: a.resource,
      details: a.details,
      createdAt: a.createdAt,
    })),
  } as any);
}, MARKETING_AUTH);
