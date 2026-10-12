import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isolatedDatabaseEnvironment } from './lib/test-database-safety.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let env;
try { env = isolatedDatabaseEnvironment(); }
catch (error) {
  // Never print URLs, credentials, or driver exceptions.
  console.error(error instanceof Error ? error.message : 'Unsafe test database configuration');
  process.exit(1);
}

const vitestPath = path.join(projectRoot, 'node_modules', 'vitest', 'vitest.mjs');
if (!existsSync(vitestPath)) {
  console.error('Vitest is not installed. Run npm ci before the integration tests.');
  process.exit(1);
}

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
