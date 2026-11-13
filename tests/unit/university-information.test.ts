import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const m = vi.hoisted(() => ({ list: vi.fn(), count: vi.fn(), detail: vi.fn(), auth: { userType: 'ADMIN', roles: ['ADMIN'] } }));
vi.mock('@/lib/db', () => ({ db: { crmUniversity: { findMany: m.list, count: m.count, findUnique: m.detail } } }));
vi.mock('@/lib/auth-middleware', () => ({ withAuth: (handler: any) => (request: Request) => handler(request, m.auth) }));
import { GET } from '@/app/api/crm/universities/route';
import { UniversityInformationFields } from '@/components/crm/pages/UniversityInformation';
const req = (query = '') => new NextRequest(`https://alo.test/api/crm/universities?${query}`);
beforeEach(() => { vi.resetAllMocks(); m.auth = { userType: 'ADMIN', roles: ['ADMIN'] }; m.list.mockResolvedValue([]); m.count.mockResolvedValue(201); m.detail.mockResolvedValue(null); });
describe('university information catalogue', () => {
  it('paginates the entire stored directory rather than truncating at 100 universities', async () => {
    const body = await (await GET(req('page=6&limit=24'))).json();
    expect(body.pagination).toMatchObject({ page: 6, total: 201, pages: 9 });
    expect(m.list).toHaveBeenCalledWith(expect.objectContaining({ skip: 120, take: 24 }));
  });
  it.each(['page=NaN', 'page=0', 'limit=101', 'limit=1.5'])('rejects invalid pagination: %s', async (query) => {
    expect((await GET(req(query))).status).toBe(400); expect(m.list).not.toHaveBeenCalled();
  });
  it.each(['STUDENT', 'PARTNER'])('rejects %s even with contradictory admin roles', async (userType) => {
    m.auth.userType = userType; expect((await GET(req())).status).toBe(403); expect(m.list).not.toHaveBeenCalled();
  });
  it('returns a real university record with bounded related previews and actual totals', async () => {
    m.detail.mockResolvedValue({ universityId: 'synthetic-uni', name: 'Synthetic university', _count: { courses: 80 }, courses: [] });
    const body = await (await GET(req('universityId=synthetic-uni'))).json();
    expect(body.university._count.courses).toBe(80); expect(body.relatedRecordLimit).toBe(50);
    const args = m.detail.mock.calls[0][0]; expect(args.where).toEqual({ universityId: 'synthetic-uni' });
    for (const relation of ['courses', 'campusRecords', 'rankingRecords', 'scholarshipRecords', 'requirements', 'intakeFees']) expect(args.include[relation].take).toBe(50);
    expect(args.include).not.toHaveProperty('commissions');
  });
  it('reports missing records and database failure explicitly', async () => {
    expect((await GET(req('universityId=missing'))).status).toBe(404);
    m.count.mockRejectedValue(new Error('Synthetic private driver error'));
    const response = await GET(req()); expect(response.status).toBe(503); expect(JSON.stringify(await response.json())).not.toContain('private driver');
  });
  it('shows missing information without creating facts and renders only safe source anchors', () => {
    const html = renderToStaticMarkup(createElement(UniversityInformationFields, { record: { sourceUrl: 'javascript:alert(1)', officialUrl: 'https://synthetic-university.edu', description: '<script>not executable</script>' }, fields: ['founded', 'sourceUrl', 'officialUrl', 'description'] }));
    expect(html).toContain('Not recorded'); expect(html).not.toContain('href="javascript:'); expect(html).toContain('href="https://synthetic-university.edu/"'); expect(html).toContain('&lt;script&gt;');
  });
});
