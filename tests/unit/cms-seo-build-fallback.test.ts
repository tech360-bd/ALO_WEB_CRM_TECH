import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { cmsManagedContent: { findMany } } }));
vi.mock('@/lib/cms-revisions', () => ({
  sanitizeCmsInput: vi.fn((value: unknown) => value),
  captureBeforeImage: vi.fn(),
  captureAfterImage: vi.fn(),
  rollbackTo: vi.fn(),
  listRevisions: vi.fn(),
  getRevision: vi.fn(),
}));

import { getSiteSeoDefaults } from '@/lib/cms-managed-content';

const previousSkipCmsDb = process.env.SKIP_CMS_DB;

describe('CMS site SEO metadata build/runtime behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SKIP_CMS_DB = '1';
  });

  afterEach(() => {
    if (previousSkipCmsDb === undefined) delete process.env.SKIP_CMS_DB;
    else process.env.SKIP_CMS_DB = previousSkipCmsDb;
    vi.restoreAllMocks();
  });

  it('uses compiled defaults without querying MySQL when the production build opts out', async () => {
    await expect(getSiteSeoDefaults()).resolves.toBeNull();
    expect(findMany).not.toHaveBeenCalled();
  });

  it('logs only a safe error code and preserves the compiled metadata fallback at runtime', async () => {
    delete process.env.SKIP_CMS_DB;
    findMany.mockRejectedValue(Object.assign(new Error('private host and password'), { code: 'P1000' }));
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await expect(getSiteSeoDefaults()).resolves.toBeNull();
    expect(log).toHaveBeenCalledWith(
      '[cms-seo] Published site SEO unavailable; using compiled defaults.',
      { code: 'P1000' },
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain('private host and password');
  });
});
