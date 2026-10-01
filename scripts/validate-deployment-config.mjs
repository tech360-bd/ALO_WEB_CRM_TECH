#!/usr/bin/env node
// Offline Hostinger contract verification only. Never connects or deploys.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const result = spawnSync(process.execPath, ['--test', 'tests/runtime-standard.test.mjs', 'tests/deployment-ownership.test.mjs'], { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status || 1);
console.log('Repository contract verified only. Hostinger configuration, actual build/start and database access require separate verification.');
