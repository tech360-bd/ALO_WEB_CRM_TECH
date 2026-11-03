import { describe, expect, it } from 'vitest';
import { applicationIntakeLabel } from '@/lib/course-finder/application-intake';

describe('application intake labels', () => {
  it('uses the published name or the recorded month and year', () => {
    expect(applicationIntakeLabel({ intakeName: ' January 2027 ', intakeMonth: 'Jan', intakeYear: 2027 })).toBe('January 2027');
    expect(applicationIntakeLabel({ intakeName: '', intakeMonth: 'May', intakeYear: 2027 })).toBe('May 2027');
  });
  it('does not invent an intake for empty data', () => {
    expect(applicationIntakeLabel({ intakeName: '', intakeMonth: '', intakeYear: null })).toBe('');
  });
});
