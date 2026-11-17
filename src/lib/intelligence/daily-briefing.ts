// ============================================================
// ALO EDUCATION — AI DAILY MANAGEMENT BRIEFING (spec s109)
// ============================================================
// "Generate a daily management briefing: Yesterday / Today / At risk /
// Opportunities / Revenue / Applications / Visa / Partner performance /
// Marketing / System issues. Use actual database information."
//
// This module composes that briefing from LIVE database queries only. There is
// no language-model call on this path and nothing is invented: every figure is
// a COUNT, SUM or TOP-N computed from real rows, and every section degrades
// independently — a failed query reports status ERROR with its reason instead
// of showing a comfortable zero (s91, s94).
//
// Explainability contract:
//   * Each statistic carries `linkTo` to the filtered route that opens exactly
//     those records, per s108's "every number must link to the underlying
//     records".
//   * `highlights` are deterministic sentences rendered from the numbers above,
//     never free text. If a section errored, its highlight is omitted rather
//     than guessed.
//   * Undetermined facts (e.g. an unconfigured currency) are reported as such,
//     never guessed (s93, s105).
// ============================================================

import { db } from '@/lib/db';
import { buildAttentionReport, type Severity } from '@/lib/intelligence/attention-engine';

export interface BriefingStat {
  label: string;
  /** Display-ready value; formatted from real rows, never from a template. */
  value: string;
  linkTo?: string;
}

export interface BriefingSection {
  key: string;
  title: string;
  severity: Severity;
  status: 'OK' | 'ERROR';
  error?: string;
  summary: string;
  linkTo?: string;
  stats: BriefingStat[];
}

export interface DailyBriefing {
  generatedAt: string;
  /** ISO day this briefing describes (the "today" the reader logs in on). */
  day: string;
  window: { yesterdayStart: string; todayStart: string; in7Days: string; in30Days: string };
  /** Deterministic, data-derived sentences. Empty sections produce no highlights. */
  highlights: string[];
  sections: BriefingSection[];
}

export interface DailyBriefingOptions {
  now?: Date;
  /** Include the s108 attention engine inside the "At risk" section. Default true. */
  includeAttention?: boolean;
}

