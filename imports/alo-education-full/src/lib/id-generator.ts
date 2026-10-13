/**
 * ALO Education — Business ID Generator
 *
 * Generates sequential, human-readable IDs for all core business entities.
 * Year-prefixed IDs reset the sequence each calendar year.
 * Non-year IDs (Case, Task) use a global sequential counter.
 *
 * @module id-generator
 */

import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

/** Parsed components of a generated business ID. */
export interface ParsedBusinessId {
  /** The entity type prefix (e.g. 'AE', 'ALO-APP', 'ALO-CASE'). */
  prefix: string;
  /** The year portion, or `null` for non-year IDs (Case, Task). */
  year: number | null;
  /** The sequential numeric suffix. */
  sequence: number;
}

/** Maps entity type keys to their ID prefix and digit-width. */
interface IdConfig {
  prefix: string;
  /** Number of digits for the sequence portion. */
  digits: number;
  /** Whether this ID type includes a year prefix. */
  hasYear: boolean;
}

// ------------------------------------------------------------------
// Configuration
// ------------------------------------------------------------------

const ID_CONFIGS: Record<string, IdConfig> = {
  student:   { prefix: 'AE',          digits: 6, hasYear: true  },
  partner:   { prefix: 'AEP',         digits: 4, hasYear: true  },
  employee:  { prefix: 'ALO-EMP',     digits: 4, hasYear: true  },
  application: { prefix: 'ALO-APP',  digits: 6, hasYear: true  },
  payment:   { prefix: 'ALO-PAY',     digits: 6, hasYear: true  },
  invoice:   { prefix: 'ALO-INV',     digits: 6, hasYear: true  },
  case:      { prefix: 'ALO-CASE',    digits: 4, hasYear: false },
  task:      { prefix: 'ALO-TASK',    digits: 4, hasYear: false },
  expense:   { prefix: 'ALO-EXP',     digits: 4, hasYear: true  },
  lead:      { prefix: 'ALO-LEAD',    digits: 6, hasYear: true  },
};

// ------------------------------------------------------------------
// Internal helpers
// ------------------------------------------------------------------

/** Zero-pad a number to the given width. */
function pad(n: number, width: number): string {
  return String(n).padStart(width, '0');
}

/**
 * Get the current calendar year as a 4-digit string.
 */
function currentYear(): string {
  return String(new Date().getFullYear());
}

/**
 * Build the final ID string from config, year, and sequence.
 */
function buildId(config: IdConfig, year: string | null, sequence: number): string {
  const seq = pad(sequence, config.digits);
  return config.hasYear ? `${config.prefix}-${year}${seq}` : `${config.prefix}-${seq}`;
}

/**
 * Get the next sequence number for a year-prefixed ID type.
 * Counts records created in the current calendar year and adds 1.
 *
 * @param tableName  The Prisma table name (must be a valid Prisma table identifier)
 * @param idColumn   The column that stores the business ID
 * @param prefix     The ID prefix to match (e.g. 'AE-2025')
 */
async function getNextYearSequence(
  tableName: string,
  idColumn: string,
  prefix: string,
): Promise<number> {
  const yearPrefix = `${prefix}-${currentYear()}`;

  // Use $queryRawUnsafe to build a dynamic table/column query.
  // Both tableName and idColumn are sourced from the internal ID_CONFIGS
  // constant — they are never user-supplied.
  const rows: Record<string, unknown>[] = await db.$queryRawUnsafe(
    `SELECT COUNT(*) as cnt FROM "${tableName}" WHERE "${idColumn}" LIKE ?`,
    `${yearPrefix}%`,
  );

  const count = Number((rows?.[0]?.cnt as number) ?? 0);
  return count + 1;
}

/**
 * Get the next sequence number for a non-year (global sequential) ID type.
 * Parses the numeric suffix from all existing IDs and returns max + 1.
 *
 * @param tableName  The Prisma table name
 * @param idColumn   The column that stores the business ID
 * @param prefix     The ID prefix to match (e.g. 'ALO-CASE-')
 */
