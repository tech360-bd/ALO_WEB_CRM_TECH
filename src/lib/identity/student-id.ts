/**
 * Canonical identifier allocation (student AE-, partner AEP-, employee EMP-).
 *
 * Format: `<SCOPE>-<YEAR><5-digit sequence>`, e.g. AE-202600001.
 *
 * Guarantees (MySQL):
 * - The sequence row is advanced with one atomic UPDATE. `LAST_INSERT_ID(expr)` returns the new
 *   value on the same connection, so two concurrent transactions can never receive the same number.
 * - The increment is part of the caller's transaction. If the caller rolls back, the number is
 *   released before anything was committed, so it is never visible outside the transaction.
 * - Numbers are never reused once committed. Gaps can appear (e.g. a rolled-back business
 *   operation after commit of a separate allocation); gaps are acceptable, reuse is not.
 * - Years follow the business calendar (Asia/Dhaka). Each year restarts at 00001.
 * - Sequence overflow (> 99999 in one year) fails closed.
 *
 * Note: concurrency behaviour depends on MySQL row locking. It is verified only by the
 * real-database integration test, which requires a disposable MySQL instance.
 */
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';

export type IdScope = 'AE' | 'AEP' | 'EMP';
const SCOPES: readonly IdScope[] = ['AE', 'AEP', 'EMP'];
const MAX_SEQUENCE = 99999;
const BUSINESS_TIME_ZONE = 'Asia/Dhaka';

export class IdentifierAllocationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IdentifierAllocationError';
  }
}

/** Calendar year in the business time zone (not the server's local zone). */
export function businessYear(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: BUSINESS_TIME_ZONE, year: 'numeric' }).formatToParts(now);
  const year = Number(parts.find((p) => p.type === 'year')?.value);
  if (!Number.isInteger(year)) throw new IdentifierAllocationError('Could not determine business year.');
  return year;
}

export function formatIdentifier(scope: IdScope, year: number, sequence: number): string {
  if (!SCOPES.includes(scope)) throw new IdentifierAllocationError(`Unknown identifier scope: ${scope}`);
  if (!Number.isInteger(year) || year < 2000 || year > 9999) throw new IdentifierAllocationError('Invalid year.');
  if (!Number.isInteger(sequence) || sequence < 1 || sequence > MAX_SEQUENCE) {
    throw new IdentifierAllocationError('Identifier sequence exhausted for this year.');
  }
  return `${scope}-${year}${String(sequence).padStart(5, '0')}`;
}

/**
 * Allocates the next number inside the caller's transaction.
 * Must be called from within `db.$transaction(async (tx) => ...)`; the caller's commit makes it durable.
 */
export async function allocateIdentifier(
  tx: Prisma.TransactionClient,
  scope: IdScope,
  year: number = businessYear(),
): Promise<string> {
  if (!SCOPES.includes(scope)) throw new IdentifierAllocationError(`Unknown identifier scope: ${scope}`);
  const key = `${scope}-${year}`;

  // Create the row once for this scope/year. Duplicate-key is a no-op.
  await tx.$executeRaw`INSERT INTO StudentIdSequence (id, scope, year, lastValue, updatedAt)
    VALUES (${key}, ${scope}, ${year}, 0, NOW(3))
    ON DUPLICATE KEY UPDATE id = id`;

  // Atomic increment. The row lock is held until the transaction ends.
  const updated = await tx.$executeRaw`UPDATE StudentIdSequence
    SET lastValue = LAST_INSERT_ID(lastValue + 1), updatedAt = NOW(3)
    WHERE id = ${key}`;
  if (updated !== 1) throw new IdentifierAllocationError('Sequence row unavailable.');

  const rows = await tx.$queryRaw<Array<{ value: bigint | number }>>`SELECT LAST_INSERT_ID() AS value`;
  const sequence = Number(rows[0]?.value);
  return formatIdentifier(scope, year, sequence);
}

/**
 * Allocates a number in its own committed transaction. Use when the identifier must exist
 * before a larger workflow runs. A later failure leaves a gap, never a reused number.
 */
export async function allocateIdentifierCommitted(scope: IdScope): Promise<string> {
  return db.$transaction((tx) => allocateIdentifier(tx, scope));
}
