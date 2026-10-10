import { describe, expect, it } from 'vitest';
import {
  isInUniversityCourseIntakeWindow,
  normalizeIntakeMonth,
  universityIntakeWindowWhere,
} from '@/lib/university-intake-window';

describe('January 2027 through January 2028 intake window', () => {
  it.each([
    [2027, 'January', true],
    [2027, 'December', true],
    [2027, '2027-06', true],
    [2028, 'Jan', true],
    [2028, 'January 2028', true],
    [2028, '2028-01', true],
    [2028, 'February', false],
    [2026, 'December', false],
    [2028, 'not-a-month', false],
  ])('classifies %s %s as in-window: %s', (year, month, expected) => {
    expect(isInUniversityCourseIntakeWindow(year, month)).toBe(expected);
  });

  it('normalizes numeric and named month values without guessing unknown formats', () => {
    expect(normalizeIntakeMonth('01')).toBe(1);
    expect(normalizeIntakeMonth('Sept')).toBe(9);
    expect(normalizeIntakeMonth('13')).toBeNull();
    expect(normalizeIntakeMonth('Spring')).toBeNull();
  });

  it('queries recognized month values for all of 2027 and only January 2028', () => {
    const [all2027, january2028] = universityIntakeWindowWhere().OR;
    const months2027 = all2027.intakeMonth.in;
    const months2028 = january2028.intakeMonth.in;

    expect(all2027.intakeYear).toBe(2027);
    expect(months2027).toEqual(expect.arrayContaining([
      'January', 'Jan', 'January 2027', 'Jan 2027', '2027-01', '2027/01',
      'December', 'Dec', 'December 2027', 'Dec 2027', '2027-12', '2027/12',
    ]));
    expect(months2027).not.toContain('Spring 2027');
    expect(january2028.intakeYear).toBe(2028);
    expect(months2028).toEqual(expect.arrayContaining([
      'January', 'Jan', '1', '01', 'January 2028', 'Jan 2028', '2028-01', '2028/01',
    ]));
    expect(months2028).not.toContain('February');
  });
});
