import { describe, expect, it } from 'vitest';
import { hasCurrentVerifiedPublicSource, PUBLIC_SOURCE_REVIEW_MAX_AGE_DAYS } from '@/lib/public-source-review';

describe('hasCurrentVerifiedPublicSource', () => {
  const now = new Date('2026-10-29T00:00:00.000Z');
  const current = {
    verificationStatus: 'VERIFIED',
    sourceUrl: 'https://official.example.edu/admissions',
    lastVerifiedAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
  };

  it('allows a recent verified HTTPS record', () => {
    expect(hasCurrentVerifiedPublicSource(current, now)).toBe(true);
  });

  it('allows exactly the configured review-age boundary', () => {
    const boundary = new Date(now.getTime() - PUBLIC_SOURCE_REVIEW_MAX_AGE_DAYS * 24 * 60 * 60 * 1000);
    expect(hasCurrentVerifiedPublicSource({ ...current, lastVerifiedAt: boundary }, now)).toBe(true);
  });

  it.each([
    ['unverified', { verificationStatus: 'NEEDS_REVIEW' }],
    ['stale', { lastVerifiedAt: new Date(now.getTime() - (PUBLIC_SOURCE_REVIEW_MAX_AGE_DAYS + 1) * 24 * 60 * 60 * 1000) }],
    ['future dated', { lastVerifiedAt: new Date(now.getTime() + 1000) }],
    ['HTTP', { sourceUrl: 'http://official.example.edu/admissions' }],
    ['invalid URL', { sourceUrl: 'not-a-url' }],
    ['credentialed URL', { sourceUrl: 'https://user:pass@official.example.edu/admissions' }],
    ['missing review date', { lastVerifiedAt: null }],
  ])('rejects %s records', (_name, patch) => {
    expect(hasCurrentVerifiedPublicSource({ ...current, ...patch }, now)).toBe(false);
  });
});
