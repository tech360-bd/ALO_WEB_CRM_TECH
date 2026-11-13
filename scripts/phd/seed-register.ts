/**
 * Seeds the 27-institution UK PhD register.
 *
 * Safety properties:
 *   - idempotent: safe to run repeatedly;
 *   - never deletes or renames an existing record;
 *   - never upgrades a record to VERIFIED_OFFICIAL (only a human verifier can);
 *   - reports (but does not remove) register rows that no longer appear in the
 *     shipped list, so a silent removal cannot happen unnoticed.
 *
 * Run:
 *   npx tsx scripts/phd/seed-register.ts
 *   ALO_DB_DRIVER=sqlite DATABASE_URL="file:$PWD/.phd-tmp/phd-test.db" npx tsx scripts/phd/seed-register.ts
 */
import { db } from '../../src/lib/db';
import { REGISTER_RETRIEVAL_DATE, TARGET_INSTITUTIONS, assertRegisterIntegrity } from '../../src/lib/phd/data/institutions';
import { REGENT_UNIVERSITY_LONDON } from '../../src/lib/phd/constants';

async function main() {
  assertRegisterIntegrity();
  const retrievedAt = new Date(`${REGISTER_RETRIEVAL_DATE}T00:00:00.000Z`);
  let created = 0;
  let existing = 0;
  const drifted: string[] = [];

  for (const entry of TARGET_INSTITUTIONS) {
    const present = await db.phdUniversity.findUnique({ where: { registerId: entry.registerId } });
    if (present) {
      existing += 1;
      if (present.name !== entry.name || present.officialDomain !== entry.officialDomain) {
        drifted.push(`${entry.registerId}: stored "${present.name}" (${present.officialDomain}) differs from register "${entry.name}" (${entry.officialDomain})`);
      }
      // Preserve the original name/slug (immutability) but refresh retrieval
      // provenance and fill any missing URL rather than overwriting verified data.
      await db.phdUniversity.update({
        where: { registerId: entry.registerId },
        data: {
          sourceRetrievedAt: retrievedAt,
          researchDegreesUrl: present.researchDegreesUrl || entry.researchDegreesUrl,
          researchDegreesPageTitle: present.researchDegreesPageTitle || entry.researchDegreesPageTitle,
          targetListRank: entry.rank,
        },
      });
      continue;
    }
    await db.phdUniversity.create({
      data: {
        registerId: entry.registerId,
        slug: entry.slug,
        name: entry.name,
        officialDomain: entry.officialDomain,
        officialHomepage: entry.officialHomepage,
        country: 'United Kingdom',
        researchDegreesUrl: entry.researchDegreesUrl,
        researchDegreesPageTitle: entry.researchDegreesPageTitle,
        // Desk research located the page; the claim itself is not yet verified.
        researchDegreesStatus: 'NOT_YET_VERIFIED',
        lastVerifiedAt: null,
        sourceRetrievedAt: retrievedAt,
        targetListRank: entry.rank,
        registerProvenance: 'SEEDED_TARGET_REGISTER',
        notes: [
          entry.note,
          `Official page located ${REGISTER_RETRIEVAL_DATE}; second-reviewer verification and archival are still required before this row may be marked VERIFIED_OFFICIAL.`,
        ].filter(Boolean).join(' '),
      },
    });
    created += 1;
  }

  // Institutional register rows absent from the shipped list are reported, not
  // deleted. The only rows this script owns are SEEDED_TARGET_REGISTER rows with
  // a UK-PHD-* id.
  const shippedIds = new Set(TARGET_INSTITUTIONS.map((entry) => entry.registerId));
  const unlisted = await db.phdUniversity.findMany({
    where: { registerProvenance: 'SEEDED_TARGET_REGISTER' },
    select: { registerId: true, name: true },
  });
  const removedFromList = unlisted.filter((row) => row.registerId.startsWith('UK-PHD-') && !shippedIds.has(row.registerId));

  // Regent's University London: excluded from the commission-eligible PhD list
  // by the supplied Spring 2027 structure. The PDF itself is not present in this
  // environment, so the row is recorded as excluded-but-unverified rather than
  // fabricating page numbers or rates.
  const regents = await db.phdCommissionAgreement.findUnique({ where: { universityNameRaw: REGENT_UNIVERSITY_LONDON } });
  if (!regents) {
    await db.phdCommissionAgreement.create({
      data: {
        universityNameRaw: REGENT_UNIVERSITY_LONDON,
        phdCommissionStatus: 'EXCLUDED_BY_SUPPLIED_STRUCTURE',
        reason:
          'Excluded from the commission-eligible PhD list by the supplied Spring 2027 commission structure. The source PDF is not present in this build environment, so no page citation, rate or clause is asserted here. Upload the document and cite the exclusion page before treating this as verified.',
        exactWording: '',
        reviewRequired: true,
      },
    });
  }

  const total = await db.phdUniversity.count();
  console.log(JSON.stringify({
    registerEntries: TARGET_INSTITUTIONS.length,
    created,
    existing,
    databaseUniversities: total,
    drifted,
    removedFromList,
    regentsExclusionSeeded: true,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
