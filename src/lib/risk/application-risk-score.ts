// ============================================================
// ALO EDUCATION — APPLICATION RISK SCORE (spec s111)
// ============================================================
// Every application gets a GREEN / AMBER / RED risk level derived from REAL
// workflow state: document completeness, deadline proximity, review outcome,
// deposit status, offer conditions, SLA state, visa handover and data
// integrity.
//
// This is an OPERATIONAL triage signal. It is not an admission prediction and
// it never overrides a human decision (spec s93, s116, s125).
//
// The scoring core is a pure function over an explicit input snapshot so it is
// deterministic and unit-testable without a database. `assessApplicationRisk`
// loads the real rows and delegates to it.
// ============================================================

export type RiskLevel = 'GREEN' | 'AMBER' | 'RED';

export interface RiskFactor {
  code: string;
  label: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  points: number;
  detail?: string;
}

/** Everything the scorer needs. No DB access inside the pure core. */
export interface ApplicationRiskInput {
  applicationId: string;
  stage?: string | null;
  safeStatus?: string | null;
  reviewStatus?: string | null;
  documentStatus?: string | null;
  paymentStatus?: string | null;
  depositStatus?: string | null;
  offerStatus?: string | null;
  casI20CoeStatus?: string | null;
  visaHandoverStatus?: string | null;
  slaStatus?: string | null;
  deadlineDate?: Date | string | null;
  universityId?: string | null;
  universityName?: string | null;
  courseId?: string | null;
  courseName?: string | null;
  country?: string | null;
  intake?: string | null;
  /** Documents attached to this application. */
  documents?: Array<{ documentType?: string | null; status?: string | null; required?: boolean | null }>;
  /** Document types the university/programme requires but are absent. */
  missingRequiredDocumentTypes?: string[];
  /** Unmet conditions on a conditional offer. */
  unmetOfferConditions?: number;
  now?: Date;
}

export interface ApplicationRiskResult {
  applicationId: string;
  riskLevel: RiskLevel;
  /** 0 = no risk, 100 = maximum risk. */
  score: number;
  factors: RiskFactor[];
  missingItems: string[];
  evaluatedAt: string;
}

const TERMINAL_STAGES = new Set([
  'REJECTED',
  'WITHDRAWN',
  'DEFERRED',
  'CLOSED',
  'ENROLLED',
]);

const DOCUMENT_BAD_STATUSES = new Set([
  'MISSING',
  'REJECTED',
  'EXPIRED',
  'REQUEST_AGAIN',
]);

const DOCUMENT_OK_STATUSES = new Set(['VERIFIED', 'APPROVED', 'LOCKED', 'UPLOADED', 'UNDER_REVIEW']);

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Pure risk computation. Deterministic: same input -> same output.
 */
