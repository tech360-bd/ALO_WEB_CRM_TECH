import { describe, expect, it } from 'vitest';
import { normalizePhone, phonesMatch, phoneVariants } from '@/lib/phone-normalization';
describe('Bangladesh contact normalization (synthetic values)', () => {
  it.each(['01700000000', '+8801700000000', '008801700000000', '8801700000000'])('normalizes %s without retaining the national trunk zero', input => {
    expect(normalizePhone(input)).toBe('8801700000000');
  });
  it('generates local/international review candidates consistently', () => {
    expect(phoneVariants('01700000000')).toEqual(expect.arrayContaining(['01700000000','1700000000','8801700000000','+8801700000000','008801700000000']));
    expect(phonesMatch('01700000000', '+8801700000000')).toBe(true);
  });
});
