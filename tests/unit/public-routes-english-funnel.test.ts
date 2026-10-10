// Public route coverage for the English funnel and PWA offline fallback.
import { describe, expect, it } from 'vitest';
import { isPublicPageRequest } from '@/proxy';

describe('public page exposure for the English funnel', () => {
  it.each([
    '/english-tests',
    '/english-test-prep',
    '/english-test-prep/ielts',
    '/language-prep',
    '/language-prep/ielts',
    '/language-prep/comparison',
    '/offline',
    '/student/register',
    '/student/login',
  ])('keeps %s reachable without a session', (path) => {
    expect(isPublicPageRequest(path)).toBe(true);
  });

  it('keeps the student mock-test and portal pages behind authentication', () => {
    for (const path of ['/student/mock-tests', '/student/mock-tests/session/abc', '/student/english-test', '/student/dashboard']) {
      expect(isPublicPageRequest(path), path).toBe(false);
    }
  });
});
