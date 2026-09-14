// ALO HRMS — Payroll calculation (attendance, leave, late, holiday, overtime, bonus, allowance, loan, advance, tax, PF, deduction)
export type PayrollInput = {
  basicSalary: number;
  allowances: number; // house + medical + conveyance etc
  bonus?: number;
  overtimeHours?: number;
  overtimeRate?: number; // per hour
  loanDeduction?: number;
  advanceDeduction?: number;
  taxPercent?: number;
  pfRate?: number; // 8 default
  insurance?: number;
  absentDays?: number;
  lateDays?: number;
  leaveWithoutPayDays?: number;
  workingDaysInMonth?: number; // e.g., 30
};

export type PayrollResult = {
  grossSalary: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  breakdown: { label:string; amount:number; type:'earning'|'deduction' }[];
};

export function calculatePayroll(input: PayrollInput): PayrollResult {
  const basic = Math.max(0, input.basicSalary || 0);
  const allowances = Math.max(0, input.allowances || 0);
  const bonus = Math.max(0, input.bonus || 0);
  const overtime = Math.max(0, (input.overtimeHours||0) * (input.overtimeRate||0));
  const gross = basic + allowances + bonus + overtime;

  const workingDays = Math.max(1, input.workingDaysInMonth || 30);
  const perDay = basic / workingDays;
  const absentDeduction = Math.max(0, (input.absentDays||0) * perDay);
  const lwpDeduction = Math.max(0, (input.leaveWithoutPayDays||0) * perDay);
  const lateDeduction = Math.max(0, (input.lateDays||0) * (perDay * 0.5)); // half day per late after threshold

  const pf = Math.max(0, basic * ((input.pfRate ?? 8)/100));
  const tax = Math.max(0, gross * ((input.taxPercent||0)/100));
  const insurance = Math.max(0, input.insurance||0);
  const loan = Math.max(0, input.loanDeduction||0);
  const advance = Math.max(0, input.advanceDeduction||0);

  const totalDeductions = absentDeduction + lwpDeduction + lateDeduction + pf + tax + insurance + loan + advance;
  const totalEarnings = gross;
  const net = Math.max(0, totalEarnings - totalDeductions);

  const breakdown: PayrollResult['breakdown'] = [
    { label:'Basic Salary', amount: basic, type:'earning' },
    { label:'Allowances', amount: allowances, type:'earning' },
    ...(bonus? [{ label:'Bonus', amount: bonus, type:'earning' as const }]:[]),
    ...(overtime? [{ label:'Overtime', amount: overtime, type:'earning' as const }]:[]),
    ...(absentDeduction? [{ label:'Absent Deduction', amount: -absentDeduction, type:'deduction' as const }]:[]),
    ...(lwpDeduction? [{ label:'Leave Without Pay', amount: -lwpDeduction, type:'deduction' as const }]:[]),
    ...(lateDeduction? [{ label:'Late Deduction', amount: -lateDeduction, type:'deduction' as const }]:[]),
    { label:'Provident Fund', amount: -pf, type:'deduction' },
    ...(tax? [{ label:'Tax', amount: -tax, type:'deduction' as const }]:[]),
    ...(insurance? [{ label:'Insurance', amount: -insurance, type:'deduction' as const }]:[]),
    ...(loan? [{ label:'Loan', amount: -loan, type:'deduction' as const }]:[]),
    ...(advance? [{ label:'Advance', amount: -advance, type:'deduction' as const }]:[]),
  ];

  return { grossSalary: gross, totalEarnings, totalDeductions, netSalary: Math.round(net*100)/100, breakdown };
}

export function payrollVisibilityForRole(role: string, isOwner: boolean): 'full'|'summary'|'none' {
  const r = role.toLowerCase();
  if (['super_admin','admin','hr_manager','hr','finance','accounts'].includes(r)) return 'full';
  if (isOwner) return 'summary'; // employee sees only final approved salary + slip
  return 'none';
}
