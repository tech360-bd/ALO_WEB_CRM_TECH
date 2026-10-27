// ============================================================
// ALO EDUCATION — SUPER ADMIN OPERATING METRICS
//
// Every number returned here is read from the database. There is
// no `|| 1420` fallback, no hardcoded "newStudentsToday: 18" and no
// sample trend line: if a source cannot be read the metric is
// returned as `available: false` with the reason, and the UI renders
// an honest unavailable state instead of a fabricated figure.
//
// Each KPI is computed independently so a single failing table
// degrades one card, never the whole dashboard.
// ============================================================

import { db } from '@/lib/db';
import type {
  DashboardHeaderMetrics,
  KpiCard,
  KpiSubMetric,
  KpiStatus,
  OperatingMetricsResponse,
} from './types';

const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfTomorrow = (): Date => {
  const d = startOfToday();
  d.setDate(d.getDate() + 1);
  return d;
};

const daysAgo = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

function reasonOf(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return `database error ${String((error as { code?: unknown }).code)}`;
  }
  return error instanceof Error ? error.message.slice(0, 160) : 'unknown error';
}

type Computed = { value: number | null; sub: KpiSubMetric[]; status: KpiStatus };

/**
 * Runs one KPI computation. A failure is contained: the card reports
 * `available: false` and the underlying reason, nothing is invented.
 */
async function kpi<T extends Computed>(
  label: string,
  icon: string,
  href: string,
  actionLabel: string,
  compute: () => Promise<T>,
  staticSub: Pick<KpiCard, 'key'>['key'],
  warnings: string[],
): Promise<KpiCard> {
  try {
    const { value, sub, status } = await compute();
    return {
      key: staticSub,
      label,
      icon,
      value,
      sub,
      status,
      href,
      actionLabel,
      available: true,
    };
  } catch (error) {
    const reason = reasonOf(error);
    warnings.push(`${label}: ${reason}`);
    return {
      key: staticSub,
      label,
      icon,
      value: null,
      sub: [],
      status: 'unknown',
      href,
      actionLabel,
      available: false,
      unavailableReason: reason,
    };
  }
}

const num = (value: number | bigint | null | undefined): number =>
  typeof value === 'bigint' ? Number(value) : Number(value ?? 0);

