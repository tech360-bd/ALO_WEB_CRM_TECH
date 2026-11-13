#!/usr/bin/env tsx
/**
 * Stage a verified-catalogue dataset into the CRM.
 *
 *   npx tsx scripts/verified-catalogue/ingest.ts --dataset data/verified-2027/dataset.json --apply
 *   npx tsx scripts/verified-catalogue/ingest.ts --dry-run
 *
 * Guarantees:
 *  • validation must pass first (no partial ingest of an invalid batch),
 *  • every row lands as PENDING with a Super Admin approval-queue item,
 *  • re-running the same dataset creates no duplicates,
 *  • an already-approved value is never overwritten — a conflict revision and
 *    a CONFLICT queue item are created instead.
 *
 * Offline SQLite usage (no MySQL available):
 *   NODE_OPTIONS="--require $PWD/scripts/dev-sqlite/preload.cjs" \
 *   ALO_DB_DRIVER=sqlite DATABASE_URL="file:$PWD/prisma/dev.db" \
 *   npx tsx scripts/verified-catalogue/ingest.ts --apply
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createScriptPrisma } from './prisma-client';
import { ingestVerifiedDataset } from '../../src/lib/verified-catalogue/ingest';
import type { VerifiedDataset } from '../../src/lib/verified-catalogue/types';

function argValue(flag: string, fallback: string): string {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

async function main(): Promise<void> {
  const datasetPath = resolve(process.cwd(), argValue('--dataset', 'data/verified-2027/dataset.json'));
  const apply = !process.argv.includes('--dry-run');
  const actorUserId = argValue('--actor', 'system:verified-catalogue-ingest');
  const dataset = JSON.parse(readFileSync(datasetPath, 'utf8')) as VerifiedDataset;

  const prisma = createScriptPrisma();
  try {
    const result = await ingestVerifiedDataset(prisma, dataset, {
      apply,
      actorUserId,
      actorRole: 'SYSTEM',
      fileName: datasetPath.split('/').pop(),
    });
    console.log(JSON.stringify({
      datasetId: dataset.datasetId,
      applied: result.counts.applied,
      batchId: result.batchId,
      counts: result.counts,
      conflicts: result.conflicts,
      warnings: result.warnings,
    }, null, 2));
    if (!apply) console.log('\nDRY RUN — no rows were written.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
