import { describe, expect, it } from 'vitest';
import { safeReturnPath } from '@/lib/safe-return-path';

describe('student authentication return paths', () => {
  it('preserves a local course application path', () => {
    expect(safeReturnPath('/apply/computing?intake=2027-09')).toBe('/apply/computing?intake=2027-09');
  });
  it('rejects external and malformed redirects', () => {
    for (const value of ['https://evil.test', '//evil.test/x', '/\\evil.test/x', '/\n//evil.test']) {
      expect(safeReturnPath(value)).toBe('/student/dashboard');
    }
  });
});
