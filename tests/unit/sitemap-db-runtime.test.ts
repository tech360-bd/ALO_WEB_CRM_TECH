import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  blogs: vi.fn(),
  courses: vi.fn(),
  scholarships: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  db: {
    blogPost: { findMany: mocks.blogs },
    coursePage: { findMany: mocks.courses },
    scholarship: { findMany: mocks.scholarships },
  },
}));

import sitemap, { dynamic } from '@/app/sitemap';

describe('database-backed sitemap generation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.blogs.mockResolvedValue([]);
    mocks.courses.mockResolvedValue([]);
    mocks.scholarships.mockResolvedValue([]);
  });

  it('is intentionally rendered at request time', () => {
    expect(dynamic).toBe('force-dynamic');
  });

  it('fails with a sanitized error rather than returning an incomplete sitemap', async () => {
    mocks.courses.mockRejectedValue(Object.assign(new Error('private connection details'), { code: 'P1000' }));
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(sitemap()).rejects.toThrow('SITEMAP_DATABASE_UNAVAILABLE');
    expect(JSON.stringify(log.mock.calls)).not.toContain('private connection details');
    expect(log).toHaveBeenCalledWith('[sitemap] Database operation failed.', { code: 'P1000' });
  });
});
