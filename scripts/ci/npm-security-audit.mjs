import { spawnSync } from 'node:child_process';

// Keep the security gate fail-closed, including registry/network failures.
const result = spawnSync('npm', ['audit', '--audit-level=high'], { stdio: 'inherit' });
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