export function computeApplicationRisk(input: ApplicationRiskInput): ApplicationRiskResult {
  const now = input.now ?? new Date();
  const factors: RiskFactor[] = [];
  const missingItems: string[] = [];
  const stage = String(input.stage || '').toUpperCase();

  // ----------------------------------------------------------
  // 1. Missing / rejected / expired documents
  // ----------------------------------------------------------
  const documents = input.documents ?? [];
  const badDocuments = documents.filter((document) =>
    DOCUMENT_BAD_STATUSES.has(String(document.status || '').toUpperCase()),
  );
  for (const document of badDocuments) {
    const type = String(document.documentType || 'document').trim();
    factors.push({
      code: 'DOCUMENT_NOT_USABLE',
      label: `Document not usable: ${type}`,
      severity: 'HIGH',
      points: 12,
      detail: String(document.status || '').toUpperCase(),
    });
    missingItems.push(type);
  }

  const declaredMissing = (input.missingRequiredDocumentTypes ?? []).map((type) =>
    String(type || '').trim(),
  ).filter(Boolean);
  for (const type of declaredMissing) {
    const alreadyCounted = badDocuments.some(
      (document) => String(document.documentType || '').trim().toLowerCase() === type.toLowerCase(),
    );
    if (alreadyCounted) continue;
    factors.push({
      code: 'DOCUMENT_MISSING',
      label: `Required document missing: ${type}`,
      severity: 'HIGH',
      points: 14,
    });
    missingItems.push(type);
  }

  if (String(input.documentStatus || '').toUpperCase() === 'INCOMPLETE') {
    factors.push({
      code: 'DOCUMENT_STATUS_INCOMPLETE',
      label: 'Application document status is INCOMPLETE',
      severity: 'MEDIUM',
      // Weighted to the AMBER boundary on its own: an incomplete document set
      // is a genuine submission blocker, not a cosmetic observation.
      points: 18,
    });
  }

  // A file with three or more unusable documents cannot be submitted at all,
  // whatever else is true. Recorded as one explainable aggregate factor rather
  // than relying on arithmetic to cross the RED threshold by coincidence.
  const unusableCount = badDocuments.length + declaredMissing.length;
  if (unusableCount >= 3) {
    factors.push({
      code: 'DOCUMENT_SET_BLOCKING',
      label: `${unusableCount} required documents are unusable — the application cannot be submitted`,
      severity: 'HIGH',
      points: 20,
    });
  }

  // ----------------------------------------------------------
  // 2. Deadline proximity
  // ----------------------------------------------------------
  const deadline = toDate(input.deadlineDate);
  if (deadline && !TERMINAL_STAGES.has(stage)) {
    const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);
    if (daysRemaining < 0) {
      factors.push({
        code: 'DEADLINE_PASSED',
        label: `Deadline passed ${Math.abs(daysRemaining)} day(s) ago`,
        severity: 'HIGH',
        points: 30,
        detail: deadline.toISOString(),
      });
    } else if (daysRemaining <= 3) {
      factors.push({
        code: 'DEADLINE_IMMINENT',
        label: `Deadline in ${daysRemaining} day(s)`,
        severity: 'HIGH',
        points: 22,
        detail: deadline.toISOString(),
      });
    } else if (daysRemaining <= 7) {
      factors.push({
        code: 'DEADLINE_SOON',
        label: `Deadline in ${daysRemaining} day(s)`,
        severity: 'MEDIUM',
        points: 12,
        detail: deadline.toISOString(),
      });
    } else if (daysRemaining <= 21) {
      factors.push({
        code: 'DEADLINE_APPROACHING',
        label: `Deadline in ${daysRemaining} day(s)`,
        severity: 'LOW',
        points: 5,
        detail: deadline.toISOString(),
      });
    }
  }

  // ----------------------------------------------------------
  // 3. Review / decision state
  // ----------------------------------------------------------
  const reviewStatus = String(input.reviewStatus || '').toUpperCase();
  if (reviewStatus === 'NEEDS_MORE_INFO') {
    factors.push({
      code: 'REVIEW_NEEDS_MORE_INFO',
      label: 'Internal review requires more information',
      severity: 'MEDIUM',
      points: 10,
    });
  } else if (reviewStatus === 'REJECTED') {
    factors.push({
      code: 'REVIEW_REJECTED',
      label: 'Internal review rejected',
      severity: 'HIGH',
      points: 25,
    });
  }

  const offerStatus = String(input.offerStatus || '').toUpperCase();
  if (offerStatus === 'REJECTED') {
    factors.push({
      code: 'OFFER_REJECTED',
      label: 'University rejected the application',
      severity: 'HIGH',
      points: 20,
    });
  } else if (offerStatus === 'CONDITIONAL_OFFER') {
    const unmet = Math.max(0, Number(input.unmetOfferConditions ?? 0));
    if (unmet > 0) {
      factors.push({
        code: 'OFFER_CONDITIONS_UNMET',
        label: `${unmet} offer condition(s) still unmet`,
        severity: 'MEDIUM',
        points: 6 * Math.min(unmet, 4),
      });
      missingItems.push('offer_conditions');
    }
  }

  // ----------------------------------------------------------
  // 4. Money
  // ----------------------------------------------------------
  const paymentStatus = String(input.paymentStatus || '').toUpperCase();
  if (paymentStatus === 'OVERDUE') {
    factors.push({
      code: 'PAYMENT_OVERDUE',
      label: 'Application payment overdue',
      severity: 'HIGH',
      points: 18,
    });
    missingItems.push('payment');
  }
  const depositStatus = String(input.depositStatus || '').toUpperCase();
  if (depositStatus === 'OVERDUE') {
    factors.push({
      code: 'DEPOSIT_OVERDUE',
      label: 'Deposit overdue',
      severity: 'HIGH',
      points: 16,
    });
    missingItems.push('deposit');
  } else if (
    depositStatus === 'PENDING' &&
    ['DEPOSIT_PENDING', 'CAS_PENDING', 'I20_PENDING', 'COE_PENDING'].includes(stage)
  ) {
    factors.push({
      code: 'DEPOSIT_BLOCKING_STAGE',
      label: 'Deposit outstanding while the application is blocked on it',
      severity: 'MEDIUM',
      points: 10,
    });
    missingItems.push('deposit');
  }

  // ----------------------------------------------------------
  // 5. CAS / I-20 / CoE and visa handover
  // ----------------------------------------------------------
  const casStatus = String(input.casI20CoeStatus || '').toUpperCase();
  if (['CAS_PENDING', 'I20_PENDING', 'COE_PENDING'].includes(stage) && casStatus === 'NOT_STARTED') {
    factors.push({
      code: 'CONFIRMATION_NOT_STARTED',
      label: 'CAS/COE/I-20 stage reached but confirmation not started',
      severity: 'MEDIUM',
      points: 9,
    });
    missingItems.push('cas_coe_i20');
  }
  const visaHandover = String(input.visaHandoverStatus || '').toUpperCase();
  if (visaHandover === 'NOT_READY' && ['VISA_HANDOVER_READY', 'VISA_FILE_CREATED'].includes(stage)) {
    factors.push({
      code: 'VISA_HANDOVER_NOT_READY',
      label: 'Visa handover expected but readiness is NOT_READY',
      severity: 'HIGH',
      points: 15,
    });
    missingItems.push('visa_handover');
  }

  // ----------------------------------------------------------
  // 6. SLA
  // ----------------------------------------------------------
  const slaStatus = String(input.slaStatus || '').toUpperCase();
  if (slaStatus === 'OVERDUE') {
    factors.push({
      code: 'SLA_OVERDUE',
      label: 'SLA breached',
      severity: 'MEDIUM',
      points: 10,
    });
  } else if (slaStatus === 'DUE_TODAY') {
    factors.push({
      code: 'SLA_DUE_TODAY',
      label: 'SLA due today',
      severity: 'LOW',
      points: 5,
    });
  }

  // ----------------------------------------------------------
  // 7. Data integrity — an application that cannot be traced is unsafe
  // ----------------------------------------------------------
  if (!input.universityId && !String(input.universityName || '').trim()) {
    factors.push({
      code: 'NO_UNIVERSITY',
      label: 'No university recorded',
      severity: 'HIGH',
      points: 20,
    });
    missingItems.push('university');
  }
  if (!input.courseId && !String(input.courseName || '').trim()) {
    factors.push({
      code: 'NO_COURSE',
      label: 'No course/programme recorded',
      severity: 'HIGH',
      points: 18,
    });
    missingItems.push('course');
  }
  if (!String(input.country || '').trim()) {
    factors.push({
      code: 'NO_COUNTRY',
      label: 'No destination country recorded',
      severity: 'MEDIUM',
      points: 10,
    });
    missingItems.push('country');
  }
  if (!String(input.intake || '').trim() && !TERMINAL_STAGES.has(stage)) {
    factors.push({
      code: 'NO_INTAKE',
      label: 'No intake recorded',
      severity: 'LOW',
      points: 5,
    });
    missingItems.push('intake');
  }

  // ----------------------------------------------------------
  // Aggregate
  // ----------------------------------------------------------
  const rawScore = factors.reduce((total, factor) => total + factor.points, 0);
  const score = Math.max(0, Math.min(100, rawScore));

  // A single HIGH-severity data-integrity or overdue-deadline factor is enough
  // to make an application RED regardless of the arithmetic total.
  const hardRed = factors.some((factor) =>
    [
      'DEADLINE_PASSED',
      'NO_UNIVERSITY',
      'NO_COURSE',
      'REVIEW_REJECTED',
      'OFFER_REJECTED',
      'DOCUMENT_SET_BLOCKING',
    ].includes(factor.code),
  );

  let riskLevel: RiskLevel = 'GREEN';
  if (hardRed || score >= 45) riskLevel = 'RED';
  else if (score >= 18) riskLevel = 'AMBER';

  // Terminal/closed applications are reported at their true score but capped
  // at AMBER so they do not dominate live triage queues.
  if (TERMINAL_STAGES.has(stage) && riskLevel === 'RED' && !hardRed) {
    riskLevel = 'AMBER';
  }

  return {
    applicationId: input.applicationId,
    riskLevel,
    score,
    factors: factors.sort((a, b) => b.points - a.points),
    missingItems: Array.from(new Set(missingItems)),
    evaluatedAt: now.toISOString(),
  };
}

