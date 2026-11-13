// ============================================================
// ALO EDUCATION — PARENT / GUARDIAN SERVICE (spec s13, s67)
// ============================================================
// Study-abroad decisions are frequently parent-led, and parents often carry
// the financial responsibility. Before this module the only parent data in the
// system was two flat strings (guardianName / guardianPhone) on
// PortalStudentProfile, which could not express relationship, consent,
// communication preference, financial responsibility or controlled access.
//
// Privacy rules enforced here (s67):
//  * A parent NEVER sees internal counselor notes, other students, partner
//    commission data or confidential B2B fields — access is level-gated.
//  * Consent is an explicit, versioned, revocable record. Communication is
//    only allowed where a current granted consent exists.
//  * Portal access requires BOTH portalEnabled AND an accessLevel above NONE.
// ============================================================

import { db } from '@/lib/db';

export const RELATIONSHIPS = ['FATHER', 'MOTHER', 'GUARDIAN', 'SPOUSE', 'SIBLING', 'UNCLE', 'AUNT', 'GRANDPARENT', 'OTHER'] as const;
export type Relationship = (typeof RELATIONSHIPS)[number];

export const ACCESS_LEVELS = ['NONE', 'LIMITED', 'FULL_JOURNEY'] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const CONSENT_TYPES = [
  'DATA_SHARING',
  'COMMUNICATION',
  'FINANCIAL',
  'DOCUMENT_ACCESS',
  'THIRD_PARTY_DISCLOSURE',
] as const;
export type ConsentType = (typeof CONSENT_TYPES)[number];

export const CHANNELS = ['EMAIL', 'SMS', 'WHATSAPP', 'PHONE', 'IN_APP'] as const;
export type Channel = (typeof CHANNELS)[number];

export const RESPONSIBILITY_SCOPES = ['TUITION', 'DEPOSIT', 'SERVICE_FEE', 'ACCOMMODATION', 'TRAVEL', 'ALL'] as const;

/** What a parent may see at each access level. */
export const ACCESS_LEVEL_CAPABILITIES: Record<AccessLevel, string[]> = {
  NONE: [],
  LIMITED: [
    'student.name',
    'journey.stage',
    'application.status_safe',
    'deadline.dates',
    'payment.own_responsibility',
    'notification.own',
  ],
  FULL_JOURNEY: [
    'student.name',
    'student.contact',
    'journey.stage',
    'journey.timeline',
    'application.status_safe',
    'application.university',
    'application.course',
    'deadline.dates',
    'document.own_checklist',
    'payment.own_responsibility',
    'visa.stage_safe',
    'notification.own',
  ],
};

/** Data a parent must NEVER see, regardless of access level. */
export const PARENT_FORBIDDEN_FIELDS = [
  'internalNotes',
  'counselorNotes',
  'reviewStatus',
  'commissionAmount',
  'partnerCommission',
  'isB2bConfidential',
  'b2bProviderId',
  'riskFlags',
  'auditLogs',
] as const;

export interface CreateParentInput {
  studentId: string;
  fullName: string;
  relationship?: Relationship | string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  country?: string;
  city?: string;
  occupation?: string;
  isPrimaryContact?: boolean;
  isFinancialSponsor?: boolean;
  communicationPrefs?: Channel[];
  notificationPrefs?: Channel[];
  accessLevel?: AccessLevel;
  portalEnabled?: boolean;
  notes?: string;
  actorId?: string | null;
  /** Consents recorded at creation time. */
  consents?: Array<{
    consentType: ConsentType | string;
    granted: boolean;
    method?: string;
    evidenceRef?: string;
    version?: string;
    ipAddress?: string;
  }>;
}

function normalizeChannels(value: unknown): Channel[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(CHANNELS);
  return Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim().toUpperCase())
        .filter((item) => allowed.has(item)),
    ),
  ) as Channel[];
}

export function normalizeAccessLevel(value: unknown): AccessLevel {
  const normalized = String(value || '').trim().toUpperCase();
  return (ACCESS_LEVELS as readonly string[]).includes(normalized) ? (normalized as AccessLevel) : 'NONE';
}

