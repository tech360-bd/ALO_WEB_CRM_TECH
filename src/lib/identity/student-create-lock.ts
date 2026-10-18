/**
 * Cross-transaction mutex for "find-or-create student by natural key".
 *
 * Why this exists
 * ---------------
 * `Student.email` and `Student.phone` are plain `String @default("")` columns:
 * neither carries a unique constraint (an empty-string default is shared by
 * every student created without that field, so a unique index is impossible
 * without a data migration). The find-then-create used by the counsellor lead
 * form is therefore a classic check-then-act race: two concurrent submissions
 * for the same person can both observe "no student" and both insert.
 *
 * Adding a unique index would be the durable fix, but it is a destructive
 * schema migration against a table that already holds duplicates, and the
 * project rule is no destructive migration without a verified backup and
 * explicit approval. This lock closes the race without touching the schema.
 *
 * Mechanism
 * ---------
 * MySQL's `GET_LOCK()` is a server-side advisory lock keyed by name. It is
 * connection-scoped, so it is safe to take inside a Prisma `$transaction`
 * (Prisma pins one connection for the transaction's lifetime) and it is
 * released by `RELEASE_LOCK()`, by the connection closing, or by the timeout —
 * a crashed worker cannot strand the lock forever.
 *
 * The lock name is derived from a SHA-256 of the normalized natural key, so
 * PII (email/phone) never appears in MySQL's `performance_schema` lock tables
 * or in the processlist.
 *
 * `ALO_DB_DRIVER=sqlite` is the offline-verification-only driver documented in
 * src/lib/db.ts. It has no `GET_LOCK`, so the helper degrades to a no-op
 * there; that path never runs in production and never carries real student
 * data.
 */
import { createHash } from 'node:crypto';
import type { Prisma } from '@prisma/client';

/** Seconds to wait for the advisory lock before giving up. */
const LOCK_TIMEOUT_SECONDS = 10;
const LOCK_NAMESPACE = 'alo:student:create';

/** Normalizes the natural key so equivalent spellings share one lock. */
export function studentLockKey(email: string, phone: string): string {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const normalizedPhone = (phone || '').replace(/[^0-9]/g, '');
  if (!normalizedEmail && !normalizedPhone) {
    // Without a natural key there is nothing to serialize on; the caller must
    // not rely on duplicate protection in that case.
    return '';
  }
  const digest = createHash('sha256').update(`${normalizedEmail}|${normalizedPhone}`).digest('hex');
  return `${LOCK_NAMESPACE}:${digest.slice(0, 32)}`;
}

/**
 * Takes the advisory lock. Returns true when the lock is held, false when the
 * key was empty or the driver does not support advisory locking.
 *
 * Throws when MySQL reports contention (0 = timed out, NULL = error) so the
 * caller fails closed rather than creating a duplicate student.
 */
export async function acquireStudentCreateLock(
  tx: Prisma.TransactionClient,
  key: string,
  timeoutSeconds: number = LOCK_TIMEOUT_SECONDS,
): Promise<boolean> {
  if (!key) return false;
  if (process.env.ALO_DB_DRIVER === 'sqlite') return false;

  const rows = await tx.$queryRaw<Array<{ acquired: bigint | number | null }>>`
    SELECT GET_LOCK(${key}, ${timeoutSeconds}) AS acquired`;
  const raw = rows[0]?.acquired;

  // GET_LOCK returns 1 = acquired, 0 = timed out, NULL = error (e.g. the server
  // could not allocate memory for the lock). NULL must not be coerced to 0,
  // otherwise a server-side failure is reported to the operator as contention.
  if (raw === null || raw === undefined) {
    throw new Error('The student-creation lock could not be acquired (GET_LOCK returned an error).');
  }
  if (Number(raw) === 1) return true;
  if (Number(raw) === 0) {
    throw new Error('Timed out waiting for the student-creation lock; the request was not processed.');
  }
  throw new Error('The student-creation lock could not be acquired (GET_LOCK returned an error).');
}

/** Releases a lock previously taken with acquireStudentCreateLock. Best-effort. */
export async function releaseStudentCreateLock(
  tx: Prisma.TransactionClient,
  key: string,
): Promise<void> {
  if (!key) return;
  if (process.env.ALO_DB_DRIVER === 'sqlite') return;
  try {
    await tx.$executeRaw`SELECT RELEASE_LOCK(${key})`;
  } catch {
    // The connection closing releases the lock anyway; a failed explicit
    // release must never mask the business outcome of the transaction.
  }
}
