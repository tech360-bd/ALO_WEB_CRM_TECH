// Parent/guardian access and consent contracts (spec s13, s67, s69, s99).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    student: { findUnique: vi.fn() },
    parentGuardian: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    parentGuardianConsent: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    parentGuardianPaymentResponsibility: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    application: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { db } from '@/lib/db';
import {
  ACCESS_LEVEL_CAPABILITIES,
  PARENT_FORBIDDEN_FIELDS,
  addPaymentResponsibility,
  buildParentStudentView,
  canContactParent,
  createParentGuardian,
  hasActiveConsent,
  normalizeAccessLevel,
  parentFinancialSummary,
  recordConsent,
  recordResponsibilityPayment,
  resolveParentAccess,
} from '@/lib/parent-guardian';

const studentFindUnique = db.student.findUnique as unknown as ReturnType<typeof vi.fn>;
const parentCreate = db.parentGuardian.create as unknown as ReturnType<typeof vi.fn>;
const parentFindUnique = db.parentGuardian.findUnique as unknown as ReturnType<typeof vi.fn>;
const consentCreate = db.parentGuardianConsent.create as unknown as ReturnType<typeof vi.fn>;
const consentFindFirst = db.parentGuardianConsent.findFirst as unknown as ReturnType<typeof vi.fn>;
const responsibilityCreate = db.parentGuardianPaymentResponsibility.create as unknown as ReturnType<typeof vi.fn>;
const responsibilityFindUnique = db.parentGuardianPaymentResponsibility.findUnique as unknown as ReturnType<typeof vi.fn>;
const responsibilityFindMany = db.parentGuardianPaymentResponsibility.findMany as unknown as ReturnType<typeof vi.fn>;
const responsibilityUpdate = db.parentGuardianPaymentResponsibility.update as unknown as ReturnType<typeof vi.fn>;
const applicationFindMany = db.application.findMany as unknown as ReturnType<typeof vi.fn>;
const transaction = db.$transaction as unknown as ReturnType<typeof vi.fn>;

function parentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'par-1',
    studentId: 'stu-1',
    userId: 'user-1',
    fullName: 'Father Name',
    relationship: 'FATHER',
    email: 'father@example.com',
    phone: '+8801700000000',
    communicationPrefs: '["EMAIL","SMS"]',
    notificationPrefs: '["EMAIL"]',
    accessLevel: 'LIMITED',
    portalEnabled: true,
    status: 'ACTIVE',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  // Run the transaction callback with the same mock surface.
  transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(db));
});

describe('Access levels (s13)', () => {
  it('normalises unknown or missing levels to NONE — fail closed', () => {
    expect(normalizeAccessLevel('FULL_JOURNEY')).toBe('FULL_JOURNEY');
    expect(normalizeAccessLevel('limited')).toBe('LIMITED');
    expect(normalizeAccessLevel('')).toBe('NONE');
    expect(normalizeAccessLevel(null)).toBe('NONE');
    expect(normalizeAccessLevel('SUPERUSER')).toBe('NONE');
    expect(normalizeAccessLevel(undefined)).toBe('NONE');
  });

  it('gives NONE no capabilities at all', () => {
    expect(ACCESS_LEVEL_CAPABILITIES.NONE).toEqual([]);
  });

  it('gives LIMITED less than FULL_JOURNEY', () => {
    expect(ACCESS_LEVEL_CAPABILITIES.LIMITED.length).toBeLessThan(
      ACCESS_LEVEL_CAPABILITIES.FULL_JOURNEY.length,
    );
    // Contact details are private unless the family explicitly widened access.
    expect(ACCESS_LEVEL_CAPABILITIES.LIMITED).not.toContain('student.contact');
    expect(ACCESS_LEVEL_CAPABILITIES.FULL_JOURNEY).toContain('student.contact');
  });

  it('never grants internal notes, commission or B2B data at any level', () => {
    for (const level of ['NONE', 'LIMITED', 'FULL_JOURNEY'] as const) {
      for (const capability of ACCESS_LEVEL_CAPABILITIES[level]) {
        expect(capability).not.toMatch(/internal|commission|b2b|audit|risk|review/i);
      }
    }
    expect(PARENT_FORBIDDEN_FIELDS).toContain('internalNotes');
    expect(PARENT_FORBIDDEN_FIELDS).toContain('commissionAmount');
    expect(PARENT_FORBIDDEN_FIELDS).toContain('isB2bConfidential');
  });
});

