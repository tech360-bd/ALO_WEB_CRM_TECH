import { beforeEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const m = vi.hoisted(() => ({ uniFind: vi.fn(), courseFind: vi.fn(), uniCreate: vi.fn(), courseCreate: vi.fn(), feeCreate: vi.fn(), audit: vi.fn(), transaction: vi.fn(), auth: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { crmUniversity: { findFirst: m.uniFind, findUnique: m.uniFind }, crmCourse: { findFirst: m.courseFind }, $transaction: m.transaction } }));
vi.mock('@/lib/auth-middleware', () => ({ withAuth: (handler: (req: Request, auth: unknown) => Promise<Response>) => (req: Request) => handler(req, m.auth()) }));
import { POST as importCourses } from '@/app/api/admin/import/courses/route';
import { POST as importUniversities } from '@/app/api/admin/import/universities/route';
const request = (rows: unknown[]) => new NextRequest('https://alo.test/api/admin/import/courses', { method: 'POST', headers: { origin: 'https://alo.test' }, body: JSON.stringify({ rows }) });
beforeEach(() => {
  vi.resetAllMocks(); vi.stubEnv('NEXTAUTH_URL', 'https://alo.test');
  m.auth.mockReturnValue({ identityDomain: 'user', authenticationMethod: 'cookie', userType: 'ADMIN', roles: ['ADMIN'], userId: 'admin', actorUserId: 'admin' });
  m.uniFind.mockResolvedValue(null); m.courseFind.mockResolvedValue(null); m.uniCreate.mockResolvedValue({}); m.courseCreate.mockResolvedValue({}); m.audit.mockResolvedValue({});
  m.transaction.mockImplementation(fn => fn({ crmUniversity: { create: m.uniCreate }, crmCourse: { create: m.courseCreate }, crmCourseIntakeFee: { create: m.feeCreate }, crmAuditLog: { create: m.audit } }));
});
it('imports a university only as draft even with supplied verified flags and source URL', async () => {
  const res = await importUniversities(request([{ name: 'Example', country: 'UK', source_url: 'https://example.edu', verificationStatus: 'VERIFIED', publicationStatus: 'PUBLISHED' }]));
  expect(res.status).toBe(200);
  expect(m.uniCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ status: 'active', publicationStatus: 'draft', verificationStatus: 'NEEDS_REVIEW', lastVerifiedAt: '', type: '', campusName: '' }) });
});
it('does not invent qualification, duration, intake, campus or currency for a course import', async () => {
  m.uniFind.mockResolvedValue({ universityId: 'uni', name: 'Example', country: 'UK', city: '' });
  const res = await importCourses(request([{ name: 'Programme', university_id: 'uni', source_url: 'https://example.edu/course', tuition_fee: '1000' }]));
  expect(res.status).toBe(200);
  expect(m.courseCreate).toHaveBeenCalledWith({ data: expect.objectContaining({ status: 'active', publicationStatus: 'draft', verificationStatus: 'NEEDS_REVIEW', lastVerifiedAt: '', qualification: '', durationMonths: 0, campus: '', studyLevel: '' }) });
  expect(m.feeCreate).not.toHaveBeenCalled();
});
it('bounds batch input before database work', async () => {
  expect((await importUniversities(request(Array(501).fill({})))).status).toBe(400);
  expect(m.uniFind).not.toHaveBeenCalled();
});
it('legacy exporter is disabled before client construction; bulk update cannot preserve publication', async () => {
  const { readFileSync } = await import('node:fs');
  const exporter = readFileSync('scripts/run-real-data-audit.ts', 'utf8');
  expect(exporter.indexOf('throw new Error')).toBeLessThan(exporter.indexOf('new PrismaClient'));
  const confirm = readFileSync('src/app/api/crm/course-import/confirm/route.ts', 'utf8');
  expect(confirm).toContain('Reviewed or published catalogue records require a reviewed update request');
  expect(confirm.match(/publicationStatus: 'draft'/g)).toHaveLength(5);
  expect(confirm).not.toContain('lastVerifiedAt: new Date');
});

it('batch audit failures cannot return false success or raw driver details', async () => {
  m.audit.mockRejectedValue(new Error('private driver secret'));
  const res = await importUniversities(request([{ name: 'Example', country: 'UK' }]));
  expect(res.status).toBe(500); expect(await res.text()).not.toContain('secret');
  expect(m.transaction).toHaveBeenCalledOnce();
});
it('rejects invalid cells, nonadmin identities and foreign origins before writes', async () => {
  expect((await importUniversities(request([{ name: null, country: 'UK' }]))).status).toBe(400);
  const foreign = request([]); foreign.headers.set('origin', 'https://attacker.test');
  expect((await importUniversities(foreign)).status).toBe(403);
  m.auth.mockReturnValue({ userType: 'STUDENT', identityDomain: 'user', roles: ['ADMIN'] });
  expect((await importUniversities(request([]))).status).toBe(403);
  expect(m.transaction).not.toHaveBeenCalled();
});
