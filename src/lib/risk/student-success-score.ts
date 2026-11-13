// ============================================================
// ALO EDUCATION — STUDENT SUCCESS SCORE (spec s112)
// ============================================================
// A NON-GUARANTEED operational support score. It exists to tell counselors
// which students need help today — it is explicitly NOT an admission or visa
// prediction, and the disclaimer is persisted with every assessment so it can
// never be silently dropped by a client (spec s15, s93, s112, s125).
//
// Components (each 0-100, weighted):
//   profile    — how complete the student profile is
//   documents  — required documents uploaded/approved
//   application— whether a real application exists and is progressing
//   financial  — deposit/fee obligations met
//   visa       — reuses the existing VisaReadinessAssessment (no duplication)
//   deadline   — nearest deadline pressure
//
// The scoring core is pure and deterministic so it is unit-testable.
// ============================================================

export type SuccessBand = 'ON_TRACK' | 'NEEDS_SUPPORT' | 'AT_RISK' | 'CRITICAL';

export const SUCCESS_SCORE_DISCLAIMER =
  'Operational support indicator only. This is not a prediction, guarantee or assessment of admission, ' +
  'scholarship or visa approval. Admission and visa decisions are made solely by the institution and the ' +
  'immigration authority. Use this score to prioritise counselor support.';

export interface SuccessComponent {
  key: string;
  label: string;
  score: number;
  weight: number;
  weighted: number;
  detail: string;
}

export interface StudentSuccessInput {
  studentId: string;
  profileCompletePercent?: number | null;
  requiredDocumentCount?: number;
  usableDocumentCount?: number;
  applicationCount?: number;
  submittedApplicationCount?: number;
  offerCount?: number;
  /** True when a deposit or fee is outstanding. */
  hasOutstandingPayment?: boolean;
  /** True when every known financial obligation is settled. */
  financialSettled?: boolean;
  /** Latest VisaReadinessAssessment.overallScore when one exists. */
  visaReadinessScore?: number | null;
  visaAssessed?: boolean;
  nearestDeadline?: Date | string | null;
  journeyStage?: string | null;
  now?: Date;
}

export interface StudentSuccessResult {
  studentId: string;
  score: number;
  band: SuccessBand;
  components: SuccessComponent[];
  nextActions: string[];
  disclaimer: string;
  evaluatedAt: string;
}

const WEIGHTS = {
  profile: 0.15,
  documents: 0.25,
  application: 0.2,
  financial: 0.15,
  visa: 0.15,
  deadline: 0.1,
} as const;

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));

function toDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function bandFromScore(score: number): SuccessBand {
  if (score >= 80) return 'ON_TRACK';
  if (score >= 60) return 'NEEDS_SUPPORT';
  if (score >= 40) return 'AT_RISK';
  return 'CRITICAL';
}

