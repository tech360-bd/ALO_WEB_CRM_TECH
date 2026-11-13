#!/usr/bin/env tsx
/**
 * WHY IS MY DATA NOT ON THE WEBSITE? — public catalogue funnel diagnostic.
 *
 *   npx tsx scripts/diagnose-public-catalogue.ts            # read-only report
 *   npx tsx scripts/diagnose-public-catalogue.ts --json      # machine-readable
 *   npx tsx scripts/diagnose-public-catalogue.ts --apply     # repair legacy rows
 *
 * The public website, /course-finder and /courses read the SAME database, but
 * they only display records that satisfy `publicUniversityWhere()` /
 * `publicCourseWhere()` (see src/lib/public-catalog.ts):
 *
 *   status = 'active'
 *   AND verificationStatus = 'VERIFIED'
 *   AND publicationStatus = 'published'
 *   AND sourceUrl or officialUrl starts with https://
 *   AND (courses) the parent university is public too
 *   AND (courses) internationalEligibility is not "closed"/"domestic only"
 *
 * Every counter below is a gate from that rule, so the drop-off between two
 * lines is exactly the reason those rows are invisible. Nothing is invented:
 * when the database is unreachable the script fails loudly instead of printing
 * zeroes.
 *
 * `--apply` repairs the two writer bugs that leave already-approved data
 * invisible (it never marks anything verified and never publishes a draft):
 *   1. records published by the verified-catalogue approval flow were written
 *      with status 'published_verified' instead of 'active';
 *   2. records staged by that flow kept 'verified_pending_approval' after the
 *      parent university was published.
 * Use `--normalize-verification` ONLY if your team accepts that the legacy
 * labels 'VERIFIED_OFFICIAL' / 'CROSS_SOURCE_VERIFIED' mean the same thing as
 * the canonical 'VERIFIED'; it rewrites those labels so such rows can pass the
 * public gate.
 */
import { PrismaClient } from '@prisma/client';
import { createScriptPrisma } from './verified-catalogue/prisma-client';
import {
  publicCourseWhere,
  publicUniversityWhere,
  publicIntakeWhere,
  publicRequirementWhere,
} from '../src/lib/public-catalog';

type Row = Record<string, any>;

const VERIFIED_LABELS = [
  'VERIFIED', 'verified',
  'VERIFIED_RECENT', 'verified_recent',
  'VERIFIED_OFFICIAL', 'verified_official',
  'CROSS_SOURCE_VERIFIED', 'cross_source_verified',
];
const CANONICAL_VERIFIED = 'VERIFIED';
const LEGACY_VERIFIED_LABELS = ['VERIFIED_OFFICIAL', 'verified_official', 'CROSS_SOURCE_VERIFIED', 'cross_source_verified'];
/** Statuses written by the approval flow that are not 'active'. */
const NON_CANONICAL_PUBLISHED_STATUSES = ['published_verified', 'verified_pending_approval', 'published'];

const json = process.argv.includes('--json');
const apply = process.argv.includes('--apply');
const normalizeVerification = process.argv.includes('--normalize-verification');

function say(line = '') {
  if (!json) console.log(line);
}

function pct(part: number, whole: number): string {
  if (!whole) return '—';
  return `${((part / whole) * 100).toFixed(1)}%`;
}

function bar(part: number, whole: number): string {
  const filled = whole ? Math.round((part / whole) * 24) : 0;
  return `${'█'.repeat(filled)}${'·'.repeat(24 - filled)}`;
}

/** Counts one gate at a time, each applied on top of the previous ones. */
async function funnel(
  label: string,
  total: number,
  gates: Array<{ name: string; where: Record<string, unknown>; count: (where: any) => Promise<number> }>,
): Promise<{ label: string; total: number; steps: Array<{ name: string; count: number }> }> {
  const steps: Array<{ name: string; count: number }> = [];
  let cumulative: Record<string, any> = { AND: [] };
  for (const gate of gates) {
    cumulative = { AND: [...(cumulative.AND as any[]), gate.where] };
    const count = await gate.count(cumulative);
    steps.push({ name: gate.name, count });
  }
  if (!json) {
    say(`\n${label} — ${total} row(s) in the database`);
    say(`  ${'everything'.padEnd(46)} ${String(total).padStart(8)}  100.0%`);
    for (const step of steps) {
      say(`  ${step.name.padEnd(46)} ${String(step.count).padStart(8)}  ${pct(step.count, total).padStart(5)}  ${bar(step.count, total)}`);
    }
    const final = steps.length ? steps[steps.length - 1].count : total;
    say(`  => visible to the public: ${final} of ${total} (${pct(final, total)})`);
  }
  return { label, total, steps };
}

