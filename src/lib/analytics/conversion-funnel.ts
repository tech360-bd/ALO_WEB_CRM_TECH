/**
 * Acquisition-to-enrolment conversion funnel.
 *
 * Answers the question the Google stack exists to answer:
 *
 *   Google Organic → /destinations/uk → 100 leads → 35 qualified →
 *   15 applications → 6 enrolments
 *
 * Built on ALO's own database, not on GA4. GA4 measures what the browser saw;
 * the funnel measures what the CRM actually holds. They will not agree exactly —
 * a lead can be created by a phone call with no web session at all — and the
 * response says so rather than pretending the two are interchangeable.
 *
 * Join paths (both real, both explicit):
 *
 *   Lead.studentId ──────────────────────────► Application.studentId
 *   Lead.studentId ─► Student.studentId ─────► PortalStudentProfile.studentId
 *                                              └► PortalStudentApplication
 *
 * ALO has two application stores and they are NOT the same rows. Both are
 * counted, and the response reports them separately so a discrepancy between
 * the CRM application view and the student-portal view is visible instead of
 * being averaged away.
 *
 * Honesty rules:
 *   - A lead with no `studentId` cannot be joined to an application. Those leads
 *     are counted in `leadsWithoutStudentLink`, NOT silently treated as
 *     "applied and dropped out". Without that number a low conversion rate is
 *     indistinguishable from a broken join.
 *   - Leads with no captured attribution are grouped under `unknown`, never
 *     under `direct`. An unattributed lead is not proof of direct traffic.
 *   - The enrolment definition is returned in the payload. "Enrolled" is not a
 *     single stage in ALO's `Application` model, so the set used is stated
 *     rather than left for a reader to guess.
 */

import type { PrismaClient } from '@prisma/client';

/** How to group the funnel. */
export type FunnelGroupBy = 'channel' | 'source' | 'medium' | 'campaign' | 'landingPage' | 'firstTouchSource';

/**
 * `Application.stage` values that mean the student actually enrolled.
 *
 * ALO's application pipeline has no single `ENROLLED` stage; the enrolment fact
 * is recorded as the university issuing its enrolment document (CAS for the UK,
 * I-20 for the USA, CoE for Australia), a deposit being paid, or the file being
 * handed to visa processing and closed. Any of those means the place was taken.
 *
 * This set is returned with every funnel response so the number is never
 * interpreted against a different definition.
 */
export const ENROLLED_APPLICATION_STAGES = [
  'CAS_RECEIVED',
  'I20_RECEIVED',
  'COE_RECEIVED',
  'DEPOSIT_PAID',
  'VISA_HANDOVER_READY',
  'VISA_FILE_CREATED',
  'CLOSED',
] as const;

/** `PortalStudentApplication.stage` value that means enrolled. */
export const ENROLLED_PORTAL_STAGE = 'enrolled';

/** Lead statuses that mean a human qualified the lead. */
export const QUALIFIED_LEAD_STATUSES = ['QUALIFIED', 'CONVERTED'] as const;

/**
 * Lead tiers that count as qualified.
 *
 * `leadTier` is computed by `scoreLead()` in src/lib/crm-automation.ts, so it is
 * a derived score rather than a human decision. It is counted here because a
 * HOT lead that was never status-changed is still a qualified lead in practice;
 * the response reports how many came from each so the split is visible.
 */
export const QUALIFIED_LEAD_TIERS = ['HOT', 'URGENT'] as const;

export interface FunnelWindow {
  from: string;
  to: string;
}

export interface FunnelRow {
  /** The grouping value, or `unknown` when nothing was captured. */
  key: string;
  channel: string;
  source: string;
  medium: string;
  campaign: string;
  landingPage: string;
  leads: number;
  qualified: number;
  /** Qualified by an explicit status change. */
  qualifiedByStatus: number;
  /** Qualified only by the computed score tier. */
  qualifiedByScore: number;
  applications: number;
  /** Applications in the CRM `Application` store. */
  crmApplications: number;
  /** Applications in the student-portal `PortalStudentApplication` store. */
  portalApplications: number;
  enrolments: number;
  crmEnrolments: number;
  portalEnrolments: number;
  /** Leads that cannot be joined to any application because studentId is null. */
  leadsWithoutStudentLink: number;
  conversionRates: {
    leadToQualified: number | null;
    qualifiedToApplication: number | null;
    applicationToEnrolment: number | null;
    leadToEnrolment: number | null;
  };
}

export interface FunnelResult {
  window: FunnelWindow;
  groupBy: FunnelGroupBy;
  rows: FunnelRow[];
  totals: Omit<FunnelRow, 'key' | 'channel' | 'source' | 'medium' | 'campaign' | 'landingPage' | 'conversionRates'>;
  /** Definition of enrolment used, so the number cannot be misread. */
  enrolmentDefinition: {
    applicationStages: readonly string[];
    portalStage: string;
  };
  /** How many leads in the window had no attribution at all. */
  unattributedLeads: number;
  caveats: string[];
  generatedAt: string;
}