describe('resolveParentAccess — the single gate (s67, s99)', () => {
  it('denies an unknown parent', async () => {
    parentFindUnique.mockResolvedValue(null);
    const decision = await resolveParentAccess('ghost');
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('PARENT_NOT_FOUND');
    expect(decision.capabilities).toEqual([]);
  });

  it('denies a suspended parent', async () => {
    parentFindUnique.mockResolvedValue(parentRow({ status: 'SUSPENDED' }));
    const decision = await resolveParentAccess('par-1');
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('PARENT_STATUS_SUSPENDED');
  });

  it('denies when accessLevel is NONE', async () => {
    parentFindUnique.mockResolvedValue(parentRow({ accessLevel: 'NONE' }));
    const decision = await resolveParentAccess('par-1');
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('ACCESS_LEVEL_NONE');
  });

  it('denies when the portal is not enabled', async () => {
    parentFindUnique.mockResolvedValue(parentRow({ portalEnabled: false }));
    const decision = await resolveParentAccess('par-1');
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('PORTAL_NOT_ENABLED');
  });

  it('denies a cross-student read attempt (IDOR)', async () => {
    parentFindUnique.mockResolvedValue(parentRow({ studentId: 'stu-1' }));
    const decision = await resolveParentAccess('par-1', 'stu-OTHER');
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe('CROSS_STUDENT_ACCESS_DENIED');
  });

  it('allows access to the parent own student', async () => {
    parentFindUnique.mockResolvedValue(parentRow());
    const decision = await resolveParentAccess('par-1', 'stu-1');
    expect(decision.allowed).toBe(true);
    expect(decision.accessLevel).toBe('LIMITED');
    expect(decision.capabilities.length).toBeGreaterThan(0);
  });

  it('still returns the forbidden-field list when allowed, so callers can enforce it', async () => {
    parentFindUnique.mockResolvedValue(parentRow());
    const decision = await resolveParentAccess('par-1');
    expect(decision.allowed).toBe(true);
    expect(decision.forbiddenFields).toBe(PARENT_FORBIDDEN_FIELDS);
  });
});

describe('Consent (s67)', () => {
  it('requires a known consent type', async () => {
    await expect(
      recordConsent({ parentId: 'par-1', consentType: 'SELL_DATA', granted: true }),
    ).rejects.toThrow(/Unsupported consent type/);
  });

  it('records a grant with a timestamp and no revocation', async () => {
    parentFindUnique.mockResolvedValue(parentRow());
    consentCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'c1', ...data }));

    const consent = await recordConsent({
      parentId: 'par-1',
      consentType: 'communication',
      granted: true,
      method: 'PORTAL',
      version: '2.0',
    });
    expect(consent.consentType).toBe('COMMUNICATION');
    expect(consent.grantedAt).toBeInstanceOf(Date);
    expect(consent.revokedAt).toBeNull();
    expect(consent.version).toBe('2.0');
  });

  it('records a revocation with a timestamp', async () => {
    parentFindUnique.mockResolvedValue(parentRow());
    consentCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'c2', ...data }));
    const consent = await recordConsent({ parentId: 'par-1', consentType: 'COMMUNICATION', granted: false });
    expect(consent.grantedAt).toBeNull();
    expect(consent.revokedAt).toBeInstanceOf(Date);
  });

  it('treats only the LATEST consent row as current, and a revocation wins', async () => {
    consentFindFirst.mockResolvedValue({ granted: true, revokedAt: new Date() });
    expect(await hasActiveConsent('par-1', 'COMMUNICATION')).toBe(false);

    consentFindFirst.mockResolvedValue({ granted: false, revokedAt: null });
    expect(await hasActiveConsent('par-1', 'COMMUNICATION')).toBe(false);

    consentFindFirst.mockResolvedValue({ granted: true, revokedAt: null });
    expect(await hasActiveConsent('par-1', 'COMMUNICATION')).toBe(true);

    consentFindFirst.mockResolvedValue(null);
    expect(await hasActiveConsent('par-1', 'COMMUNICATION')).toBe(false);
  });

  it('queries the latest consent ordered by creation', async () => {
    consentFindFirst.mockResolvedValue(null);
    await hasActiveConsent('par-1', 'data_sharing');
    const args = consentFindFirst.mock.calls[0][0];
    expect(args.where.consentType).toBe('DATA_SHARING');
    expect(args.orderBy).toEqual({ createdAt: 'desc' });
  });
});

