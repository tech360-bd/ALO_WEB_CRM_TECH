/** Never include the supplied URL (or credentials) in an error message.
 * @param {string} value
 */
function applicationSchema(value) {
  try { return decodeURIComponent(new URL(value).pathname.slice(1)); }
  catch { throw new Error('Application database URL is invalid; refusing test initialization'); }
}

/** Shared by the integration runner and Vitest before any DB-backed imports.
 * @param {Record<string, string | undefined>} env
 * @returns {string | null}
 */
export function testDatabaseUrl(env = process.env) {
  if (!env.TEST_DATABASE_URL) return null;
  let url;
  try { url = new URL(env.TEST_DATABASE_URL); }
  catch { throw new Error('TEST_DATABASE_URL must be a valid local MySQL URL'); }
  if (url.search || url.hash) throw new Error('Test URL must not contain transport/query overrides');
  const schema = decodeURIComponent(url.pathname.slice(1));
  if (url.protocol !== 'mysql:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !/^alo_test_[a-z0-9_]+$/.test(schema)) {
    throw new Error('Tests require local MySQL and an isolated alo_test_* database');
  }
  const originalSchema = Object.prototype.hasOwnProperty.call(env, 'ALO_APPLICATION_DATABASE_SCHEMA')
    ? env.ALO_APPLICATION_DATABASE_SCHEMA
    : env.DATABASE_URL ? applicationSchema(env.DATABASE_URL) : undefined;
  if (originalSchema === schema) throw new Error('Test database must not share the application database name');
  return url.href;
}

/** Validate BEFORE overriding DATABASE_URL, preserving the original schema.
 * Explicit acknowledgment documents operator ownership of the disposable DB;
 * a local hostname alone cannot prove a tunnel is not production.
 * @param {Record<string, string | undefined>} env
 */
export function isolatedDatabaseEnvironment(env = process.env) {
  const url = testDatabaseUrl(env);
  if (!url) throw new Error('Integration tests require TEST_DATABASE_URL pointing to an isolated, disposable test database.');
  if (env.ALLOW_DISPOSABLE_DATABASE_TESTS !== '1') throw new Error('Set ALLOW_DISPOSABLE_DATABASE_TESTS=1 only after confirming this is a disposable non-production database.');
  if (env.NODE_ENV === 'production' || env.ALO_DB_DRIVER === 'sqlite') throw new Error('Database integration tests require non-production MySQL, not production mode or a SQLite mirror.');
  return {
    ...env,
    DATABASE_URL: url,
    ALO_APPLICATION_DATABASE_SCHEMA: Object.prototype.hasOwnProperty.call(env, 'ALO_APPLICATION_DATABASE_SCHEMA')
      ? env.ALO_APPLICATION_DATABASE_SCHEMA
      : env.DATABASE_URL ? applicationSchema(env.DATABASE_URL) : '',
  };
}