/** Pure, deterministic scoring core. */
export function computeStudentSuccess(input: StudentSuccessInput): StudentSuccessResult {
  const now = input.now ?? new Date();
  const components: SuccessComponent[] = [];
  const nextActions: string[] = [];

  // ---- profile ----
  const profileScore = clamp(Number(input.profileCompletePercent ?? 0) || 0);
  components.push({
    key: 'profile',
    label: 'Profile readiness',
    score: Math.round(profileScore),
    weight: WEIGHTS.profile,
    weighted: profileScore * WEIGHTS.profile,
    detail: `${Math.round(profileScore)}% of profile fields complete`,
  });
  if (profileScore < 80) nextActions.push('Complete the missing student profile fields');

  // ---- documents ----
  const required = Math.max(0, Number(input.requiredDocumentCount ?? 0) || 0);
  const usable = Math.max(0, Number(input.usableDocumentCount ?? 0) || 0);
  // No requirements recorded yet is treated as "unknown", not as "perfect".
  const documentScore = required === 0 ? (usable > 0 ? 60 : 30) : clamp((usable / required) * 100);
  components.push({
    key: 'documents',
    label: 'Document readiness',
    score: Math.round(documentScore),
    weight: WEIGHTS.documents,
    weighted: documentScore * WEIGHTS.documents,
    detail: required === 0 ? `${usable} document(s) on file, no checklist recorded` : `${usable}/${required} required documents usable`,
  });
  if (required > 0 && usable < required) {
    nextActions.push(`Upload the ${required - usable} outstanding required document(s)`);
  }

  // ---- application ----
  const applicationCount = Math.max(0, Number(input.applicationCount ?? 0) || 0);
  const submittedCount = Math.max(0, Number(input.submittedApplicationCount ?? 0) || 0);
  const offerCount = Math.max(0, Number(input.offerCount ?? 0) || 0);
  let applicationScore: number;
  let applicationDetail: string;
  if (applicationCount === 0) {
    applicationScore = 10;
    applicationDetail = 'No application created yet';
    nextActions.push('Create and shortlist at least one application');
  } else if (offerCount > 0) {
    applicationScore = 100;
    applicationDetail = `${offerCount} offer(s) received across ${applicationCount} application(s)`;
  } else if (submittedCount > 0) {
    applicationScore = 75;
    applicationDetail = `${submittedCount}/${applicationCount} application(s) submitted`;
  } else {
    applicationScore = 40;
    applicationDetail = `${applicationCount} application(s) drafted, none submitted`;
    nextActions.push('Move drafted applications to submitted');
  }
  components.push({
    key: 'application',
    label: 'Application readiness',
    score: Math.round(applicationScore),
    weight: WEIGHTS.application,
    weighted: applicationScore * WEIGHTS.application,
    detail: applicationDetail,
  });

  // ---- financial ----
  let financialScore: number;
  let financialDetail: string;
  if (input.hasOutstandingPayment) {
    financialScore = 25;
    financialDetail = 'Outstanding deposit or fee';
    nextActions.push('Settle the outstanding deposit or fee');
  } else if (input.financialSettled) {
    financialScore = 100;
    financialDetail = 'All known financial obligations settled';
  } else {
    financialScore = 60;
    financialDetail = 'No financial obligation recorded yet';
  }
  components.push({
    key: 'financial',
    label: 'Financial readiness',
    score: Math.round(financialScore),
    weight: WEIGHTS.financial,
    weighted: financialScore * WEIGHTS.financial,
    detail: financialDetail,
  });

  // ---- visa (reuses the existing VisaReadinessAssessment) ----
  let visaScore: number;
  let visaDetail: string;
  if (input.visaAssessed && typeof input.visaReadinessScore === 'number') {
    visaScore = clamp(input.visaReadinessScore);
    visaDetail = `Latest visa readiness assessment: ${Math.round(visaScore)}/100`;
  } else {
    // Not assessed is genuinely unknown; score it low-ish so it surfaces as work.
    visaScore = 35;
    visaDetail = 'No visa readiness assessment recorded';
    nextActions.push('Run a visa readiness assessment');
  }
  components.push({
    key: 'visa',
    label: 'Visa readiness',
    score: Math.round(visaScore),
    weight: WEIGHTS.visa,
    weighted: visaScore * WEIGHTS.visa,
    detail: visaDetail,
  });

  // ---- deadline pressure ----
  const deadline = toDate(input.nearestDeadline);
  let deadlineScore = 80;
  let deadlineDetail = 'No upcoming deadline recorded';
  if (deadline) {
    const days = Math.ceil((deadline.getTime() - now.getTime()) / 86_400_000);
    if (days < 0) {
      deadlineScore = 0;
      deadlineDetail = `A deadline passed ${Math.abs(days)} day(s) ago`;
      nextActions.push('Resolve the passed deadline immediately');
    } else if (days <= 7) {
      deadlineScore = 30;
      deadlineDetail = `Nearest deadline in ${days} day(s)`;
      nextActions.push(`Act on the deadline in ${days} day(s)`);
    } else if (days <= 30) {
      deadlineScore = 65;
      deadlineDetail = `Nearest deadline in ${days} day(s)`;
    } else {
      deadlineScore = 90;
      deadlineDetail = `Nearest deadline in ${days} day(s)`;
    }
  }
  components.push({
    key: 'deadline',
    label: 'Deadline readiness',
    score: Math.round(deadlineScore),
    weight: WEIGHTS.deadline,
    weighted: deadlineScore * WEIGHTS.deadline,
    detail: deadlineDetail,
  });

  const totalWeight = components.reduce((sum, component) => sum + component.weight, 0);
  const rawScore = components.reduce((sum, component) => sum + component.weighted, 0);
  const score = Math.round(clamp(totalWeight > 0 ? rawScore / totalWeight : 0));

  return {
    studentId: input.studentId,
    score,
    band: bandFromScore(score),
    components,
    nextActions: Array.from(new Set(nextActions)),
    disclaimer: SUCCESS_SCORE_DISCLAIMER,
    evaluatedAt: now.toISOString(),
  };
}

// ============================================================
// Real-data loader + persistence
// ============================================================
import { db } from '@/lib/db';

const USABLE_DOCUMENT_STATUSES = ['APPROVED', 'VERIFIED', 'UPLOADED', 'LOCKED'];

export interface AssessStudentOptions {
  persist?: boolean;
  evaluatedBy?: string;
  now?: Date;
}