describe('Contact gating — consent plus channel preference (s67, s9)', () => {
  it('allows a channel that is preferred AND consented', async () => {
    parentFindUnique.mockResolvedValue(parentRow({ communicationPrefs: '["EMAIL","SMS"]', status: 'ACTIVE' }));
    consentFindFirst.mockResolvedValue({ granted: true, revokedAt: null });
    expect(await canContactParent('par-1', 'EMAIL')).toBe(true);
    expect(await canContactParent('par-1', 'SMS')).toBe(true);
  });

  it('refuses a channel the parent did not opt into, even with consent', async () => {
    parentFindUnique.mockResolvedValue(parentRow({ communicationPrefs: '["EMAIL"]' }));
    consentFindFirst.mockResolvedValue({ granted: true, revokedAt: null });
    expect(await canContactParent('par-1', 'WHATSAPP')).toBe(false);
  });

  it('refuses every channel without COMMUNICATION consent', async () => {
    parentFindUnique.mockResolvedValue(parentRow({ communicationPrefs: '["EMAIL","SMS","WHATSAPP"]' }));
    consentFindFirst.mockResolvedValue({ granted: false, revokedAt: null });
    expect(await canContactParent('par-1', 'EMAIL')).toBe(false);
  });

  it('refuses when the parent is inactive or unknown', async () => {
    parentFindUnique.mockResolvedValue(parentRow({ status: 'SUSPENDED' }));
    consentFindFirst.mockResolvedValue({ granted: true, revokedAt: null });
    expect(await canContactParent('par-1', 'EMAIL')).toBe(false);

    parentFindUnique.mockResolvedValue(null);
    expect(await canContactParent('ghost', 'EMAIL')).toBe(false);
  });

  it('survives corrupt preference JSON', async () => {
    parentFindUnique.mockResolvedValue(parentRow({ communicationPrefs: '{broken' }));
    consentFindFirst.mockResolvedValue({ granted: true, revokedAt: null });
    expect(await canContactParent('par-1', 'EMAIL')).toBe(false);
  });
});