export function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 45) return 'RED';
  if (score >= 18) return 'AMBER';
  return 'GREEN';
}

// ============================================================
// Real-data loader + persistence
// ============================================================
import { db } from '@/lib/db';

export interface AssessApplicationOptions {
  /** Persist the assessment row. Defaults to true. */
  persist?: boolean;
  evaluatedById?: string | null;
  evaluatedBy?: string;
  now?: Date;
}

/**
 * Load the real application rows and assess them. Persists an immutable
 * ApplicationRiskAssessment so risk trends remain auditable.
 */
export async function assessApplicationRisk(
  applicationId: string,
  options: AssessApplicationOptions = {},
) {
  const application = await db.application.findUnique({ where: { id: applicationId } });
  if (!application) throw new Error(`Application not found: ${applicationId}`);

  const documents = await db.applicationDocument.findMany({
    where: { applicationId },
    select: { documentType: true, status: true },
  });

  const result = computeApplicationRisk({
    applicationId: application.id,
    stage: application.stage,
    safeStatus: application.safeStatus,
    reviewStatus: application.reviewStatus,
    documentStatus: application.documentStatus,
    paymentStatus: application.paymentStatus,
    depositStatus: application.depositStatus,
    offerStatus: application.offerStatus,
    casI20CoeStatus: application.casI20CoeStatus,
    visaHandoverStatus: application.visaHandoverStatus,
    slaStatus: application.slaStatus,
    deadlineDate: application.deadlineDate,
    universityId: application.universityId,
    universityName: application.universityName,
    courseId: application.courseId,
    courseName: application.courseName,
    country: application.country,
    intake: application.intake,
    documents,
    now: options.now ?? new Date(),
  });

  if (options.persist !== false) {
    await db.applicationRiskAssessment.create({
      data: {
        applicationId,
        studentId: application.studentId || '',
        riskLevel: result.riskLevel,
        score: result.score,
        factors: JSON.stringify(result.factors),
        missingItems: JSON.stringify(result.missingItems),
        evaluatedBy: options.evaluatedBy || 'SYSTEM',
        evaluatedById: options.evaluatedById || null,
        metadata: JSON.stringify({ stage: application.stage, evaluatedAt: result.evaluatedAt }),
      },
    });
  }

  return result;
}

