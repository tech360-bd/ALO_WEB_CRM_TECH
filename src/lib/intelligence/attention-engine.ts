// ============================================================
// ALO EDUCATION — "WHAT NEEDS ATTENTION?" ENGINE (spec s108)
// ============================================================
// On login, management must see actionable counts — and every number must
// link to the underlying records (s108). Each bucket therefore returns:
//   * a real COUNT computed from live database rows (never an estimate)
//   * a severity (s85: INFO / WARNING / URGENT / CRITICAL)
//   * `linkTo`: the route + query filter that opens exactly those records
//   * `sample`: a few real record ids so the UI can prove the count is not
//     fabricated before the operator even clicks through
//
// Buckets degrade independently: if one query fails, that bucket reports
// status "ERROR" with the reason instead of silently showing 0 (s91 — no
// silent failures, s94 — never pretend).
// ============================================================

import { db } from '@/lib/db';

export type Severity = 'INFO' | 'WARNING' | 'URGENT' | 'CRITICAL';

export interface AttentionBucket {
  key: string;
  label: string;
  count: number;
  severity: Severity;
  /** Route that lists exactly these records. */
  linkTo: string;
  /** Real record ids backing the count (capped). */
  sample: string[];
  status: 'OK' | 'ERROR';
  error?: string;
  description: string;
}

export interface AttentionReport {
  generatedAt: string;
  scope: 'GLOBAL' | 'BRANCH' | 'USER';
  scopeId: string;
  generatedFor: string;
  totals: { critical: number; urgent: number; warning: number; info: number; total: number; errored: number };
  buckets: AttentionBucket[];
}

export interface AttentionOptions {
  scope?: 'GLOBAL' | 'BRANCH' | 'USER';
  scopeId?: string;
  generatedFor?: string;
  /** How many real record ids to return per bucket. */
  sampleSize?: number;
  now?: Date;
  /** Stale-lead threshold in hours. */
  untouchedLeadHours?: number;
  /** Persist a snapshot row for trend analysis. */
  persist?: boolean;
}

const SAMPLE_SIZE = 5;

async function safeBucket(
  definition: Omit<AttentionBucket, 'count' | 'sample' | 'status'>,
  compute: (sampleSize: number) => Promise<{ count: number; sample: string[] }>,
  sampleSize: number,
): Promise<AttentionBucket> {
  try {
    const { count, sample } = await compute(sampleSize);
    return { ...definition, count, sample, status: 'OK' };
  } catch (error) {
    return {
      ...definition,
      count: 0,
      sample: [],
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'unknown error',
    };
  }
}

