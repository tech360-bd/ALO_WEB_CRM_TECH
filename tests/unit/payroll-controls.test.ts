import { describe, expect, it } from 'vitest';
import {
  assertMakerChecker,
  assertPayrollPeriod,
  assertPayrollTransition,
  buildPayrollItems,
  PayrollValidationError,
  validateSalaryRecord,
} from '@/lib/hrms/payroll-controls';

const employee = (id: string) => ({ id, employeeId: id, name: `Employee ${id}` });
const salary = (employeeId: string, overrides: Partial<Record<string, number>> = {}) => ({
  employeeId,
  basicSalary: 60000,
  grossSalary: 100000,
  taxDeduction: 10000,
  pfDeduction: 5000,
  housingAllow: 20000,
  transportAllow: 10000,
  medicalAllow: 10000,
  otherAllow: 0,
  ...overrides,
});

function codeOf(fn: () => unknown) {
  try { fn(); } catch (error) { return (error as PayrollValidationError).code; }
  return undefined;
}

describe('payroll controls', () => {
  it('requires a valid YYYY-MM period and persisted salary values', () => {
    expect(() => assertPayrollPeriod('2026-13')).toThrow();
    expect(() => validateSalaryRecord(null, 'emp-1')).toThrow(/No valid salary record/);
    expect(codeOf(() => validateSalaryRecord(null, 'emp-1'))).toBe('MISSING_SALARY');
    expect(codeOf(() => validateSalaryRecord(salary('emp-1', { grossSalary: 0 }), 'emp-1'))).toBe('INVALID_SALARY');
    expect(() => validateSalaryRecord(salary('emp-1'), 'emp-1')).not.toThrow();
  });

  it('preflights every employee so a missing salary cannot create a partial run', () => {
    const salaries = new Map<string, any>([['emp-1', salary('emp-1')]]);
    expect(() => buildPayrollItems([employee('emp-1'), employee('emp-2')], salaries)).toThrow(/emp-2/);
    // No write operation exists in this pure preflight; callers must invoke it
    // before creating the run and item rows inside their transaction.
    expect(salaries.size).toBe(1);
  });

  it('rejects duplicate period/run transitions and requires approval before payment', () => {
    expect(assertPayrollTransition('draft', 'approve')).toBe('approved');
    expect(assertPayrollTransition('approved', 'pay')).toBe('paid');
    expect(codeOf(() => assertPayrollTransition('paid', 'pay'))).toBe('DUPLICATE_RUN');
    expect(codeOf(() => assertPayrollTransition('draft', 'pay'))).toBe('DUPLICATE_RUN');
  });

  it('enforces maker-checker permissions', () => {
    expect(() => assertMakerChecker('approver', 'maker')).not.toThrow();
    expect(codeOf(() => assertMakerChecker('maker', 'maker'))).toBe('MAKER_CHECKER');
    expect(codeOf(() => assertMakerChecker('approver', ''))).toBe('MAKER_CHECKER');
  });
});
