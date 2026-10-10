import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

// Operational statistics contain confidential CRM and finance metrics. Do not
// make this endpoint public and never serialize user/audit-detail relations.
const STAT_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'CEO', 'BRANCH_MANAGER', 'COUNSELOR',
  'APPLICATION_TEAM', 'VISA_OFFICER', 'VISA_INTERVIEW_OFFICER',
  'MARKETING_MANAGER', 'MARKETING', 'FINANCE', 'HR_MANAGER',
  'super_admin', 'admin', 'ceo', 'branch_manager', 'counselor',
  'application_team', 'visa_officer', 'visa_interview_officer',
  'marketing_manager', 'marketing', 'finance', 'hr_manager',
];

function countMap(rows: Array<{ [key: string]: any; _count: { _all: number } }>, key: string) {
  return Object.fromEntries(rows.map((row) => [String(row[key] || 'unknown'), row._count._all]));
}

export const GET = (request: NextRequest) => withAuth(async () => {
  try {
    const [
      leads,
      leadSources,
      leadStatuses,
      students,
      avgProfile,
      documents,
      documentStatuses,
      applications,
      appStages,
      visaCases,
      visaStages,
      mockTests,
      interviews,
      campaigns,
      campaignTotals,
      agents,
      agentDepartments,
      payments,
      paidPayments,
      pendingPayments,
      pendingCommission,
      recentAudit,
    ] = await Promise.all([
      db.lead.count(),
      db.lead.groupBy({ by: ['source'], _count: { _all: true } }),
      db.lead.groupBy({ by: ['status'], _count: { _all: true } }),
      db.student.count(),
      db.student.aggregate({ _avg: { profileComplete: true } }),
      db.document.count(),
      db.document.groupBy({ by: ['status'], _count: { _all: true } }),
      db.application.count(),
      db.application.groupBy({ by: ['stage'], _count: { _all: true } }),
      db.visaCase.count(),
      db.visaCase.groupBy({ by: ['currentStage'], _count: { _all: true } }),
      db.mockTest.count(),
      db.interviewSession.count(),
      db.campaign.count(),
      db.campaign.aggregate({ _sum: { budget: true, spent: true, leadsCount: true, conversionsCount: true } }),
      db.aiAgent.count(),
      db.aiAgent.groupBy({ by: ['department'], _count: { _all: true } }),
      db.payment.count(),
      db.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true } }),
      db.payment.count({ where: { status: 'PENDING' } }),
      db.payment.aggregate({ where: { commissionStatus: 'PENDING' }, _sum: { commissionAmount: true } }),
      db.auditLog.findMany({
        take: 8,
        orderBy: { createdAt: 'desc' },
        select: { id: true, action: true, resource: true, resourceId: true, createdAt: true },
      }),
    ]);

    const totalBudget = campaignTotals._sum.budget || 0;
    const totalSpent = campaignTotals._sum.spent || 0;
    const totalLeadsFromCampaigns = campaignTotals._sum.leadsCount || 0;
    const totalConversions = campaignTotals._sum.conversionsCount || 0;

    return NextResponse.json({
      counts: { leads, students, documents, applications, visaCases, mockTests, interviews, campaigns, aiAgents: agents, payments },
      leadsBySource: countMap(leadSources, 'source'),
      leadsByStatus: countMap(leadStatuses, 'status'),
      appsByStage: countMap(appStages, 'stage'),
      docsByStatus: countMap(documentStatuses, 'status'),
      visaByStage: countMap(visaStages, 'currentStage'),
      agentsByDept: countMap(agentDepartments, 'department'),
      marketing: {
        totalBudget,
        totalSpent,
        totalLeadsFromCampaigns,
        totalConversions,
        costPerLead: totalLeadsFromCampaigns ? Math.round(totalSpent / totalLeadsFromCampaigns) : 0,
        conversionRate: totalLeadsFromCampaigns ? Math.round((totalConversions / totalLeadsFromCampaigns) * 100) : 0,
      },
      finance: {
        revenue: paidPayments._sum.amount || 0,
        pendingPayments,
        commissionPending: pendingCommission._sum.commissionAmount || 0,
      },
      // Audit metadata only: never return the User relation, password hash, or
      // details JSON (which historically contained verification codes).
      recentAudit,
      avgProfileCompletion: Math.round(avgProfile._avg.profileComplete || 0),
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to load dashboard statistics' }, { status: 500 });
  }
}, { requireRoles: STAT_ROLES })(request);
