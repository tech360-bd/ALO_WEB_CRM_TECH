import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { publicCourseWhere, publicUniversityWhere } from '@/lib/public-catalog';
const m = vi.hoisted(() => ({ guard: vi.fn(), universities: vi.fn(), courses: vi.fn(), scholarships: vi.fn() }));
vi.mock('@/lib/university-monitoring-auth', () => ({ requireMonitoringViewer: m.guard }));
vi.mock('@/lib/db', () => ({ db: { crmUniversity: { findMany: m.universities }, crmCourse: { findMany: m.courses }, crmScholarship: { findMany: m.scholarships } } }));
import { GET } from '@/app/api/university-monitoring/search/route';
const request = (query: string) => new NextRequest(`https://alo.test/api/university-monitoring/search?${query}`);
beforeEach(() => { vi.resetAllMocks(); m.guard.mockResolvedValue({ ok: true }); for (const fn of [m.universities, m.courses, m.scholarships]) fn.mockResolvedValue([]); });
describe('approved Knowledge Center catalogue search', () => {
  it('requires staff authentication before searching', async () => {
    m.guard.mockResolvedValue({ ok: false, response: NextResponse.json({}, { status: 401 }) });
    expect((await GET(request('q=MRes'))).status).toBe(401); expect(m.courses).not.toHaveBeenCalled();
  });
  it.each(['NaN', '-1', '0', '1.5', '51'])('rejects invalid database limits: %s', async (limit) => {
    expect((await GET(request(`q=MRes&limit=${limit}`))).status).toBe(400); expect(m.courses).not.toHaveBeenCalled();
  });
  it('uses the canonical catalogue visibility policy, not unapproved change records or legacy page tables', async () => {
    expect((await GET(request('q=MRes'))).status).toBe(200);
    expect(m.courses.mock.calls[0][0].where.AND).toContainEqual(publicCourseWhere());
    expect(m.universities.mock.calls[0][0].where.AND).toContainEqual(publicUniversityWhere());
    expect(JSON.stringify(m.courses.mock.calls[0][0].where)).toContain('Master of Research');
  });
  it('filters a year-qualified intake using verified, source-linked intake rows', async () => {
    await GET(request('q=Which%20courses%20have%20September%202027%20intake'));
    const filter = m.courses.mock.calls[0][0].where.AND.find((item: Record<string, unknown>) => item.intakeFees);
    expect(filter.intakeFees.some).toMatchObject({ intakeYear: 2027, status: 'active', verificationStatus: 'VERIFIED' });
    expect(filter.intakeFees.some.OR).toContainEqual({ intakeMonth: 'September' });
  });
  it('requires universities to have a course matching the same programme/intake constraints', async () => {
    await GET(request('q=Which%20universities%20have%20September%202027%20intake%3F'));
    const courseWhere = m.courses.mock.calls[0][0].where;
    expect(m.universities.mock.calls[0][0].where.AND).toContainEqual({ courses: { some: courseWhere } });
    expect(JSON.stringify(courseWhere)).not.toContain('"contains":"?"');
  });
  it('recognizes top-up programme intent and January 2028 without inventing availability', async () => {
    await GET(request('q=top-up%20January%202028'));
    const clauses = m.courses.mock.calls[0][0].where.AND;
    expect(JSON.stringify(clauses)).toContain('final-year entry');
    expect(clauses.find((item: Record<string, unknown>) => item.intakeFees).intakeFees.some).toMatchObject({ intakeYear: 2028, verificationStatus: 'VERIFIED' });
  });
  it('requires source evidence and a public university for scholarship results', async () => {
    await GET(request('q=scholarship'));
    const scholarshipWhere = m.scholarships.mock.calls[0][0].where.AND[0];
    expect(scholarshipWhere).toMatchObject({
      status: 'active',
      verificationStatus: { in: ['VERIFIED', 'verified', 'VERIFIED_RECENT', 'verified_recent'] },
      lastCheckedAt: { gte: expect.any(String), lte: expect.any(String) },
      officialScholarshipUrl: { startsWith: 'https://' },
    });
    expect(m.scholarships.mock.calls[0][0].where.AND).toContainEqual({ university: { is: publicUniversityWhere() } });
  });
  it('reports DB failures rather than turning them into empty verified results', async () => {
    m.courses.mockRejectedValue(new Error('Synthetic database failure'));
    const response = await GET(request('q=top-up')); expect(response.status).toBe(503); expect(JSON.stringify(await response.json())).not.toContain('Synthetic database failure');
  });
});