export async function createParentGuardian(input: CreateParentInput) {
  const student = await db.student.findUnique({
    where: { id: input.studentId },
    select: { id: true },
  });
  if (!student) throw new Error(`Student not found: ${input.studentId}`);

  const fullName = String(input.fullName || '').trim();
  if (!fullName) throw new Error('Parent/guardian full name is required');

  const accessLevel = normalizeAccessLevel(input.accessLevel ?? 'LIMITED');
  const communicationPrefs = normalizeChannels(input.communicationPrefs ?? ['EMAIL']);

  // Portal access is meaningless without an access level, and dangerous
  // without a contact channel. Fail closed rather than silently downgrading.
  const portalEnabled = Boolean(input.portalEnabled) && accessLevel !== 'NONE';

  return db.$transaction(async (tx) => {
    const parent = await tx.parentGuardian.create({
      data: {
        studentId: student.id,
        fullName,
        relationship: String(input.relationship || 'OTHER').toUpperCase(),
        email: String(input.email || '').trim(),
        phone: String(input.phone || '').trim(),
        whatsapp: String(input.whatsapp || '').trim(),
        country: String(input.country || '').trim(),
        city: String(input.city || '').trim(),
        occupation: String(input.occupation || '').trim(),
        isPrimaryContact: Boolean(input.isPrimaryContact),
        isFinancialSponsor: Boolean(input.isFinancialSponsor),
        communicationPrefs: JSON.stringify(communicationPrefs),
        notificationPrefs: JSON.stringify(normalizeChannels(input.notificationPrefs ?? communicationPrefs)),
        accessLevel,
        portalEnabled,
        status: 'ACTIVE',
        notes: String(input.notes || ''),
        createdBy: input.actorId || '',
        updatedBy: input.actorId || '',
      },
    });

    for (const consent of input.consents ?? []) {
      const consentType = String(consent.consentType || '').toUpperCase();
      if (!(CONSENT_TYPES as readonly string[]).includes(consentType)) continue;
      await tx.parentGuardianConsent.create({
        data: {
          parentId: parent.id,
          studentId: student.id,
          consentType,
          granted: Boolean(consent.granted),
          grantedAt: consent.granted ? new Date() : null,
          revokedAt: consent.granted ? null : new Date(),
          method: consent.method || '',
          evidenceRef: consent.evidenceRef || '',
          ipAddress: consent.ipAddress || '',
          version: consent.version || '1.0',
        },
      });
    }

    return parent;
  });
}

export async function listParentsForStudent(studentId: string) {
  const parents = await db.parentGuardian.findMany({
    where: { studentId },
    orderBy: [{ isPrimaryContact: 'desc' }, { createdAt: 'asc' }],
    include: { consents: { orderBy: { createdAt: 'desc' } }, responsibilities: true },
  });
  return parents.map((parent) => ({
    ...parent,
    communicationPrefs: safeParseArray(parent.communicationPrefs),
    notificationPrefs: safeParseArray(parent.notificationPrefs),
    capabilities: ACCESS_LEVEL_CAPABILITIES[normalizeAccessLevel(parent.accessLevel)],
  }));
}

function safeParseArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

// ============================================================
// Consent — explicit, versioned, revocable
// ============================================================
export interface RecordConsentInput {
  parentId: string;
  consentType: ConsentType | string;
  granted: boolean;
  method?: string;
  evidenceRef?: string;
  version?: string;
  ipAddress?: string;
}

export async function recordConsent(input: RecordConsentInput) {
  const consentType = String(input.consentType || '').toUpperCase();
  if (!(CONSENT_TYPES as readonly string[]).includes(consentType)) {
    throw new Error(`Unsupported consent type: ${input.consentType}`);
  }
  const parent = await db.parentGuardian.findUnique({ where: { id: input.parentId } });
  if (!parent) throw new Error(`Parent/guardian not found: ${input.parentId}`);

  const now = new Date();
  return db.parentGuardianConsent.create({
    data: {
      parentId: parent.id,
      studentId: parent.studentId,
      consentType,
      granted: Boolean(input.granted),
      grantedAt: input.granted ? now : null,
      revokedAt: input.granted ? null : now,
      method: input.method || '',
      evidenceRef: input.evidenceRef || '',
      ipAddress: input.ipAddress || '',
      version: input.version || '1.0',
    },
  });
}

