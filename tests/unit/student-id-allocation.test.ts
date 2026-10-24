import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: { $transaction: vi.fn() } }));

import {
  allocateIdentifier,
  businessYear,
  formatIdentifier,
  IdentifierAllocationError,
} from '@/lib/identity/student-id';

/**
 * In-memory stand-in for the three SQL statements used by allocateIdentifier.
 * It models what MySQL guarantees for a single connection: the UPDATE advances the row and
 * LAST_INSERT_ID() returns the new value. Transactions are all-or-nothing via snapshot/restore.
 * This verifies the allocator's logic only; real concurrency is verified against MySQL (NOT VERIFIED here).
 */
function createFakeDatabase() {
  const rows = new Map<string, { lastValue: number }>();
  const reservedCodes = new Set<string>();
  let lastInsertId = 0;

  const makeTx = () => ({
    student: { findUnique: async ({ where }: { where: { studentId: string } }) => reservedCodes.has(where.studentId) ? { id: 'legacy-student' } : null },
    portalStudentProfile: { findUnique: async ({ where }: { where: { studentId: string } }) => reservedCodes.has(where.studentId) ? { id: 'portal-profile' } : null },
    $executeRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = strings.join('?');
      if (sql.includes('ON DUPLICATE KEY UPDATE')) {
        const key = String(values[0]);
        if (!rows.has(key)) rows.set(key, { lastValue: 0 });
        return 0;
      }
      if (sql.includes('LAST_INSERT_ID(lastValue + 1)')) {
        const key = String(values[0]);
        const row = rows.get(key);
        if (!row) return 0;
        row.lastValue += 1;
        lastInsertId = row.lastValue;
        return 1;
      }
      throw new Error(`unexpected statement: ${sql}`);
    },
    $queryRaw: async (strings: TemplateStringsArray) => {
      const sql = strings.join('?');
      if (!sql.includes('LAST_INSERT_ID() AS value')) throw new Error(`unexpected query: ${sql}`);
      return [{ value: BigInt(lastInsertId) }];
    },
  });

  /** Runs fn as a transaction: commit on success, restore all state on failure. */
  const transaction = async <T>(fn: (tx: ReturnType<typeof makeTx>) => Promise<T>): Promise<T> => {
    const snapshot = new Map([...rows].map(([k, v]) => [k, { ...v }]));
    const savedLast = lastInsertId;
    try {
      return await fn(makeTx());
    } catch (error) {
      rows.clear();
      for (const [k, v] of snapshot) rows.set(k, v);
      lastInsertId = savedLast;
      throw error;
    }
  };

  return { transaction, rows, reservedCodes };
}

describe('identifier format', () => {
  it('formats the canonical student ID exactly as specified', () => {
    expect(formatIdentifier('AE', 2026, 1)).toBe('AE-20260001');
    expect(formatIdentifier('AE', 2026, 2)).toBe('AE-20260002');
    expect(formatIdentifier('AEP', 2026, 1)).toBe('AEP-202600001');
    expect(formatIdentifier('EMP', 2026, 99999)).toBe('EMP-202699999');
  });

  it('fails closed on sequence exhaustion, bad scope, or bad year', () => {
    expect(() => formatIdentifier('AE', 2026, 10000)).toThrow(IdentifierAllocationError);
    expect(formatIdentifier('AE', 2026, 9999)).toBe('AE-20269999');
    expect(() => formatIdentifier('EMP', 2026, 100000)).toThrow(IdentifierAllocationError);
    expect(() => formatIdentifier('AE', 2026, 0)).toThrow(IdentifierAllocationError);
    expect(() => formatIdentifier('XX' as never, 2026, 1)).toThrow(/Unknown identifier scope/);
    expect(() => formatIdentifier('AE', 1999, 1)).toThrow(/Invalid year/);
  });

  it('recognizes new four-digit and historical five/six-digit student codes', () => {
    const regex = /\b(AE-\d{4}\d{4}|AE-\d{4}\d{5}|AE-\d{4}\d{6}|ALO-S-\d+|STU-\w+)\b/i;
    expect(regex.exec('my id is AE-20260001 thanks')?.[1]).toBe('AE-20260001');
    expect(regex.exec('legacy code AE-202600042')?.[1]).toBe('AE-202600042');
    expect(regex.exec('legacy code AE-2026000001')?.[1]).toBe('AE-2026000001');
  });
});

describe('business year', () => {
  it('uses Asia/Dhaka for the calendar year, not UTC', () => {
    // 2026-12-31T18:30:00Z is 2027-01-01 00:30 in Dhaka (UTC+6)
    expect(businessYear(new Date('2026-12-31T18:30:00Z'))).toBe(2027);
    expect(businessYear(new Date('2026-12-31T17:59:00Z'))).toBe(2026);
  });
});

describe('allocateIdentifier', () => {
  it('issues unique, strictly increasing numbers within a year', async () => {
    const fake = createFakeDatabase();
    const ids: string[] = [];
    for (let i = 0; i < 200; i++) {
      ids.push(await fake.transaction((tx) => allocateIdentifier(tx as never, 'AE', 2026)));
    }
    expect(new Set(ids).size).toBe(200);
    expect(ids[0]).toBe('AE-20260001');
    expect(ids[199]).toBe('AE-20260200');
  });

  it('keeps each year and scope independent (restart per year, no cross-scope reuse)', async () => {
    const fake = createFakeDatabase();
    const a = await fake.transaction((tx) => allocateIdentifier(tx as never, 'AE', 2026));
    const b = await fake.transaction((tx) => allocateIdentifier(tx as never, 'AE', 2027));
    const c = await fake.transaction((tx) => allocateIdentifier(tx as never, 'AEP', 2026));
    expect([a, b, c]).toEqual(['AE-20260001', 'AE-20270001', 'AEP-202600001']);
  });

  it('skips a legacy six-digit student code that exists outside the new sequence', async () => {
    const fake = createFakeDatabase();
    fake.reservedCodes.add('AE-20260001');
    fake.reservedCodes.add('AE-2026000001');
    const next = await fake.transaction((tx) => allocateIdentifier(tx as never, 'AE', 2026));
    expect(next).toBe('AE-20260002');
  });

  it('never reuses a committed number, even after later failures', async () => {
    const fake = createFakeDatabase();
    const first = await fake.transaction((tx) => allocateIdentifier(tx as never, 'AE', 2026));
    await expect(
      fake.transaction(async (tx) => {
        await allocateIdentifier(tx as never, 'AE', 2026);
        throw new Error('welcome workflow failed');
      }),
    ).rejects.toThrow('welcome workflow failed');
    const next = await fake.transaction((tx) => allocateIdentifier(tx as never, 'AE', 2026));
    expect(first).toBe('AE-20260001');
    // The rolled-back allocation released its number before anything was committed, so the next
    // committed ID is 0002 and nothing visible was ever reused.
    expect(next).toBe('AE-20260002');
  });

  it('rejects unknown scopes before touching the database', async () => {
    const fake = createFakeDatabase();
    await expect(fake.transaction((tx) => allocateIdentifier(tx as never, 'ZZ' as never, 2026))).rejects.toThrow(
      /Unknown identifier scope/,
    );
    expect(fake.rows.size).toBe(0);
  });
});
