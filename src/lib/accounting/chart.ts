// ============================================================================
// ALO Education — canonical chart of accounts.
//
// Codes are stable identifiers; the legacy journal adapter's GL_ACCOUNTS codes
// (1000, 1100, 1300, 2000, 2100, 4000, 5000, 5100) are preserved verbatim so
// historical postings keep their meaning after the 2026-10-01 consolidation.
// ============================================================================

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface ChartAccountDefinition {
  code: string;
  name: string;
  type: AccountType;
  subType?: string;
  parentCode?: string;
  description?: string;
}

/** Debit-normal accounts: ASSET and EXPENSE. Credit-normal: the rest. */
export function isDebitNormal(type: AccountType): boolean {
  return type === 'ASSET' || type === 'EXPENSE';
}

export const AR_ACCOUNT_CODE = '1100';
export const AP_ACCOUNT_CODE = '2000';
export const ACCUMULATED_DEPRECIATION_CODE = '1510';
export const DEPRECIATION_EXPENSE_CODE = '5200';

export const DEFAULT_CHART_OF_ACCOUNTS: ChartAccountDefinition[] = [
  // ── Assets ──────────────────────────────────────────────────────────────
  { code: '1000', name: 'Cash', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Cash on hand and petty cash' },
  { code: '1010', name: 'Bank Account', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Operating bank accounts' },
  { code: '1100', name: 'Accounts Receivable', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'University and partner commissions receivable' },
  { code: '1200', name: 'Prepaid Expenses', type: 'ASSET', subType: 'CURRENT_ASSET' },
  { code: '1300', name: 'Inventory Asset', type: 'ASSET', subType: 'CURRENT_ASSET', description: 'Marketing materials and consumables' },
  { code: '1500', name: 'Fixed Assets', type: 'ASSET', subType: 'FIXED_ASSET', description: 'Computers, furniture and equipment at cost' },
  { code: '1510', name: 'Accumulated Depreciation', type: 'ASSET', subType: 'FIXED_ASSET', description: 'Contra-asset; credit-normal within ASSET' },
  { code: '1600', name: 'Employee Advances', type: 'ASSET', subType: 'CURRENT_ASSET' },
  // ── Liabilities ─────────────────────────────────────────────────────────
  { code: '2000', name: 'Accounts Payable', type: 'LIABILITY', subType: 'CURRENT_LIABILITY', description: 'Vendor bills pending payment' },
  { code: '2100', name: 'Payroll Payable', type: 'LIABILITY', subType: 'CURRENT_LIABILITY' },
  { code: '2200', name: 'Taxes Payable', type: 'LIABILITY', subType: 'CURRENT_LIABILITY' },
  { code: '2300', name: 'Deferred Revenue', type: 'LIABILITY', subType: 'CURRENT_LIABILITY', description: 'Service fees collected before delivery' },
  { code: '2400', name: 'Vendor Deposits', type: 'LIABILITY', subType: 'CURRENT_LIABILITY' },
  // ── Equity ──────────────────────────────────────────────────────────────
  { code: '3000', name: "Owner's Equity", type: 'EQUITY' },
  { code: '3100', name: 'Retained Earnings', type: 'EQUITY' },
  // ── Revenue ─────────────────────────────────────────────────────────────
  { code: '4000', name: 'Revenue — Commissions', type: 'REVENUE', subType: 'OPERATING_REVENUE', description: 'University/partner commission income' },
  { code: '4010', name: 'Revenue — Service Fees', type: 'REVENUE', subType: 'OPERATING_REVENUE' },
  { code: '4020', name: 'Revenue — Consultancy', type: 'REVENUE', subType: 'OPERATING_REVENUE' },
  { code: '4900', name: 'Sales Discounts', type: 'REVENUE', subType: 'CONTRA_REVENUE', description: 'Contra-revenue; debit-normal within REVENUE' },
  // ── Expenses ────────────────────────────────────────────────────────────
  { code: '5000', name: 'Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' },
  { code: '5010', name: 'Rent Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' },
  { code: '5020', name: 'Salaries & Wages', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' },
  { code: '5030', name: 'Marketing Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' },
  { code: '5040', name: 'Utilities Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' },
  { code: '5050', name: 'Travel Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' },
  { code: '5100', name: 'Payroll Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' },
  { code: '5200', name: 'Depreciation Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' },
  { code: '5300', name: 'Bank Charges', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' },
  { code: '5400', name: 'Software & Subscriptions', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' },
  { code: '5500', name: 'Bad Debt Expense', type: 'EXPENSE', subType: 'OPERATING_EXPENSE' },
];