/** Build the scoring input from real student rows. */
export async function loadStudentSuccessInput(studentId: string, now = new Date()): Promise<StudentSuccessInput> {
  const student = await db.student.findUnique({
    where: { id: studentId },
    select: { id: true, profileComplete: true, journeyStage: true },
  });
  if (!student) throw new Error(`Student not found: ${studentId}`);

  const [documents, applications, payments, latestVisa] = await Promise.all([
    db.document.findMany({
      where: { studentId },
      select: { required: true, status: true },
    }),
    db.application.findMany({
      where: { studentId },
      select: { id: true, stage: true, offerStatus: true, deadlineDate: true },
      orderBy: { deadlineDate: 'asc' },
    }),
    db.payment.findMany({
      where: { studentId },
      select: { status: true },
    }),
    db.visaReadinessAssessment.findFirst({
      where: { studentId },
      orderBy: { assessedAt: 'desc' },
      select: { overallScore: true },
    }),
  ]);

  const requiredDocuments = documents.filter((document) => document.required);
  const usableDocuments = requiredDocuments.filter((document) =>
    USABLE_DOCUMENT_STATUSES.includes(String(document.status || '').toUpperCase()),
  );

  const SUBMITTED_STAGES = [
    'SUBMITTED_TO_UNIVERSITY',
    'ACKNOWLEDGEMENT_RECEIVED',
    'DECISION_PENDING',
    'CONDITIONAL_OFFER',
    'UNCONDITIONAL_OFFER',
    'DEPOSIT_PENDING',
    'DEPOSIT_PAID',
    'CAS_PENDING',
    'CAS_RECEIVED',
    'I20_PENDING',
    'I20_RECEIVED',
    'COE_PENDING',
    'COE_RECEIVED',
    'VISA_HANDOVER_READY',
    'VISA_FILE_CREATED',
    'CLOSED',
  ];

  const submitted = applications.filter((application) =>
    SUBMITTED_STAGES.includes(String(application.stage || '').toUpperCase()),
  );
  const offers = applications.filter((application) =>
    ['CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER'].includes(String(application.offerStatus || '').toUpperCase()),
  );

  const upcoming = applications
    .map((application) => (application.deadlineDate ? new Date(application.deadlineDate) : null))
    .filter((date): date is Date => Boolean(date) && !Number.isNaN((date as Date).getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  const hasOutstandingPayment = payments.some((payment) =>
    ['PENDING', 'OVERDUE'].includes(String(payment.status || '').toUpperCase()),
  );
  const financialSettled =
    payments.length > 0 &&
    payments.every((payment) => ['PAID', 'REFUNDED'].includes(String(payment.status || '').toUpperCase()));

  return {
    studentId: student.id,
    profileCompletePercent: Number(student.profileComplete ?? 0) || 0,
    requiredDocumentCount: requiredDocuments.length,
    usableDocumentCount: usableDocuments.length,
    applicationCount: applications.length,
    submittedApplicationCount: submitted.length,
    offerCount: offers.length,
    hasOutstandingPayment,
    financialSettled,
    visaReadinessScore: latestVisa ? latestVisa.overallScore : null,
    visaAssessed: Boolean(latestVisa),
    nearestDeadline: upcoming[0] ?? null,
    journeyStage: student.journeyStage,
    now,
  };
}

/** Assess a student from real data and persist the snapshot. */
export async function assessStudentSuccess(studentId: string, options: AssessStudentOptions = {}) {
  const now = options.now ?? new Date();
  const input = await loadStudentSuccessInput(studentId, now);
  const result = computeStudentSuccess(input);

  if (options.persist !== false) {
    await db.studentSuccessAssessment.create({
      data: {
        studentId,
        score: result.score,
        band: result.band,
        components: JSON.stringify(result.components),
        nextActions: JSON.stringify(result.nextActions),
        disclaimer: result.disclaimer,
        evaluatedBy: options.evaluatedBy || 'SYSTEM',
      },
    });
  }

  return result;
}

/** Band distribution for management dashboards. */
export async function studentSuccessDistribution(limit = 2000) {
  const rows = await db.studentSuccessAssessment.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: { studentId: true, band: true, score: true },
  });
  const latest = new Map<string, { band: SuccessBand; score: number }>();
  for (const row of rows) {
    if (!latest.has(row.studentId)) latest.set(row.studentId, { band: row.band as SuccessBand, score: row.score });
  }
  const distribution: Record<SuccessBand, number> = { ON_TRACK: 0, NEEDS_SUPPORT: 0, AT_RISK: 0, CRITICAL: 0 };
  for (const entry of latest.values()) {
    distribution[entry.band] = (distribution[entry.band] || 0) + 1;
  }
  return { students: latest.size, distribution };
}
