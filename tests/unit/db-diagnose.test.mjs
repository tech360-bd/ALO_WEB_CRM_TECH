import { describe, expect, it } from 'vitest';
import {
  assessRuntimePrivileges,
  classifyDatabaseError,
  compareExpectedDatabase,
  expectedDatabaseFromArgs,
  formatFailure,
  identifyDatabaseUrlSource,
  parseDatabaseUrl,
  withTimeout,
} from '../../scripts/db-diagnose.mjs';

describe('read-only database diagnostic configuration and identity helpers', () => {
  it('parses MySQL target fields without returning the password', () => {
    const parsed = parseDatabaseUrl('mysql://app_user@db.example.test:3307/alo_prod');
    expect(parsed).toMatchObject({
      host: 'db.example.test',
      port: 3307,
      databaseName: 'alo_prod',
      configuredUsername: 'app_user',
      hasUsername: true,
      hasPassword: false,
    });
    expect(parsed).not.toHaveProperty('password');
    expect(parsed).not.toHaveProperty('url');
    expect(parseDatabaseUrl('not a URL')).toEqual({ error: 'DATABASE_URL_INVALID' });
    expect(parseDatabaseUrl('file:local.db')).toEqual({ error: 'DATABASE_URL_SCHEME_UNSUPPORTED' });
  });

  it('honors process-environment precedence and identifies dotenv fallback files', () => {
    expect(identifyDatabaseUrlSource('set', true, [], 'set'))
      .toContain('process environment');
    expect(identifyDatabaseUrlSource('', false, [
      { path: '/app/.env', contents: 'DATABASE_URL=mysql://placeholder' },
      { path: '/app/.env.production.local', contents: 'DATABASE_URL=mysql://placeholder' },
    ], 'loaded')).toContain('.env.production.local');
    expect(identifyDatabaseUrlSource('', false, [], 'set')).toContain('source not identified');
  });

  it('accepts only an explicit expected-database comparison argument', () => {
    expect(expectedDatabaseFromArgs([])).toEqual({ value: '' });
    expect(expectedDatabaseFromArgs(['--expected-database=alo_prod']))
      .toEqual({ value: 'alo_prod' });
    expect(expectedDatabaseFromArgs(['--expected-database=one', '--expected-database=two']).error)
      .toBe('EXPECTED_DATABASE_OPTION_REPEATED');
    expect(expectedDatabaseFromArgs(['--expected-database=bad' + String.fromCharCode(10) + 'name']).error)
      .toBe('EXPECTED_DATABASE_OPTION_INVALID');
    expect(compareExpectedDatabase('alo_prod', 'alo_prod')).toBe('PASS');
    expect(compareExpectedDatabase('other_db', 'alo_prod')).toBe('FAIL');
    expect(compareExpectedDatabase('alo_prod', '')).toBe('NOT CHECKED');
  });

  it('bounds slow operations and classifies timeouts without leaking exception messages', async () => {
    await expect(withTimeout(new Promise(() => {}), 5)).rejects.toMatchObject({
      code: 'DIAGNOSTIC_TIMEOUT',
    });
    expect(classifyDatabaseError({ code: 'DIAGNOSTIC_TIMEOUT' }).category)
      .toBe('DATABASE_OPERATION_TIMEOUT');
    expect(classifyDatabaseError({ code: 'P1010' }).category)
      .toBe('MYSQL_AUTHENTICATION_OR_ACCESS_DENIED');
    const output = formatFailure('Connection check', {
      code: 'P1000',
      message: 'url and password must never appear in output',
      stack: 'stack must never be printed',
    });
    expect(output).toContain('MYSQL_AUTHENTICATION_OR_ACCESS_DENIED');
    expect(output).not.toContain('password');
    expect(output).not.toContain('stack');
  });

  it('verifies read/write grants only when directly scoped to the effective database', () => {
    const grants = [
      { grant: 'GRANT SELECT, INSERT ON `alo_prod`.* TO `app`@`%`' },
      { grant: 'GRANT UPDATE, DELETE ON `alo_prod`.* TO `app`@`%`' },
    ];
    expect(assessRuntimePrivileges(grants, 'alo_prod')).toMatchObject({ status: 'PASS', missing: [] });
    expect(assessRuntimePrivileges(grants, 'other_db')).toMatchObject({ status: 'UNKNOWN' });
    expect(assessRuntimePrivileges([
      { grant: 'GRANT SELECT ON `alo_prod`.* TO `app`@`%`' },
    ], 'alo_prod')).toMatchObject({ status: 'FAIL', missing: ['INSERT', 'UPDATE', 'DELETE'] });
    expect(assessRuntimePrivileges([
      { grant: 'GRANT ALL PRIVILEGES ON *.* TO `app`@`%`' },
    ], 'alo_prod')).toMatchObject({ status: 'PASS' });
  });
});

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
