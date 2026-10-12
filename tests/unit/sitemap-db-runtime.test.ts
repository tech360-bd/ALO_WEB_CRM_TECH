import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  blogs: vi.fn(),
  courses: vi.fn(),
  scholarships: vi.fn(),
  universities: vi.fn(),
  crmCourses: vi.fn(),
  crmUniversities: vi.fn(),
  guides: vi.fn(), services: vi.fn(), resources: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  db: {
    blogPost: { findMany: mocks.blogs },
    coursePage: { findMany: mocks.courses },
    scholarship: { findMany: mocks.scholarships },
    universityPage: { findMany: mocks.universities },
    crmCourse: { findMany: mocks.crmCourses },
    crmUniversity: { findMany: mocks.crmUniversities },
    contentAsset: { findMany: mocks.guides },
    service: { findMany: mocks.services }, resource: { findMany: mocks.resources },
  },
}));

import sitemap, { dynamic } from '@/app/sitemap';

describe('database-backed sitemap generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.blogs.mockResolvedValue([]);
    mocks.courses.mockResolvedValue([]);
    mocks.scholarships.mockResolvedValue([]);
    mocks.universities.mockResolvedValue([]);
    mocks.crmCourses.mockResolvedValue([]);
    mocks.crmUniversities.mockResolvedValue([]);
    mocks.guides.mockResolvedValue([]);
    mocks.services.mockResolvedValue([]); mocks.resources.mockResolvedValue([]);
  });

  it('is intentionally rendered at request time', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('returns a valid static fallback and logs only a sanitized diagnostic when the database is unavailable', async () => {
    mocks.courses.mockRejectedValue(Object.assign(new Error('private connection details'), { code: 'P1000' }));
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(40);
    expect(entries.some((entry) => entry.url === 'https://aloeducation.com/course-finder')).toBe(true);
    expect(entries.some((entry) => entry.url === 'https://aloeducation.com/destinations/uk')).toBe(true);
    expect(JSON.stringify(log.mock.calls)).not.toContain('private connection details');
    expect(log).toHaveBeenCalledWith('[sitemap] Database operation failed; serving static fallback.', { code: 'P1000' });
  });

  it('includes published database routes and removes duplicate URLs', async () => {
    const updatedAt = new Date('2026-10-08T00:00:00Z');
    mocks.blogs.mockResolvedValue([{ slug: 'visa-guide', updatedAt }, { slug: 'visa-guide', updatedAt }]);
    // Phase 1 review: catalogue pages need an https source URL to be listed.
    mocks.courses.mockResolvedValue([{ slug: 'data-science', updatedAt, sourceUrl: 'https://www.auckland.ac.nz/en/study.html' }]);
    mocks.scholarships.mockResolvedValue([{ slug: 'merit-award', updatedAt }]);
    mocks.universities.mockResolvedValue([{ slug: 'example-university', updatedAt }]);
    mocks.services.mockResolvedValue([{ slug: 'visa-guidance', updatedAt }]);
    mocks.resources.mockResolvedValue([{ slug: 'build-a-budget', updatedAt, category: { slug: 'financial-planning' } }]);

    const entries = await sitemap();
    expect(entries.filter((entry) => entry.url.endsWith('/blog/visa-guide'))).toHaveLength(1);
    expect(entries.some((entry) => entry.url.endsWith('/courses/data-science'))).toBe(true);
    expect(entries.some((entry) => entry.url.endsWith('/universities/example-university'))).toBe(true);
    expect(entries.some((entry) => entry.url.endsWith('/services/visa-guidance'))).toBe(true);
    expect(entries.some((entry) => entry.url.endsWith('/resources/financial-planning/build-a-budget'))).toBe(true);
    expect(entries.find(entry => entry.url === 'https://aloeducation.com')?.lastModified).toBeUndefined();
  });
});