async function main(): Promise<void> {
  const prisma: PrismaClient = createScriptPrisma();
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    console.error('Database is not reachable:', error instanceof Error ? error.message : error);
    console.error('Set DATABASE_URL (see .env.example) before running this report.');
    await prisma.$disconnect();
    process.exitCode = 1;
    return;
  }

  const hasSource = {
    OR: [{ sourceUrl: { startsWith: 'https://' } }, { officialUrl: { startsWith: 'https://' } }],
  };

  try {
    // ── Sanity: what vocabulary does this database actually use? ────────────
    const [uniVerification, uniPublication, uniStatus, crsVerification, crsPublication, crsStatus] = await Promise.all([
      prisma.crmUniversity.groupBy({ by: ['verificationStatus'], _count: { _all: true } }),
      prisma.crmUniversity.groupBy({ by: ['publicationStatus'], _count: { _all: true } }),
      prisma.crmUniversity.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.crmCourse.groupBy({ by: ['verificationStatus'], _count: { _all: true } }),
      prisma.crmCourse.groupBy({ by: ['publicationStatus'], _count: { _all: true } }),
      prisma.crmCourse.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const toMap = (rows: Row[], key: string) =>
      Object.fromEntries(rows.map((row) => [row[key] || '(empty)', row._count._all]));

    const vocabulary = {
      university: {
        verificationStatus: toMap(uniVerification as Row[], 'verificationStatus'),
        publicationStatus: toMap(uniPublication as Row[], 'publicationStatus'),
        status: toMap(uniStatus as Row[], 'status'),
      },
      course: {
        verificationStatus: toMap(crsVerification as Row[], 'verificationStatus'),
        publicationStatus: toMap(crsPublication as Row[], 'publicationStatus'),
        status: toMap(crsStatus as Row[], 'status'),
      },
    };

    if (!json) {
      say('============================================================');
      say('ALO — PUBLIC CATALOGUE FUNNEL (why records are not on the site)');
      say('============================================================');
      say(`Database: ${String(process.env.DATABASE_URL || '').replace(/\/\/[^@]*@/, '//***@')}`);
      say(`Run at  : ${new Date().toISOString()}`);
      say('\nSTORED VOCABULARY');
      for (const entity of ['university', 'course'] as const) {
        for (const field of ['verificationStatus', 'publicationStatus', 'status'] as const) {
          const entries = Object.entries(vocabulary[entity][field]).sort((a, b) => b[1] - a[1]);
          say(`  ${`${entity}.${field}`.padEnd(34)} ${entries.map(([value, count]) => `${value}=${count}`).join('  ')}`);
        }
      }
      say('\nPUBLIC RULE (src/lib/public-catalog.ts)');
      say("  status='active' AND verificationStatus='VERIFIED' AND publicationStatus='published'");
      say('  AND (sourceUrl|officialUrl) starts with https://  [+ parent university public]');
    }

    const totalUni = await prisma.crmUniversity.count();
    const totalCrs = await prisma.crmCourse.count();

    const uniFunnel = await funnel('UNIVERSITIES', totalUni, [
      { name: "status = 'active'", where: { status: 'active' }, count: (w) => prisma.crmUniversity.count({ where: w }) },
      { name: "verificationStatus = 'VERIFIED'", where: { verificationStatus: CANONICAL_VERIFIED }, count: (w) => prisma.crmUniversity.count({ where: w }) },
      { name: "publicationStatus = 'published'", where: { publicationStatus: { in: ['published', 'PUBLISHED'] } }, count: (w) => prisma.crmUniversity.count({ where: w }) },
      { name: 'sourceUrl / officialUrl is https', where: hasSource, count: (w) => prisma.crmUniversity.count({ where: w }) },
    ]);

    const crsFunnel = await funnel('COURSES', totalCrs, [
      { name: "status = 'active'", where: { status: 'active' }, count: (w) => prisma.crmCourse.count({ where: w }) },
      { name: "verificationStatus = 'VERIFIED'", where: { verificationStatus: CANONICAL_VERIFIED }, count: (w) => prisma.crmCourse.count({ where: w }) },
      { name: "publicationStatus = 'published'", where: { publicationStatus: { in: ['published', 'PUBLISHED'] } }, count: (w) => prisma.crmCourse.count({ where: w }) },
      { name: 'sourceUrl / officialUrl is https', where: hasSource, count: (w) => prisma.crmCourse.count({ where: w }) },
      {
        name: 'internationally eligible (not closed/domestic)',
        where: { OR: [{ internationalEligibility: null }, { internationalEligibility: '' }, { NOT: { internationalEligibility: { in: ['closed', 'CLOSED', 'domestic', 'DOMESTIC', 'domestic_only', 'HOME_ONLY'] } } }] },
        count: (w) => prisma.crmCourse.count({ where: w }),
      },
      { name: 'parent university is public', where: { university: { is: publicUniversityWhere() } }, count: (w) => prisma.crmCourse.count({ where: w }) },
    ]);

    // The authoritative numbers, from the same helpers the API uses.
    const [publicUni, publicCrs, publicIntakes, publicRequirements] = await Promise.all([
      prisma.crmUniversity.count({ where: publicUniversityWhere() as any }),
      prisma.crmCourse.count({ where: publicCourseWhere() as any }),
      prisma.crmCourseIntakeFee.count({ where: { ...(publicIntakeWhere() as any), course: { is: publicCourseWhere() as any } } }),
      prisma.crmCourseRequirement.count({ where: { ...(publicRequirementWhere() as any), course: { is: publicCourseWhere() as any } } }),
    ]);
    const [totalIntakes, totalRequirements] = await Promise.all([
      prisma.crmCourseIntakeFee.count(),
      prisma.crmCourseRequirement.count(),
    ]);

    // ── Diagnose the two known writer bugs + the legacy vocabulary ──────────
    const publishedButNotActive = await Promise.all([
      prisma.crmUniversity.count({ where: { publicationStatus: { in: ['published', 'PUBLISHED'] }, status: { in: NON_CANONICAL_PUBLISHED_STATUSES } } }),
      prisma.crmCourse.count({ where: { publicationStatus: { in: ['published', 'PUBLISHED'] }, status: { in: NON_CANONICAL_PUBLISHED_STATUSES } } }),
    ]);
    const legacyVerified = await Promise.all([
      prisma.crmUniversity.count({ where: { verificationStatus: { in: LEGACY_VERIFIED_LABELS } } }),
      prisma.crmCourse.count({ where: { verificationStatus: { in: LEGACY_VERIFIED_LABELS } } }),
    ]);
    const verifiedButDraft = await Promise.all([
      prisma.crmUniversity.count({ where: { status: 'active', verificationStatus: { in: VERIFIED_LABELS }, publicationStatus: { notIn: ['published', 'PUBLISHED'] } } }),
      prisma.crmCourse.count({ where: { status: 'active', verificationStatus: { in: VERIFIED_LABELS }, publicationStatus: { notIn: ['published', 'PUBLISHED'] } } }),
    ]);
    const unverified = await Promise.all([
      prisma.crmUniversity.count({ where: { verificationStatus: { notIn: VERIFIED_LABELS } } }),
      prisma.crmCourse.count({ where: { verificationStatus: { notIn: VERIFIED_LABELS } } }),
    ]);
    const noSource = await Promise.all([
      prisma.crmUniversity.count({ where: { NOT: { OR: [{ sourceUrl: { startsWith: 'https://' } }, { officialUrl: { startsWith: 'https://' } }] } } }),
      prisma.crmCourse.count({ where: { NOT: { OR: [{ sourceUrl: { startsWith: 'https://' } }, { officialUrl: { startsWith: 'https://' } }] } } }),
    ]);

    const blockers = {
      university: {
        total: totalUni,
        publiclyVisible: publicUni,
        notVerified: unverified[0],
        verifiedButDraft: verifiedButDraft[0],
        publishedButStatusNotActive: publishedButNotActive[0],
        legacyVerifiedLabel: legacyVerified[0],
        noHttpsSource: noSource[0],
      },
      course: {
        total: totalCrs,
        publiclyVisible: publicCrs,
        notVerified: unverified[1],
        verifiedButDraft: verifiedButDraft[1],
        publishedButStatusNotActive: publishedButNotActive[1],
        legacyVerifiedLabel: legacyVerified[1],
        noHttpsSource: noSource[1],
      },
      intake: { total: totalIntakes, publiclyVisible: publicIntakes },
      requirement: { total: totalRequirements, publiclyVisible: publicRequirements },
    };

    if (!json) {
      say('\nBLOCKERS (a row can appear in more than one line)');
      for (const entity of ['university', 'course'] as const) {
        const b = blockers[entity];
        say(`  ${entity.toUpperCase()}`);
        say(`    not marked verified at all ........................ ${String(b.notVerified).padStart(8)}  -> verify from official sources`);
        say(`    verified label not 'VERIFIED' (legacy) ............ ${String(b.legacyVerifiedLabel).padStart(8)}  -> --normalize-verification`);
        say(`    verified + active but publicationStatus=draft ..... ${String(b.verifiedButDraft).padStart(8)}  -> needs an approval/publish step`);
        say(`    published but status is not 'active' .............. ${String(b.publishedButStatusNotActive).padStart(8)}  -> --apply (approval-flow bug)`);
        say(`    no https source URL ............................... ${String(b.noHttpsSource).padStart(8)}  -> add the official URL`);
      }
      say('\nWHAT THE SITE CAN SHOW RIGHT NOW');
      say(`  universities ................. ${publicUni} of ${totalUni}`);
      say(`  courses ...................... ${publicCrs} of ${totalCrs}`);
      say(`  intake/fee rows .............. ${publicIntakes} of ${totalIntakes}`);
      say(`  entry requirements ........... ${publicRequirements} of ${totalRequirements}`);
      say('  (fees, intake dates and IELTS minimums are hidden unless their OWN row is');
      say('   verified with an https source, so a visible course can still show "not published")');
    }

    // ── Repair mode ─────────────────────────────────────────────────────────
    let repairs: Record<string, number> = {};
    if (apply) {
      const uniRepair = await prisma.crmUniversity.updateMany({
        where: { publicationStatus: { in: ['published', 'PUBLISHED'] }, status: { in: NON_CANONICAL_PUBLISHED_STATUSES } },
        data: { status: 'active' },
      });
      const crsRepair = await prisma.crmCourse.updateMany({
        where: { publicationStatus: { in: ['published', 'PUBLISHED'] }, status: { in: NON_CANONICAL_PUBLISHED_STATUSES } },
        data: { status: 'active' },
      });
      repairs = { universitiesStatusFixed: uniRepair.count, coursesStatusFixed: crsRepair.count };

      if (normalizeVerification) {
        const uniVerify = await prisma.crmUniversity.updateMany({
          where: { verificationStatus: { in: LEGACY_VERIFIED_LABELS } },
          data: { verificationStatus: CANONICAL_VERIFIED },
        });
        const crsVerify = await prisma.crmCourse.updateMany({
          where: { verificationStatus: { in: LEGACY_VERIFIED_LABELS } },
          data: { verificationStatus: CANONICAL_VERIFIED },
        });
        mergeCounts(repairs, { universitiesVerificationNormalised: uniVerify.count, coursesVerificationNormalised: crsVerify.count });
      }

      await prisma.crmAuditLog.create({
        data: {
          actorUserId: 'system:diagnose-public-catalogue',
          actorRole: 'SYSTEM',
          action: 'PUBLIC_CATALOGUE_REPAIR',
          targetCollection: 'CrmUniversity/CrmCourse',
          targetId: `REPAIR-${Date.now()}`,
          afterData: JSON.stringify({ ...repairs, normalizeVerification }),
        },
      }).catch(() => undefined);

      if (!json) {
        say('\nREPAIR APPLIED');
        for (const [key, value] of Object.entries(repairs)) say(`  ${key}: ${value}`);
        say('  Re-run without --apply to see the new funnel.');
      }
    } else if (!json) {
      say('\nNo rows were changed. Repair options:');
      say('  --apply                     status fixes for rows the approval flow already published');
      say('  --apply --normalize-verification   also map VERIFIED_OFFICIAL/CROSS_SOURCE_VERIFIED to VERIFIED');
    }

    if (json) {
      console.log(JSON.stringify({ generatedAt: new Date().toISOString(), vocabulary, funnels: [uniFunnel, crsFunnel], blockers, repairs, applied: apply }, null, 2));
    }
  } finally {
    await prisma.$disconnect();
  }
}

function mergeCounts(target: Record<string, number>, extra: Record<string, number>): void {
  Object.assign(target, extra);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
