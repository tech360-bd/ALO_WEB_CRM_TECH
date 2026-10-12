import { describe, expect, it } from 'vitest';
import { classifyDatabaseError } from '../../scripts/db-diagnose.mjs';

describe('read-only database diagnostic error classification', () => {
  it('distinguishes MySQL authentication and database access failures', () => {
    expect(classifyDatabaseError({ code: 'P1000' })).toEqual({
      code: 'P1000',
      category: 'MYSQL_AUTHENTICATION_OR_ACCESS_DENIED',
    });
    expect(classifyDatabaseError({ code: 'ER_DBACCESS_DENIED_ERROR' }).category)
      .toBe('MYSQL_AUTHENTICATION_OR_ACCESS_DENIED');
  });

  it('distinguishes network, missing-schema, and Prisma model errors', () => {
    expect(classifyDatabaseError({ code: 'P1001' }).category)
      .toBe('MYSQL_HOST_OR_NETWORK_UNREACHABLE');
    expect(classifyDatabaseError({ code: 'P1003' }).category)
      .toBe('MYSQL_DATABASE_SCHEMA_NOT_FOUND');
    expect(classifyDatabaseError({ code: 'P2021' }).category)
      .toBe('PRISMA_MODEL_OR_SCHEMA_MISMATCH');
  });

  it('does not copy exception messages into diagnostic summaries', () => {
    const summary = classifyDatabaseError({
      code: 'UNKNOWN_DRIVER_ERROR',
      message: 'sensitive connection text must not be included',
    });
    expect(summary).toEqual({ code: 'UNKNOWN_DRIVER_ERROR', category: 'DATABASE_QUERY_FAILED' });
    expect(JSON.stringify(summary)).not.toContain('sensitive');
  });
});
