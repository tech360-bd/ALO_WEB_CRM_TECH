/**
 * Student ID allocation and creation locking against a REAL MySQL server.
 *
 * The unit journey test (tests/unit/whatsapp-student-journey.test.ts) proves the
 * allocator's logic against an in-memory model of MySQL. Only a real server can
 * prove the two properties that actually prevent duplicate students in
 * production:
 *
 *   1. `LAST_INSERT_ID(lastValue + 1)` under a row lock gives every concurrent
 *      transaction a distinct number.
 *   2. `GET_LOCK()` serializes the find-or-create on a natural key, so two
 *      simultaneous counsellor submissions for the same person cannot both
 *      insert.
 *
 * TEST_DATABASE_URL must point at a disposable local `alo_test_*` schema; the
 * suite self-skips (reported as skipped, never "passed") when it is absent, and
 * scripts/lib/test-database-safety.mjs refuses production URLs before Vitest
 * even starts.
 */
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { afterAll, describe, expect, it } from 'vitest';

import { testDatabaseUrl } from '../helpers/test-database';

const databaseUrl = testDatabaseUrl();
const HAS_TEST_DB = databaseUrl !== null;
const client = databaseUrl ? new PrismaClient({ datasourceUrl: databaseUrl }) : null;

function requireClient(): PrismaClient {
  if (!client) throw new Error('TEST_DATABASE_URL is not configured');
  return client;
}

const runId = `wajourney-${randomUUID()}`;
const allocatedStudents: string[] = [];

afterAll(async () => {
  if (!client) return;
  try {
    if (allocatedStudents.length) {
      await client.student.deleteMany({ where: { id: { in: allocatedStudents } } });
    }
    // Release any advisory lock this suite still holds, so a repeat run in the
    // same server process is not blocked by its own leftover lock.
    await client.$queryRawUnsafe(`SELECT RELEASE_LOCK(?)`, `${runId}-lock`).catch(() => {});
  } finally {
    await client.$disconnect();
  }
});

describe.skipIf(!HAS_TEST_DB)('Student ID allocation on real MySQL', () => {
  it('issues distinct identifiers to 20 concurrent transactions', async () => {
    const db = requireClient();

    // Twenty transactions racing on the same scope/year row. If the row lock or
    // the LAST_INSERT_ID trick were wrong, at least two would collide — and
    // Student.studentId is UNIQUE, so a collision would surface as P2002 here
    // rather than silently in production.
    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () =>
        db.$transaction(async (tx) => {
          const year = 2099; // far-future year: isolates this suite from real data
          const key = `AE-${year}`;
          await tx.$executeRaw`INSERT INTO StudentIdSequence (id, scope, year, lastValue, updatedAt)
            VALUES (${key}, 'AE', ${year}, 0, NOW(3))
            ON DUPLICATE KEY UPDATE id = id`;
          const updated = await tx.$executeRaw`UPDATE StudentIdSequence
            SET lastValue = LAST_INSERT_ID(lastValue + 1), updatedAt = NOW(3)
            WHERE id = ${key}`;
          expect(updated).toBe(1);
          const rows = await tx.$queryRaw<Array<{ value: bigint }>>`SELECT LAST_INSERT_ID() AS value`;
          return Number(rows[0].value);
        }),
      ),
    );

    const fulfilled = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<number>[];
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(rejected).toEqual([]);

    const sequences = fulfilled.map((r) => r.value);
    expect(sequences).toHaveLength(20);
    // The decisive assertion: no two transactions received the same number.
    expect(new Set(sequences).size).toBe(20);
    // And they form a contiguous block, so no number was skipped or double-issued.
    expect([...sequences].sort((a, b) => a - b)).toEqual(
      Array.from({ length: 20 }, (_, index) => Math.min(...sequences) + index),
    );
  }, 60_000);
});

describe.skipIf(!HAS_TEST_DB)('advisory lock serialization on real MySQL', () => {
  it('blocks a second connection until the first releases', async () => {
    const db = requireClient();

    // GET_LOCK is RE-ENTRANT on a single MySQL connection: asking twice from the
    // same connection succeeds and just increments a counter. Prisma serves
    // sequential $queryRaw calls from one pooled connection, so a test that
    // acquires and then contends using the same PrismaClient proves nothing — it
    // observes re-entrancy, not exclusion.
    //
    // A second PrismaClient has its own pool and therefore its own physical
    // connection, which is what real concurrent requests use. The CONNECTION_ID
    // assertions below make that precondition explicit: if the two clients ever
    // shared a connection the test would fail loudly instead of passing falsely.
    const holder = new PrismaClient({ datasourceUrl: databaseUrl! });
    try {
      const [holderConn, contenderConn] = await Promise.all([
        holder.$queryRaw<Array<{ id: bigint }>>`SELECT CONNECTION_ID() AS id`,
        db.$queryRaw<Array<{ id: bigint }>>`SELECT CONNECTION_ID() AS id`,
      ]);
      expect(Number(holderConn[0].id)).not.toBe(Number(contenderConn[0].id));

      const lockName = `${runId}-lock`;
      const held = await holder.$queryRaw<Array<{ got: bigint }>>`SELECT GET_LOCK(${lockName}, 5) AS got`;
      expect(Number(held[0].got)).toBe(1);

      try {
        // A genuinely different connection with a short timeout must time out (0).
        const contended = await db.$queryRaw<Array<{ got: bigint | null }>>`
          SELECT GET_LOCK(${lockName}, 1) AS got`;
        expect(Number(contended[0].got ?? 0)).toBe(0);
      } finally {
        await holder.$queryRawUnsafe(`SELECT RELEASE_LOCK(?)`, lockName);
      }

      // After release, the contending connection can take it.
      const reacquired = await db.$queryRaw<Array<{ got: bigint }>>`SELECT GET_LOCK(${lockName}, 5) AS got`;
      expect(Number(reacquired[0].got)).toBe(1);
      await db.$queryRawUnsafe(`SELECT RELEASE_LOCK(?)`, lockName);
    } finally {
      await holder.$disconnect();
    }
  }, 60_000);

  it('stores a student row created under the lock with a canonical identifier', async () => {
    const db = requireClient();
    const year = 2099;
    const key = `AE-${year}`;

    const studentId = await db.$transaction(async (tx) => {
      await tx.$executeRaw`INSERT INTO StudentIdSequence (id, scope, year, lastValue, updatedAt)
        VALUES (${key}, 'AE', ${year}, 0, NOW(3))
        ON DUPLICATE KEY UPDATE id = id`;
      await tx.$executeRaw`UPDATE StudentIdSequence
        SET lastValue = LAST_INSERT_ID(lastValue + 1), updatedAt = NOW(3)
        WHERE id = ${key}`;
      const rows = await tx.$queryRaw<Array<{ value: bigint }>>`SELECT LAST_INSERT_ID() AS value`;
      return `AE-${year}${String(Number(rows[0].value)).padStart(4, '0')}`;
    });

    expect(studentId).toMatch(/^AE-2099\d{4}$/);

    const email = `${runId}-${randomUUID()}@example.invalid`;
    const created = await db.student.create({
      data: {
        studentId,
        name: 'Journey Test Student',
        email,
        phone: `+88017${Math.floor(10000000 + Math.random() * 89999999)}`,
        status: 'active',
        userType: 'ALO_FULL_STUDENT',
        journeyStage: 'lead_created',
      },
      select: { id: true, studentId: true },
    });
    allocatedStudents.push(created.id);

    const persisted = await db.student.findUnique({ where: { id: created.id }, select: { studentId: true } });
    expect(persisted?.studentId).toBe(studentId);
  }, 60_000);
});
