/**
 * PROPOSED TEST — section B guard. Becomes tests/unit/offline-page-copy.test.ts.
 *
 * The offline page used to promise that queued work would sync after reconnect.
 * Nothing implements that, so the promise is a data-loss trap for counsellors.
 * This test keeps the corrected copy in place and fails if the promise returns.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/app/offline/page.tsx', 'utf8');

describe('offline page copy', () => {
  it('states the corrected requirement verbatim', () => {
    expect(page).toContain('Some features require an internet connection. Please reconnect to continue.');
  });

  it('never promises that work made offline will be synchronised later', () => {
    expect(page).not.toMatch(/will sync/i);
    expect(page).not.toMatch(/sync(s|ed|ing)? (when|once|after) you reconnect/i);
    expect(page).not.toMatch(/will be (saved|delivered|sent|queued)/i);
  });
});