export async function getOperatingMetrics(adminName: string | null): Promise<OperatingMetricsResponse> {
  const warnings: string[] = [];
  const today = startOfToday();
  const tomorrow = startOfTomorrow();

  // ── 1. Students ─────────────────────────────────────────────
  const students = await kpi('Total Students', 'GraduationCap', '/admin/students', 'Open student control', async () => {
    const [total, full, englishOnlyNew, newToday, suspended] = await Promise.all([
      db.student.count(),
      db.student.count({ where: { userType: 'ALO_FULL_STUDENT' } }),
      db.student.count({ where: { userType: 'ENGLISH_TEST_ONLY_STUDENT' } }),
      db.student.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      db.student.count({ where: { suspended: true } }),
    ]);
    const sub: KpiSubMetric[] = [
      { label: 'Full students', value: num(full) },
      { label: 'English-test-only', value: num(englishOnlyNew), tone: 'neutral' },
      { label: 'New today', value: num(newToday), tone: newToday > 0 ? 'positive' : 'neutral' },
      { label: 'Suspended', value: num(suspended), tone: suspended > 0 ? 'warning' : 'neutral' },
    ];
    return { value: num(total), sub, status: 'ok' as KpiStatus };
  }, 'students', warnings);

  // ── 2. Leads ────────────────────────────────────────────────
  const leads = await kpi('Total Leads', 'Users', '/crm/leads', 'Open leads', async () => {
    const [total, todayLeads, unassigned, bySource] = await Promise.all([
      db.lead.count(),
      db.lead.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
      db.lead.count({ where: { counselorId: null } }),
      db.lead.groupBy({ by: ['source'], _count: { _all: true }, orderBy: { _count: { source: 'desc' } }, take: 3 }),
    ]);
    const topSources = bySource
      .map((row) => `${row.source}: ${num(row._count._all)}`)
      .join(' · ');
    const sub: KpiSubMetric[] = [
      { label: 'Today', value: num(todayLeads) },
      { label: 'Unassigned', value: num(unassigned), tone: unassigned > 0 ? 'warning' : 'positive' },
      { label: 'Top sources', value: topSources || 'No leads recorded' },
    ];
    return { value: num(total), sub, status: unassigned > 0 ? 'attention' : 'ok' as KpiStatus };
  }, 'leads', warnings);

  // ── 3. Active applications ──────────────────────────────────
  const applications = await kpi('Active Applications', 'FileText', '/crm/applications', 'Open applications', async () => {
    const [total, submitted, docsPending, offerStage, visaStage] = await Promise.all([
      db.application.count({ where: { status: 'active' } }),
      db.application.count({ where: { stage: 'SUBMITTED' } }),
      db.application.count({ where: { documentStatus: { in: ['PENDING', 'INCOMPLETE'] } } }),
      db.application.count({ where: { stage: { in: ['OFFER', 'OFFER_RECEIVED'] } } }),
      db.application.count({ where: { stage: { startsWith: 'VISA' } } }),
    ]);
    const sub: KpiSubMetric[] = [
      { label: 'Submitted', value: num(submitted) },
      { label: 'Document pending', value: num(docsPending), tone: docsPending > 0 ? 'warning' : 'positive' },
      { label: 'Offer stage', value: num(offerStage), tone: 'positive' },
      { label: 'Visa stage', value: num(visaStage) },
    ];
    return { value: num(total), sub, status: 'ok' as KpiStatus };
  }, 'applications', warnings);

  // ── 4. Partner network ──────────────────────────────────────
  const partners = await kpi('Partner Network', 'Handshake', '/admin/partners', 'Open partner control', async () => {
    const [total, active, pending, partnerLeads] = await Promise.all([
      db.partnerProfile.count(),
      db.partnerProfile.count({ where: { approvalStatus: { in: ['approved', 'active'] } } }),
      db.partnerProfile.count({ where: { approvalStatus: 'pending' } }),
      db.partnerLead.count(),
    ]);
    const sub: KpiSubMetric[] = [
      { label: 'Active', value: num(active), tone: 'positive' },
      { label: 'Pending approval', value: num(pending), tone: pending > 0 ? 'warning' : 'neutral' },
      { label: 'Partner leads', value: num(partnerLeads) },
    ];
    return { value: num(total), sub, status: pending > 0 ? 'attention' : 'ok' as KpiStatus };
  }, 'partners', warnings);

  // ── 5. Employees ────────────────────────────────────────────
  const employees = await kpi('Employees', 'UserCog', '/admin/employee-control', 'Open employee control', async () => {
    const [total, active, suspended, online, roleCount] = await Promise.all([
      db.employee.count(),
      db.employee.count({ where: { status: 'active' } }),
      db.employee.count({ where: { status: { in: ['suspended', 'locked', 'terminated', 'resigned'] } } }),
      db.employee.count({ where: { isOnline: true } }),
      db.portalRole.count(),
    ]);
    const sub: KpiSubMetric[] = [
      { label: 'Active', value: num(active), tone: 'positive' },
      { label: 'Online now', value: num(online) },
      { label: 'Suspended/inactive', value: num(suspended), tone: suspended > 0 ? 'warning' : 'neutral' },
      { label: 'Roles configured', value: num(roleCount) },
    ];
    return { value: num(total), sub, status: 'ok' as KpiStatus };
  }, 'employees', warnings);

  // ── 6. Counselor performance ────────────────────────────────
  const counselorPerformance = await kpi('Counselor Performance', 'Target', '/crm/morning-summary', 'Open counselor view', async () => {
    const [followUpsDue, overdueFollowUps, openTasks, convertedStudents] = await Promise.all([
      db.lead.count({ where: { followUpDate: { gte: today } } }),
      db.lead.count({ where: { followUpDate: { lt: today } } }),
      db.task.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
      db.student.count({ where: { counselorId: { not: null } } }),
    ]);
    const allLeads = await db.lead.count();
    const conversion = allLeads > 0 ? Math.round((num(convertedStudents) / allLeads) * 1000) / 10 : null;
    const sub: KpiSubMetric[] = [
      { label: 'Follow-ups due', value: num(followUpsDue) },
      { label: 'Overdue', value: num(overdueFollowUps), tone: overdueFollowUps > 0 ? 'danger' : 'positive' },
      { label: 'Open tasks', value: num(openTasks) },
      { label: 'Lead→student', value: conversion === null ? 'No leads yet' : `${conversion}%` },
    ];
    return { value: num(overdueFollowUps), sub, status: overdueFollowUps > 0 ? 'attention' : 'ok' as KpiStatus };
  }, 'counselorPerformance', warnings);

  // ── 7. Marketing ────────────────────────────────────────────
  const marketing = await kpi('Marketing Performance', 'Megaphone', '/crm/marketing', 'Open marketing control', async () => {
    const [activeCampaigns, campaignAgg, pendingReplies] = await Promise.all([
      db.campaign.count({ where: { status: 'ACTIVE' } }),
      db.campaign.aggregate({ _sum: { leadsCount: true, spent: true, conversionsCount: true } }),
      db.socialInboxMessage.count({ where: { direction: 'INBOUND', isRead: false } }),
    ]);
    const spend = num(campaignAgg._sum.spent);
    const conversions = num(campaignAgg._sum.conversionsCount);
    const roi = spend > 0 ? Math.round((conversions / spend) * 1000) / 10 : null;
    const sub: KpiSubMetric[] = [
      { label: 'Active campaigns', value: num(activeCampaigns) },
      { label: 'Marketing leads', value: num(campaignAgg._sum.leadsCount) },
      { label: 'Conversions / spend', value: roi === null ? 'No spend recorded' : `${roi} per currency unit` },
      { label: 'Pending social replies', value: num(pendingReplies), tone: pendingReplies > 0 ? 'warning' : 'positive' },
    ];
    return { value: num(activeCampaigns), sub, status: pendingReplies > 0 ? 'attention' : 'ok' as KpiStatus };
  }, 'marketing', warnings);

  // ── 8. Visa operations ──────────────────────────────────────
  const visa = await kpi('Visa Operations', 'Plane', '/crm/visa-dashboard', 'Open visa control', async () => {
    const [cases, interviewPending, highRisk, avgReadiness] = await Promise.all([
      db.visaCase.count(),
      db.visaCase.count({ where: { currentStage: { in: ['interview', 'interview_pending', 'ai_interview'] } } }),
      db.visaCase.count({ where: { riskLevel: { in: ['high', 'HIGH', 'critical'] } } }),
      db.visaCase.aggregate({ _avg: { readinessScore: true } }),
    ]);
    const avg = avgReadiness._avg.readinessScore;
    const sub: KpiSubMetric[] = [
      { label: 'Interview pending', value: num(interviewPending), tone: interviewPending > 0 ? 'warning' : 'neutral' },
      { label: 'High-risk cases', value: num(highRisk), tone: highRisk > 0 ? 'danger' : 'positive' },
      { label: 'Avg readiness', value: avg === null ? 'Not assessed' : `${Math.round(avg)}%` },
    ];
    return { value: num(cases), sub, status: highRisk > 0 ? 'critical' : 'ok' as KpiStatus };
  }, 'visa', warnings);

  // ── 9. English test system ──────────────────────────────────
  const englishTest = await kpi('English Test System', 'Languages', '/admin/language-tests', 'Open English test control', async () => {
    const [mocksToday, credits, testsRecorded] = await Promise.all([
      db.mockTestCredit.count({ where: { updatedAt: { gte: today, lt: tomorrow } } }),
      db.mockTestCredit.aggregate({ _sum: { totalCredits: true, usedCredits: true } }),
      db.studentEnglishTest.count(),
    ]);
    const totalCredits = num(credits._sum.totalCredits);
    const usedCredits = num(credits._sum.usedCredits);
    const sub: KpiSubMetric[] = [
      { label: 'Credit accounts', value: num(mocksToday) },
      { label: 'Free credits issued', value: totalCredits },
      { label: 'Credits used', value: usedCredits },
      { label: 'Tests recorded', value: num(testsRecorded) },
    ];
    return { value: num(testsRecorded), sub, status: 'ok' as KpiStatus };
  }, 'englishTest', warnings);

  // ── 10. Finance ─────────────────────────────────────────────
  const finance = await kpi('Finance', 'Wallet', '/crm/ucc', 'Open finance view', async () => {
    const [paid, pending, commissionPending] = await Promise.all([
      db.payment.aggregate({ where: { status: 'PAID' }, _sum: { amount: true }, _count: { _all: true } }),
      db.payment.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true }, _count: { _all: true } }),
      db.commission.aggregate({
        where: { status: { in: ['DUE', 'VERIFIED', 'REQUESTED', 'INVOICED'] } },
        _sum: { amount: true },
        _count: { _all: true },
      }),
    ]);
    const sub: KpiSubMetric[] = [
      { label: 'Payments received', value: `${num(paid._sum.amount).toLocaleString()} (${num(paid._count._all)})`, tone: 'positive' },
      { label: 'Pending invoices', value: `${num(pending._sum.amount).toLocaleString()} (${num(pending._count._all)})`, tone: num(pending._count._all) > 0 ? 'warning' : 'neutral' },
      { label: 'Commissions pending', value: `${num(commissionPending._sum.amount).toLocaleString()} (${num(commissionPending._count._all)})` },
    ];
    return { value: num(paid._sum.amount), sub, status: 'ok' as KpiStatus };
  }, 'finance', warnings);

  // ── 11. HR ──────────────────────────────────────────────────
  const hr = await kpi('HR', 'CalendarCheck', '/crm/hrm', 'Open HR view', async () => {
    const todayKey = new Date().toISOString().slice(0, 10);
    const [attendanceToday, leavePending, payrollPending] = await Promise.all([
      db.employeeAttendance.count({ where: { date: todayKey } }),
      db.employeeLeave.count({ where: { status: 'pending' } }),
      db.employeePayroll.count({ where: { status: { in: ['pending', 'PENDING', 'draft', 'DRAFT'] } } }),
    ]);
    const sub: KpiSubMetric[] = [
      { label: 'Attendance recorded today', value: num(attendanceToday) },
      { label: 'Leave requests', value: num(leavePending), tone: leavePending > 0 ? 'warning' : 'positive' },
      { label: 'Payroll tasks', value: num(payrollPending) },
    ];
    return { value: num(attendanceToday), sub, status: leavePending > 0 ? 'attention' : 'ok' as KpiStatus };
  }, 'hr', warnings);

  // ── 12. AI command center ───────────────────────────────────
  const ai = await kpi('AI Command Center', 'Bot', '/admin/ai-command-center', 'Open AI Command Center', async () => {
    const [agents, runningJobs, waitingApproval, failedJobs] = await Promise.all([
      db.aiAgent.count(),
      db.aiTask.count({ where: { status: 'RUNNING' } }),
      db.aiTask.count({ where: { status: 'WAITING' } }),
      db.aiTask.count({ where: { status: 'FAILED' } }),
    ]);
    const sub: KpiSubMetric[] = [
      { label: 'Registered agents', value: num(agents) },
      { label: 'Jobs running', value: num(runningJobs), tone: 'positive' },
      { label: 'Approvals pending', value: num(waitingApproval), tone: waitingApproval > 0 ? 'warning' : 'neutral' },
      { label: 'Failed jobs', value: num(failedJobs), tone: failedJobs > 0 ? 'danger' : 'positive' },
    ];
    return { value: num(runningJobs), sub, status: failedJobs > 0 ? 'attention' : 'ok' as KpiStatus };
  }, 'ai', warnings);

  const kpis: KpiCard[] = [
    students, leads, applications, partners, employees, counselorPerformance,
    marketing, visa, englishTest, finance, hr, ai,
  ];

  // ── Header strip ────────────────────────────────────────────
  const header: DashboardHeaderMetrics = {
    adminName,
    role: 'SUPER_ADMIN',
    totalActiveStudents: students.available ? await safeCount(() => db.student.count({ where: { suspended: false } })) : null,
    totalActiveApplications: applications.available
      ? await safeCount(() => db.application.count({ where: { status: 'active' } }))
      : null,
    employeesOnline: employees.available ? await safeCount(() => db.employee.count({ where: { isOnline: true } })) : null,
    employeesActiveToday: employees.available
      ? await safeCount(() => db.employee.count({ where: { lastLoginAt: { gte: today, lt: tomorrow } } }))
      : null,
    pendingApprovals: await safeCount(() => db.approvalRequest.count({ where: { status: 'pending' } })),
    securityAlerts: await safeCount(() => db.employeeSecurityEvent.count({ where: { isResolved: false } })),
    aiJobsRunning: ai.available ? await safeCount(() => db.aiTask.count({ where: { status: 'RUNNING' } })) : null,
    unreadNotifications: await safeCount(() => db.notification.count({ where: { isRead: false } })),
  };

  return {
    success: true,
    generatedAt: new Date().toISOString(),
    header,
    kpis,
    warnings,
  };
}

async function safeCount(fn: () => Promise<number>): Promise<number | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}