function parseDateLoose(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Build the attention report from live data. Every bucket is an independent
 * query so a single failing table cannot blank the whole management view.
 */
export async function buildAttentionReport(options: AttentionOptions = {}): Promise<AttentionReport> {
  const now = options.now ?? new Date();
  const sampleSize = Math.max(1, Math.min(options.sampleSize ?? SAMPLE_SIZE, 50));
  const untouchedHours = Math.max(1, options.untouchedLeadHours ?? 24);
  const untouchedCutoff = new Date(now.getTime() - untouchedHours * 3_600_000);
  const day7 = new Date(now.getTime() + 7 * 86_400_000);
  const day60 = new Date(now.getTime() + 60 * 86_400_000);
  const day1 = new Date(now.getTime() - 86_400_000);

  const buckets = await Promise.all([
    // 1. Urgent applications — SLA breached or past deadline, still live.
    safeBucket(
      {
        key: 'urgent_applications',
        label: 'Urgent applications',
        severity: 'CRITICAL',
        linkTo: '/application-manager/applications?filter=urgent',
        description: 'Live applications whose SLA is breached or whose deadline has passed.',
      },
      async (size) => {
        const where = {
          stage: { notIn: ['REJECTED', 'WITHDRAWN', 'DEFERRED', 'CLOSED'] },
          OR: [
            { slaStatus: 'OVERDUE' },
            { deadlineDate: { lt: now } },
            { paymentStatus: 'OVERDUE' },
            { depositStatus: 'OVERDUE' },
          ],
        };
        const [count, rows] = await Promise.all([
          db.application.count({ where }),
          db.application.findMany({ where, select: { id: true }, orderBy: { deadlineDate: 'asc' }, take: size }),
        ]);
        return { count, sample: rows.map((row) => row.id) };
      },
      sampleSize,
    ),

    // 2. Visa deadlines within 7 days.
    safeBucket(
      {
        key: 'visa_deadlines',
        label: 'Visa deadlines (7 days)',
        severity: 'URGENT',
        linkTo: '/crm/visa-cases?filter=deadline7',
        description: 'Open visa cases with a deadline inside the next 7 days.',
      },
      async (size) => {
        const where = {
          deadline: { gte: now, lte: day7 },
          currentStage: { notIn: ['granted', 'refused', 'withdrawn', 'closed', 'completed'] },
        };
        const [count, rows] = await Promise.all([
          db.visaCase.count({ where }),
          db.visaCase.findMany({ where, select: { id: true }, orderBy: { deadline: 'asc' }, take: size }),
        ]);
        return { count, sample: rows.map((row) => row.id) };
      },
      sampleSize,
    ),

    // 3. High-risk visa cases.
    safeBucket(
      {
        key: 'high_risk_visa_cases',
        label: 'High-risk visa cases',
        severity: 'CRITICAL',
        linkTo: '/crm/visa-cases?filter=risk-high',
        description: 'Visa cases flagged high risk or urgent that are still open.',
      },
      async (size) => {
        const where = {
          OR: [{ riskLevel: 'high' }, { isUrgent: true }],
          currentStage: { notIn: ['granted', 'refused', 'withdrawn', 'closed', 'completed'] },
        };
        const [count, rows] = await Promise.all([
          db.visaCase.count({ where }),
          db.visaCase.findMany({ where, select: { id: true }, take: size }),
        ]);
        return { count, sample: rows.map((row) => row.id) };
      },
      sampleSize,
    ),

    // 4. Missing / unusable documents on live applications.
    safeBucket(
      {
        key: 'missing_documents',
        label: 'Missing documents',
        severity: 'WARNING',
        linkTo: '/application-manager/document-review?filter=missing',
        description: 'Application documents marked MISSING, REJECTED, EXPIRED or REQUEST_AGAIN.',
      },
      async (size) => {
        const where = { status: { in: ['MISSING', 'REJECTED', 'EXPIRED', 'REQUEST_AGAIN'] } };
        const [count, rows] = await Promise.all([
          db.applicationDocument.count({ where }),
          db.applicationDocument.findMany({ where, select: { id: true }, take: size }),
        ]);
        return { count, sample: rows.map((row) => row.id) };
      },
      sampleSize,
    ),

    // 5. Documents awaiting review (queue depth for documentation officers).
    safeBucket(
      {
        key: 'documents_awaiting_review',
        label: 'Documents awaiting review',
        severity: 'INFO',
        linkTo: '/application-manager/document-review?filter=pending',
        description: 'Uploaded application documents still pending a reviewer decision.',
      },
      async (size) => {
        const where = { status: { in: ['PENDING', 'UNDER_REVIEW', 'UPLOADED'] } };
        const [count, rows] = await Promise.all([
          db.applicationDocument.count({ where }),
          db.applicationDocument.findMany({ where, select: { id: true }, take: size }),
        ]);
        return { count, sample: rows.map((row) => row.id) };
      },
      sampleSize,
    ),

    // 6. Expiring / expired time-sensitive documents.
    safeBucket(
      {
        key: 'expiring_documents',
        label: 'Expiring documents',
        severity: 'WARNING',
        linkTo: '/application-manager/document-review?filter=expiring',
        description:
          'Documents already marked EXPIRED plus passports whose recorded expiry falls within 60 days.',
      },
      async (size) => {
        const expiredDocs = await db.applicationDocument.count({ where: { status: 'EXPIRED' } });
        const profiles = await db.portalStudentProfile.findMany({
          where: { passportExpiry: { not: '' } },
          select: { id: true, passportExpiry: true },
          take: 500,
        });
        const expiringPassports = profiles.filter((profile) => {
          const expiry = parseDateLoose(profile.passportExpiry);
          return Boolean(expiry && expiry >= now && expiry <= day60);
        });
        const sampleRows = await db.applicationDocument.findMany({
          where: { status: 'EXPIRED' },
          select: { id: true },
          take: size,
        });
        return {
          count: expiredDocs + expiringPassports.length,
          sample: [...sampleRows.map((row) => row.id), ...expiringPassports.map((p) => `passport:${p.id}`)].slice(0, size),
        };
      },
      sampleSize,
    ),

    // 7. Unpaid / unsettled commissions.
    safeBucket(
      {
        key: 'unpaid_commissions',
        label: 'Unpaid commissions',
        severity: 'URGENT',
        linkTo: '/admin/partners?tab=commissions&filter=unpaid',
        description: 'Commissions not yet received, reconciled or closed.',
      },
      async (size) => {
        const where = {
          status: { in: ['DUE', 'VERIFIED', 'REQUESTED', 'INVOICED', 'APPROVED', 'SENT'] },
        };
        const [count, rows] = await Promise.all([
          db.commission.count({ where }),
          db.commission.findMany({ where, select: { id: true }, orderBy: { createdAt: 'asc' }, take: size }),
        ]);
        return { count, sample: rows.map((row) => row.id) };
      },
      sampleSize,
    ),

    // 8. Untouched leads.
    safeBucket(
      {
        key: 'untouched_leads',
        label: `Untouched leads (>${untouchedHours}h)`,
        severity: 'URGENT',
        linkTo: `/crm/leads?filter=untouched&hours=${untouchedHours}`,
        description: `Leads still NEW with no owner response for more than ${untouchedHours} hours.`,
      },
      async (size) => {
        const where = { status: 'NEW', createdAt: { lt: untouchedCutoff } };
        const [count, rows] = await Promise.all([
          db.lead.count({ where }),
          db.lead.findMany({ where, select: { id: true }, orderBy: { createdAt: 'asc' }, take: size }),
        ]);
        return { count, sample: rows.map((row) => row.id) };
      },
      sampleSize,
    ),

    // 9. Partner issues — pending KYC/approval or suspended.
    safeBucket(
      {
        key: 'partner_issues',
        label: 'Partner issues',
        severity: 'WARNING',
        linkTo: '/admin/partners?filter=needs-review',
        description: 'Partner accounts awaiting approval, rejected or suspended.',
      },
      async (size) => {
        const where = { approvalStatus: { in: ['pending', 'rejected', 'suspended', 'PENDING', 'REJECTED', 'SUSPENDED'] } };
        const [count, rows] = await Promise.all([
          db.partnerProfile.count({ where }),
          db.partnerProfile.findMany({ where, select: { partnerId: true }, take: size }),
        ]);
        return { count, sample: rows.map((row) => row.partnerId) };
      },
      sampleSize,
    ),

    // 10. Failed automations / jobs in the last 24h.
    safeBucket(
      {
        key: 'failed_automations',
        label: 'Failed automations (24h)',
        severity: 'CRITICAL',
        linkTo: '/admin/system-builder?tab=jobs&filter=failed',
        description: 'Scheduled jobs that finished in a failed state in the last 24 hours.',
      },
      async (size) => {
        const where = { status: 'failed', startedAt: { gte: day1 } };
        const [count, rows] = await Promise.all([
          db.cronJobLog.count({ where }),
          db.cronJobLog.findMany({ where, select: { id: true }, orderBy: { startedAt: 'desc' }, take: size }),
        ]);
        return { count, sample: rows.map((row) => row.id) };
      },
      sampleSize,
    ),

    // 11. Dead-lettered outbound webhooks (only meaningful when configured).
    safeBucket(
      {
        key: 'dead_webhooks',
        label: 'Dead webhook deliveries',
        severity: 'WARNING',
        linkTo: '/admin/integration-center?tab=webhooks&filter=dead',
        description: 'Outbound webhook deliveries that exhausted their retries.',
      },
      async (size) => {
        const where = { status: 'DEAD' };
        const [count, rows] = await Promise.all([
          db.webhookDelivery.count({ where }),
          db.webhookDelivery.findMany({ where, select: { id: true }, orderBy: { updatedAt: 'desc' }, take: size }),
        ]);
        return { count, sample: rows.map((row) => row.id) };
      },
      sampleSize,
    ),

    // 12. RED-risk applications from the risk engine (s111).
    safeBucket(
      {
        key: 'red_risk_applications',
        label: 'Red-risk applications',
        severity: 'CRITICAL',
        linkTo: '/application-manager/applications?filter=risk-red',
        description: 'Applications whose latest computed risk assessment is RED.',
      },
      async (size) => {
        // Latest assessment per application: pull recent RED rows and keep the
        // newest per applicationId.
        const rows = await db.applicationRiskAssessment.findMany({
          where: { riskLevel: 'RED' },
          orderBy: { createdAt: 'desc' },
          take: 1000,
          select: { applicationId: true, createdAt: true },
        });
        const latest = new Map<string, Date>();
        for (const row of rows) {
          if (!latest.has(row.applicationId)) latest.set(row.applicationId, row.createdAt);
        }
        const applicationIds = Array.from(latest.keys());
        if (applicationIds.length === 0) return { count: 0, sample: [] };
        // Exclude applications whose newest assessment is no longer RED.
        const newer = await db.applicationRiskAssessment.findMany({
          where: { applicationId: { in: applicationIds }, riskLevel: { not: 'RED' }, createdAt: { gt: new Date(0) } },
          select: { applicationId: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        });
        const superseded = new Set<string>();
        const newestNonRed = new Map<string, Date>();
        for (const row of newer) {
          if (!newestNonRed.has(row.applicationId)) newestNonRed.set(row.applicationId, row.createdAt);
        }
        for (const [applicationId, redAt] of latest) {
          const nonRedAt = newestNonRed.get(applicationId);
          if (nonRedAt && nonRedAt > redAt) superseded.add(applicationId);
        }
        const live = applicationIds.filter((id) => !superseded.has(id));
        return { count: live.length, sample: live.slice(0, size) };
      },
      sampleSize,
    ),
  ]);

  const totals = buckets.reduce(
    (accumulator, bucket) => {
      if (bucket.status === 'ERROR') accumulator.errored += 1;
      const level = bucket.severity.toLowerCase() as 'critical' | 'urgent' | 'warning' | 'info';
      accumulator[level] += bucket.count;
      accumulator.total += bucket.count;
      return accumulator;
    },
    { critical: 0, urgent: 0, warning: 0, info: 0, total: 0, errored: 0 },
  );

  const report: AttentionReport = {
    generatedAt: now.toISOString(),
    scope: options.scope ?? 'GLOBAL',
    scopeId: options.scopeId ?? '',
    generatedFor: options.generatedFor ?? '',
    totals,
    // Sort so the most severe, non-empty buckets surface first.
    buckets: [...buckets].sort((a, b) => {
      const rank: Record<Severity, number> = { CRITICAL: 0, URGENT: 1, WARNING: 2, INFO: 3 };
      if (rank[a.severity] !== rank[b.severity]) return rank[a.severity] - rank[b.severity];
      return b.count - a.count;
    }),
  };

  if (options.persist) {
    try {
      await db.attentionSnapshot.create({
        data: {
          scope: report.scope,
          scopeId: report.scopeId,
          generatedFor: report.generatedFor,
          buckets: JSON.stringify(report.buckets),
          totals: JSON.stringify(report.totals),
        },
      });
    } catch {
      // Persisting the snapshot is an optimisation for trend analysis; failing
      // to store it must not hide the live report from the operator.
    }
  }

  return report;
}
