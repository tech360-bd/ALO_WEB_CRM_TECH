import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  blogs: vi.fn(),
  courses: vi.fn(),
  scholarships: vi.fn(),
  universities: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  db: {
    blogPost: { findMany: mocks.blogs },
    coursePage: { findMany: mocks.courses },
    scholarship: { findMany: mocks.scholarships },
    universityPage: { findMany: mocks.universities },
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
  });

  it('is intentionally rendered at request time', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('returns a valid static fallback and logs only a sanitized diagnostic when the database is unavailable', async () => {
    mocks.courses.mockRejectedValue(Object.assign(new Error('private connection details'), { code: 'P1000' }));
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(40);
    expect(entries.some((entry) => entry.url === 'https://aloeducation.com/courses')).toBe(true);
    expect(entries.some((entry) => entry.url === 'https://aloeducation.com/destinations/uk')).toBe(true);
    expect(JSON.stringify(log.mock.calls)).not.toContain('private connection details');
    expect(log).toHaveBeenCalledWith('[sitemap] Database operation failed; serving static fallback.', { code: 'P1000' });
  });

  it('includes published database routes and removes duplicate URLs', async () => {
    const updatedAt = new Date('2026-10-08T00:00:00Z');
    mocks.blogs.mockResolvedValue([{ slug: 'visa-guide', updatedAt }, { slug: 'visa-guide', updatedAt }]);
    mocks.courses.mockResolvedValue([{ slug: 'data-science', updatedAt }]);
    mocks.scholarships.mockResolvedValue([{ slug: 'merit-award', updatedAt }]);
    mocks.universities.mockResolvedValue([{ slug: 'example-university', updatedAt }]);

    const entries = await sitemap();
    expect(entries.filter((entry) => entry.url.endsWith('/blog/visa-guide'))).toHaveLength(1);
    expect(entries.some((entry) => entry.url.endsWith('/courses/data-science'))).toBe(true);
    expect(entries.some((entry) => entry.url.endsWith('/universities/example-university'))).toBe(true);
  });
});