/** Latest persisted risk level per application (for list views). */
export async function latestApplicationRisks(applicationIds: string[]) {
  if (applicationIds.length === 0) return new Map<string, { riskLevel: RiskLevel; score: number }>();
  const rows = await db.applicationRiskAssessment.findMany({
    where: { applicationId: { in: applicationIds } },
    orderBy: { createdAt: 'desc' },
  });
  const latest = new Map<string, { riskLevel: RiskLevel; score: number }>();
  for (const row of rows) {
    if (!latest.has(row.applicationId)) {
      latest.set(row.applicationId, { riskLevel: row.riskLevel as RiskLevel, score: row.score });
    }
  }
  return latest;
}

/** Risk distribution across a filtered set of applications. */
export async function applicationRiskDistribution(where: Record<string, unknown> = {}) {
  const applications = await db.application.findMany({
    where,
    select: { id: true, stage: true },
    take: 2000,
  });
  const risks = await latestApplicationRisks(applications.map((application) => application.id));
  const distribution: Record<RiskLevel, number> = { GREEN: 0, AMBER: 0, RED: 0 };
  let assessed = 0;
  for (const application of applications) {
    const risk = risks.get(application.id);
    if (!risk) continue;
    assessed += 1;
    distribution[risk.riskLevel] = (distribution[risk.riskLevel] || 0) + 1;
  }
  return { total: applications.length, assessed, unassessed: applications.length - assessed, distribution };
}