/** Is there a CURRENT granted consent of this type? Revocations win. */
export async function hasActiveConsent(parentId: string, consentType: string): Promise<boolean> {
  const latest = await db.parentGuardianConsent.findFirst({
    where: { parentId, consentType: String(consentType).toUpperCase() },
    orderBy: { createdAt: 'desc' },
  });
  return Boolean(latest?.granted) && !latest?.revokedAt;
}

// ============================================================
// Access control — the single gate every parent-facing route must use
// ============================================================
export interface ParentAccessDecision {
  allowed: boolean;
  reason: string;
  accessLevel: AccessLevel;
  capabilities: string[];
  forbiddenFields: readonly string[];
}

/**
 * Resolve what a specific parent may access. Every parent-facing API route
 * must call this and MUST NOT widen the result.
 */
export async function resolveParentAccess(
  parentId: string,
  requestedStudentId?: string,
): Promise<ParentAccessDecision> {
  const parent = await db.parentGuardian.findUnique({ where: { id: parentId } });
  if (!parent) return deny('PARENT_NOT_FOUND');
  if (parent.status !== 'ACTIVE') return deny(`PARENT_STATUS_${parent.status}`);

  const accessLevel = normalizeAccessLevel(parent.accessLevel);
  if (accessLevel === 'NONE') return deny('ACCESS_LEVEL_NONE', accessLevel);
  if (!parent.portalEnabled) return deny('PORTAL_NOT_ENABLED', accessLevel);

  // Cross-student access is always refused: a parent record belongs to exactly
  // one student, and requesting another one is an IDOR attempt.
  if (requestedStudentId && requestedStudentId !== parent.studentId) {
    return deny('CROSS_STUDENT_ACCESS_DENIED', accessLevel);
  }

  return {
    allowed: true,
    reason: 'OK',
    accessLevel,
    capabilities: ACCESS_LEVEL_CAPABILITIES[accessLevel],
    forbiddenFields: PARENT_FORBIDDEN_FIELDS,
  };
}

function deny(reason: string, accessLevel: AccessLevel = 'NONE'): ParentAccessDecision {
  return {
    allowed: false,
    reason,
    accessLevel,
    capabilities: [],
    forbiddenFields: PARENT_FORBIDDEN_FIELDS,
  };
}

/** Can this parent receive a message on this channel right now? */
export async function canContactParent(parentId: string, channel: Channel): Promise<boolean> {
  const parent = await db.parentGuardian.findUnique({ where: { id: parentId } });
  if (!parent || parent.status !== 'ACTIVE') return false;
  const prefs = safeParseArray(parent.communicationPrefs) as Channel[];
  if (!prefs.includes(channel)) return false;
  // COMMUNICATION consent is mandatory before any outbound message (s67).
  return hasActiveConsent(parentId, 'COMMUNICATION');
}

// ============================================================
// Financial responsibility
// ============================================================
export interface AddResponsibilityInput {
  parentId: string;
  applicationId?: string;
  scope?: string;
  amount?: number;
  currency?: string;
  dueDate?: Date | string | null;
  notes?: string;
}

export async function addPaymentResponsibility(input: AddResponsibilityInput) {
  const parent = await db.parentGuardian.findUnique({ where: { id: input.parentId } });
  if (!parent) throw new Error(`Parent/guardian not found: ${input.parentId}`);
  const amount = Math.max(0, Number(input.amount ?? 0) || 0);

  return db.parentGuardianPaymentResponsibility.create({
    data: {
      parentId: parent.id,
      studentId: parent.studentId,
      applicationId: input.applicationId || '',
      scope: String(input.scope || 'ALL').toUpperCase(),
      amount,
      currency: String(input.currency || 'USD').toUpperCase(),
      paidAmount: 0,
      status: amount > 0 ? 'PENDING' : 'PENDING',
      dueDate: input.dueDate ? new Date(input.dueDate) : null,
      notes: input.notes || '',
    },
  });
}

