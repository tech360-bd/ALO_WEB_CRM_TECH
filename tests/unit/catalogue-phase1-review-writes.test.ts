/**
 * Catalogue Phase 1 review (2026-10-12): P0-A creation defaults, P0-B AI
 * fallback, P1-D verification timestamps, audit attribution.
 *
 * Mocked: `@/lib/db` (recording fakes), `@/lib/auth-middleware` (withAuth
 * reproduces the real requireUserTypes check), next-auth session and the
 * ai-action-executor (explicitly drives its supplied action-scoped callback).
 * These are handler-logic tests, not MySQL or end-to-end proof.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => {
  const calls: Array<{ op: string; args: any }> = [];
  const rec = (op: string, impl?: (args: any) => any) => vi.fn(async (args: any) => {
    calls.push({ op, args });
    return impl ? impl(args) : null;
  });
  return { calls, rec, auth: vi.fn(), session: vi.fn(), executor: vi.fn(), db: {} as any };
});

vi.mock('@/lib/auth-middleware', () => ({
  authenticateRequest: (...a: unknown[]) => m.auth(...a),
  logAuditAction: vi.fn(async () => undefined),
  withAuth: (handler: any, opts?: { requireUserTypes?: string[] }) => async (req: Request) => {
    const auth = await m.auth(req);
    if (!auth) return new Response('{}', { status: 401 });
    if (opts?.requireUserTypes?.length && !opts.requireUserTypes.includes(auth.userType)) return new Response('{}', { status: 403 });
    return handler(req, auth);
  },
}));
vi.mock('@/lib/db', () => ({ db: m.db }));
vi.mock('next-auth', () => ({ getServerSession: (...a: unknown[]) => m.session(...a) }));
vi.mock('@/lib/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/ai-action-executor', () => ({ executeAiAction: (...a: unknown[]) => m.executor(...a), approveAndExecute: (...a: unknown[]) => m.executor(...a) }));
vi.mock('@/lib/university-monitoring-sync', () => ({ syncApprovedChange: vi.fn(async () => ({ ok: true })) }));

import { NextRequest } from 'next/server';
import { POST as createCoursePOST } from '@/app/api/admin/courses/create/route';
import { POST as coursesPOST } from '@/app/api/admin/courses/route';
import { PUT as coursePUT } from '@/app/api/admin/courses/[id]/route';
import { PUT as universityPUT } from '@/app/api/admin/universities/[id]/route';
import { POST as scholarshipImportPOST } from '@/app/api/admin/import/scholarships/route';
import { GET as aiGET, PATCH as aiPATCH } from '@/app/api/ai-command/execute/route';
import { PATCH as cfaPATCH } from '@/app/api/course-finder/admin/route';
import { PATCH as importCenterPATCH } from '@/app/api/import-center/route';
import { POST as crmScholarshipPOST, PUT as crmScholarshipPUT } from '@/app/api/crm/scholarships/route';
import { POST as countriesPOST } from '@/app/api/admin/countries/route';
import { auditActor } from '@/lib/course-finder/content-page-guards';
import { passesPublicCoursePagePolicy } from '@/lib/course-finder/public-content-page-policy';

const ORIGIN = 'https://alo.test';
const admin = { userId: 'u-admin', actorUserId: 'u-admin', userType: 'ADMIN', identityDomain: 'user', authenticationMethod: 'cookie', roles: ['ADMIN'], email: 'a@alo.test' };
const counselorWithAdminClaim = { ...admin, userId: 'u-c', userType: 'COUNSELOR', roles: ['admin'] };
const SRC = 'https://www.auckland.ac.nz/en/study/x.html';
const UNI = { id: 'uid', universityId: 'UNI-1', name: 'Uni One', city: 'Auckland', country: 'New Zealand', campusName: 'City' };

const writes = () => m.calls.filter((c) => /\.(create|createMany|update|updateMany|upsert|delete)$/.test(c.op));
const json = (url: string, method: string, body: unknown) =>
  new NextRequest(`${ORIGIN}${url}`, { method, headers: { 'content-type': 'application/json', origin: ORIGIN }, body: JSON.stringify(body) });

let existingCourse: any;
let existingUni: any;
let coursePage: any;

function resetDb() {
  m.calls.length = 0;
  existingCourse = { id: 'c1', courseId: 'CRS-1', courseTitle: 'MSc Data', studyLevel: 'Masters', subjectArea: 'Data', disciplineArea: '', durationMonths: 12, qualification: 'MSc', deliveryMode: '', campus: '', placementOption: false, onlineOption: false, sourceUrl: SRC, status: 'active', verificationStatus: 'VERIFIED', lastVerifiedAt: '2026-09-01' };
  existingUni = { id: 'u1', universityId: 'UNI-1', name: 'Uni One', country: 'New Zealand', city: 'Auckland', campusName: '', website: 'http://legacy.example-uni.ac.nz', officialUrl: '', sourceUrl: SRC, ranking: 0, worldRanking: 0, type: '', ieltsMin: 0, tuitionRange: '', scholarships: '', description: '', status: 'active', verificationStatus: 'VERIFIED', lastVerifiedAt: '2026-09-01' };
  coursePage = { id: 'cp1', slug: 'msc-data', name: 'MSc Data', universitySlug: 'uni-a', countrySlug: 'nz', city: '', level: '', subject: '', duration: '', intake: '', tuition: 'NZD 40000', scholarship: null, englishRequirement: '', academicRequirement: '', overview: '', modules: '[]', careerOutcomes: '[]', documents: '[]', faqs: '[]', deadline: null, sourceUrl: SRC, verificationStatus: 'VERIFIED', approvalStatus: 'PUBLISHED', updatedAt: new Date('2026-10-01') };
  Object.assign(m.db, {
    crmUniversity: { findFirst: m.rec('crmUniversity.findFirst', (a) => (a.where?.OR ? (a.where.OR.some((w: any) => w.id === 'u1' || w.universityId === 'UNI-1') ? existingUni : UNI) : UNI)), update: m.rec('crmUniversity.update', (a) => ({ ...existingUni, ...a.data })) },
    crmCourse: { findFirst: m.rec('crmCourse.findFirst', (a) => (a.where?.OR ? existingCourse : null)), create: m.rec('crmCourse.create', (a) => ({ id: 'new', ...a.data })), update: m.rec('crmCourse.update', (a) => ({ ...existingCourse, ...a.data })) },
    crmCourseIntakeFee: { create: m.rec('crmCourseIntakeFee.create', (a) => a.data), updateMany: m.rec('crmCourseIntakeFee.updateMany', () => ({ count: 1 })) },
    crmCourseRequirement: { create: m.rec('crmCourseRequirement.create', (a) => a.data), updateMany: m.rec('crmCourseRequirement.updateMany', () => ({ count: 1 })) },
    crmAuditLog: { create: m.rec('crmAuditLog.create', () => ({})) },
    auditLog: { create: m.rec('auditLog.create', () => ({})) },
    scholarship: { findFirst: m.rec('scholarship.findFirst', () => null), create: m.rec('scholarship.create', (a) => a.data) },
    coursePage: {
      findUnique: m.rec('coursePage.findUnique', () => ({ ...coursePage })),
      create: m.rec('coursePage.create', (a) => ({ id: 'new-cp', ...a.data })),
      update: m.rec('coursePage.update', (a) => ({ ...coursePage, ...a.data })),
      updateMany: m.rec('coursePage.updateMany', () => ({ count: 1 })),
    },
    aiCommandAction: { findUnique: vi.fn(), findMany: m.rec('aiCommandAction.findMany', () => []), update: m.rec('aiCommandAction.update', (a) => a.data) },
    globalAiPause: { findFirst: m.rec('globalAiPause.findFirst', () => null) },
  });
}

beforeEach(() => {
  vi.stubEnv('NEXTAUTH_URL', ORIGIN);
  m.auth.mockReset();
  m.auth.mockResolvedValue(admin);
  m.session.mockReset();
  m.session.mockResolvedValue({ user: { id: 'u-admin', role: 'ADMIN' } });
  m.executor.mockReset();
  m.executor.mockRejectedValue(new Error('approval executor unavailable'));
  resetDb();
});

// ------------------------------------------------------------------ P0-A
describe('P0-A manual CrmCourse creation is never verification, publication or invention', () => {
  const routes = [['/api/admin/courses/create', createCoursePOST], ['/api/admin/courses', coursesPOST]] as const;

  it.each(routes)('%s: a sourceUrl no longer marks anything VERIFIED and no facts are invented', async (url, handler) => {
    const res = await handler(json(url, 'POST', { courseTitle: 'MSc Data', universityId: 'UNI-1', sourceUrl: SRC, ieltsOverall: 6 }));
    expect(res.status).toBe(200);
    const course = m.calls.find((c) => c.op === 'crmCourse.create')!.args.data;
    expect(course).toMatchObject({ verificationStatus: 'NEEDS_REVIEW', publicationStatus: 'draft', status: 'draft', lastVerifiedAt: '' });
    // Previously defaulted to Postgraduate / General / MSc / 12 / Full-time On Campus.
    expect(course).toMatchObject({ studyLevel: '', subjectArea: '', qualification: '', durationMonths: 0, deliveryMode: '' });
    expect(course.city).toBe('Auckland'); // inherited from the university record, not invented
    const reqRow = m.calls.find((c) => c.op === 'crmCourseRequirement.create')!.args.data;
    expect(reqRow).toMatchObject({ ieltsOverall: 6, academicReq: '', verificationStatus: 'NEEDS_REVIEW' });
    for (const invented of ['pteOverall', 'toeflOverall', 'detOverall', 'ieltsMinBand']) expect(reqRow, invented).not.toHaveProperty(invented);
    // No intake was supplied, so no intake/fee row (previously "September 2026", "Rolling", GBP).
    expect(m.calls.some((c) => c.op === 'crmCourseIntakeFee.create')).toBe(false);
    expect(JSON.stringify(writes())).not.toMatch(/"VERIFIED"|Rolling|Recognized Bachelor|"GBP"/);
  });

  it.each(routes)('%s: control fields requesting publication or verification are refused with no write', async (url, handler) => {
    for (const extra of [{ publicationStatus: 'published' }, { verificationStatus: 'VERIFIED' }, { status: 'active' }, { lastVerifiedAt: '2026-10-12' }]) {
      resetDb();
      const res = await handler(json(url, 'POST', { courseTitle: 'MSc Data', universityId: 'UNI-1', sourceUrl: SRC, ...extra }));
      expect(res.status, JSON.stringify(extra)).toBeGreaterThanOrEqual(400);
      expect(writes(), JSON.stringify(extra)).toHaveLength(0);
    }
  });

  it.each(routes)('%s: fees need an explicit currency and intake; nothing is assumed', async (url, handler) => {
    let res = await handler(json(url, 'POST', { courseTitle: 'MSc Data', universityId: 'UNI-1', tuitionFee: 30000, intakes: [{ intakeYear: 2027, intakeMonth: 'February' }] }));
    expect(res.status).toBe(400);
    expect(writes()).toHaveLength(0);
    resetDb();
    res = await handler(json(url, 'POST', { courseTitle: 'MSc Data', universityId: 'UNI-1', tuitionFee: 30000, currency: 'nzd', intakes: [{ intakeYear: 2027, intakeMonth: 'February' }] }));
    expect(res.status).toBe(200);
    const fee = m.calls.find((c) => c.op === 'crmCourseIntakeFee.create')!.args.data;
    expect(fee).toMatchObject({ intakeYear: 2027, intakeMonth: 'February', applicationDeadline: '', tuitionCurrency: 'NZD', yearlyTuition: 30000, verificationStatus: 'NEEDS_REVIEW' });
    resetDb();
    res = await handler(json(url, 'POST', { courseTitle: 'MSc Data', universityId: 'UNI-1', tuitionFee: 30000, currency: 'NZD' }));
    expect((await res.json()).warnings?.[0]).toMatch(/not saved/);
    expect(m.calls.some((c) => c.op === 'crmCourseIntakeFee.create')).toBe(false);
  });

  it.each(routes)('%s: a lowercase admin role claim on a non-admin user type is refused', async (url, handler) => {
    m.auth.mockResolvedValue(counselorWithAdminClaim);
    const res = await handler(json(url, 'POST', { courseTitle: 'MSc Data', universityId: 'UNI-1' }));
    expect(res.status).toBe(403);
    expect(writes()).toHaveLength(0);
  });

  it('every CoursePage/UniversityPage/CountryPage/ExamPage create in src/ is a reviewed path that sets both status fields', () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(name)) files.push(p);
      }
    };
    walk(join(process.cwd(), 'src'));
    const creators = files.filter((f) => /\b(coursePage|universityPage|countryPage|examPage)\.(create|createMany|upsert)\s*\(/.test(readFileSync(f, 'utf8'))).map((f) => f.replace(`${process.cwd()}/`, '')).sort();
    // A new creation path must be reviewed against the VERIFIED/PUBLISHED schema defaults before it is added here.
    expect(creators).toEqual(['src/app/api/course-finder/admin/route.ts', 'src/lib/course-finder/ai-content-fallback.ts']);
    for (const f of creators) {
      const src = readFileSync(join(process.cwd(), f), 'utf8');
      expect(src, f).toMatch(/verificationStatus:\s*UNVERIFIED/);
      expect(src, f).toMatch(/approvalStatus:\s*(approvalStatus as string|'DRAFT')/);
    }
  });
});

// ------------------------------------------------------------------ P0-B
describe('P0-B /api/ai-command/execute DEPLOY_CONTENT through the guarded approval executor', () => {
  const approve = (payload: unknown, targetId: string | null = null, targetType = 'CoursePage') => {
    (m.db.aiCommandAction.findUnique as any).mockResolvedValue({ id: 'act1', actionType: 'DEPLOY_CONTENT', targetType, targetId, payload: JSON.stringify(payload), status: 'PENDING' });
    m.executor.mockImplementation(async (id: string, _approvedBy: string, callback: (approvedPayload: Record<string, unknown>) => Promise<unknown>) => {
      try {
        const result = await callback(payload as Record<string, unknown>);
        m.calls.push({ op: 'aiCommandAction.update', args: { data: { status: 'EXECUTED' } } });
        return { actionId: id, status: 'EXECUTED', riskLevel: 'HIGH', result };
      } catch (error) {
        m.calls.push({ op: 'aiCommandAction.update', args: { data: { status: 'FAILED' } } });
        return { actionId: id, status: 'FAILED', riskLevel: 'HIGH', error: error instanceof Error ? error.message : 'failed' };
      }
    });
    return aiPATCH(json('/api/ai-command/execute', 'PATCH', { id: 'act1', decision: 'APPROVED' }));
  };
  const actionStatus = () => m.calls.filter((c) => c.op === 'aiCommandAction.update').map((c) => c.args.data.status).filter(Boolean);

  it('executes the scoped callback into an UNVERIFIED DRAFT with only supplied values, not publicly visible', async () => {
    const res = await approve({ name: 'MSc Data', slug: 'msc-data-ai', universitySlug: 'uni-a', countrySlug: 'nz', tuition: 'NZD 40000' });
    expect(m.executor).toHaveBeenCalled();
    expect(res.status).toBe(200);
    const created = m.calls.find((c) => c.op === 'coursePage.create')!.args.data;
    expect(created).toMatchObject({ verificationStatus: 'UNVERIFIED', approvalStatus: 'DRAFT', lastVerifiedAt: null, tuition: 'NZD 40000' });
    expect(created).toMatchObject({ city: '', level: '', duration: '', intake: '', englishRequirement: '', academicRequirement: '', overview: '' });
    expect(JSON.stringify(created)).not.toMatch(/aalborg|denmark|IELTS 6\.0|SSC\/HSC|Contact for details|Unknown|pending\./i);
    expect(passesPublicCoursePagePolicy({ ...created, sourceUrl: SRC })).toBe(false);
    expect(actionStatus()).toContain('EXECUTED');
  });

  it('refuses to create without the identifying fields instead of inventing them', async () => {
    const res = await approve({ name: 'MSc Data' });
    expect(res.status).toBe(503);
    expect(m.calls.some((c) => c.op === 'coursePage.create')).toBe(false);
    expect(actionStatus()).toContain('FAILED');
  });

  it('rejects AI payloads that try to set verification or publication', async () => {
    for (const payload of [
      { name: 'X', slug: 'x', universitySlug: 'u', countrySlug: 'nz', verificationStatus: 'VERIFIED' },
      { name: 'X', slug: 'x', universitySlug: 'u', countrySlug: 'nz', approvalStatus: 'PUBLISHED' },
    ]) {
      resetDb();
      await approve(payload);
      expect(m.calls.some((c) => c.op === 'coursePage.create'), JSON.stringify(payload)).toBe(false);
    }
    resetDb();
    await approve({ data: { tuition: 'x', approvalStatus: 'PUBLISHED' } }, 'cp1');
    expect(m.calls.some((c) => /coursePage\.update/.test(c.op))).toBe(false);
  });

  it('an AI update to a VERIFIED published page downgrades it and takes it out of publication', async () => {
    const res = await approve({ data: { tuition: 'NZD 41000' } }, 'cp1');
    expect(res.status).toBe(200);
    const upd = m.calls.find((c) => c.op === 'coursePage.updateMany')!.args;
    expect(upd.where).toMatchObject({ id: 'cp1', updatedAt: coursePage.updatedAt });
    expect(upd.data).toEqual({ tuition: 'NZD 41000', verificationStatus: 'NEEDS_REVIEW', approvalStatus: 'PENDING_REVIEW' });
  });

  it('an unsupported target fails instead of reporting a fake deployment', async () => {
    const res = await approve({ title: 'x' }, null, 'UniversityPage');
    expect(res.status).toBe(503);
    expect(actionStatus()).toContain('FAILED');
    expect(writes().filter((w) => !w.op.startsWith('aiCommandAction'))).toHaveLength(0);
  });

  it('does not execute an inline fallback when the approval executor outcome is uncertain', async () => {
    (m.db.aiCommandAction.findUnique as any).mockResolvedValue({ id: 'act1', actionType: 'DEPLOY_CONTENT', targetType: 'CoursePage', targetId: null, payload: JSON.stringify({ name: 'MSc Data', slug: 'msc-data-ai', universitySlug: 'uni-a', countrySlug: 'nz' }), status: 'PENDING' });
    m.executor.mockRejectedValue(new Error('executor outcome uncertain'));
    const res = await aiPATCH(json('/api/ai-command/execute', 'PATCH', { id: 'act1', decision: 'APPROVED' }));
    expect(res.status).toBe(503);
    expect(m.calls.some((c) => c.op === 'coursePage.create')).toBe(false);
  });

  it('GET (lists payloads) now requires an ADMIN/SUPER_ADMIN session', async () => {
    m.session.mockResolvedValueOnce(null);
    expect((await aiGET(new NextRequest(`${ORIGIN}/api/ai-command/execute`))).status).toBe(401);
    m.session.mockResolvedValueOnce({ user: { id: 's', role: 'STUDENT' } });
    expect((await aiGET(new NextRequest(`${ORIGIN}/api/ai-command/execute`))).status).toBe(403);
    expect((await aiGET(new NextRequest(`${ORIGIN}/api/ai-command/execute`))).status).toBe(200);
  });
});

// ------------------------------------------------------------------ P1-D
describe('P1-D ordinary edits never certify a record or advance its verification date', () => {
  const put = (handler: any, url: string, id: string, body: unknown) => handler(json(url, 'PUT', body), { params: Promise.resolve({ id }) });

  it('CrmCourse: a sourceUrl in the body no longer upgrades NEEDS_REVIEW to VERIFIED', async () => {
    existingCourse.verificationStatus = 'NEEDS_REVIEW';
    const res = await put(coursePUT, '/api/admin/courses/c1', 'c1', { sourceUrl: 'https://www.auckland.ac.nz/new' });
    expect(res.status).toBe(200);
    const data = m.calls.find((c) => c.op === 'crmCourse.update')!.args.data;
    expect(data.verificationStatus).toBe('NEEDS_REVIEW');
    expect(data).not.toHaveProperty('lastVerifiedAt');
  });

  it('CrmCourse: a fact edit of a VERIFIED course sends it to NEEDS_REVIEW; a status-only edit keeps VERIFIED; neither re-dates it', async () => {
    await put(coursePUT, '/api/admin/courses/c1', 'c1', { durationMonths: 18 });
    let data = m.calls.find((c) => c.op === 'crmCourse.update')!.args.data;
    expect(data).toMatchObject({ durationMonths: 18, verificationStatus: 'NEEDS_REVIEW' });
    expect(data).not.toHaveProperty('lastVerifiedAt');
    resetDb();
    await put(coursePUT, '/api/admin/courses/c1', 'c1', { status: 'inactive' });
    data = m.calls.find((c) => c.op === 'crmCourse.update')!.args.data;
    expect(data).toMatchObject({ status: 'inactive', verificationStatus: 'VERIFIED' });
    expect(data).not.toHaveProperty('lastVerifiedAt');
  });

  it('CrmCourse: fee changes need a currency (no GBP default) and mark fee rows NEEDS_REVIEW', async () => {
    expect((await put(coursePUT, '/api/admin/courses/c1', 'c1', { tuitionFee: 1 })).status).toBe(400);
    expect(writes()).toHaveLength(0);
    await put(coursePUT, '/api/admin/courses/c1', 'c1', { tuitionFee: 41000, currency: 'nzd' });
    expect(m.calls.find((c) => c.op === 'crmCourseIntakeFee.updateMany')!.args.data).toMatchObject({ tuitionCurrency: 'NZD', verificationStatus: 'NEEDS_REVIEW' });
    expect(m.calls.find((c) => c.op === 'crmCourse.update')!.args.data.verificationStatus).toBe('NEEDS_REVIEW');
  });

  it('CrmCourse/CrmUniversity: control fields are refused', async () => {
    for (const body of [{ verificationStatus: 'VERIFIED' }, { lastVerifiedAt: 'now' }, { publicationStatus: 'published' }]) {
      resetDb();
      expect((await put(coursePUT, '/api/admin/courses/c1', 'c1', body)).status).toBe(400);
      expect((await put(universityPUT, '/api/admin/universities/u1', 'u1', body)).status).toBe(400);
      expect(writes()).toHaveLength(0);
    }
  });

  it('CrmUniversity: same rules; an unchanged legacy http website does not block the edit', async () => {
    const { verificationStatus: _v, lastVerifiedAt: _l, ...resent } = existingUni; // a client re-sending the editable fields
    const res = await put(universityPUT, '/api/admin/universities/u1', 'u1', { ...resent, description: 'New overview' });
    expect(res.status).toBe(200);
    const data = m.calls.find((c) => c.op === 'crmUniversity.update')!.args.data;
    expect(data).toMatchObject({ description: 'New overview', verificationStatus: 'NEEDS_REVIEW' });
    expect(data).not.toHaveProperty('lastVerifiedAt');
    resetDb();
    expect((await put(universityPUT, '/api/admin/universities/u1', 'u1', { website: 'http://new.example-uni.ac.nz' })).status).toBe(400);
  });

  it('scholarship import never marks rows verified or dated, and invents no currency or amount text', async () => {
    const res = await scholarshipImportPOST(json('/api/admin/import/scholarships', 'POST', { rows: [{ name: 'Merit Award', source_url: SRC }] }));
    expect(res.status).toBe(200);
    const row = m.calls.find((c) => c.op === 'scholarship.create')!.args.data;
    expect(row).toMatchObject({ verificationStatus: 'pending', lastVerifiedAt: null, currency: '', fundingAmount: '' });
  });

  it('course-finder admin: re-sending normalised values (\"\" for null) is not a change and does not unpublish', async () => {
    coursePage.verificationStatus = 'UNVERIFIED'; // legacy published-but-unverified page
    const res = await cfaPATCH(json('/api/course-finder/admin', 'PATCH', { id: 'cp1', scholarship: '', modules: '[ ]' }));
    expect((await res.json()).message).toBe('No changes.');
    expect(writes()).toHaveLength(0);
  });
});

// ------------------------------------------------------------------ audit attribution
describe('audit attribution from the session', () => {
  it('portal identities are not written to the User foreign key', () => {
    expect(auditActor({ userId: 'p1', identityDomain: 'portal', userType: 'ADMIN' }).userId).toBeNull();
    expect(auditActor({ userId: 'u1', identityDomain: 'user', userType: 'ADMIN' }).userId).toBe('u1');
  });

  it('import-center records the session actor, never a fallback email or "system" id', async () => {
    m.db.coursePage.findUnique = m.rec('coursePage.findUnique', () => ({ ...coursePage, approvalStatus: 'DRAFT', verificationStatus: 'UNVERIFIED' }));
    const res = await importCenterPATCH(json('/api/import-center', 'PATCH', { type: 'course', slug: 'msc-data', action: 'approve' }));
    expect(res.status).toBe(200);
    const log = m.calls.find((c) => c.op === 'auditLog.create')!.args.data;
    expect(log.userId).toBe('u-admin');
    expect(JSON.parse(log.details).actor).toMatchObject({ userId: 'u-admin', identityDomain: 'user' });
  });
});

// ------------------------------------------------------------------ P0-A / P1-D remaining writers
describe('remaining catalogue writers (crm/scholarships, country destination saves)', () => {
  let existingSch: any;
  beforeEach(() => {
    existingSch = { id: 's1', universityId: 'UNI-1', scholarshipName: 'Merit', scholarshipAmount: 5000, scholarshipCurrency: 'NZD', verificationStatus: 'VERIFIED', status: 'active' };
    Object.assign(m.db, {
      crmScholarship: {
        create: m.rec('crmScholarship.create', (a) => ({ id: 'new-s', ...a.data })),
        findUnique: m.rec('crmScholarship.findUnique', (a) => (a.where.id === 's1' ? { ...existingSch } : null)),
        update: m.rec('crmScholarship.update', (a) => ({ ...existingSch, ...a.data })),
      },
      country: { upsert: m.rec('country.upsert', (a) => ({ id: 'cty', ...a.create })) },
    });
  });

  it('crm/scholarships POST: no GBP default, a currency is required with an amount, control fields are refused', async () => {
    let res = await crmScholarshipPOST(json('/api/crm/scholarships', 'POST', { universityId: 'UNI-1', scholarshipName: 'Merit', scholarshipAmount: 5000 }));
    expect(res.status).toBe(400);
    for (const extra of [{ verificationStatus: 'VERIFIED' }, { status: 'active' }, { lastVerifiedAt: '2026-10-12' }]) {
      res = await crmScholarshipPOST(json('/api/crm/scholarships', 'POST', { universityId: 'UNI-1', scholarshipName: 'Merit', ...extra }));
      expect(res.status, JSON.stringify(extra)).toBe(400);
    }
    expect(writes()).toHaveLength(0);
    res = await crmScholarshipPOST(json('/api/crm/scholarships', 'POST', { universityId: 'UNI-1', scholarshipName: 'Merit', scholarshipAmount: 5000, scholarshipCurrency: 'nzd' }));
    expect(res.status).toBe(201);
    const data = m.calls.find((c) => c.op === 'crmScholarship.create')!.args.data;
    expect(data).toEqual({ universityId: 'UNI-1', courseId: '', scholarshipName: 'Merit', scholarshipAmount: 5000, scholarshipCurrency: 'NZD' });
    // No verificationStatus written: the schema default (NEEDS_REVIEW) applies, which the public CRM scholarship predicate excludes.
    resetDb();
  });

  it('crm/scholarships PUT: a fact edit of a VERIFIED scholarship returns it to NEEDS_REVIEW; a status edit does not', async () => {
    let res = await crmScholarshipPUT(json('/api/crm/scholarships', 'PUT', { id: 's1', scholarshipAmount: 6000 }));
    expect(res.status).toBe(200);
    expect(m.calls.find((c) => c.op === 'crmScholarship.update')!.args.data).toEqual({ scholarshipAmount: 6000, verificationStatus: 'NEEDS_REVIEW' });
    m.calls.length = 0;
    res = await crmScholarshipPUT(json('/api/crm/scholarships', 'PUT', { id: 's1', status: 'inactive' }));
    expect(m.calls.find((c) => c.op === 'crmScholarship.update')!.args.data).toEqual({ status: 'inactive' });
    m.calls.length = 0;
    expect((await crmScholarshipPUT(json('/api/crm/scholarships', 'PUT', { id: 's1', verificationStatus: 'VERIFIED' }))).status).toBe(400);
    expect((await crmScholarshipPUT(json('/api/crm/scholarships', 'PUT', { id: 'missing', scholarshipName: 'X' }))).status).toBe(404);
    existingSch.scholarshipCurrency = '';
    existingSch.verificationStatus = 'NEEDS_REVIEW';
    expect((await crmScholarshipPUT(json('/api/crm/scholarships', 'PUT', { id: 's1', scholarshipAmount: 100 }))).status).toBe(400);
    expect(writes()).toHaveLength(0);
    resetDb();
  });

  it('admin/countries POST: an ordinary save no longer stamps lastVerifiedAt (shown publicly as "Last verified")', async () => {
    const res = await countriesPOST(json('/api/admin/countries', 'POST', { name: 'New Zealand', slug: 'new-zealand', overview: 'x' }));
    expect(res.status).toBe(200);
    const args = m.calls.find((c) => c.op === 'country.upsert')!.args;
    expect(args.update).not.toHaveProperty('lastVerifiedAt');
    expect(args.create).not.toHaveProperty('lastVerifiedAt');
    resetDb();
  });

  it('admin/website/cms country upsert: static check that no lastVerifiedAt is written on save', () => {
    const src = readFileSync('src/app/api/admin/website/cms/route.ts', 'utf8');
    expect(src).not.toMatch(/lastVerifiedAt:\s*new Date\(\)/);
  });
});
