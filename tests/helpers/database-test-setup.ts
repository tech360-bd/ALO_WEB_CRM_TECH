import { isolatedDatabaseEnvironment } from '../../scripts/lib/test-database-safety.mjs';
// Runs before suite imports, including direct `vitest run tests/integration`.
// Missing TEST_DATABASE_URL stays skipped; it never inherits application DB.
if (process.env.TEST_DATABASE_URL) {
  const isolated = isolatedDatabaseEnvironment();
  process.env.DATABASE_URL = isolated.DATABASE_URL;
  process.env.ALO_APPLICATION_DATABASE_SCHEMA = isolated.ALO_APPLICATION_DATABASE_SCHEMA;
}