interface LeadRow {
  id: string;
  studentId: string | null;
  status: string;
  leadTier: string;
  source: string | null;
  medium: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  landingPage: string | null;
  firstTouchSource: string | null;
  firstTouchMedium: string | null;
  firstTouchCampaign: string | null;
  firstTouchLandingPage: string | null;
}

/**
 * Resolve the grouping key for one lead.
 *
 * `channel` is `source / medium`, the standard analytics pairing, so
 * "google / organic" and "google / cpc" stay separate — collapsing them is how a
 * paid campaign ends up credited with organic performance.
 */
export function groupKeyFor(lead: LeadRow, groupBy: FunnelGroupBy): string {
  const value = (input: string | null | undefined): string => (input && input.trim() !== '' ? input.trim() : '');
  switch (groupBy) {
    case 'source':
      return value(lead.utmSource) || value(lead.source) || 'unknown';
    case 'medium':
      return value(lead.utmMedium) || value(lead.medium) || 'unknown';
    case 'campaign':
      return value(lead.utmCampaign) || 'unknown';
    case 'landingPage':
      return value(lead.landingPage) || 'unknown';
    case 'firstTouchSource':
      return value(lead.firstTouchSource) || 'unknown';
    case 'channel':
    default: {
      const source = value(lead.utmSource) || value(lead.source);
      const medium = value(lead.utmMedium) || value(lead.medium);
      if (!source && !medium) return 'unknown';
      return `${source || 'unknown'} / ${medium || 'unknown'}`;
    }
  }
}

function rate(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  // Rounded to 4 decimal places: enough for a 0.01% display, and it keeps the
  // JSON free of 0.3499999999999999 artefacts.
  return Math.round((numerator / denominator) * 10000) / 10000;
}

export interface FunnelQuery {
  from: Date;
  to: Date;
  groupBy?: FunnelGroupBy;
  /** Restrict to one destination country, matched on the lead's preference. */
  country?: string;
  /** Cap the rows returned, ordered by lead volume. Default 100. */
  limit?: number;
}

/**
 * Build the funnel.
 *
 * Takes the Prisma client as a parameter so the whole calculation is testable
 * against a stub without a database.
 */
