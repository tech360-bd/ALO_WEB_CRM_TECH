import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const mocks = vi.hoisted(() => ({ auth: { userId: 'admin-1', actorUserId: 'admin-1', roles: ['ADMIN'], identityDomain: 'user', userType: 'ADMIN', authenticationMethod: 'cookie' as const }, universityFind: vi.fn(), courseFind: vi.fn(), universityCreate: vi.fn(), courseCreate: vi.fn(), feeCreate: vi.fn(), auditCreate: vi.fn(), transaction: vi.fn() }));
vi.mock('@/lib/auth-middleware', () => ({ withAuth: (fn: any) => (req: any) => fn(req, mocks.auth) }));
vi.mock('@/lib/db', () => ({ db: { crmUniversity: { findFirst: mocks.universityFind }, crmCourse: { findFirst: mocks.courseFind }, $transaction: mocks.transaction } }));
import { POST as importUniversities } from '@/app/api/admin/import/universities/route';
import { POST as importCourses } from '@/app/api/admin/import/courses/route';
const request = (rows: unknown[], dryRun = false) => new NextRequest('https://aloeducation.com/api/admin/import/universities', { method: 'POST', headers: { origin: 'https://aloeducation.com' }, body: JSON.stringify({ rows, dryRun }) });
beforeEach(() => {
 vi.resetAllMocks(); vi.stubEnv('NEXTAUTH_URL', 'https://aloeducation.com'); mocks.auth.roles = ['ADMIN']; mocks.auth.userType = 'ADMIN'; mocks.universityFind.mockResolvedValue(null); mocks.courseFind.mockResolvedValue(null);
 mocks.transaction.mockImplementation((fn: any) => fn({ crmUniversity: { create: mocks.universityCreate }, crmCourse: { create: mocks.courseCreate }, crmCourseIntakeFee: { create: mocks.feeCreate }, crmAuditLog: { create: mocks.auditCreate } }));
});
describe('catalog import safety', () => {
 it('keeps source-linked universities in draft review without fabricated verification', async () => {
  expect((await importUniversities(request([{ name: 'University of Example', country: 'UK', source_url: 'https://example.ac.uk' }]))).status).toBe(200);
  expect(mocks.universityCreate.mock.calls[0][0].data).toMatchObject({ status: 'active', publicationStatus: 'draft', verificationStatus: 'NEEDS_REVIEW', lastVerifiedAt: '', campusName: '', type: '' }); expect(mocks.auditCreate).toHaveBeenCalledOnce();
 });
 it('does not guess degree, duration or intake for a course', async () => {
  mocks.universityFind.mockResolvedValue({ universityId: 'UNI-1', name: 'University of Example', city: '', country: 'UK', campusName: '' });
  expect((await importCourses(request([{ title: 'Computing', university_id: 'UNI-1', source_url: 'https://example.ac.uk/course', tuition_fee: '20000' }]))).status).toBe(200);
  expect(mocks.courseCreate.mock.calls[0][0].data).toMatchObject({ publicationStatus: 'draft', verificationStatus: 'NEEDS_REVIEW', lastVerifiedAt: '', durationMonths: 0, qualification: '', studyLevel: '' }); expect(mocks.feeCreate).not.toHaveBeenCalled();
 });
 it('does not swallow audit failures', async () => { mocks.auditCreate.mockRejectedValue(new Error('audit unavailable')); expect((await importUniversities(request([{ name: 'University', country: 'UK' }]))).status).toBe(500); });
 it('rejects oversized batches before querying or writing', async () => { expect((await importUniversities(request(Array.from({ length: 501 }, () => ({ name: 'University', country: 'UK' }))))).status).toBe(400); expect(mocks.transaction).not.toHaveBeenCalled(); expect(mocks.universityFind).not.toHaveBeenCalled(); });
 it('previews without writing', async () => { expect((await importUniversities(request([{ name: 'University', country: 'UK' }], true))).status).toBe(200); expect(mocks.transaction).not.toHaveBeenCalled(); });
 it('rejects non-admin imports', async () => { mocks.auth.roles = ['STUDENT']; mocks.auth.userType = 'STUDENT'; expect((await importUniversities(request([{ name: 'University', country: 'UK' }]))).status).toBe(403); expect(mocks.transaction).not.toHaveBeenCalled(); });
});
