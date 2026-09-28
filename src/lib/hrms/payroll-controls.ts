export type SalaryRecord = {
  employeeId: string;
  basicSalary: number;
  grossSalary: number;
  taxDeduction: number;
  pfDeduction: number;
  housingAllow?: number;
  transportAllow?: number;
  medicalAllow?: number;
  otherAllow?: number;
};

export type PayrollEmployee = {
  id: string;
  employeeId?: string | null;
  name?: string | null;
};

export type PayrollItemDraft = {
  employeeId: string;
  employeeName: string;
  basicSalary: number;
  allowances: number;
  tax: number;
  netSalary: number;
};

export class PayrollValidationError extends Error {
  constructor(public readonly code: 'INVALID_PERIOD' | 'MISSING_SALARY' | 'INVALID_SALARY' | 'DUPLICATE_RUN' | 'MAKER_CHECKER', message: string) {
    super(message);
    this.name = 'PayrollValidationError';
  }
}

export function assertPayrollPeriod(period: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(period)) {
    throw new PayrollValidationError('INVALID_PERIOD', 'Payroll period must use YYYY-MM format');
  }
  return period;
}

/**
 * Payroll must be based on an explicit persisted salary record. Zero/default
 * values are not a safe substitute for a missing salary or tax configuration.
 */
export function validateSalaryRecord(salary: SalaryRecord | null | undefined, employeeId: string): SalaryRecord {
  if (!salary) {
    throw new PayrollValidationError('MISSING_SALARY', `No valid salary record exists for employee ${employeeId}`);
  }

  const numericFields = [salary.basicSalary, salary.grossSalary, salary.taxDeduction, salary.pfDeduction];
  if (numericFields.some((value) => !Number.isFinite(value))) {
    throw new PayrollValidationError('INVALID_SALARY', `Salary record for employee ${employeeId} contains a non-numeric value`);
  }
  if (salary.basicSalary <= 0 || salary.grossSalary <= 0) {
    throw new PayrollValidationError('INVALID_SALARY', `Salary record for employee ${employeeId} must contain a positive basic and gross salary`);
  }
  if (salary.taxDeduction < 0 || salary.pfDeduction < 0 || salary.taxDeduction + salary.pfDeduction > salary.grossSalary) {
    throw new PayrollValidationError('INVALID_SALARY', `Salary deductions for employee ${employeeId} are invalid`);
  }

  return salary;
}

export function buildPayrollItems(
  employees: PayrollEmployee[],
  salaries: Map<string, SalaryRecord>,
): { items: PayrollItemDraft[]; totalGross: number; totalDeduction: number; totalNet: number } {
  if (!employees.length) {
    throw new PayrollValidationError('MISSING_SALARY', 'No active employees are available for payroll');
  }

  // Validate the complete input before any transaction write. This guarantees
  // a missing/partial salary configuration cannot produce a partial payroll.
  const items = employees.map((employee) => {
    const salary = validateSalaryRecord(salaries.get(employee.id), employee.id);
    const allowances = [salary.housingAllow, salary.transportAllow, salary.medicalAllow, salary.otherAllow]
      .filter((value): value is number => Number.isFinite(value))
      .reduce((sum, value) => sum + value, 0);
    const netSalary = salary.grossSalary - salary.taxDeduction - salary.pfDeduction;
    return {
      employeeId: employee.id,
      employeeName: employee.name || employee.employeeId || employee.id,
      basicSalary: salary.basicSalary,
      allowances,
      tax: salary.taxDeduction,
      netSalary,
    };
  });

  return {
    items,
    totalGross: items.reduce((sum, item) => sum + (item.netSalary + item.tax), 0),
    totalDeduction: items.reduce((sum, item) => sum + item.tax, 0),
    totalNet: items.reduce((sum, item) => sum + item.netSalary, 0),
  };
}

export function assertMakerChecker(actorId: string, makerId: string): void {
  if (!makerId) throw new PayrollValidationError('MAKER_CHECKER', 'Payroll has no recorded maker');
  if (actorId === makerId) {
    throw new PayrollValidationError('MAKER_CHECKER', 'The payroll maker cannot approve or pay their own payroll');
  }
}

export function assertPayrollTransition(currentStatus: string, action: 'review' | 'approve' | 'pay'): string {
  const status = currentStatus.toLowerCase();
  if (action === 'review' && status !== 'draft') {
    throw new PayrollValidationError('DUPLICATE_RUN', `Payroll cannot be reviewed from status ${currentStatus}`);
  }
  if (action === 'approve' && !['reviewed', 'draft'].includes(status)) {
    throw new PayrollValidationError('DUPLICATE_RUN', `Payroll cannot be approved from status ${currentStatus}`);
  }
  if (action === 'pay' && status !== 'approved') {
    throw new PayrollValidationError('DUPLICATE_RUN', 'Payroll must be approved before payment');
  }
  return action === 'review' ? 'reviewed' : action === 'approve' ? 'approved' : 'paid';
}
