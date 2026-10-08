import { describe, expect, it } from 'vitest';
import { testDatabaseUrl } from '../helpers/test-database';

describe('disposable database boundary', () => {
  it('never enables database tests from application DATABASE_URL', () => {
    expect(testDatabaseUrl({ DATABASE_URL: 'mysql://localhost/production' })).toBeNull();
  });
  it.each(['mysql://remote.example/alo_test_ci', 'mysql://localhost/production', 'postgres://localhost/alo_test_ci', 'not-a-url', 'mysql://localhost/alo_test_ci?socket=/production/mysql.sock'])('rejects unsafe target %s', (url) => {
    expect(() => testDatabaseUrl({ TEST_DATABASE_URL: url })).toThrow();
  });
  it('rejects the same schema even with different credentials or hosts', () => {
    expect(() => testDatabaseUrl({ TEST_DATABASE_URL: 'mysql://localhost/alo_test_ci', DATABASE_URL: 'mysql://db/alo_test_ci' })).toThrow(/share/);
  });
  it('checks the original application schema after the runner maps DATABASE_URL to the test schema', () => {
    const mapped = {
      TEST_DATABASE_URL: 'mysql://localhost/alo_test_ci',
      DATABASE_URL: 'mysql://localhost/alo_test_ci',
      ALO_APPLICATION_DATABASE_SCHEMA: 'alo_app_ci',
    };
    expect(testDatabaseUrl(mapped)).toContain('/alo_test_ci');
    expect(() => testDatabaseUrl({ ...mapped, ALO_APPLICATION_DATABASE_SCHEMA: 'alo_test_ci' })).toThrow(/share/);
  });
  it('accepts a distinct explicitly named local disposable schema', () => {
    expect(testDatabaseUrl({ TEST_DATABASE_URL: 'mysql://127.0.0.1:3306/alo_test_ci' })).toContain('/alo_test_ci');
  });
});