async function getNextGlobalSequence(
  tableName: string,
  idColumn: string,
  prefix: string,
): Promise<number> {
  const rows: Record<string, unknown>[] = await db.$queryRawUnsafe(
    `SELECT "${idColumn}" FROM "${tableName}" WHERE "${idColumn}" LIKE ?`,
    `${prefix}%`,
  );

  let maxSeq = 0;

  for (const row of rows) {
    const idValue = String(row[idColumn] ?? '');
    // Extract everything after the last '-'
    const parts = idValue.split('-');
    const lastPart = parts[parts.length - 1];
    const num = parseInt(lastPart, 10);
    if (!isNaN(num) && num > maxSeq) {
      maxSeq = num;
    }
  }

  return maxSeq + 1;
}

// ------------------------------------------------------------------
// Year-prefixed ID generators
// ------------------------------------------------------------------

/**
 * Generate a Student ID: `AE-YYYYNNNNNN` (e.g. AE-2025000001).
 * Queries the `Student` table, counting records with a `studentId`
 * matching the current year prefix.
 */
export async function generateStudentId(): Promise<string> {
  const config = ID_CONFIGS.student;
  const seq = await getNextYearSequence('Student', 'studentId', config.prefix);
  return buildId(config, currentYear(), seq);
}

/**
 * Generate a Partner ID: `AEP-YYYYNNNN` (e.g. AEP-20250001).
 * Queries the `User` table counting users with role `PARTNER`
 * created in the current calendar year.
 */
export async function generatePartnerId(): Promise<string> {
  const config = ID_CONFIGS.partner;
  const year = currentYear();
  const yearStart = `${year}-01-01T00:00:00.000Z`;
  const yearEnd = `${year}-12-31T23:59:59.999Z`;

  const rows: { cnt: number }[] = await db.$queryRaw(
    Prisma.sql`SELECT COUNT(*) as cnt FROM "User" WHERE "role" = 'PARTNER' AND "createdAt" >= ${yearStart} AND "createdAt" <= ${yearEnd}`,
  );

  const count = Number(rows?.[0]?.cnt ?? 0);
  const seq = count + 1;
  return buildId(config, year, seq);
}

/**
 * Generate an Employee ID: `ALO-EMP-YYYYNNNN` (e.g. ALO-EMP-20250001).
 * Queries the `Employee` table counting records created in the current year.
 */
export async function generateEmployeeId(): Promise<string> {
  const config = ID_CONFIGS.employee;
  const year = currentYear();
  const yearStart = `${year}-01-01T00:00:00.000Z`;
  const yearEnd = `${year}-12-31T23:59:59.999Z`;

  const rows: { cnt: number }[] = await db.$queryRaw(
    Prisma.sql`SELECT COUNT(*) as cnt FROM "Employee" WHERE "createdAt" >= ${yearStart} AND "createdAt" <= ${yearEnd}`,
  );

  const count = Number(rows?.[0]?.cnt ?? 0);
  const seq = count + 1;
  return buildId(config, year, seq);
}

/**
 * Generate an Application ID: `ALO-APP-YYYYNNNNNN` (e.g. ALO-APP-2025000001).
 * Queries the `Application` table, counting records with an `applicationId`
 * matching the current year prefix.
 */
export async function generateApplicationId(): Promise<string> {
  const config = ID_CONFIGS.application;
  const seq = await getNextYearSequence('Application', 'applicationId', config.prefix);
  return buildId(config, currentYear(), seq);
}

/**
 * Generate a Payment ID: `ALO-PAY-YYYYNNNNNN` (e.g. ALO-PAY-2025000001).
 * Queries the `Payment` table, counting records with a `paymentId`
 * matching the current year prefix.
 */
export async function generatePaymentId(): Promise<string> {
  const config = ID_CONFIGS.payment;
  const seq = await getNextYearSequence('Payment', 'paymentId', config.prefix);
  return buildId(config, currentYear(), seq);
}

/**
 * Generate an Invoice number: `ALO-INV-YYYYNNNNNN` (e.g. ALO-INV-2025000001).
 * Queries the `Invoice` table, counting records with an `invoiceNo`
 * matching the current year prefix.
 */
