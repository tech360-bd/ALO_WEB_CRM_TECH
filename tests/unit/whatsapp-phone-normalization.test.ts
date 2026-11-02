/**
 * Regression tests for the Bangladesh phone normalisation defect.
 *
 * `toBdDisplayPhone()` used `slice(2)` on the E.164 digits, leaving the `0` of the
 * subscriber number in place: `01805020100` became `001805020100`. Every configured
 * sender, every seed row and every official-number check compared that corrupted
 * form, so a deployment that *did* configure numbers still could not route.
 *
 * These tests pin the contract directly, independently of deployment configuration.
 */
import { describe, expect, it, vi } from 'vitest';

// The registry module opens the Prisma client at import time. These tests only
// exercise pure string normalisation, so the client is stubbed out.
vi.mock('@/lib/db', () => ({ db: { whatsAppOfficialNumber: { count: vi.fn() } } }));

import { normalizeBdPhone, toBdDisplayPhone } from '@/lib/whatsapp-number-pool';

describe('Bangladesh phone normalisation', () => {
  it('normalises local, +880 and 880 forms to E.164 digits without a plus', () => {
    for (const input of ['01805020100', '+8801805020100', '8801805020100', '01805020100 ', '+88 01805 020100']) {
      expect(normalizeBdPhone(input), input).toBe('8801805020100');
    }
  });

  it('formats every accepted form back to the local display number', () => {
    for (const input of ['01805020100', '+8801805020100', '8801805020100']) {
      expect(toBdDisplayPhone(input), input).toBe('01805020100');
    }
  });

  it('never leaves a doubled prefix behind (the reported defect)', () => {
    const displayed = toBdDisplayPhone('01805020100');
    expect(displayed.startsWith('00')).toBe(false);
    expect(displayed).toHaveLength(11);
    expect(displayed).toMatch(/^01[3-9]\d{8}$/);
  });

  it('is idempotent in both directions', () => {
    const first = toBdDisplayPhone('01805020100');
    expect(toBdDisplayPhone(first)).toBe(first);
    const digits = normalizeBdPhone('01805020100');
    expect(normalizeBdPhone(digits)).toBe(digits);
    expect(normalizeBdPhone(`+${digits}`)).toBe(digits);
  });

  it('round-trips the whole 013-019 operator range', () => {
    for (const prefix of ['013', '014', '015', '016', '017', '018', '019']) {
      const local = `${prefix}12345678`;
      expect(toBdDisplayPhone(local), local).toBe(local);
      expect(normalizeBdPhone(local)).toBe(`880${local.slice(1)}`);
    }
  });

  it('rejects invalid, truncated, overlong and non-Bangladesh numbers', () => {
    for (const input of [
      '', ' ', 'not-a-phone', '12345678901', '0180502010', '018050201000',
      '01212345678', '0181234567a', '+447911123456', '+88018050201001',
    ]) {
      expect(normalizeBdPhone(input), input).toBe('');
      expect(toBdDisplayPhone(input), input).toBe('');
    }
  });

  it('rejects non-string input without throwing', () => {
    for (const input of [undefined, null, 1805020100, {}, []] as unknown[]) {
      expect(normalizeBdPhone(input as string)).toBe('');
      expect(toBdDisplayPhone(input as string)).toBe('');
    }
  });

  it('does not invent a number when configuration is empty', () => {
    // The registry ships no numbers in source; both helpers must stay empty.
    expect(toBdDisplayPhone('')).toBe('');
    expect(toBdDisplayPhone(undefined as unknown as string)).toBe('');
  });
});