/**
 * Record a payment against a responsibility. Never lets paidAmount exceed
 * amount and recomputes status from the real numbers (no manual override).
 */
export async function recordResponsibilityPayment(
  responsibilityId: string,
  amount: number,
): Promise<{ status: string; paidAmount: number; outstanding: number }> {
  const responsibility = await db.parentGuardianPaymentResponsibility.findUnique({
    where: { id: responsibilityId },
  });
  if (!responsibility) throw new Error(`Payment responsibility not found: ${responsibilityId}`);

  const payment = Math.max(0, Number(amount) || 0);
  if (payment <= 0) throw new Error('Payment amount must be greater than zero');

  const paidAmount = Math.min(responsibility.amount, responsibility.paidAmount + payment);
  const outstanding = Math.max(0, responsibility.amount - paidAmount);
  const status = outstanding <= 0 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING';

  await db.parentGuardianPaymentResponsibility.update({
    where: { id: responsibilityId },
    data: { paidAmount, status },
  });

  return { status, paidAmount, outstanding };
}

export async function parentFinancialSummary(studentId: string) {
  const responsibilities = await db.parentGuardianPaymentResponsibility.findMany({
    where: { studentId },
    include: { parent: { select: { id: true, fullName: true, relationship: true } } },
  });
  const totalAmount = responsibilities.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalPaid = responsibilities.reduce((sum, item) => sum + (item.paidAmount || 0), 0);
  return {
    studentId,
    responsibilities: responsibilities.length,
    totalAmount,
    totalPaid,
    outstanding: Math.max(0, totalAmount - totalPaid),
    byParent: responsibilities.map((item) => ({
      parentId: item.parentId,
      parentName: item.parent.fullName,
      relationship: item.parent.relationship,
      scope: item.scope,
      amount: item.amount,
      paidAmount: item.paidAmount,
      outstanding: Math.max(0, item.amount - item.paidAmount),
      currency: item.currency,
      status: item.status,
      dueDate: item.dueDate,
    })),
  };
}

/**
 * Build the SAFE student view for a parent. Strips every forbidden field and
 * only includes what the resolved access level permits.
 */
export async function buildParentStudentView(parentId: string) {
  const access = await resolveParentAccess(parentId);
  if (!access.allowed) {
    return { allowed: false, reason: access.reason, student: null, applications: [], deadlines: [] };
  }

  const parent = await db.parentGuardian.findUnique({ where: { id: parentId } });
  if (!parent) return { allowed: false, reason: 'PARENT_NOT_FOUND', student: null, applications: [], deadlines: [] };

  const student = await db.student.findUnique({
    where: { id: parent.studentId },
    select: { id: true, name: true, journeyStage: true, email: true, phone: true },
  });

  const applications = await db.application.findMany({
    where: { studentId: parent.studentId },
    select: {
      id: true,
      universityName: true,
      courseName: true,
      country: true,
      intake: true,
      // safeStatus is the externally-shareable projection; `stage` and
      // reviewStatus are internal and are deliberately not selected.
      safeStatus: true,
      deadlineDate: true,
    },
    orderBy: { deadlineDate: 'asc' },
    take: 50,
  });

  const fullJourney = access.accessLevel === 'FULL_JOURNEY';
  const safeStudent = student
    ? {
        id: student.id,
        name: student.name,
        journeyStage: student.journeyStage,
        ...(fullJourney ? { email: student.email, phone: student.phone } : {}),
      }
    : null;

  return {
    allowed: true,
    reason: 'OK',
    accessLevel: access.accessLevel,
    capabilities: access.capabilities,
    student: safeStudent,
    applications: applications.map((application) => ({
      id: application.id,
      universityName: fullJourney ? application.universityName : '',
      courseName: fullJourney ? application.courseName : '',
      country: fullJourney ? application.country : '',
      intake: fullJourney ? application.intake : '',
      status: application.safeStatus,
      deadlineDate: application.deadlineDate,
    })),
    deadlines: applications
      .filter((application) => application.deadlineDate)
      .map((application) => ({ applicationId: application.id, date: application.deadlineDate })),
  };
}
