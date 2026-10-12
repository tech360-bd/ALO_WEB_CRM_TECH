/**
 * Final safety review (2026-10-12): owner decisions 1, 2 and 4.
 *  1. Historical approvals without a valid fingerprint need re-approval.
 *  2. A material change applied to a verified record moves it to NEEDS_REVIEW, audited.
 *  4. Synthetic catalogue datasets are reachable only from the non-production fixture archive.
 * Uses the in-memory fake DB (not MySQL) and mocked auth.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createFakeCatalogDb } from '../helpers/fake-catalog-db';
import { applyApprovedCatalogChanges, isMaterialChange, isVerifiedStatus } from '@/lib/course-finder/apply-approved-changes';
import { approvalFingerprintState, isValidFingerprint, proposalPayloadHash } from '@/lib/course-finder/catalog-change-payload';
import { SYNTHETIC_CATALOGUE_DIR, syntheticFixturePath } from '@/lib/ai-agents/synthetic-data-guard';

const actor = { actorUserId: 'super-1', effectiveUserId: 'super-1', identityDomain: 'portal' };
const EVIDENCE = 'https://www.uni-one.ac.uk/courses/msc-data-science';

function catalogue() {
  return {
    crmUniversity: [
      { id: 'u-row-1', universityId: 'UNI-1', name: 'University One', city: 'Leeds', verificationStatus: 'VERIFIED', publicationStatus: 'published', visibility: 'public', lastVerifiedAt: '2026-09-01', lastApprovedUpdateAt: '', updatedBy: '' },
    ],
    crmCourse: [
      { id: 'c-row-1', courseId: 'CRS-1', universityId: 'UNI-1', courseTitle: 'MSc Data Science', durationMonths: 12, verificationStatus: 'VERIFIED', publicationStatus: 'published', visibility: 'public', lastVerifiedAt: '2026-09-01', lastApprovedUpdateAt: '', updatedBy: '' },
    ],
    crmCourseIntakeFee: [
      { id: 'i-row-1', universityId: 'UNI-1', courseId: 'CRS-1', intakeYear: 2027, intakeMonth: 'September', yearlyTuition: 21000, tuitionCurrency: 'GBP', verificationStatus: 'VERIFIED', status: 'active' },
    ],
    crmCourseRequirement: [
      { id: 'r-row-1', universityId: 'UNI-1', courseId: 'CRS-1', ieltsOverall: 6.5, moiAccepted: false, verificationStatus: 'VERIFIED' },
    ],
  };
}
let n = 0;
function proposal(p: Record<string, any> = {}) {
  n++;
  return {
    id: `req-${n}`, universityId: 'UNI-1', courseId: 'CRS-1', entityType: 'course', entityName: 'MSc Data Science', country: 'United Kingdom',
    fieldName: 'courseTitle', oldValue: 'MSc Data Science', newValue: 'MSc Applied Data Science', evidenceUrl: EVIDENCE,
    aiConfidence: 0, status: 'reviewed_unverified', reviewedBy: 'portal:admin-1', createdAt: '2026-10-01T00:00:00.000Z', ...p,
  };
}
const approval = (r: Record<string, any>, hash = proposalPayloadHash(r as any)) => ({ id: `ap-${r.id}`, actorUserId: 'admin-1', action: 'CATALOG_PROPOSAL_APPROVE', entityType: 'UniversityUpdateRequest', entityId: r.id, createdAt: '2026-10-02T00:00:00.000Z', metadata: JSON.stringify({ approvedPayloadHash: hash }) });
function setup(reqs: Array<Record<string, any>>, audits = reqs.map((r) => approval(r))) {
  return createFakeCatalogDb({ ...catalogue(), universityUpdateRequest: reqs, portalAuditLog: audits });
}
const auditsOf = (fake: ReturnType<typeof setup>, action: string) => fake.state.portalAuditLog.filter((a) => a.action === action);

beforeEach(() => { n = 0; });
afterEach(() => vi.unstubAllEnvs());

describe('decision 2: verified records that change move to needs review', () => {
  it('a material change to a verified course moves only that course to NEEDS_REVIEW, keeps publication fields, and audits prior/new state', async () => {
    const r = proposal();
    const fake = setup([r]);
    const res = await applyApprovedCatalogChanges(fake.client, [r.id], actor);
    expect(res).toMatchObject({ ok: true, code: 'APPLIED' });
    expect(res.message).toContain('moved to needs review');
    expect(res.results[0]).toMatchObject({ outcome: 'applied', verificationTransition: { from: 'VERIFIED', to: 'NEEDS_REVIEW' } });
    expect(fake.state.crmCourse[0]).toMatchObject({ courseTitle: 'MSc Applied Data Science', verificationStatus: 'NEEDS_REVIEW', publicationStatus: 'published', visibility: 'public', lastVerifiedAt: '2026-09-01' });
    // Parent university and sibling records are not touched.
    expect(fake.state.crmUniversity[0].verificationStatus).toBe('VERIFIED');
    expect(fake.state.crmCourseIntakeFee[0].verificationStatus).toBe('VERIFIED');
    const [down] = auditsOf(fake, 'CATALOG_RECORD_VERIFICATION_DOWNGRADED');
    expect(down).toMatchObject({ actorUserId: 'super-1', entityType: 'CrmCourse', entityId: 'c-row-1' });
    expect(JSON.parse(down.metadata)).toMatchObject({ previousVerificationStatus: 'VERIFIED', newVerificationStatus: 'NEEDS_REVIEW', triggeredByRequestId: r.id, field: 'courseTitle', previousValue: 'MSc Data Science', appliedValue: 'MSc Applied Data Science', evidenceUrl: EVIDENCE, verified: false });
    expect(JSON.parse(auditsOf(fake, 'CATALOG_CHANGE_APPLIED')[0].metadata).verificationTransition).toEqual({ from: 'VERIFIED', to: 'NEEDS_REVIEW' });
  });

  it('applies the same rule to a verified university, intake and requirement row', async () => {
    const u = proposal({ entityType: 'university', courseId: '', fieldName: 'city', oldValue: 'Leeds', newValue: 'Bradford' });
    const i = proposal({ fieldName: 'intake:2027-09:yearlyTuition', oldValue: '21000', newValue: '22500' });
    const q = proposal({ fieldName: 'requirement:ieltsOverall', oldValue: '6.5', newValue: '7' });
    const fake = setup([u, i, q]);
    expect((await applyApprovedCatalogChanges(fake.client, [u.id, i.id, q.id], actor)).ok).toBe(true);
    expect(fake.state.crmUniversity[0].verificationStatus).toBe('NEEDS_REVIEW');
    expect(fake.state.crmCourseIntakeFee[0].verificationStatus).toBe('NEEDS_REVIEW');
    expect(fake.state.crmCourseRequirement[0].verificationStatus).toBe('NEEDS_REVIEW');
    // An intake/requirement change does not by itself downgrade the parent course.
    expect(fake.state.crmCourse[0].verificationStatus).toBe('VERIFIED');
    expect(auditsOf(fake, 'CATALOG_RECORD_VERIFICATION_DOWNGRADED').map((a) => a.entityType).sort()).toEqual(['CrmCourseIntakeFee', 'CrmCourseRequirement', 'CrmUniversity']);
  });

  it('two changes to the same verified row in one batch produce one downgrade record', async () => {
    const a = proposal();
    const b = proposal({ fieldName: 'durationMonths', oldValue: '12', newValue: '18' });
    const fake = setup([a, b]);
    const res = await applyApprovedCatalogChanges(fake.client, [a.id, b.id], actor);
    expect(res.ok).toBe(true);
    expect(auditsOf(fake, 'CATALOG_RECORD_VERIFICATION_DOWNGRADED')).toHaveLength(1);
    expect(res.results.filter((x) => x.verificationTransition)).toHaveLength(1);
  });

  it('a non-material change (same value after normalisation) keeps the record verified', async () => {
    const r = proposal({ newValue: 'MSc  data science' });
    const fake = setup([r]);
    const res = await applyApprovedCatalogChanges(fake.client, [r.id], actor);
    expect(res.ok).toBe(true);
    expect(fake.state.crmCourse[0].verificationStatus).toBe('VERIFIED');
    expect(auditsOf(fake, 'CATALOG_RECORD_VERIFICATION_DOWNGRADED')).toHaveLength(0);
  });

  it('never marks anything verified: unverified records stay unverified', async () => {
    const r = proposal();
    const fake = setup([r]);
    fake.state.crmCourse[0].verificationStatus = 'NEEDS_REVIEW';
    await applyApprovedCatalogChanges(fake.client, [r.id], actor);
    expect(fake.state.crmCourse[0].verificationStatus).toBe('NEEDS_REVIEW');
    expect(auditsOf(fake, 'CATALOG_RECORD_VERIFICATION_DOWNGRADED')).toHaveLength(0);
  });

  it('if the transaction fails, the downgrade is rolled back with everything else', async () => {
    const a = proposal();
    const b = proposal({ fieldName: 'intake:2027-09:yearlyTuition', oldValue: '21000', newValue: '22500' });
    const fake = setup([a, b]);
    fake.onOperation(({ table, method, inTx }) => { if (inTx && table === 'crmCourseIntakeFee' && method === 'updateMany') throw new Error('simulated'); });
    const res = await applyApprovedCatalogChanges(fake.client, [a.id, b.id], actor);
    expect(res.code).toBe('TRANSACTION_FAILED');
    expect(fake.state.crmCourse[0]).toMatchObject({ courseTitle: 'MSc Data Science', verificationStatus: 'VERIFIED' });
    expect(auditsOf(fake, 'CATALOG_RECORD_VERIFICATION_DOWNGRADED')).toHaveLength(0);
  });

  it('helpers: verified labels and materiality', () => {
    for (const s of ['VERIFIED', 'verified', 'VERIFIED_OFFICIAL']) expect(isVerifiedStatus(s)).toBe(true);
    for (const s of ['NEEDS_REVIEW', 'UNVERIFIED', '', null]) expect(isVerifiedStatus(s)).toBe(false);
    expect(isMaterialChange('MSc Data Science', 'msc data science', 'name')).toBe(false);
    expect(isMaterialChange('21000', '22500', 'number')).toBe(true);
    expect(isMaterialChange('', 'GBP', 'code')).toBe(true);
  });
});

describe('decision 1: historical approvals need re-approval', () => {
  it('fingerprint state is valid / missing / mismatch, and malformed hashes count as missing', () => {
    const r = proposal();
    expect(isValidFingerprint(proposalPayloadHash(r as any))).toBe(true);
    expect(isValidFingerprint('abc')).toBe(false);
    expect(isValidFingerprint('F'.repeat(64))).toBe(false);
    expect(approvalFingerprintState(r, approval(r))).toBe('valid');
    expect(approvalFingerprintState(r, null)).toBe('missing');
    expect(approvalFingerprintState(r, { metadata: '{}' })).toBe('missing');
    expect(approvalFingerprintState(r, { metadata: 'not json' })).toBe('missing');
    expect(approvalFingerprintState(r, { metadata: JSON.stringify({ approvedPayloadHash: 'abc' }) })).toBe('missing');
    expect(approvalFingerprintState({ ...r, newValue: 'Something else' }, approval(r))).toBe('mismatch');
  });

  it('apply refuses a malformed fingerprint, changes nothing live and returns the proposal for review', async () => {
    const r = proposal();
    const fake = setup([r], [approval(r, 'not-a-sha256')]);
    const res = await applyApprovedCatalogChanges(fake.client, [r.id], actor);
    expect(res.results[0]).toMatchObject({ code: 'APPROVAL_HASH_MISSING' });
    expect(fake.state.crmCourse[0]).toMatchObject({ courseTitle: 'MSc Data Science', verificationStatus: 'VERIFIED' });
    expect(fake.state.universityUpdateRequest[0].status).toBe('apply_failed');
  });

  it('legacy "approved" rows are not applicable (not silently upgraded)', async () => {
    const r = proposal({ status: 'approved' });
    const fake = setup([r]);
    const res = await applyApprovedCatalogChanges(fake.client, [r.id], actor);
    expect(res).toMatchObject({ ok: false, code: 'NOT_APPROVED' });
    expect(fake.state.crmCourse[0].courseTitle).toBe('MSc Data Science');
    expect(fake.state.universityUpdateRequest[0].status).toBe('approved');
  });
});

const m = vi.hoisted(() => ({ auth: vi.fn(), fake: null as any }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/db', () => ({ get db() { return m.fake.client; } }));

describe('decision 1 through the review API', () => {
  const admin = { userId: 'admin-1', actorUserId: 'admin-1', userType: 'ADMIN', identityDomain: 'portal', authenticationMethod: 'cookie', roles: [] };
  beforeEach(() => { vi.stubEnv('NEXTAUTH_URL', 'https://alo.test'); m.auth.mockResolvedValue(admin); });

  it('lists approved rows with their fingerprint state (read-only) and lets a legacy approval be re-approved with a fresh fingerprint', async () => {
    const { listCatalogUpdates, reviewCatalogUpdate } = await import('@/lib/crm/catalog-update-review');
    const fresh = proposal();
    const noHash = proposal({ fieldName: 'durationMonths', oldValue: '12', newValue: '18' });
    const legacy = proposal({ status: 'approved', fieldName: 'officialUrl', oldValue: '', newValue: 'https://www.uni-one.ac.uk/msc' });
    const changed = proposal({ fieldName: 'courseTitle', newValue: 'Edited after approval' });
    m.fake = createFakeCatalogDb({ ...catalogue(), universityUpdateRequest: [fresh, noHash, legacy, changed], portalAuditLog: [approval(fresh), { ...approval(noHash), metadata: '{}' }, approval({ ...changed, newValue: 'Original' })] });
    const before = JSON.stringify(m.fake.state);
    const res = await listCatalogUpdates(new Request('https://alo.test/api/admin/university-updates?status=all'));
    const body = await res.json();
    const state = Object.fromEntries(body.updates.map((u: any) => [u.id, u.approvalFingerprint]));
    expect(state).toEqual({ [fresh.id]: 'valid', [noHash.id]: 'missing', [legacy.id]: 'missing', [changed.id]: 'mismatch' });
    expect(JSON.stringify(m.fake.state)).toBe(before); // listing writes nothing

    const reapprove = await reviewCatalogUpdate(new Request('https://alo.test/api/admin/university-updates', { method: 'PATCH', headers: { origin: 'https://alo.test', 'content-type': 'application/json' }, body: JSON.stringify({ requestId: legacy.id, action: 'approve' }) }));
    expect(reapprove.status).toBe(200);
    const row = m.fake.state.universityUpdateRequest.find((x: any) => x.id === legacy.id);
    expect(row.status).toBe('reviewed_unverified');
    expect(m.fake.state.crmCourse[0].officialUrl).toBeUndefined(); // approval changed nothing live
    const latest = m.fake.state.portalAuditLog.filter((a: any) => a.entityId === legacy.id && a.action === 'CATALOG_PROPOSAL_APPROVE').at(-1);
    expect(approvalFingerprintState(row, latest)).toBe('valid');
  });
});

describe('decision 4: synthetic datasets are confined to the non-production fixture archive', () => {
  const root = process.cwd();
  it('fixture paths resolve only with an explicit opt-in outside production, only inside the archive', () => {
    expect(syntheticFixturePath('universities.csv', { NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBeNull();
    expect(syntheticFixturePath('universities.csv', { NODE_ENV: 'production', ALO_ALLOW_SYNTHETIC_AGENT_DATA: '1' } as NodeJS.ProcessEnv)).toBeNull();
    const dev = { NODE_ENV: 'development', ALO_ALLOW_SYNTHETIC_AGENT_DATA: '1' } as NodeJS.ProcessEnv;
    expect(syntheticFixturePath('universities.csv', dev, '/app')).toBe(path.resolve('/app', SYNTHETIC_CATALOGUE_DIR, 'universities.csv'));
    for (const bad of ['../universities.csv', 'data/universities.csv', '/etc/passwd', '..', 'x.ts', '']) expect(syntheticFixturePath(bad, dev, '/app')).toBeNull();
  });

  it('AI-agent loaders return nothing in production even with the flag, and never fall back to the repository-root CSVs', async () => {
    const { findSupervisorsForProfile, getSupervisorsForCourse } = await import('@/lib/ai-agents/supervisor-matcher');
    const { loadCampuses, loadCoursesWithCampus } = await import('@/lib/ai-agents/campus-course-mapper');
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('ALO_ALLOW_SYNTHETIC_AGENT_DATA', '1');
    expect(await findSupervisorsForProfile({ researchInterest: 'Engineering', desiredLevel: 'PhD' } as any)).toEqual([]);
    expect(loadCampuses()).toEqual([]);
    // Development + opt-in: the root files still exist in this checkout, but the loaders only look in the archive.
    vi.stubEnv('NODE_ENV', 'development');
    const spy = vi.spyOn(process, 'cwd').mockReturnValue(path.join(root, 'tests', '__no_fixture_archive_here__'));
    try {
      expect(await getSupervisorsForCourse('UNI-UN-0001-FOU–001')).toEqual([]);
      expect(loadCoursesWithCampus()).toEqual([]);
    } finally { spy.mockRestore(); }
  });

  it('no loader or seed reads catalogue data from the repository root, upload or legacy paths', () => {
    for (const f of ['src/lib/ai-agents/supervisor-matcher.ts', 'src/lib/ai-agents/international-course-agent.ts', 'src/lib/ai-agents/campus-course-mapper.ts']) {
      const src = readFileSync(f, 'utf8');
      expect(src, f).not.toContain('process.cwd()');
      expect(src, f).not.toMatch(/path\.(resolve|join)\([^)]*\.csv/);
    }
    const uni = readFileSync('prisma/seed-university-data.ts', 'utf8');
    expect(uni).toContain('"fixtures", "synthetic-catalogue"');
    expect(uni).not.toMatch(/\/home\/z\/my-project\/upload|UNIVERSITY_JSON_PATH|path\.resolve\(__dirname, "\.\.", "(universities|courses)\.csv"\)/);
    expect(uni).toMatch(/ALO_ALLOW_DESTRUCTIVE_TEMPLATE_SEED === "1" && env\.NODE_ENV !== "production"/);
    const complete = readFileSync('prisma/seed-complete.ts', 'utf8');
    expect(complete).toContain("path.resolve(__dirname, '..', 'fixtures', 'synthetic-catalogue')");
    expect(complete).toMatch(/ALO_SEED_UNIVERSITY_CATALOGUE === '1' && process\.env\.NODE_ENV === 'production'/);
    expect(readFileSync('prisma.config.ts', 'utf8')).toContain("seed: 'tsx prisma/seed-complete.ts'");
  });

  it('the delivery package script no longer ships catalogue CSVs or "verified" dataset claims', () => {
    const sh = readFileSync('scripts/build-delivery-packages-portable.sh', 'utf8');
    expect(sh).not.toMatch(/cp "\$ROOT_DIR\/(universities|courses|course_intakes|tuition_fees|course_requirements|english_requirements|02_ALO_COURSE_MASTER|04_ALO_UNIVERSITY_COURSE_MASTER)\.csv"/);
    expect(sh).not.toMatch(/560 verified|GCU London verified/);
  });

  it('the documented import template and synthetic example are committable (not git-ignored)', () => {
    for (const f of ['docs/catalogue-import/catalogue-import-TEMPLATE.csv', 'docs/catalogue-import/catalogue-import-EXAMPLE-SYNTHETIC.csv']) {
      let ignored = true;
      try { execFileSync('git', ['check-ignore', '-q', f]); } catch { ignored = false; }
      expect(ignored, f).toBe(false);
    }
  });
});

describe('template catalogue seeder API is contained', () => {
  it('POST /api/crm/seed-universities returns 503 in production (even with the opt-in flag) before auth or any DB access', async () => {
    const touched: string[] = [];
    m.fake = createFakeCatalogDb(catalogue());
    m.fake.onOperation(({ table }: any) => touched.push(table));
    m.auth.mockClear();
    const { POST } = await import('@/app/api/crm/seed-universities/route');
    for (const env of [{ NODE_ENV: 'production', flag: '1' }, { NODE_ENV: 'production', flag: '' }, { NODE_ENV: 'development', flag: '' }]) {
      vi.stubEnv('NODE_ENV', env.NODE_ENV);
      vi.stubEnv('ALO_ALLOW_SYNTHETIC_AGENT_DATA', env.flag);
      const res = await POST(new Request('https://alo.test/api/crm/seed-universities', { method: 'POST', body: JSON.stringify({ clear: true }) }));
      expect(res.status).toBe(503);
      expect(await res.json()).toMatchObject({ success: false, code: 'CATALOGUE_SEEDER_DISABLED' });
    }
    expect(m.auth).not.toHaveBeenCalled();
    expect(touched).toEqual([]);
    expect(m.fake.state.crmUniversity).toHaveLength(1);
  });
});
