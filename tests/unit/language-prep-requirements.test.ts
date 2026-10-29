import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ recorded: vi.fn(), crm: vi.fn(), countries: vi.fn(), publishedTests: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { englishPrepRequirement: { findMany: mocks.recorded }, crmCourseRequirement: { findMany: mocks.crm }, country: { findMany: mocks.countries } } }));
vi.mock('@/lib/language-prep/service', () => ({ getAllEnglishPrepTestsFromDB: mocks.publishedTests }));
import { GET } from '@/app/api/language-prep/requirements/route';

describe('language requirement lookup authorization-free public catalogue filtering', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.recorded.mockResolvedValue([]);
    mocks.crm.mockResolvedValue([]);
    mocks.countries.mockResolvedValue([]);
    mocks.publishedTests.mockResolvedValue([{
      name: 'PTE Academic',
      slug: 'pte-academic',
      verificationStatus: 'verified_recent',
      sourceUrl: 'https://www.pearsonpte.com/',
      lastVerifiedAt: new Date().toISOString(),
    }]);
  });
  it('validates search bounds before querying the database', async () => {
    expect((await GET(new Request('http://localhost/api/language-prep/requirements'))).status).toBe(400);
    expect((await GET(new Request(`http://localhost/api/language-prep/requirements?university=${'a'.repeat(121)}`))).status).toBe(400);
    expect(mocks.recorded).not.toHaveBeenCalled();
  });
  it('enforces the named test and course in the primary database query', async () => {
    const response = await GET(new Request('http://localhost/api/language-prep/requirements?university=Requested&course=Medicine&country=Canada&test=pte-academic'));
    expect(response.status).toBe(200);
    expect(mocks.recorded.mock.calls[0][0].where).toMatchObject({ test: { slug: 'pte-academic', status: 'active' }, countryName: { contains: 'Canada' }, courseName: { contains: 'Medicine' }, universityName: { contains: 'Requested' } });
    expect((await response.json()).requirements).toEqual([]);
  });
  it('uses real related course and university fields in the CRM fallback and does not ignore an unknown country', async () => {
    await GET(new Request('http://localhost/api/language-prep/requirements?university=Requested&course=Medicine&country=Unknown&test=pte-academic'));
    expect(mocks.crm.mock.calls[0][0].where).toMatchObject({ course: { courseTitle: { contains: 'Medicine' }, countryId: { in: [] } }, university: { name: { contains: 'Requested' } }, pteOverall: { gt: 0 } });
    expect(mocks.crm.mock.calls[0][0].where).not.toHaveProperty('courseTitle');
  });
  it('reports a database outage as unavailable instead of claiming there are no records', async () => {
    mocks.recorded.mockRejectedValueOnce(new Error('Disposable test outage'));
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const response = await GET(new Request('http://localhost/api/language-prep/requirements?university=Requested'));
      expect(response.status).toBe(503);
      expect(await response.json()).toMatchObject({ success: false });
    } finally { errorLog.mockRestore(); }
  });
});
