#!/usr/bin/env tsx
/**
 * Super Admin decision CLI for staged verified-catalogue data.
 *
 *   # approve everything that is pending (actor must be a real SUPER_ADMIN user)
 *   npx tsx scripts/verified-catalogue/decide.ts --actor <portalUserId> --approve-all
 *
 *   # approve / reject specific course-months
 *   npx tsx scripts/verified-catalogue/decide.ts --actor <portalUserId> --approve 2027-01:centennial-biotechnology-fast-track
 *   npx tsx scripts/verified-catalogue/decide.ts --actor <portalUserId> --reject 2027-09:manchester-msc-accounting --reason "fee source superseded"
 *
 * RBAC is enforced in the library by resolving the actor's role from the
 * database — passing an id of a non-admin user fails with exit code 1.
 */
import { createScriptPrisma } from './prisma-client';
import { approveCoverage, rejectCoverage, AuthorizationError } from '../../src/lib/verified-catalogue/publish';

function argValue(flag: string, fallback = ''): string {
  const index = process.argv.indexOf(flag);
  return index >= 0 && process.argv[index + 1] ? process.argv[index + 1] : fallback;
}

function collect(flag: string): string[] {
  const values: string[] = [];
  process.argv.forEach((arg, index) => {
    if (arg === flag && process.argv[index + 1]) values.push(process.argv[index + 1]);
  });
  return values;
}

/** Accept both "2027-01:course-slug" and "course-slug:2027-01". */
function toCoverageKey(value: string): string {
  const [a, b] = value.split(':');
  if (!a || !b) return value;
  return /^\d{4}-\d{2}$/.test(a) ? `${b}:${a}` : `${a}:${b}`;
}

async function main(): Promise<void> {
  const actorUserId = argValue('--actor');
  if (!actorUserId) {
    console.error('Missing --actor <portalUserId>. Decisions must be attributable to a Super Admin.');
    process.exit(2);
  }
  const approve = collect('--approve').map(toCoverageKey);
  const reject = collect('--reject').map(toCoverageKey);
  const approveAll = process.argv.includes('--approve-all');
  const rejectAll = process.argv.includes('--reject-all');
  const reason = argValue('--reason', 'Super Admin decision');

  if (!approve.length && !reject.length && !approveAll && !rejectAll) {
    console.error('Nothing to do: pass --approve <key>, --reject <key>, --approve-all or --reject-all.');
    process.exit(2);
  }

  const prisma = createScriptPrisma();
  try {
    const output: Record<string, unknown> = {};
    if (approve.length || approveAll) {
      output.approved = await approveCoverage(prisma, {
        actorUserId,
        coverageKeys: approve.length ? approve : undefined,
        approveAllPending: approveAll,
        note: reason,
      });
    }
    if (reject.length || rejectAll) {
      output.rejected = await rejectCoverage(prisma, {
        actorUserId,
        coverageKeys: reject.length ? reject : undefined,
        reason,
      });
    }
    console.log(JSON.stringify(output, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  if (error instanceof AuthorizationError) {
    console.error(`DENIED: ${error.message}`);
    process.exit(1);
  }
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