export async function buildConversionFunnel(
  db: PrismaClient,
  query: FunnelQuery,
): Promise<FunnelResult> {
  const groupBy = query.groupBy ?? 'channel';
  const limit = Math.min(Math.max(query.limit ?? 100, 1), 500);

  const where: Record<string, unknown> = {
    createdAt: { gte: query.from, lte: query.to },
    ...(query.country ? { preferredCountry: query.country } : {}),
  };

  // One query for the leads, then a single batched query per application store.
  // Grouping in JS rather than with `groupBy` keeps the nullable attribution
  // columns and the two-store join comprehensible, and the volumes here are
  // marketing-scale rather than event-scale.
  const leads = (await db.lead.findMany({
    where,
    take: 50_000,
    select: {
      id: true,
      studentId: true,
      status: true,
      leadTier: true,
      source: true,
      medium: true,
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      landingPage: true,
      firstTouchSource: true,
      firstTouchMedium: true,
      firstTouchCampaign: true,
      firstTouchLandingPage: true,
      preferredCountry: true,
    },
    orderBy: { createdAt: 'asc' },
  })) as unknown as LeadRow[];

  const studentIds = Array.from(
    new Set(leads.map((lead) => lead.studentId).filter((value): value is string => Boolean(value))),
  );

  // Applications keyed by the canonical student code.
  const crmApplications = studentIds.length
    ? await db.application.findMany({
        where: { studentId: { in: studentIds } },
        select: { studentId: true, stage: true },
      })
    : [];

  // Portal applications join through PortalStudentProfile.studentId, which is
  // unique, so the mapping is unambiguous.
  const portalProfiles = studentIds.length
    ? await db.portalStudentProfile.findMany({
        where: { studentId: { in: studentIds } },
        select: { id: true, studentId: true },
      })
    : [];
  const profileIdToStudentId = new Map(portalProfiles.map((profile) => [profile.id, profile.studentId]));
  const portalApplications = portalProfiles.length
    ? await db.portalStudentApplication.findMany({
        where: { studentProfileId: { in: Array.from(profileIdToStudentId.keys()) } },
        select: { studentProfileId: true, stage: true },
      })
    : [];

  const crmByStudent = new Map<string, { total: number; enrolled: number }>();
  for (const application of crmApplications) {
    const entry = crmByStudent.get(application.studentId) ?? { total: 0, enrolled: 0 };
    entry.total += 1;
    if ((ENROLLED_APPLICATION_STAGES as readonly string[]).includes(application.stage)) entry.enrolled += 1;
    crmByStudent.set(application.studentId, entry);
  }

  const portalByStudent = new Map<string, { total: number; enrolled: number }>();
  for (const application of portalApplications) {
    const studentId = profileIdToStudentId.get(application.studentProfileId);
    if (!studentId) continue;
    const entry = portalByStudent.get(studentId) ?? { total: 0, enrolled: 0 };
    entry.total += 1;
    if (application.stage === ENROLLED_PORTAL_STAGE) entry.enrolled += 1;
    portalByStudent.set(studentId, entry);
  }

  const groups = new Map<string, FunnelRow>();
  let unattributedLeads = 0;

  for (const lead of leads) {
    const key = groupKeyFor(lead, groupBy);
    if (key === 'unknown') unattributedLeads += 1;

    let row = groups.get(key);
    if (!row) {
      row = {
        key,
        channel: groupKeyFor(lead, 'channel'),
        source: lead.utmSource || lead.source || 'unknown',
        medium: lead.utmMedium || lead.medium || 'unknown',
        campaign: lead.utmCampaign || 'unknown',
        landingPage: lead.landingPage || 'unknown',
        leads: 0,
        qualified: 0,
        qualifiedByStatus: 0,
        qualifiedByScore: 0,
        applications: 0,
        crmApplications: 0,
        portalApplications: 0,
        enrolments: 0,
        crmEnrolments: 0,
        portalEnrolments: 0,
        leadsWithoutStudentLink: 0,
        conversionRates: {
          leadToQualified: null,
          qualifiedToApplication: null,
          applicationToEnrolment: null,
          leadToEnrolment: null,
        },
      };
      groups.set(key, row);
    }

    row.leads += 1;

    const byStatus = (QUALIFIED_LEAD_STATUSES as readonly string[]).includes((lead.status || '').toUpperCase());
    const byScore = (QUALIFIED_LEAD_TIERS as readonly string[]).includes((lead.leadTier || '').toUpperCase());
    if (byStatus || byScore) {
      row.qualified += 1;
      if (byStatus) row.qualifiedByStatus += 1;
      else row.qualifiedByScore += 1;
    }

    if (!lead.studentId) {
      // No student record yet, so no application can be joined. Reported
      // separately: this is a data-linkage gap, not a conversion failure.
      row.leadsWithoutStudentLink += 1;
      continue;
    }

    const crm = crmByStudent.get(lead.studentId);
    const portal = portalByStudent.get(lead.studentId);
    const crmTotal = crm?.total ?? 0;
    const portalTotal = portal?.total ?? 0;
    row.crmApplications += crmTotal;
    row.portalApplications += portalTotal;
    row.applications += crmTotal + portalTotal;
    row.crmEnrolments += crm?.enrolled ?? 0;
    row.portalEnrolments += portal?.enrolled ?? 0;
    row.enrolments += (crm?.enrolled ?? 0) + (portal?.enrolled ?? 0);
  }

  const rows = Array.from(groups.values())
    .map((row) => ({
      ...row,
      conversionRates: {
        leadToQualified: rate(row.qualified, row.leads),
        qualifiedToApplication: rate(row.applications, row.qualified),
        applicationToEnrolment: rate(row.enrolments, row.applications),
        leadToEnrolment: rate(row.enrolments, row.leads),
      },
    }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, limit);

  const totals = rows.reduce(
    (accumulator, row) => ({
      leads: accumulator.leads + row.leads,
      qualified: accumulator.qualified + row.qualified,
      qualifiedByStatus: accumulator.qualifiedByStatus + row.qualifiedByStatus,
      qualifiedByScore: accumulator.qualifiedByScore + row.qualifiedByScore,
      applications: accumulator.applications + row.applications,
      crmApplications: accumulator.crmApplications + row.crmApplications,
      portalApplications: accumulator.portalApplications + row.portalApplications,
      enrolments: accumulator.enrolments + row.enrolments,
      crmEnrolments: accumulator.crmEnrolments + row.crmEnrolments,
      portalEnrolments: accumulator.portalEnrolments + row.portalEnrolments,
      leadsWithoutStudentLink: accumulator.leadsWithoutStudentLink + row.leadsWithoutStudentLink,
    }),
    {
      leads: 0,
      qualified: 0,
      qualifiedByStatus: 0,
      qualifiedByScore: 0,
      applications: 0,
      crmApplications: 0,
      portalApplications: 0,
      enrolments: 0,
      crmEnrolments: 0,
      portalEnrolments: 0,
      leadsWithoutStudentLink: 0,
    },
  );

  const caveats = [
    'Built from the ALO database, not from GA4. GA4 counts browser sessions; this counts CRM records, and a lead created by a phone call has no session at all.',
    'Leads with no captured attribution are grouped as "unknown", never as "direct".',
    `A lead with no studentId cannot be joined to an application: ${totals.leadsWithoutStudentLink} of ${totals.leads} leads in this window. Their applications are 0 here because the join is impossible, not because nobody applied.`,
    'CRM and student-portal applications are separate stores and are reported separately rather than merged.',
  ];
  if (unattributedLeads > 0) {
    caveats.push(
      `${unattributedLeads} lead(s) in this window have no attribution at all. Attribution capture was added on 2026-10-19 and is not backfilled, so leads created before that date legitimately show as unknown.`,
    );
  }

  return {
    window: { from: query.from.toISOString(), to: query.to.toISOString() },
    groupBy,
    rows,
    totals,
    enrolmentDefinition: {
      applicationStages: ENROLLED_APPLICATION_STAGES,
      portalStage: ENROLLED_PORTAL_STAGE,
    },
    unattributedLeads,
    caveats,
    generatedAt: new Date().toISOString(),
  };
}
