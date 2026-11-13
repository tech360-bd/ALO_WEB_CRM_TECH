import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));

import {
  acquireStudentCreateLock,
  releaseStudentCreateLock,
  studentLockKey,
} from '@/lib/identity/student-create-lock';

const savedEnv = { ...process.env };

beforeEach(() => {
  delete process.env.ALO_DB_DRIVER;
});

afterEach(() => {
  process.env = { ...savedEnv };
});

/** Records the SQL issued so assertions can check both the query and its binds. */
function createFakeTx(getLockResult: number | null = 1) {
  const executed: Array<{ sql: string; values: unknown[] }> = [];
  const tx = {
    $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      executed.push({ sql: strings.join('?'), values });
      return [{ acquired: getLockResult === null ? null : BigInt(getLockResult) }];
    },
    $executeRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      executed.push({ sql: strings.join('?'), values });
      return 1;
    },
  };
  return { tx, executed };
}

describe('studentLockKey', () => {
  it('is stable for the same identity regardless of spelling', () => {
    const a = studentLockKey('Student@Example.com', '+880 1712-345678');
    const b = studentLockKey('student@example.com', '8801712345678');
    expect(a).toBe(b);
    expect(a).not.toBe('');
  });

  it('differs for different identities', () => {
    expect(studentLockKey('a@example.com', '8801712345678')).not.toBe(
      studentLockKey('b@example.com', '8801712345679'),
    );
  });

  it('never embeds the email or phone in the lock name', () => {
    // The namespace prefix legitimately contains the word "student", so the
    // identity used here must not, otherwise this assertion proves nothing.
    const key = studentLockKey('rahim.ahmed@example.com', '+8801712345678');
    expect(key).not.toContain('rahim');
    expect(key).not.toContain('ahmed');
    expect(key).not.toContain('example.com');
    expect(key).not.toContain('8801712345678');
    expect(key.startsWith('alo:student:create:')).toBe(true);
    // Only the 32-hex digest follows the namespace — no PII residue.
    expect(key.slice('alo:student:create:'.length)).toMatch(/^[0-9a-f]{32}$/);
  });

  it('returns empty when there is no natural key to serialize on', () => {
    expect(studentLockKey('', '')).toBe('');
    expect(studentLockKey('   ', '+ ()')).toBe('');
  });
});

describe('acquireStudentCreateLock', () => {
  it('issues GET_LOCK and reports the lock as held', async () => {
    const { tx, executed } = createFakeTx(1);
    const held = await acquireStudentCreateLock(tx as never, 'alo:student:create:abc');
    expect(held).toBe(true);
    expect(executed).toHaveLength(1);
    expect(executed[0].sql).toContain('GET_LOCK');
    expect(executed[0].values[0]).toBe('alo:student:create:abc');
  });

  it('throws on contention so the caller cannot create a duplicate student', async () => {
    const { tx } = createFakeTx(0);
    await expect(acquireStudentCreateLock(tx as never, 'alo:student:create:abc')).rejects.toThrow(
      /Timed out waiting for the student-creation lock/,
    );
  });

  it('throws when MySQL reports a lock error', async () => {
    const { tx } = createFakeTx(null);
    await expect(acquireStudentCreateLock(tx as never, 'alo:student:create:abc')).rejects.toThrow(
      /could not be acquired/,
    );
  });

  it('is a no-op when there is no natural key', async () => {
    const { tx, executed } = createFakeTx(1);
    expect(await acquireStudentCreateLock(tx as never, '')).toBe(false);
    expect(executed).toHaveLength(0);
  });

  it('is a no-op on the sqlite verification driver, which has no GET_LOCK', async () => {
    process.env.ALO_DB_DRIVER = 'sqlite';
    const { tx, executed } = createFakeTx(1);
    expect(await acquireStudentCreateLock(tx as never, 'alo:student:create:abc')).toBe(false);
    expect(executed).toHaveLength(0);
  });
});

describe('releaseStudentCreateLock', () => {
  it('issues RELEASE_LOCK for a held key', async () => {
    const { tx, executed } = createFakeTx(1);
    await releaseStudentCreateLock(tx as never, 'alo:student:create:abc');
    expect(executed).toHaveLength(1);
    expect(executed[0].sql).toContain('RELEASE_LOCK');
  });

  it('does nothing for an empty key or on sqlite', async () => {
    const first = createFakeTx(1);
    await releaseStudentCreateLock(first.tx as never, '');
    expect(first.executed).toHaveLength(0);

    process.env.ALO_DB_DRIVER = 'sqlite';
    const second = createFakeTx(1);
    await releaseStudentCreateLock(second.tx as never, 'alo:student:create:abc');
    expect(second.executed).toHaveLength(0);
  });

  it('swallows a failed release rather than masking the business outcome', async () => {
    const tx = {
      $executeRaw: vi.fn(async () => {
        throw new Error('connection lost');
      }),
    };
    await expect(releaseStudentCreateLock(tx as never, 'alo:student:create:abc')).resolves.toBeUndefined();
  });
});