export async function generateInvoiceId(): Promise<string> {
  const config = ID_CONFIGS.invoice;
  const seq = await getNextYearSequence('Invoice', 'invoiceNo', config.prefix);
  return buildId(config, currentYear(), seq);
}

/**
 * Generate an Expense ID: `ALO-EXP-YYYYNNNN` (e.g. ALO-EXP-20250001).
 * Queries the `Expense` table, counting records with an `expenseId`
 * matching the current year prefix.
 */
export async function generateExpenseId(): Promise<string> {
  const config = ID_CONFIGS.expense;
  const seq = await getNextYearSequence('Expense', 'expenseId', config.prefix);
  return buildId(config, currentYear(), seq);
}

/**
 * Generate a Lead ID: `ALO-LEAD-YYYYNNNNNN` (e.g. ALO-LEAD-2025000001).
 * Queries the `Lead` table, counting records with a `leadId`
 * matching the current year prefix.
 */
export async function generateLeadId(): Promise<string> {
  const config = ID_CONFIGS.lead;
  const seq = await getNextYearSequence('Lead', 'leadId', config.prefix);
  return buildId(config, currentYear(), seq);
}

// ------------------------------------------------------------------
// Non-year (global sequential) ID generators
// ------------------------------------------------------------------

/**
 * Generate a Case ID: `ALO-CASE-NNNN` (e.g. ALO-CASE-0001).
 * Sequential globally (no year reset). Queries the `Case` table.
 */
export async function generateCaseId(): Promise<string> {
  const config = ID_CONFIGS.case;
  const seq = await getNextGlobalSequence('Case', 'caseId', `${config.prefix}-`);
  return buildId(config, null, seq);
}

/**
 * Generate a Task ID: `ALO-TASK-NNNN` (e.g. ALO-TASK-0001).
 * Sequential globally (no year reset). Queries the `Task` table.
 */
export async function generateTaskId(): Promise<string> {
  const config = ID_CONFIGS.task;
  const seq = await getNextGlobalSequence('Task', 'taskId', `${config.prefix}-`);
  return buildId(config, null, seq);
}

// ------------------------------------------------------------------
// Parse helper
// ------------------------------------------------------------------

/**
 * Parse an existing ALO business ID to extract its components.
 *
 * Supports all 10 ID formats. Returns `null` if the ID cannot be parsed.
 *
 * @example
 * parseBusinessId('AE-2025000001')           // { prefix: 'AE',          year: 2025, sequence: 1 }
 * parseBusinessId('ALO-APP-2025000001')       // { prefix: 'ALO-APP',    year: 2025, sequence: 1 }
 * parseBusinessId('ALO-CASE-0001')            // { prefix: 'ALO-CASE',   year: null,  sequence: 1 }
 * parseBusinessId('invalid')                  // null
 */
export function parseBusinessId(id: string): ParsedBusinessId | null {
  if (!id || typeof id !== 'string') return null;

  // Try to match against all known prefixes (sorted longest-first to
  // avoid 'ALO-CASE' being captured as 'ALO' prefix).
  const sortedConfigs = Object.entries(ID_CONFIGS).sort(
    ([, a], [, b]) => b.prefix.length - a.prefix.length,
  );

  for (const [, config] of sortedConfigs) {
    if (!id.startsWith(config.prefix + '-')) continue;

    // Everything after the prefix and its trailing dash
    const suffix = id.slice(config.prefix.length + 1);

    if (config.hasYear) {
      // Year-prefixed: suffix should be YYYY + N digits
      const yearStr = suffix.slice(0, 4);
      const seqStr = suffix.slice(4);

      const year = parseInt(yearStr, 10);
      const sequence = parseInt(seqStr, 10);

      if (isNaN(year) || isNaN(sequence)) continue;
      if (yearStr.length !== 4) continue;
      if (seqStr.length !== config.digits) continue;

      return { prefix: config.prefix, year, sequence };
    } else {
      // Non-year: suffix is just N digits
      const sequence = parseInt(suffix, 10);

      if (isNaN(sequence)) continue;
      if (suffix.length !== config.digits) continue;

      return { prefix: config.prefix, year: null, sequence };
    }
  }

  return null;
}
