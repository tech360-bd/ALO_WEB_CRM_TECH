import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { createFakeCatalogDb } from '../helpers/fake-catalog-db';
import {
  APPLY_FIELD_ALLOWLIST,
  applyApprovedCatalogChanges,
  coerceApprovedValue,
  parseProposalTarget,
} from '@/lib/course-finder/apply-approved-changes';
import { proposalPayloadHash } from '@/lib/course-finder/catalog-change-payload';

const actor = { actorUserId: 'super-1', effectiveUserId: 'super-1', identityDomain: 'portal' };
const EVIDENCE = 'https://www.uni-one.ac.uk/courses/msc-data-science';

function baseCatalogue() {
  return {
    crmUniversity: [
      { id: 'u-row-1', universityId: 'UNI-1', name: 'University One', city: 'Leeds', verificationStatus: 'VERIFIED', publicationStatus: 'published', visibility: 'public', lastVerifiedAt: '2026-09-01', lastApprovedUpdateAt: '', updatedBy: '' },
      { id: 'u-row-2', universityId: 'UNI-2', name: 'University Two', city: 'York', verificationStatus: 'NEEDS_REVIEW', publicationStatus: 'draft', visibility: 'private', lastVerifiedAt: '', lastApprovedUpdateAt: '', updatedBy: '' },
    ],
    crmCourse: [
      { id: 'c-row-1', courseId: 'CRS-1', universityId: 'UNI-1', courseTitle: 'MSc Data Science', durationMonths: 12, verificationStatus: 'VERIFIED', publicationStatus: 'published', visibility: 'public', lastVerifiedAt: '2026-09-01', lastApprovedUpdateAt: '', updatedBy: '' },
      { id: 'c-row-2', courseId: 'CRS-2', universityId: 'UNI-2', courseTitle: 'BSc Computing', durationMonths: 36, verificationStatus: 'NEEDS_REVIEW', publicationStatus: 'draft', visibility: 'private', lastVerifiedAt: '', lastApprovedUpdateAt: '', updatedBy: '' },
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
function proposal(p: Partial<Record<string, any>>) {
  n++;
  return {
    id: `req-${n}`, universityId: 'UNI-1', courseId: 'CRS-1', entityType: 'course', entityName: 'MSc Data Science', country: 'United Kingdom',
    fieldName: 'courseTitle', oldValue: 'MSc Data Science', newValue: 'MSc Applied Data Science', evidenceUrl: EVIDENCE,
    aiConfidence: 0, status: 'reviewed_unverified', reviewedBy: 'portal:admin-1', createdAt: '2026-10-01T00:00:00.000Z',
    ...p,
  };
}
function approvalFor(r: Record<string, any>, at = '2026-10-02T00:00:00.000Z') {
  return { id: `audit-approve-${r.id}`, actorUserId: 'admin-1', action: 'CATALOG_PROPOSAL_APPROVE', entityType: 'UniversityUpdateRequest', entityId: r.id, createdAt: at, metadata: JSON.stringify({ approvedPayloadHash: proposalPayloadHash(r as any), verified: false }) };
}
function setup(reqs: Array<Record<string, any>>, opts: { approve?: boolean } = {}) {
  const fake = createFakeCatalogDb({ ...baseCatalogue(), universityUpdateRequest: reqs, portalAuditLog: opts.approve === false ? [] : reqs.map((r) => approvalFor(r)) });
  return fake;
}
const audits = (fake: ReturnType<typeof setup>, action: string) => fake.state.portalAuditLog.filter((a) => a.action === action);

describe('apply approved catalogue changes', () => {
  beforeEach(() => { n = 0; });

  it('applies an approved change to a verified record, moves it to needs review (publication fields untouched) and audits it', async () => {
    const r = proposal({});
    const fake = setup([r]);
    const res = await applyApprovedCatalogChanges(fake.client, [r.id], actor);
    expect(res).toMatchObject({ httpStatus: 200, ok: true, code: 'APPLIED' });
    const course = fake.state.crmCourse.find((c) => c.courseId === 'CRS-1')!;
    expect(course.courseTitle).toBe('MSc Applied Data Science');
    // Owner decision 2026-10-12: a material change to a verified record requires re-verification.
    expect(course).toMatchObject({ verificationStatus: 'NEEDS_REVIEW', publicationStatus: 'published', visibility: 'public', lastVerifiedAt: '2026-09-01', updatedBy: 'portal:super-1' });
    expect(course.lastApprovedUpdateAt).not.toBe('');
    expect(fake.state.universityUpdateRequest[0].status).toBe('applied');
    const [audit] = audits(fake, 'CATALOG_CHANGE_APPLIED');
    const meta = JSON.parse(audit.metadata);
    expect(audit).toMatchObject({ actorUserId: 'super-1', entityId: r.id });
    expect(audit.createdAt).toBeTruthy();
    expect(meta).toMatchObject({
      target: { model: 'CrmCourse', key: 'course:CRS-1', field: 'courseTitle', rowId: 'c-row-1' },
      previousValue: 'MSc Data Science', approvedValue: 'MSc Applied Data Science', evidenceUrl: EVIDENCE,
      approvedBy: 'portal:admin-1', approvalAuditId: `audit-approve-${r.id}`, approvedPayloadHash: proposalPayloadHash(r as any), result: 'applied', verified: false, published: false,
      verificationTransition: { from: 'VERIFIED', to: 'NEEDS_REVIEW' },
    });
  });

  it('approval never verifies: applying to an unverified record leaves it unverified and private', async () => {
    const r = proposal({ universityId: 'UNI-2', courseId: 'CRS-2', oldValue: 'BSc Computing', newValue: 'BSc (Hons) Computing' });
    const fake = setup([r]);
    expect((await applyApprovedCatalogChanges(fake.client, [r.id], actor)).ok).toBe(true);
    expect(fake.state.crmCourse.find((c) => c.courseId === 'CRS-2')).toMatchObject({ courseTitle: 'BSc (Hons) Computing', verificationStatus: 'NEEDS_REVIEW', publicationStatus: 'draft', visibility: 'private' });
  });

  it('retrying an applied batch is idempotent: no writes, no new audit', async () => {
    const r = proposal({});
    const fake = setup([r]);
    await applyApprovedCatalogChanges(fake.client, [r.id], actor);
    const auditCount = fake.state.portalAuditLog.length;
    const tx = fake.transactions;
    const again = await applyApprovedCatalogChanges(fake.client, [r.id, r.id], actor);
    expect(again).toMatchObject({ httpStatus: 200, ok: true, code: 'ALREADY_APPLIED', results: [{ requestId: r.id, outcome: 'already_applied' }] });
    expect(fake.state.portalAuditLog.length).toBe(auditCount);
    expect(fake.transactions).toBe(tx);
  });

  it('stale approval never overwrites a newer live value: it is requeued with the live value and needs fresh review', async () => {
    const r = proposal({});
    const fake = setup([r]);
    fake.state.crmCourse[0].courseTitle = 'MSc Data Science and AI'; // changed after review
    const res = await applyApprovedCatalogChanges(fake.client, [r.id], actor);
    expect(res).toMatchObject({ httpStatus: 409, code: 'VALIDATION_FAILED', results: [{ requestId: r.id, outcome: 'requeued_stale', code: 'STALE', previousValue: 'MSc Data Science and AI' }] });
    expect(fake.state.crmCourse[0].courseTitle).toBe('MSc Data Science and AI');
    expect(fake.state.universityUpdateRequest[0]).toMatchObject({ status: 'pending_approval', oldValue: 'MSc Data Science and AI' });
    const [stale] = audits(fake, 'CATALOG_CHANGE_STALE_REQUEUED');
    expect(JSON.parse(stale.metadata)).toMatchObject({ code: 'STALE', previousOldValue: 'MSc Data Science', liveValue: 'MSc Data Science and AI', result: 'requeued_stale' });
    // Even if someone forces the status back, the old approval hash no longer matches.
    fake.state.universityUpdateRequest[0].status = 'reviewed_unverified';
    const forced = await applyApprovedCatalogChanges(fake.client, [r.id], actor);
    expect(forced.results[0]).toMatchObject({ code: 'PAYLOAD_MISMATCH' });
    expect(fake.state.crmCourse[0].courseTitle).toBe('MSc Data Science and AI');
  });

  it('refuses payloads that differ from the approved hash and approvals without a hash', async () => {
    const a = proposal({});
    const fake = setup([a]);
    fake.state.universityUpdateRequest[0].newValue = 'Tampered title';
    const res = await applyApprovedCatalogChanges(fake.client, [a.id], actor);
    expect(res.results[0]).toMatchObject({ outcome: 'failed', code: 'PAYLOAD_MISMATCH' });
    expect(fake.state.universityUpdateRequest[0].status).toBe('apply_failed');
    expect(fake.state.crmCourse[0].courseTitle).toBe('MSc Data Science');

    const b = proposal({});
    const legacy = setup([b], { approve: false });
    legacy.state.portalAuditLog.push({ id: 'old', action: 'CATALOG_PROPOSAL_APPROVE', entityType: 'UniversityUpdateRequest', entityId: b.id, createdAt: '2026-01-01', metadata: '{}' });
    const res2 = await applyApprovedCatalogChanges(legacy.client, [b.id], actor);
    expect(res2.results[0]).toMatchObject({ code: 'APPROVAL_HASH_MISSING' });
    expect(legacy.state.crmCourse[0].courseTitle).toBe('MSc Data Science');
  });

  it('uses the latest approval only', async () => {
    const r = proposal({});
    const fake = setup([r]);
    fake.state.portalAuditLog.push({ id: 'newer', action: 'CATALOG_PROPOSAL_APPROVE', entityType: 'UniversityUpdateRequest', entityId: r.id, createdAt: '2026-10-05T00:00:00.000Z', metadata: JSON.stringify({ approvedPayloadHash: 'f'.repeat(64) }) });
    expect((await applyApprovedCatalogChanges(fake.client, [r.id], actor)).results[0]).toMatchObject({ code: 'PAYLOAD_MISMATCH' });
  });

  it('does not apply proposals that are not approved and does not change their status', async () => {
    const p = proposal({ status: 'pending_approval' });
    const fake = setup([p]);
    const res = await applyApprovedCatalogChanges(fake.client, [p.id], actor);
    expect(res).toMatchObject({ httpStatus: 409, code: 'NOT_APPROVED' });
    expect(fake.state.universityUpdateRequest[0].status).toBe('pending_approval');
    expect(fake.transactions).toBe(0);
  });

  it('returns 404 and writes nothing when any proposal is missing', async () => {
    const r = proposal({});
    const fake = setup([r]);
    const res = await applyApprovedCatalogChanges(fake.client, [r.id, 'nope'], actor);
    expect(res.httpStatus).toBe(404);
    expect(fake.state.crmCourse[0].courseTitle).toBe('MSc Data Science');
  });

  it('a single invalid item aborts the whole batch (no partial updates)', async () => {
    const good = proposal({});
    const bad = proposal({ entityType: 'university', courseId: '', fieldName: 'ranking', oldValue: '120', newValue: '90' });
    const fake = setup([good, bad]);
    const res = await applyApprovedCatalogChanges(fake.client, [good.id, bad.id], actor);
    expect(res.code).toBe('VALIDATION_FAILED');
    expect(res.results).toEqual(expect.arrayContaining([
      expect.objectContaining({ requestId: bad.id, code: 'UNSUPPORTED_FIELD' }),
      expect.objectContaining({ requestId: good.id, outcome: 'not_applied_batch_aborted' }),
    ]));
    expect(fake.state.crmCourse[0].courseTitle).toBe('MSc Data Science');
    expect(fake.state.universityUpdateRequest.find((x) => x.id === good.id)!.status).toBe('reviewed_unverified');
    expect(fake.state.universityUpdateRequest.find((x) => x.id === bad.id)!.status).toBe('apply_failed');
  });

  it('a failed transaction rolls back every write and records the failure', async () => {
    const a = proposal({});
    const b = proposal({ fieldName: 'intake:2027-09:yearlyTuition', oldValue: '21000', newValue: '22500' });
    const fake = setup([a, b]);
    fake.onOperation(({ table, method, inTx }) => {
      if (inTx && table === 'crmCourseIntakeFee' && method === 'updateMany') throw new Error('simulated driver failure');
    });
    const res = await applyApprovedCatalogChanges(fake.client, [a.id, b.id], actor);
    expect(res).toMatchObject({ httpStatus: 503, ok: false, code: 'TRANSACTION_FAILED' });
    expect(JSON.stringify(res)).not.toContain('driver');
    expect(fake.state.crmCourse[0].courseTitle).toBe('MSc Data Science'); // first write rolled back
    expect(fake.state.crmCourseIntakeFee[0].yearlyTuition).toBe(21000);
    expect(fake.state.universityUpdateRequest.map((x) => x.status)).toEqual(['apply_failed', 'apply_failed']);
    expect(audits(fake, 'CATALOG_CHANGE_APPLIED')).toHaveLength(0);
    expect(audits(fake, 'CATALOG_CHANGE_APPLY_FAILED').map((x) => JSON.parse(x.metadata).code)).toEqual(['TRANSACTION_FAILED', 'TRANSACTION_FAILED']);
  });

  it('rolls back without status changes when a record changes concurrently between validation and the transaction', async () => {
    const r = proposal({});
    const fake = setup([r]);
    let fired = false;
    fake.onOperation(({ table, method, inTx }) => {
      if (!inTx && !fired && table === 'crmCourseRequirement' && method === 'findMany') { fired = true; fake.state.crmCourse[0].courseTitle = 'Concurrent edit'; }
    });
    const res = await applyApprovedCatalogChanges(fake.client, [r.id], actor);
    expect(res).toMatchObject({ httpStatus: 409, code: 'CONCURRENT_CHANGE' });
    expect(fake.state.crmCourse[0].courseTitle).toBe('Concurrent edit');
    expect(fake.state.universityUpdateRequest[0].status).toBe('reviewed_unverified');
  });

  it('adds a new intake to an existing verified course as NEEDS_REVIEW (not public) with provenance', async () => {
    const reqs = [
      proposal({ fieldName: 'intake_new:2028-01:intakeMonth', oldValue: '', newValue: 'January' }),
      proposal({ fieldName: 'intake_new:2028-01:yearlyTuition', oldValue: '', newValue: '23,000' }),
      proposal({ fieldName: 'intake_new:2028-01:tuitionCurrency', oldValue: '', newValue: 'gbp' }),
    ];
    const fake = setup(reqs);
    const res = await applyApprovedCatalogChanges(fake.client, reqs.map((r) => r.id), actor);
    expect(res).toMatchObject({ ok: true, code: 'APPLIED' });
    const created = fake.state.crmCourseIntakeFee.filter((i) => i.intakeYear === 2028);
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ courseId: 'CRS-1', universityId: 'UNI-1', intakeMonth: 'January', yearlyTuition: 23000, tuitionCurrency: 'GBP', verificationStatus: 'NEEDS_REVIEW', intakeSourceUrl: EVIDENCE, feeSourceUrl: EVIDENCE });
    expect(created[0].verificationStatus).not.toBe('VERIFIED');
    // The parent course stays verified; nothing else changed.
    expect(fake.state.crmCourse[0].verificationStatus).toBe('VERIFIED');
    expect(audits(fake, 'CATALOG_CHANGE_APPLIED').map((a) => JSON.parse(a.metadata).createdVerificationStatus)).toEqual(['NEEDS_REVIEW', 'NEEDS_REVIEW', 'NEEDS_REVIEW']);
  });

  it('new-intake proposals do not overwrite an intake created meanwhile with different values', async () => {
    const r = proposal({ fieldName: 'intake_new:2027-09:yearlyTuition', oldValue: '', newValue: '25000' });
    const fake = setup([r]);
    const res = await applyApprovedCatalogChanges(fake.client, [r.id], actor);
    expect(res.results[0]).toMatchObject({ code: 'STALE', outcome: 'requeued_stale' });
    expect(fake.state.crmCourseIntakeFee[0].yearlyTuition).toBe(21000);
  });

  it('refuses duplicate targets, identity mismatches, conflicting proposals and forbidden/unknown fields', async () => {
    const dupIntake = proposal({ fieldName: 'intake:2027-09:yearlyTuition', oldValue: '21000', newValue: '22000' });
    const wrongUni = proposal({ universityId: 'UNI-2' });
    const forbidden = proposal({ fieldName: 'verificationStatus', oldValue: 'VERIFIED', newValue: 'VERIFIED' });
    const unknown = proposal({ fieldName: 'requirement:secretField', oldValue: '', newValue: 'x' });
    const c1 = proposal({ entityType: 'university', courseId: '', fieldName: 'city', oldValue: 'Leeds', newValue: 'Bradford' });
    const c2 = proposal({ entityType: 'university', courseId: '', fieldName: 'city', oldValue: 'Leeds', newValue: 'Wakefield' });
    const fake = setup([dupIntake, wrongUni, forbidden, unknown, c1, c2]);
    fake.state.crmCourseIntakeFee.push({ id: 'i-row-dup', universityId: 'UNI-1', courseId: 'CRS-1', intakeYear: 2027, intakeMonth: 'Sep', yearlyTuition: 21000 });
    const res = await applyApprovedCatalogChanges(fake.client, [dupIntake, wrongUni, forbidden, unknown, c1, c2].map((r) => r.id), actor);
    const code = (id: string) => res.results.find((x) => x.requestId === id)?.code;
    expect(code(dupIntake.id)).toBe('DUPLICATE_TARGET');
    expect(code(wrongUni.id)).toBe('IDENTITY_MISMATCH');
    expect(code(forbidden.id)).toBe('UNSUPPORTED_FIELD');
    expect(code(unknown.id)).toBe('UNSUPPORTED_FIELD');
    expect(code(c1.id)).toBe('DUPLICATE_IN_BATCH');
    expect(code(c2.id)).toBe('DUPLICATE_IN_BATCH');
    expect(fake.state.crmUniversity[0].city).toBe('Leeds');
  });

  it('requires https evidence on a real domain and typed, in-range values', async () => {
    const synthetic = proposal({ evidenceUrl: 'https://uni.example/courses' });
    const http = proposal({ fieldName: 'durationMonths', oldValue: '12', newValue: '18', evidenceUrl: 'http://www.uni-one.ac.uk/x' });
    const fake = setup([synthetic, http]);
    const res = await applyApprovedCatalogChanges(fake.client, [synthetic.id, http.id], actor);
    expect(res.results.map((r) => r.code)).toEqual(['EVIDENCE_INVALID', 'EVIDENCE_INVALID']);
    const ielts = APPLY_FIELD_ALLOWLIST.CrmCourseRequirement.ieltsOverall;
    expect(coerceApprovedValue(ielts, '7.5')).toEqual({ ok: true, value: 7.5 });
    expect(coerceApprovedValue(ielts, '12')).toMatchObject({ ok: false, code: 'INVALID_VALUE' });
    expect(coerceApprovedValue(APPLY_FIELD_ALLOWLIST.CrmCourse.durationMonths, '12.5')).toMatchObject({ ok: false });
    expect(coerceApprovedValue(APPLY_FIELD_ALLOWLIST.CrmCourseRequirement.moiAccepted, 'Yes')).toEqual({ ok: true, value: true });
    expect(coerceApprovedValue(APPLY_FIELD_ALLOWLIST.CrmCourseIntakeFee.tuitionCurrency, 'pounds')).toMatchObject({ ok: false });
    expect(coerceApprovedValue(APPLY_FIELD_ALLOWLIST.CrmCourse.courseTitle, 'x'.repeat(191))).toMatchObject({ ok: false, code: 'VALUE_POSSIBLY_TRUNCATED' });
    expect(coerceApprovedValue(APPLY_FIELD_ALLOWLIST.CrmCourse.courseTitle, '   ')).toMatchObject({ ok: false });
  });

  it('parses only the documented field-name conventions', () => {
    expect(parseProposalTarget('course', 'intake:2027-09:yearlyTuition')).toMatchObject({ kind: 'intake_update', year: 2027, month: '09' });
    expect(parseProposalTarget('course', 'intake_new:2027-13:yearlyTuition')).toBeNull();
    expect(parseProposalTarget('university', 'intake:2027-09:yearlyTuition')).toBeNull();
    expect(parseProposalTarget('course', 'requirement:ieltsOverall')).toMatchObject({ kind: 'requirement' });
    expect(parseProposalTarget('scholarship', 'amount')).toBeNull();
  });

  it('every allowlisted field exists in prisma/schema.prisma with the declared scalar type (no guessed fields)', () => {
    const schema = readFileSync('prisma/schema.prisma', 'utf8');
    for (const [model, fields] of Object.entries(APPLY_FIELD_ALLOWLIST)) {
      const body = new RegExp(`^model ${model} \\{([\\s\\S]*?)^\\}`, 'm').exec(schema)?.[1];
      expect(body, model).toBeTruthy();
      for (const spec of Object.values(fields)) {
        const line = body!.split('\n').map((l) => l.trim().split(/\s+/)).find((p) => p[0] === spec.field);
        expect(line, `${model}.${spec.field}`).toBeTruthy();
        expect(line![1], `${model}.${spec.field}`).toBe(spec.prisma);
      }
      for (const forbidden of ['verificationStatus', 'publicationStatus', 'visibility', 'lastVerifiedAt']) expect(fields[forbidden]).toBeUndefined();
    }
    // Fields written as side effects must also exist.
    const intake = /^model CrmCourseIntakeFee \{([\s\S]*?)^\}/m.exec(schema)![1];
    for (const f of ['intakeYear', 'intakeMonth', 'intakeSourceUrl', 'feeSourceUrl', 'verificationStatus', 'status']) expect(intake).toMatch(new RegExp(`\\n\\s+${f}\\s`));
    for (const m of ['CrmUniversity', 'CrmCourse']) {
      const b = new RegExp(`^model ${m} \\{([\\s\\S]*?)^\\}`, 'm').exec(schema)![1];
      expect(b).toMatch(/\n\s+lastApprovedUpdateAt\s+String/);
      expect(b).toMatch(/\n\s+updatedBy\s+String/);
    }
  });
});

// ---------------------------------------------------------------------------
// End-to-end through the real approve handler and the apply route
// ---------------------------------------------------------------------------
const m = vi.hoisted(() => ({ auth: vi.fn(), fake: null as any }));
vi.mock('@/lib/auth-middleware', () => ({ authenticateRequest: m.auth }));
vi.mock('@/lib/db', () => ({ get db() { return m.fake.client; } }));

describe('approve → apply routes', () => {
  const admin = { userId: 'admin-1', actorUserId: 'admin-1', userType: 'ADMIN', identityDomain: 'portal', authenticationMethod: 'cookie', roles: [] };
  const superAdmin = { ...admin, userId: 'super-1', actorUserId: 'super-1', userType: 'SUPER_ADMIN' };
  const post = (url: string, body: unknown, origin = 'https://alo.test') => new Request(`https://alo.test${url}`, { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify(body) });

  beforeEach(() => {
    vi.stubEnv('NEXTAUTH_URL', 'https://alo.test');
    n = 0;
    m.fake = createFakeCatalogDb({ ...baseCatalogue(), universityUpdateRequest: [proposal({ status: 'pending_approval' })] });
  });

  it('approve records a payload hash but changes no live data; apply then writes it', async () => {
    const { reviewCatalogUpdate } = await import('@/lib/crm/catalog-update-review');
    const { POST: apply } = await import('@/app/api/admin/catalog-changes/apply/route');
    m.auth.mockResolvedValue(admin);
    const approved = await reviewCatalogUpdate(post('/api/admin/university-updates', { requestId: 'req-1', action: 'approve' }));
    expect(approved.status).toBe(200);
    expect(m.fake.state.crmCourse[0].courseTitle).toBe('MSc Data Science');
    const meta = JSON.parse(m.fake.state.portalAuditLog.find((a: any) => a.action === 'CATALOG_PROPOSAL_APPROVE').metadata);
    expect(meta.approvedPayloadHash).toMatch(/^[0-9a-f]{64}$/);
    expect(meta.verified).toBe(false);

    // ADMIN may approve but not apply.
    expect((await apply(post('/api/admin/catalog-changes/apply', { requestIds: ['req-1'] }))).status).toBe(403);
    m.auth.mockResolvedValue(superAdmin);
    const res = await apply(post('/api/admin/catalog-changes/apply', { requestIds: ['req-1'] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ success: true, code: 'APPLIED', verified: false, published: false });
    expect(m.fake.state.crmCourse[0].courseTitle).toBe('MSc Applied Data Science');
  });

  it('apply refuses unauthenticated, non-admin, impersonating, cross-origin and malformed requests before any DB access', async () => {
    const { NextResponse } = await import('next/server');
    const { POST: apply } = await import('@/app/api/admin/catalog-changes/apply/route');
    const touched: string[] = [];
    m.fake.onOperation(({ table }: any) => touched.push(table));
    m.auth.mockResolvedValueOnce(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    expect((await apply(post('/api/admin/catalog-changes/apply', { requestIds: ['req-1'] }))).status).toBe(401);
    for (const who of [{ ...admin, userType: 'STUDENT', roles: ['SUPER_ADMIN'] }, { ...superAdmin, identityDomain: undefined }, { ...superAdmin, userId: 'someone-else' }]) {
      m.auth.mockResolvedValueOnce(who);
      expect((await apply(post('/api/admin/catalog-changes/apply', { requestIds: ['req-1'] }))).status).toBe(403);
    }
    m.auth.mockResolvedValue(superAdmin);
    expect((await apply(post('/api/admin/catalog-changes/apply', { requestIds: ['req-1'] }, 'https://evil.test'))).status).toBe(403);
    expect((await apply(post('/api/admin/catalog-changes/apply', { requestIds: [] }))).status).toBe(400);
    expect((await apply(post('/api/admin/catalog-changes/apply', { requestIds: ['a'], status: 'VERIFIED' }))).status).toBe(400);
    expect(touched).toEqual([]);
  });

  it('history requires an administrator', async () => {
    const { GET } = await import('@/app/api/admin/catalog-changes/history/route');
    m.auth.mockResolvedValue({ ...admin, userType: 'COUNSELOR' });
    expect((await GET(new Request('https://alo.test/api/admin/catalog-changes/history'))).status).toBe(403);
    m.auth.mockResolvedValue(admin);
    m.fake.client.portalAuditLog.findMany = async () => [{ id: 'a1', actorUserId: 'x', action: 'CATALOG_CHANGE_APPLIED', entityType: 'UniversityUpdateRequest', entityId: 'req-1', metadata: '{"result":"applied"}', createdAt: '2026-10-12' }];
    const res = await GET(new Request('https://alo.test/api/admin/catalog-changes/history?action=CATALOG_CHANGE_APPLIED'));
    expect(await res.json()).toMatchObject({ success: true, entries: [{ metadata: { result: 'applied' } }] });
  });
});
