/**
 * Catalogue Phase 1 security regressions (2026-10-12), K1–K3.
 *
 * Mocked: `@/lib/db` (recording fakes) and `@/lib/auth-middleware`
 * (`authenticateRequest` returns the test identity; `withAuth` reproduces the
 * real `requireUserTypes` check). These are handler-logic tests, not database
 * or end-to-end proof. Unauthenticated behaviour with the REAL auth middleware
 * is covered in catalogue-phase1-real-auth.test.ts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => {
  const calls: Array<{ op: string; args: any }> = [];
  const rec = (op: string, impl?: (args: any) => any) => vi.fn(async (args: any) => {
    calls.push({ op, args });
    return impl ? impl(args) : null;
  });
  return { calls, rec, auth: vi.fn(), db: {} as any };
});

vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: (...args: unknown[]) => m.auth(...args),
  withAuth: (handler: any, opts?: { requireUserTypes?: string[] }) => async (req: Request) => {
    const auth = await m.auth(req);
    if (auth instanceof Response) return auth;
    if (opts?.requireUserTypes?.length && !opts.requireUserTypes.includes(auth.userType)) {
      return new Response(JSON.stringify({ error: 'Insufficient access level.' }), { status: 403 });
    }
    return handler(req, auth);
  },
}));
vi.mock('@/lib/db', () => ({ db: m.db }));
vi.mock('@/lib/university-monitoring-sync', () => ({ syncApprovedChange: vi.fn(async () => ({ ok: true })) }));

import { PATCH as importCenterPATCH, GET as importCenterGET } from '@/app/api/import-center/route';
import { POST as cfaPOST, PATCH as cfaPATCH, DELETE as cfaDELETE } from '@/app/api/course-finder/admin/route';
import { GET as sourceLogsGET, POST as sourceLogsPOST } from '@/app/api/source-logs/route';
import { GET as dataQualityGET, POST as dataQualityPOST } from '@/app/api/data-quality/route';
import { PATCH as monitoringPATCH } from '@/app/api/university-monitoring/changes/[id]/route';
import { isAcceptableSourceUrl, sanitizeCoursePageFields } from '@/lib/course-finder/content-page-guards';
import { NextRequest } from 'next/server';

const ORIGIN = 'https://alo.test';
const admin = { userId: 'u-admin', actorUserId: 'u-admin', userType: 'ADMIN', identityDomain: 'user', authenticationMethod: 'cookie', roles: [], email: 'a@alo.test' };
const superAdmin = { ...admin, userId: 'u-super', actorUserId: 'u-super', userType: 'SUPER_ADMIN' };
const marketing = { ...admin, userId: 'u-mkt', actorUserId: 'u-mkt', userType: 'MARKETING_MANAGER' };
const student = { ...admin, userId: 'u-stu', actorUserId: 'u-stu', userType: 'STUDENT', identityDomain: 'student' };
const partner = { ...admin, userId: 'u-par', actorUserId: 'u-par', userType: 'PARTNER', identityDomain: 'portal' };
const staffWithAdminRoleClaim = { ...admin, userType: 'COUNSELOR', roles: ['admin', 'super_admin'] };

const VERIFIED_PAGE = {
  id: 'cp1', slug: 'msc-data', name: 'MSc Data', universitySlug: 'uni-a', countrySlug: 'uk', city: 'London',
  level: 'Masters', subject: 'Data', duration: '1 year', intake: 'September', tuition: 'GBP 20000',
  scholarship: null, englishRequirement: 'IELTS 6.5', academicRequirement: '2:1', overview: 'Overview',
  modules: '[]', careerOutcomes: '[]', documents: '[]', faqs: '[]', deadline: null,
  sourceUrl: 'https://www.uni-a.ac.uk/msc-data', verificationStatus: 'VERIFIED', approvalStatus: 'PUBLISHED',
  updatedAt: new Date('2026-10-01T00:00:00Z'), lastVerifiedAt: new Date('2026-09-01T00:00:00Z'),
};

function req(url: string, method = 'GET', body?: unknown, origin: string | null = ORIGIN) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (origin) headers.origin = origin;
  return new NextRequest(`${ORIGIN}${url}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
}
const writes = () => m.calls.filter((c) => /\.(create|update|updateMany|upsert|delete)$/.test(c.op));

function resetDb(pageRecord: any = VERIFIED_PAGE) {
  m.calls.length = 0;
  const page = (name: string) => ({
    findUnique: m.rec(`${name}.findUnique`, () => (pageRecord ? { ...pageRecord } : null)),
    findMany: m.rec(`${name}.findMany`, () => []),
    count: m.rec(`${name}.count`, () => 0),
    create: m.rec(`${name}.create`, (a) => ({ id: 'new', ...a.data })),
    update: m.rec(`${name}.update`, (a) => ({ ...pageRecord, ...a.data })),
    updateMany: m.rec(`${name}.updateMany`, () => ({ count: 1 })),
    delete: m.rec(`${name}.delete`, () => ({})),
  });
  Object.assign(m.db, {
    countryPage: page('countryPage'), universityPage: page('universityPage'), coursePage: page('coursePage'), examPage: page('examPage'),
    auditLog: { create: m.rec('auditLog.create', () => ({})) },
    sourceLog: { findMany: m.rec('sourceLog.findMany', () => []), create: m.rec('sourceLog.create', (a) => ({ id: 'sl1', ...a.data })) },
    officialSource: { findMany: m.rec('officialSource.findMany', () => []), create: m.rec('officialSource.create', () => ({})) },
    countrySource: { findMany: m.rec('countrySource.findMany', () => []) },
    crmSourceLog: { findMany: m.rec('crmSourceLog.findMany', () => []) },
    crmCourse: { findFirst: m.rec('crmCourse.findFirst', () => ({ courseId: 'C1', university: {}, intakeFees: [], requirements: [], scholarshipRecords: [] })) },
    crmUniversity: { findFirst: m.rec('crmUniversity.findFirst', () => null) },
    crmCourseIntakeFee: { findMany: m.rec('crmCourseIntakeFee.findMany', () => []) },
    entryRequirement: { findMany: m.rec('entryRequirement.findMany', () => []) },
    englishRequirement: { findMany: m.rec('englishRequirement.findMany', () => []) },
    dataQualityScore: { findMany: m.rec('dataQualityScore.findMany', () => []), upsert: m.rec('dataQualityScore.upsert', () => ({})) },
  });
}

beforeEach(() => {
  vi.stubEnv('NEXTAUTH_URL', ORIGIN);
  m.auth.mockReset();
  m.auth.mockResolvedValue(admin);
  resetDb();
});

// ---------------------------------------------------------------- K1
describe('K1 /api/import-center PATCH never verifies through approval, rejection or publication', () => {
  it('reject and approve change approvalStatus only, never verificationStatus', async () => {
    for (const [action, status] of [['reject', 'DRAFT'], ['approve', 'PENDING_REVIEW']] as const) {
      resetDb({ ...VERIFIED_PAGE, verificationStatus: 'UNVERIFIED', approvalStatus: 'PENDING_REVIEW' });
      const res = await importCenterPATCH(req('/api/import-center', 'PATCH', { type: 'course', slug: 'msc-data', action }));
      expect(res.status, action).toBe(200);
      const upd = m.calls.find((c) => c.op === 'coursePage.updateMany');
      expect(upd?.args.data).toEqual({ approvalStatus: status });
      expect(JSON.stringify(writes().map((w) => w.args.data))).not.toContain('"verificationStatus":"VERIFIED"');
    }
  });

  it('refuses to publish an unverified item or one without an https official source', async () => {
    for (const record of [
      { ...VERIFIED_PAGE, verificationStatus: 'UNVERIFIED', approvalStatus: 'DRAFT' },
      { ...VERIFIED_PAGE, approvalStatus: 'DRAFT', sourceUrl: 'http://www.uni-a.ac.uk/x' },
      { ...VERIFIED_PAGE, approvalStatus: 'DRAFT', sourceUrl: 'https://catalogue.example.com/x' },
      { ...VERIFIED_PAGE, approvalStatus: 'DRAFT', sourceUrl: null },
    ]) {
      resetDb(record);
      const res = await importCenterPATCH(req('/api/import-center', 'PATCH', { type: 'university', slug: 'msc-data', action: 'publish' }));
      expect(res.status).toBe(409);
      expect(writes()).toHaveLength(0);
    }
  });

  it('publishes a VERIFIED item with a source, guarded against concurrent change', async () => {
    resetDb({ ...VERIFIED_PAGE, approvalStatus: 'DRAFT' });
    const res = await importCenterPATCH(req('/api/import-center', 'PATCH', { type: 'course', slug: 'msc-data', action: 'publish' }));
    expect(res.status).toBe(200);
    const upd = m.calls.find((c) => c.op === 'coursePage.updateMany');
    expect(upd?.args).toMatchObject({ where: { slug: 'msc-data', verificationStatus: 'VERIFIED' }, data: { approvalStatus: 'PUBLISHED' } });
    (m.db.coursePage.updateMany as any).mockResolvedValueOnce({ count: 0 });
    const raced = await importCenterPATCH(req('/api/import-center', 'PATCH', { type: 'course', slug: 'msc-data', action: 'publish' }));
    expect(raced.status).toBe(409);
  });

  it('verify is SUPER_ADMIN only, needs an https official source, and does not publish', async () => {
    resetDb({ ...VERIFIED_PAGE, verificationStatus: 'UNVERIFIED', approvalStatus: 'DRAFT' });
    expect((await importCenterPATCH(req('/api/import-center', 'PATCH', { type: 'course', slug: 'msc-data', action: 'verify' }))).status).toBe(403);
    expect(writes()).toHaveLength(0);

    m.auth.mockResolvedValue({ ...superAdmin, actorUserId: 'someone-else' }); // impersonating
    expect((await importCenterPATCH(req('/api/import-center', 'PATCH', { type: 'course', slug: 'msc-data', action: 'verify' }))).status).toBe(403);

    m.auth.mockResolvedValue(superAdmin);
    resetDb({ ...VERIFIED_PAGE, verificationStatus: 'UNVERIFIED', approvalStatus: 'DRAFT', sourceUrl: '' });
    expect((await importCenterPATCH(req('/api/import-center', 'PATCH', { type: 'course', slug: 'msc-data', action: 'verify' }))).status).toBe(409);

    resetDb({ ...VERIFIED_PAGE, verificationStatus: 'UNVERIFIED', approvalStatus: 'DRAFT' });
    const ok = await importCenterPATCH(req('/api/import-center', 'PATCH', { type: 'course', slug: 'msc-data', action: 'verify' }));
    expect(ok.status).toBe(200);
    const upd = m.calls.find((c) => c.op === 'coursePage.updateMany');
    expect(upd?.args.data.verificationStatus).toBe('VERIFIED');
    expect(upd?.args.data).not.toHaveProperty('approvalStatus');
    const audit = m.calls.find((c) => c.op === 'auditLog.create');
    expect(audit?.args.data).toMatchObject({ action: 'PUBLIC_VERIFY', userId: 'u-super' });
  });

  it('rejects unknown actions, unknown types, control fields and cross-origin writes', async () => {
    const bad = [
      { type: 'course', slug: 'msc-data', action: 'approve', verificationStatus: 'VERIFIED' },
      { type: 'course', slug: 'msc-data', action: 'approve', approvalStatus: 'PUBLISHED' },
      { type: 'course', slug: 'msc-data', action: 'delete' },
      { type: '__proto__', slug: 'msc-data', action: 'approve' },
      { type: 'course', slug: { contains: '' }, action: 'approve' },
    ];
    for (const body of bad) expect((await importCenterPATCH(req('/api/import-center', 'PATCH', body))).status, JSON.stringify(body)).toBe(400);
    expect((await importCenterPATCH(req('/api/import-center', 'PATCH', { type: 'course', slug: 'msc-data', action: 'approve' }, 'https://attacker.test'))).status).toBe(403);
    expect(writes()).toHaveLength(0);
  });

  it('a lowercase admin role claim on a non-admin user type no longer grants access', async () => {
    m.auth.mockResolvedValue(staffWithAdminRoleClaim);
    expect((await importCenterGET(req('/api/import-center'))).status).toBe(403);
    expect((await importCenterPATCH(req('/api/import-center', 'PATCH', { type: 'course', slug: 'msc-data', action: 'approve' }))).status).toBe(403);
    expect(writes()).toHaveLength(0);
  });
});

describe('K1 university-monitoring approval does not mark the whole record VERIFIED', () => {
  it('APPROVE applies the field and history but leaves verificationStatus untouched', async () => {
    const txCalls: Array<{ op: string; args: any }> = [];
    const tx = new Proxy({}, {
      get: (_t, model: string) => new Proxy({}, {
        get: (_m, op: string) => async (args: any) => {
          txCalls.push({ op: `${model}.${op}`, args });
          if (op === 'create') return { id: `${model}-1`, ...args?.data };
          if (op === 'update') return { id: 'chg1', entityType: 'COURSE', courseSlug: 'msc-data', universitySlug: 'uni-a', fieldName: 'tuition', newValue: 'GBP 21000', oldValue: 'GBP 20000', sourceUrl: 'https://www.uni-a.ac.uk/fees', changeType: 'FEE', detectedAt: new Date(), ...args?.data };
          if (op === 'findUnique' || op === 'findFirst') return { ...VERIFIED_PAGE };
          return { count: 1 };
        },
      }),
    });
    m.db.dataChange = { findUnique: m.rec('dataChange.findUnique', () => ({ id: 'chg1', status: 'PENDING', entityType: 'COURSE', courseSlug: 'msc-data' })) };
    m.db.$transaction = vi.fn(async (fn: any) => fn(tx));
    m.db.user = { findUnique: vi.fn(async () => ({ id: 'u-super', userType: 'SUPER_ADMIN', email: 's@alo.test', status: 'ACTIVE' })) };
    m.auth.mockResolvedValue(superAdmin);
    const res = await monitoringPATCH(req('/api/university-monitoring/changes/chg1', 'PATCH', { action: 'APPROVE' }), { params: Promise.resolve({ id: 'chg1' }) });
    if (res.status !== 200) {
      // The monitoring guard has its own identity checks; report rather than mask.
      throw new Error(`monitoring PATCH returned ${res.status}: ${await res.text()}`);
    }
    const pageUpdate = txCalls.find((c) => c.op === 'coursePage.update');
    expect(pageUpdate?.args.data.tuition).toBe('GBP 21000');
    expect(pageUpdate?.args.data).not.toHaveProperty('verificationStatus');
    // Phase 1 review (P1-D): a single-field approval no longer refreshes the
    // record-level verification date either.
    expect(pageUpdate?.args.data).not.toHaveProperty('lastVerifiedAt');
    expect(txCalls.some((c) => c.op === 'courseHistory.create')).toBe(true);
  });
});

// ---------------------------------------------------------------- K2
describe('K2 /api/course-finder/admin: no auto-VERIFIED, no body mass-assignment', () => {
  it('create always stores UNVERIFIED with no verification date, ignoring client control fields', async () => {
    m.auth.mockResolvedValue(marketing);
    const res = await cfaPOST(req('/api/course-finder/admin', 'POST', {
      slug: 'msc-ai', name: 'MSc AI', universitySlug: 'uni-a', countrySlug: 'uk', modules: ['A'], approvalStatus: 'DRAFT',
      currency: 'GBP', isAdmin: true,
    }));
    expect(res.status).toBe(200);
    const create = m.calls.find((c) => c.op === 'coursePage.create');
    expect(create?.args.data).toMatchObject({ verificationStatus: 'UNVERIFIED', lastVerifiedAt: null, approvalStatus: 'DRAFT', modules: '["A"]' });
    expect(create?.args.data).not.toHaveProperty('isAdmin');
    expect(create?.args.data).not.toHaveProperty('currency');
  });

  it('create refuses client verification/publication and invalid sources', async () => {
    for (const body of [
      { slug: 'x', name: 'X', universitySlug: 'u', countrySlug: 'uk', verificationStatus: 'VERIFIED' },
      { slug: 'x', name: 'X', universitySlug: 'u', countrySlug: 'uk', lastVerifiedAt: '2026-01-01' },
      { slug: 'x', name: 'X', universitySlug: 'u', countrySlug: 'uk', approvalStatus: 'PUBLISHED' },
      { slug: 'x', name: 'X', universitySlug: 'u', countrySlug: 'uk', sourceUrl: 'javascript:alert(1)' },
      { slug: 'Bad Slug', name: 'X', universitySlug: 'u', countrySlug: 'uk' },
    ]) {
      const res = await cfaPOST(req('/api/course-finder/admin', 'POST', body));
      expect([400, 422], JSON.stringify(body)).toContain(res.status);
    }
    expect(writes()).toHaveLength(0);
  });

  it('update never spreads the body: id, timestamps, relations and unknown keys are not written', async () => {
    resetDb({ ...VERIFIED_PAGE, verificationStatus: 'UNVERIFIED', approvalStatus: 'DRAFT' });
    const res = await cfaPATCH(req('/api/course-finder/admin', 'PATCH', { id: 'cp1', overview: 'New text', foo: 'bar', universityId: 'x' }));
    expect(res.status).toBe(400); // universityId is a control field
    const res2 = await cfaPATCH(req('/api/course-finder/admin', 'PATCH', { id: 'cp1', overview: 'New text', foo: 'bar' }));
    expect(res2.status).toBe(200);
    const upd = m.calls.find((c) => c.op === 'coursePage.updateMany');
    expect(upd?.args.where).toEqual({ id: 'cp1', updatedAt: VERIFIED_PAGE.updatedAt });
    expect(Object.keys(upd?.args.data).sort()).toEqual(['overview']);
    expect(m.calls.some((c) => c.op === 'coursePage.update')).toBe(false);
  });

  it('editing facts of a VERIFIED published page sends it back to review and never refreshes lastVerifiedAt', async () => {
    const res = await cfaPATCH(req('/api/course-finder/admin', 'PATCH', { ...VERIFIED_PAGE, tuition: 'GBP 25000', updatedAt: undefined, lastVerifiedAt: undefined }));
    expect(res.status).toBe(200);
    const upd = m.calls.find((c) => c.op === 'coursePage.updateMany');
    expect(upd?.args.data).toMatchObject({ tuition: 'GBP 25000', verificationStatus: 'NEEDS_REVIEW', approvalStatus: 'PENDING_REVIEW' });
    expect(upd?.args.data).not.toHaveProperty('lastVerifiedAt');
  });

  it('re-sending identical form values is a no-op (legacy values do not block edits)', async () => {
    resetDb({ ...VERIFIED_PAGE, sourceUrl: 'http://legacy.uni-a.ac.uk' });
    const res = await cfaPATCH(req('/api/course-finder/admin', 'PATCH', { id: 'cp1', slug: 'msc-data', sourceUrl: 'http://legacy.uni-a.ac.uk', verificationStatus: 'VERIFIED', approvalStatus: 'PUBLISHED' }));
    expect(res.status).toBe(200);
    expect(writes()).toHaveLength(0);
  });

  it('verification can only be downgraded by editing, never granted', async () => {
    resetDb({ ...VERIFIED_PAGE, verificationStatus: 'UNVERIFIED', approvalStatus: 'DRAFT' });
    expect((await cfaPATCH(req('/api/course-finder/admin', 'PATCH', { id: 'cp1', verificationStatus: 'VERIFIED' }))).status).toBe(403);
    expect(writes()).toHaveLength(0);
    resetDb();
    expect((await cfaPATCH(req('/api/course-finder/admin', 'PATCH', { id: 'cp1', verificationStatus: 'STALE' }))).status).toBe(200);
  });

  it('publishing via the toggle needs ADMIN/SUPER_ADMIN and a VERIFIED record with an https source', async () => {
    resetDb({ ...VERIFIED_PAGE, approvalStatus: 'DRAFT' });
    m.auth.mockResolvedValue(marketing);
    expect((await cfaPATCH(req('/api/course-finder/admin', 'PATCH', { id: 'cp1', approvalStatus: 'PUBLISHED' }))).status).toBe(403);
    m.auth.mockResolvedValue(admin);
    resetDb({ ...VERIFIED_PAGE, verificationStatus: 'UNVERIFIED', approvalStatus: 'DRAFT' });
    expect((await cfaPATCH(req('/api/course-finder/admin', 'PATCH', { id: 'cp1', approvalStatus: 'PUBLISHED' }))).status).toBe(409);
    expect(writes()).toHaveLength(0);
    resetDb({ ...VERIFIED_PAGE, approvalStatus: 'DRAFT' });
    expect((await cfaPATCH(req('/api/course-finder/admin', 'PATCH', { id: 'cp1', approvalStatus: 'PUBLISHED' }))).status).toBe(200);
    // Unpublishing stays available to marketing.
    m.auth.mockResolvedValue(marketing);
    resetDb();
    expect((await cfaPATCH(req('/api/course-finder/admin', 'PATCH', { id: 'cp1', approvalStatus: 'DRAFT' }))).status).toBe(200);
  });

  it('rejects object ids (operator injection) and stale writes', async () => {
    expect((await cfaPATCH(req('/api/course-finder/admin', 'PATCH', { id: { not: '' }, overview: 'x' }))).status).toBe(400);
    (m.db.coursePage.updateMany as any).mockResolvedValueOnce({ count: 0 });
    expect((await cfaPATCH(req('/api/course-finder/admin', 'PATCH', { id: 'cp1', overview: 'changed' }))).status).toBe(409);
  });

  it('DELETE is limited to ADMIN/SUPER_ADMIN; students and partners are refused everywhere', async () => {
    m.auth.mockResolvedValue(marketing);
    expect((await cfaDELETE(req('/api/course-finder/admin', 'DELETE', { id: 'cp1' }))).status).toBe(403);
    for (const who of [student, partner]) {
      m.auth.mockResolvedValue(who);
      expect((await cfaPOST(req('/api/course-finder/admin', 'POST', { slug: 'x', name: 'X', universitySlug: 'u', countrySlug: 'uk' }))).status).toBe(403);
      expect((await cfaPATCH(req('/api/course-finder/admin', 'PATCH', { id: 'cp1', overview: 'x' }))).status).toBe(403);
    }
    expect(writes()).toHaveLength(0);
    m.auth.mockResolvedValue(admin);
    expect((await cfaDELETE(req('/api/course-finder/admin', 'DELETE', { id: 'cp1' }))).status).toBe(200);
  });
});

// ---------------------------------------------------------------- K3
describe('K3 /api/source-logs and /api/data-quality permissions and side effects', () => {
  it('students, partners and ordinary staff cannot read or write source logs', async () => {
    for (const who of [student, partner, marketing, staffWithAdminRoleClaim]) {
      m.auth.mockResolvedValue(who);
      expect((await sourceLogsGET(req('/api/source-logs'))).status).toBe(403);
      expect((await sourceLogsPOST(req('/api/source-logs', 'POST', { entityType: 'course', entityId: 'C1', sourceUrl: 'https://www.uni-a.ac.uk/x' }))).status).toBe(403);
    }
    expect(m.calls).toHaveLength(0);
  });

  it('POST records a pending source attributed to the session, never a verification', async () => {
    const res = await sourceLogsPOST(req('/api/source-logs', 'POST', { entityType: 'course', entityId: 'C1', sourceUrl: 'https://www.uni-a.ac.uk/x', sourceName: 'Course page' }));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ verified: false, officialSourceRecorded: true });
    const log = m.calls.find((c) => c.op === 'sourceLog.create');
    expect(log?.args.data).toMatchObject({ verificationStatus: 'pending', checkedBy: 'u-admin' });
    const src = m.calls.find((c) => c.op === 'officialSource.create');
    expect(src?.args.data).toMatchObject({ verificationStatus: 'pending', lastVerifiedAt: null, verifiedBy: '' });
  });

  it('POST rejects client-set verification/attribution, bad URLs, bad types and cross-origin', async () => {
    const base = { entityType: 'course', entityId: 'C1', sourceUrl: 'https://www.uni-a.ac.uk/x' };
    for (const body of [
      { ...base, verificationStatus: 'verified' },
      { ...base, checkedBy: 'super-admin' },
      { ...base, sourceUrl: 'http://www.uni-a.ac.uk/x' },
      { ...base, sourceUrl: 'https://fake.example.com/x' },
      { ...base, entityType: 'student' },
      { ...base, entityId: { not: '' } },
      { ...base, sourceType: 'Aggregator' },
    ]) {
      expect((await sourceLogsPOST(req('/api/source-logs', 'POST', body))).status, JSON.stringify(body)).toBe(400);
    }
    expect((await sourceLogsPOST(req('/api/source-logs', 'POST', base, 'https://attacker.test'))).status).toBe(403);
    expect(writes()).toHaveLength(0);
  });

  it('data-quality GET is admin-only and performs no writes; persisting is an explicit POST', async () => {
    for (const who of [student, partner, marketing]) {
      m.auth.mockResolvedValue(who);
      expect((await dataQualityGET(req('/api/data-quality?entityType=course&entityId=C1'))).status).toBe(403);
    }
    m.auth.mockResolvedValue(admin);
    const res = await dataQualityGET(req('/api/data-quality?entityType=course&entityId=C1'));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ persisted: false });
    expect(writes()).toHaveLength(0);

    expect((await dataQualityPOST(req('/api/data-quality', 'POST', { entityType: 'course', entityId: 'C1' }, 'https://attacker.test'))).status).toBe(403);
    expect(writes()).toHaveLength(0);
    const post = await dataQualityPOST(req('/api/data-quality', 'POST', { entityType: 'course', entityId: 'C1' }));
    expect(post.status).toBe(200);
    expect(m.calls.filter((c) => c.op === 'dataQualityScore.upsert')).toHaveLength(1);
    expect((await dataQualityPOST(req('/api/data-quality', 'POST', { entityType: 'student', entityId: 'C1' }))).status).toBe(400);
  });

  it('error responses do not leak driver messages', async () => {
    (m.db.dataQualityScore.findMany as any).mockImplementationOnce(() => { throw new Error('mysql://user:secret@host'); });
    const res = await dataQualityGET(req('/api/data-quality'));
    expect(res.status).toBe(500);
    expect(await res.text()).not.toContain('secret');
  });
});

describe('content-page guards', () => {
  it('accepts only https, credential-free, non-synthetic source URLs', () => {
    expect(isAcceptableSourceUrl('https://www.auckland.ac.nz/en/study.html')).toBe(true);
    for (const bad of ['http://www.auckland.ac.nz', 'https://user:pw@www.auckland.ac.nz', 'https://localhost/x', 'https://x.example.org', 'https://site.test', 'ftp://a.b', 'not a url', '', null, 42]) {
      expect(isAcceptableSourceUrl(bad as any), String(bad)).toBe(false);
    }
  });
  it('drops unknown keys and never passes control fields through', () => {
    const r = sanitizeCoursePageFields({ overview: 'x', verificationStatus: 'VERIFIED', approvalStatus: 'PUBLISHED', lastVerifiedAt: 'now', id: 'z', extra: 1 });
    expect(r).toEqual({ ok: true, data: { overview: 'x' } });
  });
});
