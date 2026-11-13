import { describe, expect, it } from 'vitest';
import {
  hasCurrentLanguagePrepSourceReview,
  hasCurrentLanguagePrepVerification,
} from '@/lib/language-prep/verification';

const now = new Date('2026-10-29T00:00:00.000Z');

const currentTest = {
  verificationStatus: 'verified',
  lastVerifiedAt: '2026-10-28T00:00:00.000Z',
  sourceUrl: 'https://provider.example/requirements',
};

describe('language-prep publication verification', () => {
  it('accepts an explicit verified status, recent date, and HTTPS source', () => {
    expect(hasCurrentLanguagePrepVerification(currentTest, now)).toBe(true);
  });

  it('rejects pending, missing, or unrecognised verification status', () => {
    expect(hasCurrentLanguagePrepVerification({ ...currentTest, verificationStatus: 'pending' }, now)).toBe(false);
    expect(hasCurrentLanguagePrepVerification({ ...currentTest, verificationStatus: '' }, now)).toBe(false);
  });

  it('rejects missing, non-HTTPS, future, and stale source reviews', () => {
    expect(hasCurrentLanguagePrepSourceReview({ ...currentTest, sourceUrl: '' }, now)).toBe(false);
    expect(hasCurrentLanguagePrepSourceReview({ ...currentTest, sourceUrl: 'http://provider.example' }, now)).toBe(false);
    expect(hasCurrentLanguagePrepSourceReview({ ...currentTest, lastVerifiedAt: '2026-10-30T00:00:00.000Z' }, now)).toBe(false);
    expect(hasCurrentLanguagePrepSourceReview({ ...currentTest, lastVerifiedAt: '2026-07-01T00:00:00.000Z' }, now)).toBe(false);
  });

  it('requires both source date and HTTPS URL for related records', () => {
    expect(hasCurrentLanguagePrepSourceReview({ sourceUrl: 'https://provider.example' }, now)).toBe(false);
    expect(hasCurrentLanguagePrepSourceReview({ lastVerifiedAt: '2026-10-28T00:00:00.000Z' }, now)).toBe(false);
  });
});