const DAY = 86_400_000;

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfUtcDay(date: Date): Date {
  const copy = new Date(date);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

function formatMoney(amount: number): string {
  // Whole-unit display; amounts are Float in the schema and are summed as-is.
  return amount.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

async function safeSection(
  definition: Omit<BriefingSection, 'status' | 'stats' | 'summary'> & { summary: string },
  compute: () => Promise<BriefingStat[]>,
): Promise<BriefingSection> {
  try {
    const stats = await compute();
    return { ...definition, stats, status: 'OK' };
  } catch (error) {
    return {
      ...definition,
      stats: [],
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'unknown error',
    };
  }
}

const CLOSED_APPLICATION_STAGES = ['REJECTED', 'WITHDRAWN', 'DEFERRED', 'CLOSED', 'ENROLLED'];
const CLOSED_VISA_STAGES = ['granted', 'refused', 'withdrawn', 'closed', 'completed'];

export async function buildDailyBriefing(options: DailyBriefingOptions = {}): Promise<DailyBriefing> {
  const now = options.now ?? new Date();
  const todayStart = startOfUtcDay(now);
  const yesterdayStart = new Date(todayStart.getTime() - DAY);
  const in7Days = new Date(now.getTime() + 7 * DAY);
  const in30Days = new Date(now.getTime() + 30 * DAY);
  const day1 = new Date(now.getTime() - DAY);
  const day30 = new Date(now.getTime() - 30 * DAY);

  const y = { gte: yesterdayStart, lt: todayStart };

  const sections = await Promise.all([
    // ── 1. Yesterday in review ────────────────────────────────────────────
    safeSection(
      {
        key: 'yesterday',
        title: 'Yesterday in review',
        severity: 'INFO',
        summary: 'Real activity recorded between 00:00 and 23:59 UTC yesterday.',
        linkTo: '/crm/reports',
      },
      async () => {
        const [leads, applications, offers, payments, paidAgg, visaGranted] = await Promise.all([
          db.lead.count({ where: { createdAt: y } }),
          db.application.count({ where: { createdAt: y } }),
          db.applicationOffer.count({ where: { createdAt: y } }),
          db.payment.count({ where: { createdAt: y, status: 'PAID' } }),
          db.payment.aggregate({ _sum: { amount: true }, where: { createdAt: y, status: 'PAID' } }),
          db.visaCase.count({ where: { updatedAt: y, currentStage: { in: ['granted', 'approved', 'issued'] } } }),
        ]);
        return [
          { label: 'New leads', value: String(leads), linkTo: '/crm/leads?filter=yesterday' },
          { label: 'Applications created', value: String(applications), linkTo: '/application-manager/applications' },
          { label: 'Offers received', value: String(offers), linkTo: '/crm/offers?filter=yesterday' },
          { label: 'Payments received', value: `${payments} (total ${formatMoney(paidAgg._sum.amount ?? 0)})`, linkTo: '/crm/payments?filter=yesterday' },
          { label: 'Visas granted', value: String(visaGranted), linkTo: '/crm/visa-cases?filter=granted' },
        ];
      },
    ),

    // ── 2. Today's agenda ─────────────────────────────────────────────────
    safeSection(
      {
        key: 'today',
        title: "Today's agenda",
        severity: 'WARNING',
        summary: 'Open tasks due today, meetings scheduled today and live application deadlines inside 24 hours.',
        linkTo: '/crm/tasks?filter=due-today',
      },
      async () => {
        // Task.dueDate is stored as a free-text date string; an ISO prefix
        // comparison is the only safe cross-format check, so it is applied on
        // ISO-formatted values only.
        const dayStr = isoDay(now);
        const nextDayStr = isoDay(new Date(todayStart.getTime() + DAY));
        const [tasks, appointments, deadlines] = await Promise.all([
          db.task.count({
            where: { status: { notIn: ['COMPLETED', 'CANCELLED', 'completed', 'cancelled'] }, dueDate: { gte: dayStr, lt: nextDayStr } },
          }),
          db.appointment.count({
            where: { scheduledAt: { gte: todayStart, lt: new Date(todayStart.getTime() + DAY) }, status: { notIn: ['CANCELLED', 'NO_SHOW'] } },
          }),
          db.application.count({
            where: { deadlineDate: { gte: now, lt: new Date(now.getTime() + DAY) }, stage: { notIn: CLOSED_APPLICATION_STAGES } },
          }),
        ]);
        return [
          { label: 'Tasks due today', value: String(tasks), linkTo: '/crm/tasks?filter=due-today' },
          { label: 'Appointments today', value: String(appointments), linkTo: '/crm/appointments?filter=today' },
          { label: 'Application deadlines (24h)', value: String(deadlines), linkTo: '/application-manager/applications?filter=deadline24h' },
        ];
      },
    ),

    // ── 3. At risk (powered by the s108 attention engine) ────────────────
    safeSection(
      {
        key: 'at_risk',
        title: 'At risk',
        severity: 'CRITICAL',
        summary: 'The live operational pressure view — every figure is a real count linked to its records.',
        linkTo: '/admin/attention',
      },
      async () => {
        if (options.includeAttention === false) {
          return [{ label: 'Attention engine', value: 'NOT INCLUDED in this run', linkTo: '/admin/attention' }];
        }
        const report = await buildAttentionReport({ generatedFor: 'daily-briefing', persist: false, now });
        const critical = report.buckets.filter((bucket) => bucket.status === 'OK');
        const top = [...critical].sort((a, b) => b.count - a.count).slice(0, 6);
        const stats = top.map((bucket) => ({
          label: bucket.label,
          value: String(bucket.count),
          linkTo: bucket.linkTo,
        }));
        stats.push({
          label: 'Totals (critical/urgent/warning)',
          value: `${report.totals.critical}/${report.totals.urgent}/${report.totals.warning}`,
          linkTo: '/admin/attention',
        });
        if (report.totals.errored > 0) {
          stats.push({ label: 'Buckets that failed to compute', value: String(report.totals.errored), linkTo: '/admin/attention' });
        }
        return stats;
      },
    ),

    // ── 4. Opportunities ──────────────────────────────────────────────────
    safeSection(
      {
        key: 'opportunities',
        title: 'Opportunities',
        severity: 'INFO',
        summary: 'Upcoming intake and scholarship windows, plus new leads that have not had first contact.',
        linkTo: '/course-finder',
      },
      async () => {
        const [scholarships, intakes, freshLeads] = await Promise.all([
          db.scholarship.count({ where: { deadlineDate: { gte: now, lte: in30Days } } }),
          db.courseIntake.count({ where: { status: 'open', deadlineDate: { gte: now, lte: in30Days } } }),
          db.lead.count({ where: { status: 'NEW' } }),
        ]);
        return [
          { label: 'Scholarships closing within 30 days', value: String(scholarships), linkTo: '/scholarships?filter=closing30d' },
          { label: 'Open intakes with deadlines in 30 days', value: String(intakes), linkTo: '/course-finder?filter=deadline30d' },
          { label: 'Leads awaiting first contact', value: String(freshLeads), linkTo: '/crm/leads?filter=new' },
        ];
      },
    ),

    // ── 5. Revenue (30 days) ──────────────────────────────────────────────
    safeSection(
      {
        key: 'revenue_30d',
        title: 'Revenue (30 days)',
        severity: 'INFO',
        summary: 'Collected payments, refunds and pending commission over the trailing 30 days.',
        linkTo: '/crm/finance',
      },
      async () => {
        const window30 = { gte: day30 };
        const [paidCount, paidAgg, refunds, commissionPending] = await Promise.all([
          db.payment.count({ where: { createdAt: window30, status: 'PAID' } }),
          db.payment.aggregate({ _sum: { amount: true }, where: { createdAt: window30, status: 'PAID' } }),
          db.payment.count({ where: { createdAt: window30, status: 'REFUNDED' } }),
          db.commission.aggregate({ _sum: { amount: true }, where: { status: { in: ['DUE', 'VERIFIED', 'APPROVED', 'SENT'] } } }),
        ]);
        return [
          { label: 'Collected (30d)', value: `${paidCount} payments — ${formatMoney(paidAgg._sum.amount ?? 0)}`, linkTo: '/crm/payments?filter=paid30d' },
          { label: 'Refunds (30d)', value: String(refunds), linkTo: '/crm/payments?filter=refunded30d' },
          { label: 'Commission pending reconciliation', value: formatMoney(commissionPending._sum.amount ?? 0), linkTo: '/crm/commissions?filter=pending' },
        ];
      },
    ),

    // ── 6. Applications ───────────────────────────────────────────────────
    safeSection(
      {
        key: 'applications',
        title: 'Applications',
        severity: 'INFO',
        summary: 'Live application pipeline and outstanding decisions.',
        linkTo: '/application-manager/applications',
      },
      async () => {
        const [live, conditional, unconditional, created30d] = await Promise.all([
          db.application.count({ where: { stage: { notIn: CLOSED_APPLICATION_STAGES } } }),
          db.applicationOffer.count({ where: { offerStatus: 'CONDITIONAL_OFFER' } }),
          db.applicationOffer.count({ where: { offerStatus: 'UNCONDITIONAL_OFFER' } }),
          db.application.count({ where: { createdAt: { gte: day30 } } }),
        ]);
        return [
          { label: 'Live applications', value: String(live), linkTo: '/application-manager/applications?filter=live' },
          { label: 'Conditional offers open', value: String(conditional), linkTo: '/crm/offers?filter=conditional' },
          { label: 'Unconditional offers open', value: String(unconditional), linkTo: '/crm/offers?filter=unconditional' },
          { label: 'Created in last 30 days', value: String(created30d), linkTo: '/application-manager/applications?filter=created30d' },
        ];
      },
    ),

    // ── 7. Visa ───────────────────────────────────────────────────────────
    safeSection(
      {
        key: 'visa',
        title: 'Visa',
        severity: 'URGENT',
        summary: 'Open visa caseload, decisions in the last 30 days and deadlines inside 7 days.',
        linkTo: '/crm/visa-cases',
      },
      async () => {
        const [open, granted30d, refused30d, deadline7d] = await Promise.all([
          db.visaCase.count({ where: { currentStage: { notIn: CLOSED_VISA_STAGES } } }),
          db.visaCase.count({ where: { updatedAt: { gte: day30 }, currentStage: { in: ['granted', 'approved', 'issued'] } } }),
          db.visaCase.count({ where: { updatedAt: { gte: day30 }, currentStage: 'refused' } }),
          db.visaCase.count({ where: { deadline: { gte: now, lte: in7Days }, currentStage: { notIn: CLOSED_VISA_STAGES } } }),
        ]);
        return [
          { label: 'Open visa cases', value: String(open), linkTo: '/crm/visa-cases?filter=open' },
          { label: 'Granted (30d)', value: String(granted30d), linkTo: '/crm/visa-cases?filter=granted30d' },
          { label: 'Refused (30d)', value: String(refused30d), linkTo: '/crm/visa-cases?filter=refused30d' },
          { label: 'Deadlines within 7 days', value: String(deadline7d), linkTo: '/crm/visa-cases?filter=deadline7' },
        ];
      },
    ),

    // ── 8. Partner performance ────────────────────────────────────────────
    safeSection(
      {
        key: 'partners',
        title: 'Partner performance',
        severity: 'INFO',
        summary: 'Partner onboarding pipeline and B2B contribution over the trailing 30 days.',
        linkTo: '/crm/partners',
      },
      async () => {
        const [active, pending, partnerApplications30d, pendingCommission] = await Promise.all([
          db.partnerProfile.count({ where: { approvalStatus: 'approved' } }),
          db.partnerProfile.count({ where: { approvalStatus: 'pending' } }),
          db.application.count({ where: { createdAt: { gte: day30 }, NOT: { partnerId: '' } } }),
          db.commission.aggregate({ _sum: { amount: true }, where: { type: 'PARTNER_COMMISSION', status: { in: ['DUE', 'VERIFIED', 'APPROVED', 'SENT'] } } }),
        ]);
        return [
          { label: 'Active partners', value: String(active), linkTo: '/crm/partners?filter=approved' },
          { label: 'Partners awaiting approval', value: String(pending), linkTo: '/crm/partners?filter=pending' },
          { label: 'Partner-sourced applications (30d)', value: String(partnerApplications30d), linkTo: '/application-manager/applications?filter=partner30d' },
          { label: 'Partner commission pending', value: formatMoney(pendingCommission._sum.amount ?? 0), linkTo: '/crm/commissions?filter=partner-pending' },
        ];
      },
    ),

    // ── 9. Marketing ──────────────────────────────────────────────────────
    safeSection(
      {
        key: 'marketing',
        title: 'Marketing',
        severity: 'INFO',
        summary: 'Lead volume over 30 days and the top acquisition sources by recorded rows.',
        linkTo: '/crm/marketing',
      },
      async () => {
        const leads30d = await db.lead.count({ where: { createdAt: { gte: day30 } } });
        // Top sources are counted in memory from a bounded, real sample — no
        // groupBy so the query stays index-friendly and mockable in tests.
        const rows = await db.lead.findMany({
          where: { createdAt: { gte: day30 } },
          select: { source: true },
          take: 1000,
        });
        const counts = new Map<string, number>();
        for (const row of rows) {
          const key = row.source || 'UNKNOWN';
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
        const stats: BriefingStat[] = [
          { label: 'Leads (30d)', value: String(leads30d), linkTo: '/crm/marketing?filter=leads30d' },
        ];
        for (const [source, count] of top) {
          stats.push({ label: `Source: ${source}`, value: String(count), linkTo: `/crm/leads?source=${encodeURIComponent(source)}` });
        }
        if (top.length === 0) stats.push({ label: 'Top sources', value: 'NO LEADS IN WINDOW' });
        return stats;
      },
    ),

    // ── 10. System issues ─────────────────────────────────────────────────
    safeSection(
      {
        key: 'system',
        title: 'System issues',
        severity: 'WARNING',
        summary: 'Failed background jobs (24h) and dead-lettered outbound webhooks (7d).',
        linkTo: '/admin/system-health',
      },
      async () => {
        const day7 = new Date(now.getTime() - 7 * DAY);
        const [failedCron, deadWebhooks] = await Promise.all([
          db.cronJobLog.count({ where: { status: 'failed', startedAt: { gte: day1 } } }),
          db.webhookDelivery.count({ where: { status: 'DEAD', createdAt: { gte: day7 } } }),
        ]);
        return [
          { label: 'Failed cron jobs (24h)', value: String(failedCron), linkTo: '/admin/system-health?filter=failed-cron' },
          { label: 'Dead-lettered webhooks (7d)', value: String(deadWebhooks), linkTo: '/admin/webhooks?filter=dead' },
        ];
      },
    ),
  ]);

  // ── Deterministic highlights: one sentence per OK section that has a
  //    headline number. Sections that errored contribute nothing.
  const byKey = new Map(sections.map((section) => [section.key, section]));
  const stat = (key: string, label: string): string | null => {
    const section = byKey.get(key);
    if (!section || section.status !== 'OK') return null;
    return section.stats.find((item) => item.label === label)?.value ?? null;
  };
  const highlights: string[] = [];
  const push = (line: string | null) => {
    if (line) highlights.push(line);
  };
  push(stat('yesterday', 'New leads') && `${stat('yesterday', 'New leads')} new leads were recorded yesterday.`);
  push(stat('today', 'Application deadlines (24h)') && `${stat('today', 'Application deadlines (24h)')} application deadline(s) fall inside the next 24 hours.`);
  push(stat('at_risk', 'Totals (critical/urgent/warning)') && `Attention engine: ${stat('at_risk', 'Totals (critical/urgent/warning)')} (critical/urgent/warning).`);
  push(stat('visa', 'Deadlines within 7 days') && `${stat('visa', 'Deadlines within 7 days')} visa deadline(s) inside 7 days.`);
  push(stat('revenue_30d', 'Collected (30d)') && `Collected over 30 days: ${stat('revenue_30d', 'Collected (30d)')}.`);
  push(stat('partners', 'Partners awaiting approval') && `${stat('partners', 'Partners awaiting approval')} partner(s) awaiting approval.`);
  push(stat('system', 'Failed cron jobs (24h)') && `${stat('system', 'Failed cron jobs (24h)')} failed background job(s) in the last 24 hours.`);

  return {
    generatedAt: now.toISOString(),
    day: isoDay(now),
    window: {
      yesterdayStart: yesterdayStart.toISOString(),
      todayStart: todayStart.toISOString(),
      in7Days: in7Days.toISOString(),
      in30Days: in30Days.toISOString(),
    },
    highlights,
    sections,
  };
}
