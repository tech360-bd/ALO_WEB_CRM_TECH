import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const [
    leads,
    students,
    documents,
    applications,
    visaCases,
    mockTests,
    interviews,
    campaigns,
    aiAgents,
    payments,
    auditLogs,
  ] = await Promise.all([
    db.lead.findMany({ include: { counselor: true } }),
    db.student.findMany({ include: { counselor: true } }),
    db.document.findMany(),
    db.application.findMany(),
    db.visaCase.findMany(),
    db.mockTest.findMany(),
    db.interviewSession.findMany(),
    db.campaign.findMany(),
    db.aiAgent.findMany(),
    db.payment.findMany(),
    db.auditLog.findMany({ take: 8, orderBy: { createdAt: "desc" }, include: { user: true } }),
  ]);

  const leadsBySource: Record<string, number> = {};
  for (const l of leads) leadsBySource[l.source] = (leadsBySource[l.source] || 0) + 1;

  const leadsByStatus: Record<string, number> = {};
  for (const l of leads) leadsByStatus[l.status] = (leadsByStatus[l.status] || 0) + 1;

  const appsByStage: Record<string, number> = {};
  for (const a of applications) appsByStage[a.stage] = (appsByStage[a.stage] || 0) + 1;

  const docsByStatus: Record<string, number> = {};
  for (const d of documents) docsByStatus[d.status] = (docsByStatus[d.status] || 0) + 1;

  const visaByStage: Record<string, number> = {};
  for (const v of visaCases) visaByStage[v.visaStage] = (visaByStage[v.visaStage] || 0) + 1;

  const agentsByDept: Record<string, number> = {};
  for (const a of aiAgents) agentsByDept[a.department] = (agentsByDept[a.department] || 0) + 1;

  const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0);
  const totalSpent = campaigns.reduce((s, c) => s + (c.spent || 0), 0);
  const totalLeadsFromCampaigns = campaigns.reduce((s, c) => s + c.leadsCount, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversionsCount, 0);

  const revenue = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.amount, 0);

  return NextResponse.json({
    counts: {
      leads: leads.length,
      students: students.length,
      documents: documents.length,
      applications: applications.length,
      visaCases: visaCases.length,
      mockTests: mockTests.length,
      interviews: interviews.length,
      campaigns: campaigns.length,
      aiAgents: aiAgents.length,
      payments: payments.length,
    },
    leadsBySource,
    leadsByStatus,
    appsByStage,
    docsByStatus,
    visaByStage,
    agentsByDept,
    marketing: {
      totalBudget,
      totalSpent,
      totalLeadsFromCampaigns,
      totalConversions,
      costPerLead: totalLeadsFromCampaigns ? Math.round(totalSpent / totalLeadsFromCampaigns) : 0,
      conversionRate: totalLeadsFromCampaigns ? Math.round((totalConversions / totalLeadsFromCampaigns) * 100) : 0,
    },
    finance: {
      revenue,
      pendingPayments: payments.filter((p) => p.status === "PENDING").length,
      commissionPending: payments.filter((p) => p.commissionStatus === "PENDING").reduce((s, p) => s + (p.commissionAmount || 0), 0),
    },
    recentAudit: auditLogs,
    avgProfileCompletion: students.length
      ? Math.round(students.reduce((s, st) => s + st.profileCompletion, 0) / students.length)
      : 0,
  });
}