describe('Parent creation', () => {
  it('refuses an unknown student', async () => {
    studentFindUnique.mockResolvedValue(null);
    await expect(
      createParentGuardian({ studentId: 'ghost', fullName: 'Mother' }),
    ).rejects.toThrow(/Student not found/);
  });

  it('requires a name', async () => {
    studentFindUnique.mockResolvedValue({ id: 'stu-1' });
    await expect(createParentGuardian({ studentId: 'stu-1', fullName: '   ' })).rejects.toThrow(
      /full name is required/i,
    );
  });

  it('forces portalEnabled off when the access level is NONE', async () => {
    studentFindUnique.mockResolvedValue({ id: 'stu-1' });
    parentCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'par-1', ...data }));

    await createParentGuardian({ studentId: 'stu-1', fullName: 'M', accessLevel: 'NONE', portalEnabled: true });
    expect(parentCreate.mock.calls[0][0].data.portalEnabled).toBe(false);
  });

  it('filters unsupported channels and de-duplicates preferences', async () => {
    studentFindUnique.mockResolvedValue({ id: 'stu-1' });
    parentCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'par-1', ...data }));

    await createParentGuardian({
      studentId: 'stu-1',
      fullName: 'M',
      communicationPrefs: ['email', 'EMAIL', 'PIGEON', 'SMS'] as never,
    });
    expect(JSON.parse(parentCreate.mock.calls[0][0].data.communicationPrefs)).toEqual(['EMAIL', 'SMS']);
  });

  it('records consents inside the same transaction as the parent', async () => {
    studentFindUnique.mockResolvedValue({ id: 'stu-1' });
    parentCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: 'par-1',
      studentId: data.studentId,
      ...data,
    }));
    consentCreate.mockResolvedValue({ id: 'c1' });

    await createParentGuardian({
      studentId: 'stu-1',
      fullName: 'M',
      consents: [
        { consentType: 'COMMUNICATION', granted: true, method: 'PORTAL' },
        { consentType: 'BOGUS', granted: true },
      ],
    });
    // The unsupported consent type must be dropped, not stored.
    expect(consentCreate).toHaveBeenCalledTimes(1);
    expect(consentCreate.mock.calls[0][0].data.consentType).toBe('COMMUNICATION');
  });
});

describe('Parent-facing student view strips confidential data (s13, s69)', () => {
  it('returns nothing when access is denied', async () => {
    parentFindUnique.mockResolvedValue(parentRow({ portalEnabled: false }));
    const view = await buildParentStudentView('par-1');
    expect(view.allowed).toBe(false);
    expect(view.student).toBeNull();
    expect(view.applications).toEqual([]);
  });

  it('hides university, course and contact detail at LIMITED level', async () => {
    parentFindUnique.mockResolvedValue(parentRow({ accessLevel: 'LIMITED' }));
    studentFindUnique.mockResolvedValue({
      id: 'stu-1',
      name: 'Student',
      journeyStage: 'application',
      email: 'student@example.com',
      phone: '+8801700000000',
    });
    applicationFindMany.mockResolvedValue([
      {
        id: 'app-1',
        universityName: 'Aston University',
        courseName: 'MSc Data Science',
        country: 'UK',
        intake: 'Sep 2027',
        safeStatus: 'SUBMITTED',
        deadlineDate: new Date('2026-12-01'),
      },
    ]);

    const view = await buildParentStudentView('par-1');
    expect(view.allowed).toBe(true);
    expect(view.student).toEqual({ id: 'stu-1', name: 'Student', journeyStage: 'application' });
    expect(view.applications[0]).toEqual({
      id: 'app-1',
      universityName: '',
      courseName: '',
      country: '',
      intake: '',
      status: 'SUBMITTED',
      deadlineDate: expect.any(Date),
    });
  });

  it('reveals university and course only at FULL_JOURNEY', async () => {
    parentFindUnique.mockResolvedValue(parentRow({ accessLevel: 'FULL_JOURNEY' }));
    studentFindUnique.mockResolvedValue({
      id: 'stu-1',
      name: 'Student',
      journeyStage: 'application',
      email: 'student@example.com',
      phone: '+8801700000000',
    });
    applicationFindMany.mockResolvedValue([
      {
        id: 'app-1',
        universityName: 'Aston University',
        courseName: 'MSc Data Science',
        country: 'UK',
        intake: 'Sep 2027',
        safeStatus: 'SUBMITTED',
        deadlineDate: null,
      },
    ]);

    const view = await buildParentStudentView('par-1');
    expect(view.applications[0].universityName).toBe('Aston University');
    expect(view.applications[0].courseName).toBe('MSc Data Science');
    expect(view.student).toMatchObject({ email: 'student@example.com' });
  });

  it('never selects internal fields from the database', async () => {
    parentFindUnique.mockResolvedValue(parentRow());
    studentFindUnique.mockResolvedValue({ id: 'stu-1', name: 'S', journeyStage: 'x', email: '', phone: '' });
    applicationFindMany.mockResolvedValue([]);

    await buildParentStudentView('par-1');

    const applicationSelect = applicationFindMany.mock.calls[0][0].select;
    for (const forbidden of ['internalNotes', 'notes', 'reviewStatus', 'counselorName', 'partnerId', 'isB2bConfidential']) {
      expect(Object.keys(applicationSelect)).not.toContain(forbidden);
    }
    const studentSelect = studentFindUnique.mock.calls[0][0].select;
    expect(Object.keys(studentSelect)).not.toContain('password');
  });
});

