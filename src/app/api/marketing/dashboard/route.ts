import { leadAccess } from '@/lib/crm/lead-access';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { AuthContext } from '@/lib/auth-middleware';
import { withMarketingAccess } from '@/lib/marketing/access';

const todayStart = () => new Date(new Date().setHours(0, 0, 0, 0));

export const GET = withMarketingAccess(async (_request: Request, _auth: AuthContext) => {
  const leadScope = leadAccess(_auth);
  if (!leadScope) return NextResponse.json({ error: 'Verified User lead access required' }, { status: 403 });
  try {
    const today = todayStart();
    const now = new Date();

    const [
      todayLeads,
      hotLeads,
      newDmLeads,
      commentLeads,
      whatsappReplies,
      websiteChatLeads,
      campaignsRunning,
      pendingApproval,
      pendingComments,
      scheduledPosts,
      failedPosts,
      counselorAssigned,
      followUpOverdue,
      socialAccountsConnected,
      aiJobsRunning,
      campaignsForCPL,
      allLeads,
      convertedLeads,
      recentCampaigns,
      recentLeads,
      recentApprovals,
    ] = await Promise.all([
      db.marketingLead.count({ where: { ...leadScope.where, createdAt: { gte: today } } }),
      db.marketingLead.count({ where: { ...leadScope.where, hotLead: true } }),
      db.marketingLead.count({
        where: { ...leadScope.where, source: 'dm', createdAt: { gte: today } },
      }),
      db.marketingLead.count({
        where: { ...leadScope.where, source: 'comment', createdAt: { gte: today } },
      }),
      db.marketingSocialMessage.count({
        where: {
          platform: 'whatsapp',
          replySent: { not: '' },
        },
      }),
      db.marketingLead.count({
        where: { ...leadScope.where, source: 'website_chat', createdAt: { gte: today } },
      }),
      db.marketingCampaign.count({ where: { status: 'active' } }),
      db.marketingApproval.count({ where: { status: 'pending' } }),
      db.marketingComment.count({ where: { status: 'new' } }),
      db.marketingCalendar.count({ where: { status: 'scheduled' } }),
      db.marketingCalendar.count({ where: { status: 'failed' } }),
      db.marketingLead.count({ where: { ...leadScope.where, counselorId: { not: null } } }),
      db.marketingLead.count({
        where: { ...leadScope.where,
          followUpDueAt: { lt: now },
          followUpDone: false,
        },
      }),
      db.socialConnectedAccount.count({ where: { status: 'connected' } }),
      db.marketingAgentJob.count({ where: { status: 'running' } }),
      db.marketingCampaign.findMany({
        where: { status: 'active' },
        select: { costPerLead: true },
      }),
      db.marketingLead.count({ where: leadScope.where }),
      db.marketingLead.count({ where: { ...leadScope.where, status: 'converted' } }),
      db.marketingCampaign.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      db.marketingLead.findMany({
        where: leadScope.where,
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      db.marketingApproval.findMany({
        where: { status: 'pending' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    const activeCampaigns = campaignsForCPL.length;
    const totalCPL =
      activeCampaigns > 0
        ? campaignsForCPL.reduce((sum, c) => sum + c.costPerLead, 0) /
          activeCampaigns
        : 0;

    const leadConversionRate =
      allLeads > 0 ? (convertedLeads / allLeads) * 100 : 0;

    const kpis = {
      todayLeads,
      hotLeads,
      newDmLeads,
      commentLeads,
      whatsappReplies,
      websiteChatLeads,
      campaignsRunning,
      pendingApproval,
      pendingComments,
      scheduledPosts,
      failedPosts,
      costPerLead: Math.round(totalCPL * 100) / 100,
      leadConversionRate: Math.round(leadConversionRate * 100) / 100,
      counselorAssigned,
      followUpOverdue,
      socialAccountsConnected,
      aiJobsRunning,
    };

    return NextResponse.json({
      kpis,
      recentCampaigns,
      recentLeads,
      recentApprovals,
    });
  } catch (error) {
    console.error('Dashboard KPI error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
}, 'manager');
