import { describe, expect, it, vi } from 'vitest';
import {
  getSafeDatabaseErrorCode,
  logSafeDatabaseFailure,
  throwSanitizedDatabaseFailure,
} from '@/lib/safe-db-error';

describe('safe database error reporting', () => {
  it('extracts only a short driver code and ignores messages/connection metadata', () => {
    const error = Object.assign(new Error('password and connection details'), {
      code: 'P1000',
      meta: { database: 'private-schema' },
    });
    expect(getSafeDatabaseErrorCode(error)).toBe('P1000');
    expect(getSafeDatabaseErrorCode(new Error('raw error text'))).toBe('DATABASE_OPERATION_FAILED');
  });

  it('logs a scope and safe code without the original error text', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    logSafeDatabaseFailure('test-scope', Object.assign(new Error('private details'), { code: 'P1001' }));
    expect(log).toHaveBeenCalledWith('[test-scope] Database operation failed.', { code: 'P1001' });
    expect(JSON.stringify(log.mock.calls)).not.toContain('private details');
  });

  it('throws a generic public error without chaining the database exception', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    let caught: unknown;
    try {
      throwSanitizedDatabaseFailure('test-scope', new Error('private details'), 'DATABASE_UNAVAILABLE');
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(Error);
    expect((caught as Error).message).toBe('DATABASE_UNAVAILABLE');
    expect((caught as Error & { cause?: unknown }).cause).toBeUndefined();
    expect(JSON.stringify(log.mock.calls)).not.toContain('private details');
  });
});
