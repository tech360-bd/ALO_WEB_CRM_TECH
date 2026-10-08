import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const testDatabaseUrl = process.env.TEST_DATABASE_URL?.trim();

if (!testDatabaseUrl) {
  console.error('Integration tests require TEST_DATABASE_URL pointing to an isolated, disposable test database.');
  process.exit(1);
}

const usesSqlite = /^file:/i.test(testDatabaseUrl);
if (usesSqlite !== (process.env.ALO_DB_DRIVER === 'sqlite')) {
  console.error(usesSqlite
    ? 'A file: TEST_DATABASE_URL requires ALO_DB_DRIVER=sqlite and the generated verification client.'
    : 'ALO_DB_DRIVER=sqlite requires TEST_DATABASE_URL to use a file: URL.');
  process.exit(1);
}

const vitestPath = path.join(projectRoot, 'node_modules', 'vitest', 'vitest.mjs');
if (!existsSync(vitestPath)) {
  console.error('Vitest is not installed. Run npm ci before the integration tests.');
  process.exit(1);
}

// Never inherit a potentially different DATABASE_URL: integration tests must
// use only the explicitly named disposable test database. Do not print it.
const env = { ...process.env, DATABASE_URL: testDatabaseUrl };
const result = spawnSync(process.execPath, [vitestPath, 'run', 'tests/integration'], {
  cwd: projectRoot,
  env,
  stdio: 'inherit',
});

if (result.error) {
  console.error(`Could not start Vitest: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
