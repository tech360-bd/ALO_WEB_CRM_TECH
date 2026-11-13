import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const m = vi.hoisted(() => ({ count: vi.fn(), find: vi.fn(), uni: vi.fn(), userType: 'ADMIN' }));
vi.mock('@/lib/db', () => ({ db: { crmScholarship: { count: m.count, findMany: m.find }, crmUniversity: { findUnique: m.uni } } }));
vi.mock('@/lib/auth-middleware', () => ({
  logAuditAction: vi.fn(),
  withAuth: (handler: any, options: any) => (request: Request) => options.requireUserTypes.includes(m.userType) ? handler(request, { userType: m.userType }) : new Response('{}', { status: 403 }),
}));
import { GET } from '@/app/api/crm/scholarships/route';
const req = (query = '') => new NextRequest(`https://alo.test/api/crm/scholarships?${query}`);
beforeEach(() => { vi.resetAllMocks(); m.userType = 'ADMIN'; m.count.mockResolvedValue(0); m.find.mockResolvedValue([]); });
describe('real CRM scholarship catalogue', () => {
  it.each(['page=NaN', 'page=0', 'page=1.5', 'limit=0', 'limit=101', 'limit=NaN'])('rejects unsafe pagination: %s', async (query) => {
    expect((await GET(req(query))).status).toBe(400); expect(m.find).not.toHaveBeenCalled();
  });
  it.each(['STUDENT', 'PARTNER'])('does not expose review records to %s sessions', async (userType) => {
    m.userType = userType; expect((await GET(req())).status).toBe(403); expect(m.find).not.toHaveBeenCalled();
  });
  it('returns stored awards and verification state without deriving values from tuition', async () => {
    m.count.mockResolvedValue(1); m.find.mockResolvedValue([{ id: 'synthetic-scholarship', universityId: 'synthetic-uni', scholarshipName: 'Synthetic recorded award', scholarshipAmount: 123, scholarshipCurrency: 'CAD', verificationStatus: 'NEEDS_REVIEW' }]);
    m.uni.mockResolvedValue({ name: 'Synthetic university' });
    const body = await (await GET(req('page=1&limit=24'))).json();
    expect(body.data[0]).toMatchObject({ scholarshipAmount: 123, scholarshipCurrency: 'CAD', verificationStatus: 'NEEDS_REVIEW', universityName: 'Synthetic university' });
    expect(body).toMatchObject({ total: 1, page: 1, totalPages: 1 });
  });
  it('does not report a missing scholarship table as successful zero coverage', async () => {
    m.find.mockRejectedValue(new Error('Unknown table synthetic_database_table'));
    const response = await GET(req()); expect(response.status).toBe(500);
    const body = await response.json(); expect(body.success).toBe(false); expect(JSON.stringify(body)).not.toContain('synthetic_database_table');
  });
});
