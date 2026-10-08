/** Database tests never inherit DATABASE_URL. Use an explicitly isolated local schema. */
export function testDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | null {
  if (!env.TEST_DATABASE_URL) return null;
  let url: URL;
  try {
    url = new URL(env.TEST_DATABASE_URL);
  } catch {
    throw new Error('TEST_DATABASE_URL must be a valid local MySQL URL');
  }
  // Prisma accepts transport options (e.g. socket) in the query string. Do not
  // allow those to redirect a nominally-local disposable target.
  if (url.search || url.hash) throw new Error('Test URL must not contain transport/query overrides');
  const schema = decodeURIComponent(url.pathname.slice(1));
  if (url.protocol !== 'mysql:' || !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || !/^alo_test_[a-z0-9_]+$/.test(schema)) {
    throw new Error('Tests require local MySQL and an isolated alo_test_* database');
  }
  // The integration runner deliberately maps DATABASE_URL to TEST_DATABASE_URL
  // for DB-backed Prisma clients. Preserve the original app schema separately so
  // this guard still checks the pre-override target instead of rejecting its
  // own isolated test connection.
  const hasOriginalApplicationSchema = Object.prototype.hasOwnProperty.call(env, 'ALO_APPLICATION_DATABASE_SCHEMA');
  const applicationSchema = hasOriginalApplicationSchema
    ? env.ALO_APPLICATION_DATABASE_SCHEMA
    : env.DATABASE_URL
      ? decodeURIComponent(new URL(env.DATABASE_URL).pathname.slice(1))
      : undefined;
  if (applicationSchema === schema) {
    throw new Error('Test database must not share the application database name');
  }
  return url.href;
}