describe('Financial responsibility (s13, s26)', () => {
  it('refuses an unknown parent', async () => {
    parentFindUnique.mockResolvedValue(null);
    await expect(addPaymentResponsibility({ parentId: 'ghost', amount: 100 })).rejects.toThrow(
      /not found/i,
    );
  });

  it('never stores a negative amount', async () => {
    parentFindUnique.mockResolvedValue(parentRow());
    responsibilityCreate.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({ id: 'r1', ...data }));
    await addPaymentResponsibility({ parentId: 'par-1', amount: -500 });
    expect(responsibilityCreate.mock.calls[0][0].data.amount).toBe(0);
  });

  it('rejects a non-positive payment', async () => {
    responsibilityFindUnique.mockResolvedValue({ id: 'r1', amount: 1000, paidAmount: 0 });
    await expect(recordResponsibilityPayment('r1', 0)).rejects.toThrow(/greater than zero/);
    await expect(recordResponsibilityPayment('r1', -10)).rejects.toThrow(/greater than zero/);
  });

  it('caps paidAmount at the owed amount — no phantom credit', async () => {
    responsibilityFindUnique.mockResolvedValue({ id: 'r1', amount: 1000, paidAmount: 900 });
    responsibilityUpdate.mockResolvedValue({ id: 'r1' });
    const result = await recordResponsibilityPayment('r1', 500);
    expect(result.paidAmount).toBe(1000);
    expect(result.outstanding).toBe(0);
    expect(result.status).toBe('PAID');
  });

  it('computes PARTIAL and PENDING from the real numbers', async () => {
    responsibilityFindUnique.mockResolvedValue({ id: 'r1', amount: 1000, paidAmount: 0 });
    responsibilityUpdate.mockResolvedValue({ id: 'r1' });
    expect((await recordResponsibilityPayment('r1', 400)).status).toBe('PARTIAL');

    responsibilityFindUnique.mockResolvedValue({ id: 'r2', amount: 0, paidAmount: 0 });
    expect((await recordResponsibilityPayment('r2', 10)).status).toBe('PAID');
  });

  it('never lets outstanding go negative in the summary', async () => {
    responsibilityFindMany.mockResolvedValue([
      { parentId: 'p1', amount: 1000, paidAmount: 1200, scope: 'TUITION', currency: 'USD', status: 'PAID', dueDate: null, parent: { fullName: 'F', relationship: 'FATHER' } },
      { parentId: 'p2', amount: 500, paidAmount: 100, scope: 'DEPOSIT', currency: 'USD', status: 'PARTIAL', dueDate: null, parent: { fullName: 'M', relationship: 'MOTHER' } },
    ]);
    const summary = await parentFinancialSummary('stu-1');
    expect(summary.totalAmount).toBe(1500);
    expect(summary.totalPaid).toBe(1300);
    expect(summary.outstanding).toBe(200);
    expect(summary.byParent[0].outstanding).toBe(0);
    expect(summary.byParent[1].outstanding).toBe(400);
  });
});
