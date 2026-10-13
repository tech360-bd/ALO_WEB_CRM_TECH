// ALO Education — University Data Monitoring Seed (Task 21)
// Seeds the monitoring job, registers official sources for REAL universities,
// and flags fabricated source URLs for review. Idempotent via upsert.

import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

// Patterns that indicate a fabricated source URL (from the old seed-massive script)
const FABRICATED_PATTERNS = [
  /dkuniversity\d+\.ac\.uk/i,
  /aeuniversity\d+\.ac\.uk/i,
  /usuniversity\d+\.ac\.uk/i,
  /cauniversity\d+\.ac\.uk/i,
  /auuniversity\d+\.ac\.uk/i,
  /ieuniversity\d+\.ac\.uk/i,
  /nzuniversity\d+\.ac\.uk/i,
  /deuniversity\d+\.ac\.uk/i,
  /jpuniversity\d+\.ac\.uk/i,
  /kruniversity\d+\.ac\.uk/i,
  /myuniversity\d+\.ac\.uk/i,
  /euuniversity\d+\.ac\.uk/i,
];

function isFabricatedSource(url: string | null | undefined): boolean {
  if (!url) return true;
  return FABRICATED_PATTERNS.some((p) => p.test(url));
}

// Official government / authority sources to monitor per country
const GOVERNMENT_SOURCES = [
  // UK
  { countrySlug: "uk", url: "https://www.gov.uk/student-visa", name: "UK Government — Student Visa", sourceType: "GOVERNMENT", category: "VISAS", priority: 2 },
  { countrySlug: "uk", url: "https://www.gov.uk/government/organisations/uk-visas-and-immigration", name: "UKVI — UK Visas and Immigration", sourceType: "GOVERNMENT", category: "VISAS", priority: 2 },
  { countrySlug: "uk", url: "https://www.ucas.com/", name: "UCAS — Universities and Colleges Admissions Service", sourceType: "AUTHORITY", category: "ADMISSIONS", priority: 3 },
  // Canada
  { countrySlug: "canada", url: "https://www.canada.ca/en/immigration-refugees-citizenship/services/study-canada.html", name: "IRCC — Study in Canada", sourceType: "GOVERNMENT", category: "VISAS", priority: 2 },
  { countrySlug: "canada", url: "https://www.educanada.ca/", name: "EduCanada — Official Study Portal", sourceType: "AUTHORITY", category: "ADMISSIONS", priority: 3 },
  // Australia
  { countrySlug: "australia", url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/student-500", name: "Department of Home Affairs — Student Visa (subclass 500)", sourceType: "GOVERNMENT", category: "VISAS", priority: 2 },
  { countrySlug: "australia", url: "https://cricos.education.gov.au/", name: "CRICOS — Commonwealth Register of Institutions and Courses", sourceType: "AUTHORITY", category: "ADMISSIONS", priority: 3 },
  // New Zealand
  { countrySlug: "new-zealand", url: "https://www.immigration.govt.nz/new-zealand-visas/visas/visa/student-visa", name: "Immigration New Zealand — Student Visa", sourceType: "GOVERNMENT", category: "VISAS", priority: 2 },
  { countrySlug: "new-zealand", url: "https://www.nzqa.govt.nz/", name: "NZQA — New Zealand Qualifications Authority", sourceType: "AUTHORITY", category: "ADMISSIONS", priority: 3 },
  // USA
  { countrySlug: "usa", url: "https://www.ice.gov/sevis", name: "SEVP / SEVIS — Student and Exchange Visitor Program", sourceType: "GOVERNMENT", category: "VISAS", priority: 2 },
  { countrySlug: "usa", url: "https://travel.state.gov/content/travel/en/us-visas/study.html", name: "U.S. Department of State — Student Visas", sourceType: "GOVERNMENT", category: "VISAS", priority: 2 },
  // Ireland
  { countrySlug: "ireland", url: "https://www.irishimmigration.ie/", name: "Irish Immigration — Long Stay Study Visas", sourceType: "GOVERNMENT", category: "VISAS", priority: 2 },
  { countrySlug: "ireland", url: "https://www.qqi.ie/", name: "QQI — Quality and Qualifications Ireland", sourceType: "AUTHORITY", category: "ADMISSIONS", priority: 3 },
  // Germany
  { countrySlug: "germany", url: "https://www.daad.de/en/", name: "DAAD — German Academic Exchange Service", sourceType: "AUTHORITY", category: "ADMISSIONS", priority: 3 },
  { countrySlug: "germany", url: "https://www.make-it-in-germany.com/en/visa/kinds-of-visa/studying", name: "Make it in Germany — Student Visa", sourceType: "GOVERNMENT", category: "VISAS", priority: 2 },
  // UAE / Dubai
  { countrySlug: "dubai", url: "https://www.khda.gov.ae/en/", name: "KHDA — Knowledge and Human Development Authority (Dubai)", sourceType: "AUTHORITY", category: "ADMISSIONS", priority: 3 },
  { countrySlug: "dubai", url: "https://u.ae/en/information-and-services/education/higher-education", name: "UAE Government — Higher Education", sourceType: "GOVERNMENT", category: "ADMISSIONS", priority: 2 },
  // Malaysia
  { countrySlug: "malaysia", url: "https://www.mqa.gov.my/", name: "MQA — Malaysian Qualifications Agency", sourceType: "AUTHORITY", category: "ADMISSIONS", priority: 3 },
  { countrySlug: "malaysia", url: "https://educationmalaysia.gov.my/", name: "Education Malaysia — Official Portal", sourceType: "AUTHORITY", category: "ADMISSIONS", priority: 3 },
  // Denmark
  { countrySlug: "denmark", url: "https://ufm.dk/en/education/recognition-and-transparency", name: "Danish Agency for Higher Education — Recognition", sourceType: "AUTHORITY", category: "ADMISSIONS", priority: 3 },
  { countrySlug: "denmark", url: "https://www.nyidanmark.dk/en-GB/You-want-to-apply/Higher-education", name: "New to Denmark — Higher Education Visa", sourceType: "GOVERNMENT", category: "VISAS", priority: 2 },
  // Japan
  { countrySlug: "japan", url: "https://www.jasso.go.jp/en/", name: "JASSO — Japan Student Services Organization", sourceType: "AUTHORITY", category: "ADMISSIONS", priority: 3 },
  { countrySlug: "japan", url: "https://www.mext.go.jp/en/", name: "MEXT — Ministry of Education, Culture, Sports, Science and Technology", sourceType: "GOVERNMENT", category: "ADMISSIONS", priority: 2 },
  // South Korea
  { countrySlug: "south-korea", url: "https://www.studyinkorea.go.kr/en/", name: "Study in Korea — Official Portal", sourceType: "AUTHORITY", category: "ADMISSIONS", priority: 3 },
  // Europe (Schengen)
  { countrySlug: "europe", url: "https://europa.eu/youreurope/citizens/education/university/admission-entry-conditions/index_en.htm", name: "Your Europe — University Admission Conditions", sourceType: "AUTHORITY", category: "ADMISSIONS", priority: 3 },
];

// Known official sources for REAL universities (manually verified list of top universities)
// This is a curated list — the monitoring system will expand it over time.
const KNOWN_OFFICIAL_UNIVERSITIES: Array<{ slug: string; name: string; country: string; officialUrl: string; city: string }> = [
  // UK
  { slug: "university-of-oxford", name: "University of Oxford", country: "uk", officialUrl: "https://www.ox.ac.uk/", city: "Oxford" },
  { slug: "university-of-cambridge", name: "University of Cambridge", country: "uk", officialUrl: "https://www.cam.ac.uk/", city: "Cambridge" },
  { slug: "imperial-college-london", name: "Imperial College London", country: "uk", officialUrl: "https://www.imperial.ac.uk/", city: "London" },
  { slug: "ucl", name: "University College London", country: "uk", officialUrl: "https://www.ucl.ac.uk/", city: "London" },
  { slug: "university-of-edinburgh", name: "University of Edinburgh", country: "uk", officialUrl: "https://www.ed.ac.uk/", city: "Edinburgh" },
  { slug: "university-of-manchester", name: "University of Manchester", country: "uk", officialUrl: "https://www.manchester.ac.uk/", city: "Manchester" },
  { slug: "kings-college-london", name: "King's College London", country: "uk", officialUrl: "https://www.kcl.ac.uk/", city: "London" },
  { slug: "lse", name: "London School of Economics and Political Science", country: "uk", officialUrl: "https://www.lse.ac.uk/", city: "London" },
  { slug: "university-of-bristol", name: "University of Bristol", country: "uk", officialUrl: "https://www.bristol.ac.uk/", city: "Bristol" },
  { slug: "university-of-warwick", name: "University of Warwick", country: "uk", officialUrl: "https://warwick.ac.uk/", city: "Coventry" },
  { slug: "university-of-glasgow", name: "University of Glasgow", country: "uk", officialUrl: "https://www.gla.ac.uk/", city: "Glasgow" },
  { slug: "university-of-leeds", name: "University of Leeds", country: "uk", officialUrl: "https://www.leeds.ac.uk/", city: "Leeds" },
  { slug: "university-of-birmingham", name: "University of Birmingham", country: "uk", officialUrl: "https://www.birmingham.ac.uk/", city: "Birmingham" },
  { slug: "university-of-southampton", name: "University of Southampton", country: "uk", officialUrl: "https://www.southampton.ac.uk/", city: "Southampton" },
  { slug: "university-of-sheffield", name: "University of Sheffield", country: "uk", officialUrl: "https://www.sheffield.ac.uk/", city: "Sheffield" },
  { slug: "university-of-nottingham", name: "University of Nottingham", country: "uk", officialUrl: "https://www.nottingham.ac.uk/", city: "Nottingham" },
  // USA
  { slug: "harvard-university", name: "Harvard University", country: "usa", officialUrl: "https://www.harvard.edu/", city: "Cambridge" },
  { slug: "stanford-university", name: "Stanford University", country: "usa", officialUrl: "https://www.stanford.edu/", city: "Stanford" },
  { slug: "mit", name: "Massachusetts Institute of Technology", country: "usa", officialUrl: "https://www.mit.edu/", city: "Cambridge" },
  { slug: "princeton-university", name: "Princeton University", country: "usa", officialUrl: "https://www.princeton.edu/", city: "Princeton" },
  { slug: "yale-university", name: "Yale University", country: "usa", officialUrl: "https://www.yale.edu/", city: "New Haven" },
  { slug: "columbia-university", name: "Columbia University", country: "usa", officialUrl: "https://www.columbia.edu/", city: "New York" },
  { slug: "university-of-chicago", name: "University of Chicago", country: "usa", officialUrl: "https://www.uchicago.edu/", city: "Chicago" },
  { slug: "university-of-pennsylvania", name: "University of Pennsylvania", country: "usa", officialUrl: "https://www.upenn.edu/", city: "Philadelphia" },
  { slug: "cornell-university", name: "Cornell University", country: "usa", officialUrl: "https://www.cornell.edu/", city: "Ithaca" },
  // Canada
  { slug: "university-of-toronto", name: "University of Toronto", country: "canada", officialUrl: "https://www.utoronto.ca/", city: "Toronto" },
  { slug: "mcgill-university", name: "McGill University", country: "canada", officialUrl: "https://www.mcgill.ca/", city: "Montreal" },
  { slug: "university-of-british-columbia", name: "University of British Columbia", country: "canada", officialUrl: "https://www.ubc.ca/", city: "Vancouver" },
  { slug: "university-of-alberta", name: "University of Alberta", country: "canada", officialUrl: "https://www.ualberta.ca/", city: "Edmonton" },
  { slug: "universite-de-montreal", name: "Université de Montréal", country: "canada", officialUrl: "https://www.umontreal.ca/", city: "Montreal" },
  { slug: "mcmaster-university", name: "McMaster University", country: "canada", officialUrl: "https://www.mcmaster.ca/", city: "Hamilton" },
  { slug: "university-of-waterloo", name: "University of Waterloo", country: "canada", officialUrl: "https://uwaterloo.ca/", city: "Waterloo" },
  { slug: "western-university", name: "Western University", country: "canada", officialUrl: "https://www.uwo.ca/", city: "London" },
  // Australia
  { slug: "university-of-melbourne", name: "University of Melbourne", country: "australia", officialUrl: "https://www.unimelb.edu.au/", city: "Melbourne" },
  { slug: "university-of-sydney", name: "University of Sydney", country: "australia", officialUrl: "https://www.sydney.edu.au/", city: "Sydney" },
  { slug: "university-of-queensland", name: "University of Queensland", country: "australia", officialUrl: "https://uq.edu.au/", city: "Brisbane" },
  { slug: "university-of-new-south-wales", name: "University of New South Wales", country: "australia", officialUrl: "https://www.unsw.edu.au/", city: "Sydney" },
  { slug: "australian-national-university", name: "Australian National University", country: "australia", officialUrl: "https://www.anu.edu.au/", city: "Canberra" },
  { slug: "monash-university", name: "Monash University", country: "australia", officialUrl: "https://www.monash.edu/", city: "Melbourne" },
  { slug: "university-of-western-australia", name: "University of Western Australia", country: "australia", officialUrl: "https://www.uwa.edu.au/", city: "Perth" },
  { slug: "university-of-adelaide", name: "University of Adelaide", country: "australia", officialUrl: "https://www.adelaide.edu.au/", city: "Adelaide" },
  // New Zealand
  { slug: "university-of-auckland", name: "University of Auckland", country: "new-zealand", officialUrl: "https://www.auckland.ac.nz/", city: "Auckland" },
  { slug: "university-of-otago", name: "University of Otago", country: "new-zealand", officialUrl: "https://www.otago.ac.nz/", city: "Dunedin" },
  { slug: "victoria-university-of-wellington", name: "Victoria University of Wellington", country: "new-zealand", officialUrl: "https://www.wgtn.ac.nz/", city: "Wellington" },
  { slug: "university-of-canterbury", name: "University of Canterbury", country: "new-zealand", officialUrl: "https://www.canterbury.ac.nz/", city: "Christchurch" },
  { slug: "massey-university", name: "Massey University", country: "new-zealand", officialUrl: "https://www.massey.ac.nz/", city: "Palmerston North" },
  // Ireland
  { slug: "trinity-college-dublin", name: "Trinity College Dublin", country: "ireland", officialUrl: "https://www.tcd.ie/", city: "Dublin" },
  { slug: "university-college-dublin", name: "University College Dublin", country: "ireland", officialUrl: "https://www.ucd.ie/", city: "Dublin" },
  { slug: "university-college-cork", name: "University College Cork", country: "ireland", officialUrl: "https://www.ucc.ie/", city: "Cork" },
  { slug: "national-university-of-ireland-galway", name: "University of Galway", country: "ireland", officialUrl: "https://www.universityofgalway.ie/", city: "Galway" },
  { slug: "dublin-city-university", name: "Dublin City University", country: "ireland", officialUrl: "https://www.dcu.ie/", city: "Dublin" },
  // Germany
  { slug: "technical-university-of-munich", name: "Technical University of Munich", country: "germany", officialUrl: "https://www.tum.de/en/", city: "Munich" },
  { slug: "ludwig-maximilian-university-of-munich", name: "Ludwig Maximilian University of Munich", country: "germany", officialUrl: "https://www.lmu.de/en/", city: "Munich" },
  { slug: "heidelberg-university", name: "Heidelberg University", country: "germany", officialUrl: "https://www.uni-heidelberg.de/en/", city: "Heidelberg" },
  { slug: "humboldt-university-of-berlin", name: "Humboldt University of Berlin", country: "germany", officialUrl: "https://www.hu-berlin.de/en/", city: "Berlin" },
  { slug: "rwth-aachen-university", name: "RWTH Aachen University", country: "germany", officialUrl: "https://www.rwth-aachen.de/go/id/e/?lidx=1", city: "Aachen" },
  // UAE
  { slug: "united-arab-emirates-university", name: "United Arab Emirates University", country: "dubai", officialUrl: "https://www.uaeu.ac.ae/en/", city: "Al Ain" },
  { slug: "khalifa-university", name: "Khalifa University of Science and Technology", country: "dubai", officialUrl: "https://www.ku.ac.ae/", city: "Abu Dhabi" },
  { slug: "american-university-of-sharjah", name: "American University of Sharjah", country: "dubai", officialUrl: "https://www.aus.edu/", city: "Sharjah" },
  // Malaysia
  { slug: "university-of-malaya", name: "University of Malaya", country: "malaysia", officialUrl: "https://www.um.edu.my/", city: "Kuala Lumpur" },
  { slug: "universiti-kebangsaan-malaysia", name: "Universiti Kebangsaan Malaysia", country: "malaysia", officialUrl: "https://www.ukm.my/en/", city: "Bangi" },
  { slug: "universiti-sains-malaysia", name: "Universiti Sains Malaysia", country: "malaysia", officialUrl: "https://www.usm.my/", city: "Penang" },
  // Japan
  { slug: "university-of-tokyo", name: "University of Tokyo", country: "japan", officialUrl: "https://www.u-tokyo.ac.jp/en/", city: "Tokyo" },
  { slug: "kyoto-university", name: "Kyoto University", country: "japan", officialUrl: "https://www.kyoto-u.ac.jp/en", city: "Kyoto" },
  { slug: "osaka-university", name: "Osaka University", country: "japan", officialUrl: "https://www.osaka-u.ac.jp/en", city: "Osaka" },
  // South Korea
  { slug: "seoul-national-university", name: "Seoul National University", country: "south-korea", officialUrl: "https://en.snu.ac.kr/", city: "Seoul" },
  { slug: "korea-university", name: "Korea University", country: "south-korea", officialUrl: "https://www.korea.edu/mbshome/mbs/en/index.do", city: "Seoul" },
  { slug: "yonsei-university", name: "Yonsei University", country: "south-korea", officialUrl: "https://www.yonsei.ac.kr/en_sc/", city: "Seoul" },
  // Denmark
  { slug: "university-of-copenhagen", name: "University of Copenhagen", country: "denmark", officialUrl: "https://www.ku.dk/english/", city: "Copenhagen" },
  { slug: "aarhus-university", name: "Aarhus University", country: "denmark", officialUrl: "https://international.au.dk/", city: "Aarhus" },
  { slug: "dtu", name: "Technical University of Denmark", country: "denmark", officialUrl: "https://www.dtu.dk/english", city: "Lyngby" },
];

async function main() {
  console.log("=== ALO University Data Monitoring Seed (Task 21) ===\n");

  // 1. Upsert the persistent monitoring job
  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + 7);
  nextRun.setHours(3, 0, 0, 0);

  const job = await db.monitoringJob.upsert({
    where: { jobId: "university-monitor-7d" },
    update: {},
    create: {
      jobId: "university-monitor-7d",
      name: "ALO University & Official Data Monitoring Agent",
      description:
        "Continuously monitors official university and government sources every 7 days. Detects changes in courses, fees, intakes, deadlines, requirements, scholarships, and visa policies. Routes all material changes to Super Admin approval queue before mutating production data.",
      schedule: "0 3 * * 1", // every Monday 03:00
      enabled: true,
      maxRetries: 3,
      retryDelayMs: 60000,
      nextRunAt: nextRun,
    },
  });
  console.log(`✓ Monitoring job upserted: ${job.jobId} (next run: ${nextRun.toISOString()})`);

  // 2. Register government / authority sources (idempotent by sourceUrl)
  let govCount = 0;
  for (const gs of GOVERNMENT_SOURCES) {
    await db.officialSource.upsert({
      where: { sourceUrl: gs.url },
      update: { sourceName: gs.name, sourceType: gs.sourceType, category: gs.category, priority: gs.priority, countrySlug: gs.countrySlug },
      create: {
        sourceUrl: gs.url,
        sourceName: gs.name,
        sourceType: gs.sourceType,
        category: gs.category,
        priority: gs.priority,
        entityType: "GOVERNMENT",
        countrySlug: gs.countrySlug,
        monitoringEnabled: true,
        checkFrequencyDays: 7,
        status: "ACTIVE",
      },
    });
    govCount++;
  }
  console.log(`✓ ${govCount} government/authority official sources registered`);

  // 3. Register known official university sources + upsert REAL universities
  let uniCount = 0;
  let sourceCount = 0;
  for (const u of KNOWN_OFFICIAL_UNIVERSITIES) {
    // Ensure the university record exists (upsert by slug)
    const uni = await db.universityPage.upsert({
      where: { slug: u.slug },
      update: {
        name: u.name,
        countrySlug: u.country,
        city: u.city,
        sourceUrl: u.officialUrl,
        verificationStatus: "VERIFIED",
        approvalStatus: "PUBLISHED",
        lastVerifiedAt: new Date(),
      },
      create: {
        slug: u.slug,
        name: u.name,
        countrySlug: u.country,
        city: u.city,
        overview: `${u.name} — official information monitored by the ALO University Data Monitoring Agent. Course catalogue, fees, intakes, and requirements are verified against the official university website (${u.officialUrl}).`,
        sourceUrl: u.officialUrl,
        verificationStatus: "VERIFIED",
        approvalStatus: "PUBLISHED",
        lastVerifiedAt: new Date(),
      },
    });

    // Register the official university source
    await db.officialSource.upsert({
      where: { sourceUrl: u.officialUrl },
      update: { universitySlug: uni.slug, sourceName: `${u.name} — Official Website`, status: "ACTIVE" },
      create: {
        sourceUrl: u.officialUrl,
        sourceName: `${u.name} — Official Website`,
        sourceType: "UNIVERSITY_OFFICIAL",
        category: "CATALOGUE",
        priority: 1,
        entityType: "UNIVERSITY",
        universitySlug: uni.slug,
        countrySlug: u.country,
        monitoringEnabled: true,
        checkFrequencyDays: 7,
        status: "ACTIVE",
        lastVerifiedAt: new Date(),
      },
    });
    sourceCount++;
    uniCount++;
  }
  console.log(`✓ ${uniCount} real universities upserted with official source URLs (${sourceCount} sources registered)`);

  // 4. Flag fabricated source URLs in the existing database for review
  const allUnis = await db.universityPage.findMany({ select: { id: true, slug: true, name: true, sourceUrl: true, countrySlug: true, verificationStatus: true } });
  let flaggedCount = 0;
  for (const u of allUnis) {
    if (isFabricatedSource(u.sourceUrl)) {
      // Mark as UNVERIFIED so the system knows this record needs official-source research
      await db.universityPage.update({
        where: { id: u.id },
        data: { verificationStatus: "UNVERIFIED" },
      });
      flaggedCount++;
    }
  }
  console.log(`✓ ${flaggedCount} universities with fabricated source URLs flagged as UNVERIFIED (need official source research)`);

  // 5. Detect duplicate universities (same slug appearing multiple times — actually unique by slug, but check duplicate names per country)
  const duplicateGroups = await db.universityPage.groupBy({
    by: ["name", "countrySlug"],
    _count: { id: true },
    having: { id: { _count: { gt: 1 } } },
  });
  let dupFlagged = 0;
  for (const g of duplicateGroups) {
    if (g._count.id > 1) {
      // Create a NEEDS_MANUAL_REVIEW change record for each duplicate group
      const dupUnis = await db.universityPage.findMany({
        where: { name: g.name, countrySlug: g.countrySlug },
        select: { id: true, slug: true, sourceUrl: true, verificationStatus: true },
        orderBy: { createdAt: "asc" },
      });
      const existingChange = await db.dataChange.findFirst({
        where: { entityType: "UNIVERSITY", universitySlug: dupUnis[0].slug, changeType: "NEEDS_MANUAL_REVIEW", status: "PENDING" },
      });
      if (!existingChange) {
        await db.dataChange.create({
          data: {
            runId: "seed-initial",
            sourceId: (await db.officialSource.findFirst({ where: { sourceUrl: "seed://duplicate-detection" } }))?.id ?? (await db.officialSource.create({ data: { sourceUrl: "seed://duplicate-detection", sourceName: "ALO Duplicate Detection", sourceType: "APPROVED_INSTITUTIONAL", entityType: "UNIVERSITY", status: "ACTIVE", priority: 6 } })).id,
            entityType: "UNIVERSITY",
            universitySlug: dupUnis[0].slug,
            countrySlug: g.countrySlug,
            changeType: "NEEDS_MANUAL_REVIEW",
            fieldName: "duplicate_name",
            oldValue: JSON.stringify(dupUnis.map((d) => ({ slug: d.slug, sourceUrl: d.sourceUrl }))),
            newValue: `${g._count.id} records with the same name`,
            sourceUrl: "seed://duplicate-detection",
            aiExplanation: `${g._count.id} university records share the name "${g.name}" in country "${g.countrySlug}". This may indicate duplicate data from the old seed-massive script. Super Admin should review and consolidate, keeping the record with the verified official source URL.`,
            confidence: 0.95,
            impactLevel: "MEDIUM",
            status: "PENDING",
          },
        });
        await db.approvalQueueItem.create({
          data: {
            changeId: (await db.dataChange.findFirst({ where: { entityType: "UNIVERSITY", universitySlug: dupUnis[0].slug, changeType: "NEEDS_MANUAL_REVIEW", status: "PENDING" }, orderBy: { createdAt: "desc" } }))!.id,
            queueType: "MANUAL_REVIEW",
            priority: 5,
            status: "PENDING",
          },
        });
        dupFlagged++;
      }
    }
  }
  console.log(`✓ ${dupFlagged} duplicate university groups flagged for manual review`);

  // 6. Summary log
  const totalSources = await db.officialSource.count();
  const totalChanges = await db.dataChange.count();
  const totalQueue = await db.approvalQueueItem.count();
  const verifiedUnis = await db.universityPage.count({ where: { verificationStatus: "VERIFIED" } });
  const unverifiedUnis = await db.universityPage.count({ where: { verificationStatus: "UNVERIFIED" } });
  console.log("\n=== Seed Summary ===");
  console.log(`  Monitoring job: ${job.jobId}`);
  console.log(`  Official sources registered: ${totalSources}`);
  console.log(`  Verified universities: ${verifiedUnis}`);
  console.log(`  Unverified universities (flagged): ${unverifiedUnis}`);
  console.log(`  Pending changes: ${totalChanges}`);
  console.log(`  Pending approval queue items: ${totalQueue}`);
  console.log("\n=== Seed Complete ===");
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
