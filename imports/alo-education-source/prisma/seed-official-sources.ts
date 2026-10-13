import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

const GOVERNMENT_SOURCES = [
  // UK
  { sourceUrl: 'https://www.gov.uk/student-visa', sourceName: 'UKVI - Student Visa', countrySlug: 'uk', entityType: 'GOVERNMENT', sourceType: 'GOVERNMENT' },
  { sourceUrl: 'https://www.ucas.com', sourceName: 'UCAS - Universities and Colleges Admissions Service', countrySlug: 'uk', entityType: 'GOVERNMENT', sourceType: 'GOVERNMENT' },
  // Australia
  { sourceUrl: 'https://immi.homeaffairs.gov.au', sourceName: 'Dept of Home Affairs - Australia Immigration', countrySlug: 'australia', entityType: 'GOVERNMENT', sourceType: 'GOVERNMENT' },
  // Canada
  { sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship.html', sourceName: 'IRCC - Immigration, Refugees and Citizenship Canada', countrySlug: 'canada', entityType: 'GOVERNMENT', sourceType: 'GOVERNMENT' },
  // USA
  { sourceUrl: 'https://studyinthestates.dos.gov', sourceName: 'Dept of State - Study in the States', countrySlug: 'usa', entityType: 'GOVERNMENT', sourceType: 'GOVERNMENT' },
  // Germany
  { sourceUrl: 'https://www.daad.de/en', sourceName: 'DAAD - German Academic Exchange Service', countrySlug: 'germany', entityType: 'GOVERNMENT', sourceType: 'GOVERNMENT' },
  // Ireland
  { sourceUrl: 'https://www.irishimmigration.ie', sourceName: 'Irish Immigration - INIS', countrySlug: 'ireland', entityType: 'GOVERNMENT', sourceType: 'GOVERNMENT' },
  // New Zealand
  { sourceUrl: 'https://www.immigration.govt.nz', sourceName: 'Immigration New Zealand', countrySlug: 'new-zealand', entityType: 'GOVERNMENT', sourceType: 'GOVERNMENT' },
  // Malaysia
  { sourceUrl: 'https://www.mqa.gov.my', sourceName: 'MQA - Malaysian Qualifications Agency', countrySlug: 'malaysia', entityType: 'GOVERNMENT', sourceType: 'GOVERNMENT' },
  // Malta
  { sourceUrl: 'https://education.gov.mt', sourceName: 'Malta Ministry for Education', countrySlug: 'malta', entityType: 'GOVERNMENT', sourceType: 'GOVERNMENT' },
  // Cyprus
  { sourceUrl: 'https://www.moe.gov.cy', sourceName: 'Cyprus Ministry of Education', countrySlug: 'cyprus', entityType: 'GOVERNMENT', sourceType: 'GOVERNMENT' },
  // South Korea
  { sourceUrl: 'https://www.studyinkorea.go.kr', sourceName: 'Study in Korea - Gov Portal', countrySlug: 'south-korea', entityType: 'GOVERNMENT', sourceType: 'GOVERNMENT' },
];

async function main() {
  console.log('🚀 Seeding OfficialSource records...');

  // 1. Seed university official websites
  const universities = await db.universityPage.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      name: true,
      slug: true,
      countrySlug: true,
      officialWebsite: true,
      sourceUrl: true,
    },
  });

  let uniCreated = 0;
  let uniSkipped = 0;

  for (const uni of universities) {
    const url = uni.officialWebsite || uni.sourceUrl;
    if (!url) {
      uniSkipped++;
      continue;
    }

    try {
      await db.officialSource.create({
        data: {
          sourceUrl: url,
          sourceName: `${uni.name} Official Website`,
          sourceType: 'UNIVERSITY',
          entityType: 'UNIVERSITY',
          universitySlug: uni.slug,
          countrySlug: uni.countrySlug,
          priority: 1,
          trustLevel: 'PRIMARY',
          monitoringEnabled: true,
          status: 'ACTIVE',
        },
      });
      uniCreated++;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        uniSkipped++;
      } else {
        console.error(`  ❌ Error for ${uni.name}: ${e.message}`);
        uniSkipped++;
      }
    }
  }

  console.log(`  University sources: ${uniCreated} created, ${uniSkipped} skipped (no URL or duplicate)`);

  // 2. Seed government sources
  let govCreated = 0;
  let govSkipped = 0;

  for (const gov of GOVERNMENT_SOURCES) {
    try {
      await db.officialSource.create({
        data: {
          sourceUrl: gov.sourceUrl,
          sourceName: gov.sourceName,
          sourceType: gov.sourceType,
          entityType: gov.entityType,
          countrySlug: gov.countrySlug,
          priority: 2,
          trustLevel: 'PRIMARY',
          monitoringEnabled: true,
          status: 'ACTIVE',
        },
      });
      govCreated++;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        govSkipped++;
      } else {
        console.error(`  ❌ Error for ${gov.sourceName}: ${e.message}`);
        govSkipped++;
      }
    }
  }

  console.log(`  Government sources: ${govCreated} created, ${govSkipped} skipped (duplicate)`);
  console.log(`✅ Done! Total: ${uniCreated + govCreated} OfficialSource records created.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
