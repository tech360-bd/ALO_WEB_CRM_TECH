import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  calls: [] as Array<{ operation: string; args: any }>,
  tx: {} as any,
  db: {} as any,
  syncApprovedChange: vi.fn(async () => ({ paths: [], tags: [], auditEvent: 'COURSE_DATA_APPROVED', syncedAt: new Date().toISOString(), errors: [] })),
}));

vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: (...args: unknown[]) => mocks.auth(...args) }));
vi.mock('@/lib/db', () => ({ db: mocks.db }));
vi.mock('@/lib/university-monitoring-sync', () => ({ syncApprovedChange: (...args: unknown[]) => mocks.syncApprovedChange(...args) }));

import { PATCH } from '@/app/api/university-monitoring/changes/[id]/route';
import { NextRequest } from 'next/server';

const ORIGIN = 'https://alo.test';
const detectedAt = new Date('2026-10-01T00:00:00.000Z');
const priorUpdatedAt = new Date('2026-09-20T00:00:00.000Z');
const source = {
  id: 'source-1',
  sourceUrl: 'https://www.exampleuni.ac.uk/courses/msc-data',
  sourceName: 'Example University course catalogue',
  sourceType: 'UNIVERSITY_OFFICIAL',
  entityType: 'COURSE',
  universitySlug: 'example-university',
  courseSlug: 'msc-data',
  countrySlug: 'uk',
  verificationStatus: 'verified',
  status: 'ACTIVE',
  monitoringEnabled: true,
  lastContentHash: 'snapshot-hash',
};
const snapshot = {
  id: 'snapshot-1',
  sourceId: source.id,
  contentHash: source.lastContentHash,
  finalUrl: source.sourceUrl,
  textExtract: 'MSc Data Science is the current official course title. Applications open in September 2027.',
  aiKeyFacts: '{}',
};
const current = {
  id: 'change-1',
  status: 'PENDING',
  entityType: 'COURSE',
  changeType: 'COURSE_RENAMED',
  fieldName: 'course_title',
  universitySlug: source.universitySlug,
  courseSlug: source.courseSlug,
  countrySlug: source.countrySlug,
  oldValue: 'MSc Data',
  newValue: 'MSc Data Science',
  sourceUrl: source.sourceUrl,
  sourceId: source.id,
  snapshotId: snapshot.id,
  detectedAt,
  source,
};
const value = {
  id: 'value-1',
  changeId: current.id,
  fieldName: current.fieldName,
  oldValue: current.oldValue,
  newValue: current.newValue,
  oldValueHash: createHash('sha256').update(current.oldValue).digest('hex'),
  newValueHash: createHash('sha256').update(current.newValue).digest('hex'),
  evidenceQuote: 'MSc Data Science is the current official course title.',
  sourceUrl: source.sourceUrl,
};
const page = {
  id: 'page-1',
  slug: current.courseSlug,
  name: current.oldValue,
  city: 'London',
  level: 'Masters',
  subject: 'Data Science',
  duration: '1 year',
  tuition: 'GBP 20,000 per year',
  deadline: '',
  modules: '[]',
  careerOutcomes: '[]',
  internationalEligibility: 'eligible_for_international_students',
  englishRequirement: 'IELTS 6.5',
  academicRequirement: 'Bachelor degree',
  sourceUrl: 'https://www.exampleuni.ac.uk',
  verificationStatus: 'VERIFIED',
  approvalStatus: 'PUBLISHED',
  updatedAt: priorUpdatedAt,
};
const crmCourse = {
  id: 'crm-course-1',
  courseId: 'C-1',
  slug: current.courseSlug,
  courseTitle: current.oldValue,
  name: current.oldValue,
  courseCode: 'EX-101',
  studyLevel: 'Masters',
  programLevel: 'Masters',
  qualification: 'MSc',
  subjectArea: 'Data Science',
  disciplineArea: 'Data Science',
  deliveryMode: 'Full-time',
  attendanceMode: 'On campus',
  campus: 'Main campus',
  city: 'London',
  internationalEligibility: 'eligible_for_international_students',
  tuitionFee: 20000,
  currency: 'GBP',
  tuitionPeriod: 'per year',
  officialUrl: source.sourceUrl,
  officialApplicationUrl: '',
  deadline: '',
  status: 'active',
  publicationStatus: 'published',
  updatedAt: priorUpdatedAt,
};

