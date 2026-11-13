#!/usr/bin/env tsx
/**
 * Validate a verified-catalogue dataset without touching the database.
 *
 *   npx tsx scripts/verified-catalogue/validate-dataset.ts [--dataset data/verified-2027/dataset.json]
 *
 * Exit code 1 when any error is found, so it can gate CI and the ingest job.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateDataset } from '../../src/lib/verified-catalogue/validation';
import type { VerifiedDataset } from '../../src/lib/verified-catalogue/types';

function argValue(flag: string, fallback: string): string {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

const datasetPath = resolve(process.cwd(), argValue('--dataset', 'data/verified-2027/dataset.json'));
const dataset = JSON.parse(readFileSync(datasetPath, 'utf8')) as VerifiedDataset;
const result = validateDataset(dataset);

console.log(`Dataset: ${datasetPath}`);
console.log(`  id: ${dataset.datasetId}`);
console.log(`  evidence: ${dataset.evidence.length}  universities: ${dataset.universities.length}  courses: ${dataset.courses.length}  course-months: ${dataset.coverage.length}`);
console.log(`  traversals: ${dataset.traversals.length}  research queue: ${dataset.researchQueue.length}`);
console.log(`  errors: ${result.errors.length}  warnings: ${result.warnings.length}`);

for (const warning of result.warnings.slice(0, 20)) console.warn(`  WARN [${warning.code}] ${warning.path}: ${warning.message}`);
for (const error of result.errors.slice(0, 50)) console.error(`  ERROR [${error.code}] ${error.path}: ${error.message}`);

if (!result.ok) {
  console.error(`\nDATASET INVALID — ${result.errors.length} error(s). Nothing may be ingested.`);
  process.exit(1);
}
console.log('\nDATASET VALID — safe to stage for Super Admin approval.');