function request(action: string, id = current.id, origin = ORIGIN) {
  return new NextRequest(`${ORIGIN}/api/university-monitoring/changes/${id}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', origin },
    body: JSON.stringify({ action, notes: 'Reviewed source quote and current catalogue value.' }),
  });
}

function makeTx(overrides: Record<string, any> = {}) {
  const calls = mocks.calls;
  const fn = (operation: string, impl: (args?: any) => any = () => null) => async (args?: any) => {
    calls.push({ operation, args });
    return impl(args);
  };
  const tx: Record<string, any> = {
    dataChange: {
      findUnique: fn('dataChange.findUnique', () => ({ ...current, source, values: [value] })),
      update: fn('dataChange.update', (args) => ({ ...current, ...args.data })),
    },
    officialSource: { findUnique: fn('officialSource.findUnique', () => ({ ...source })) },
    sourceSnapshot: {
      findUnique: fn('sourceSnapshot.findUnique', () => ({ ...snapshot })),
      findFirst: fn('sourceSnapshot.findFirst', () => ({ ...snapshot })),
    },
    dataChangeValue: { findFirst: fn('dataChangeValue.findFirst', () => ({ ...value })) },
    approvalAction: { create: fn('approvalAction.create', (args) => ({ id: 'approval-1', ...args.data })) },
    approvalQueueItem: { updateMany: fn('approvalQueueItem.updateMany', () => ({ count: 1 })) },
    auditLog: { create: fn('auditLog.create', () => ({ id: 'audit-1' })) },
    monitoringLog: { create: fn('monitoringLog.create', () => ({ id: 'log-1' })) },
    coursePage: {
      findUnique: fn('coursePage.findUnique', () => ({ ...page })),
      update: fn('coursePage.update', (args) => ({ ...page, ...args.data })),
    },
    crmCourse: {
      findFirst: fn('crmCourse.findFirst', () => ({ ...crmCourse })),
      update: fn('crmCourse.update', (args) => ({ ...crmCourse, ...args.data })),
    },
    courseHistory: { create: fn('courseHistory.create', (args) => args.data) },
    universityPage: { findUnique: fn('universityPage.findUnique', () => null) },
    crmUniversity: { findFirst: fn('crmUniversity.findFirst', () => null) },
    ...overrides,
  };
  return tx;
}

beforeEach(() => {
  vi.stubEnv('NEXTAUTH_URL', ORIGIN);
  mocks.calls.length = 0;
  mocks.syncApprovedChange.mockClear();
  mocks.auth.mockResolvedValue({
    userId: 'super-1', actorUserId: 'super-1', userType: 'SUPER_ADMIN',
    identityDomain: 'user', authenticationMethod: 'cookie', roles: ['SUPER_ADMIN'],
    email: 'super@example.test', name: 'Monitoring Super Admin',
  });
  mocks.tx = makeTx();
  mocks.db.$transaction = vi.fn(async (callback: any) => callback(mocks.tx));
});

describe('university monitoring approval safety', () => {
  it('applies an evidenced change atomically, preserves the actual old value, and syncs afterward', async () => {
    const response = await PATCH(request('APPROVE'), { params: Promise.resolve({ id: current.id }) });
    expect(response.status).toBe(200);
    const pageWrite = mocks.calls.find((call) => call.operation === 'coursePage.update')?.args.data;
    expect(pageWrite).toEqual({ sourceUrl: source.sourceUrl, name: current.newValue });
    expect(pageWrite).not.toHaveProperty('verificationStatus');
    const crmWrite = mocks.calls.find((call) => call.operation === 'crmCourse.update')?.args.data;
    expect(crmWrite).toMatchObject({ courseTitle: current.newValue, name: current.newValue, sourceUrl: source.sourceUrl });
    expect(crmWrite).not.toHaveProperty('lastVerifiedAt');
    const history = mocks.calls.find((call) => call.operation === 'courseHistory.create')?.args.data;
    expect(history).toMatchObject({ oldValue: 'MSc Data', newValue: 'MSc Data Science', approvedBy: 'super-1', changeId: current.id });
    expect(mocks.calls.find((call) => call.operation === 'auditLog.create')?.args.data).toMatchObject({ action: 'MONITORING_CHANGE_APPROVED', userId: 'super-1' });
    expect(mocks.syncApprovedChange).toHaveBeenCalledTimes(1);
  });

  it('rejects a candidate when production changed after detection and writes nothing', async () => {
    mocks.tx = makeTx({
      coursePage: { findUnique: async (args: any) => ({ ...page, updatedAt: new Date('2026-10-02T00:00:00.000Z') }), update: async () => { throw new Error('must not write'); } },
    });
    const response = await PATCH(request('APPROVE'), { params: Promise.resolve({ id: current.id }) });
    expect(response.status).toBe(409);
    expect(mocks.calls.some((call) => call.operation === 'coursePage.update')).toBe(false);
    expect(mocks.calls.some((call) => call.operation === 'courseHistory.create')).toBe(false);
    expect(mocks.syncApprovedChange).not.toHaveBeenCalled();
  });

  it('rejects a candidate when the recorded old value differs from the actual pre-write value', async () => {
    mocks.tx = makeTx({
      coursePage: {
        findUnique: async () => ({ ...page, name: 'MSc Data Analytics', updatedAt: priorUpdatedAt }),
        update: async () => { throw new Error('must not write'); },
      },
    });
    const response = await PATCH(request('APPROVE'), { params: Promise.resolve({ id: current.id }) });
    expect(response.status).toBe(409);
    expect(mocks.calls.some((call) => call.operation === 'courseHistory.create')).toBe(false);
  });

  it('requires the evidence hash, quote, source version, and current official-source status', async () => {
    const cases = [
      makeTx({ dataChangeValue: { findFirst: async () => ({ ...value, newValueHash: 'bad-hash' }) } }),
      makeTx({ dataChangeValue: { findFirst: async () => ({ ...value, evidenceQuote: 'This quote is not in the snapshot.' }) } }),
      makeTx({ sourceSnapshot: { findUnique: async () => ({ ...snapshot }), findFirst: async () => ({ ...snapshot, id: 'newer-snapshot' }) } }),
      makeTx({ officialSource: { findUnique: async () => ({ ...source, status: 'PAUSED' }) } }),
    ];
    for (const tx of cases) {
      mocks.calls.length = 0;
      mocks.tx = tx;
      const response = await PATCH(request('APPROVE'), { params: Promise.resolve({ id: current.id }) });
      expect(response.status).toBe(409);
      expect(mocks.calls.some((call) => call.operation === 'coursePage.update')).toBe(false);
      expect(mocks.calls.some((call) => call.operation === 'courseHistory.create')).toBe(false);
    }
  });

  it('rejects without mutating production and refuses unsupported Mark Verified semantics', async () => {
    const rejected = await PATCH(request('REJECT'), { params: Promise.resolve({ id: current.id }) });
    expect(rejected.status).toBe(200);
    expect(mocks.calls.some((call) => call.operation === 'coursePage.update')).toBe(false);
    expect(mocks.calls.some((call) => call.operation === 'courseHistory.create')).toBe(false);
    expect(mocks.syncApprovedChange).not.toHaveBeenCalled();

    const mark = await PATCH(request('MARK_VERIFIED'), { params: Promise.resolve({ id: current.id }) });
    expect(mark.status).toBe(400);
  });

  it('publishes CRM tuition only when amount, explicit currency, and annual period are in the cited value', async () => {
    const tuitionChange = {
      ...current,
      changeType: 'FEE_CHANGED',
      fieldName: 'tuition_international',
      oldValue: 'GBP 20,000 per year',
      newValue: 'GBP 25,000 per year',
    };
    const tuitionSnapshot = {
      ...snapshot,
      textExtract: 'Official international tuition is GBP 25,000 per year for this course.',
    };
    const tuitionValue = {
      ...value,
      fieldName: 'tuition_international',
      oldValue: tuitionChange.oldValue,
      newValue: tuitionChange.newValue,
      newValueHash: createHash('sha256').update(tuitionChange.newValue).digest('hex'),
      evidenceQuote: 'Official international tuition is GBP 25,000 per year for this course.',
    };
    mocks.tx = makeTx({
      dataChange: {
        findUnique: async () => ({ ...tuitionChange, source, values: [tuitionValue] }),
        update: async (args: any) => ({ ...tuitionChange, ...args.data }),
      },
      sourceSnapshot: { findUnique: async () => tuitionSnapshot, findFirst: async () => tuitionSnapshot },
      dataChangeValue: { findFirst: async () => tuitionValue },
      coursePage: {
        findUnique: async () => ({ ...page, tuition: 'GBP 20,000 per year', updatedAt: priorUpdatedAt }),
        update: async (args: any) => { mocks.calls.push({ operation: 'coursePage.update', args }); return { ...page, ...args.data }; },
      },
      crmCourse: {
        findFirst: async () => ({ ...crmCourse, updatedAt: priorUpdatedAt }),
        update: async (args: any) => { mocks.calls.push({ operation: 'crmCourse.update', args }); return { ...crmCourse, ...args.data }; },
      },
    });
    const response = await PATCH(request('APPROVE'), { params: Promise.resolve({ id: current.id }) });
    expect(response.status).toBe(200);
    expect(mocks.calls.find((call) => call.operation === 'crmCourse.update')?.args.data).toMatchObject({ tuitionFee: 25000, currency: 'GBP', tuitionPeriod: 'per year' });

    const nonAnnual = 'GBP 25,000';
    const unsafeChange = { ...tuitionChange, newValue: nonAnnual };
    const unsafeSnapshot = { ...tuitionSnapshot, textExtract: `Official international tuition is ${nonAnnual} for this course.` };
    const unsafeValue = { ...tuitionValue, newValue: nonAnnual, newValueHash: createHash('sha256').update(nonAnnual).digest('hex'), evidenceQuote: unsafeSnapshot.textExtract };
    mocks.calls.length = 0;
    mocks.tx = makeTx({
      dataChange: { findUnique: async () => ({ ...unsafeChange, source, values: [unsafeValue] }), update: async (args: any) => ({ ...unsafeChange, ...args.data }) },
      sourceSnapshot: { findUnique: async () => unsafeSnapshot, findFirst: async () => unsafeSnapshot },
      dataChangeValue: { findFirst: async () => unsafeValue },
      coursePage: { findUnique: async () => ({ ...page, tuition: 'GBP 20,000 per year', updatedAt: priorUpdatedAt }) },
      crmCourse: { findFirst: async () => ({ ...crmCourse, updatedAt: priorUpdatedAt }) },
    });
    const refused = await PATCH(request('APPROVE'), { params: Promise.resolve({ id: current.id }) });
    expect(refused.status).toBe(409);
    expect(mocks.calls.some((call) => call.operation === 'crmCourse.update')).toBe(false);
  });
});
