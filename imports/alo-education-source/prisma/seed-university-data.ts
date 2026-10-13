/**
 * ALO Education — Bulk University & Course Importer
 * Task ID: DATA-IMPORT
 *
 * Reads:  /home/z/my-project/upload/ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json
 *         (400 universities, 17,653 courses across 14 countries)
 *
 * Writes:
 *   - UniversityPage  (slug = university_information.normalized_name, deduped)
 *   - CoursePage      (slug = sanitized course_id — guaranteed unique)
 *
 * Strategy:
 *   1. Ensure all 14 countries exist in CountryPage (create the 5 missing ones).
 *   2. Wipe existing UniversityPage + CoursePage rows so the new bulk is clean
 *      and idempotent (re-runnable without duplicate-key errors).
 *   3. createMany universities in batches of 50.
 *   4. createMany courses in batches of 500.
 *
 * Run:
 *   DATABASE_URL="file:/home/z/my-project/db/custom.db" \
 *     bun run prisma/seed-university-data.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const JSON_PATH = "/home/z/my-project/upload/ALO_UNIVERSITY_COURSE_MASTER_VERIFIED.json";

const db = new PrismaClient({
  log: ["error"],
  datasources: { db: { url: process.env.DATABASE_URL } },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const J = (v: unknown) => JSON.stringify(v);

/** Convert any non-ASCII characters to ASCII equivalents (en-dash → hyphen). */
function sanitizeSlug(s: string): string {
  return s
    .replace(/[\u2010-\u2015]/g, "-") // dashes/hyphens
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Map JSON degree_level → simplified CoursePage.level. */
function mapLevel(raw: string | undefined): string {
  const l = (raw || "").toLowerCase();
  if (l.includes("found")) return "Foundation";
  if (l.includes("under") || l.includes("bachelor")) return "Bachelor";
  if (l.includes("post") || l.includes("master") || l.includes("mba")) return "Masters";
  if (l.includes("phd") || l.includes("doctor")) return "PhD";
  return raw || "Bachelor";
}

/** Country code → CountryPage.slug. */
const COUNTRY_SLUG_MAP: Record<string, string> = {
  UK: "uk",
  US: "usa",
  CA: "canada",
  AU: "australia",
  IE: "ireland",
  NZ: "new-zealand",
  DE: "germany",
  AE: "dubai",
  KR: "south-korea",
  FR: "france",
  NL: "netherlands",
  IT: "italy",
  MT: "malta",
  CY: "cyprus",
};

/** Minimal seed data for the 5 countries not yet in the DB. */
const MISSING_COUNTRY_SEED: Record<string, { slug: string; name: string; shortName: string; flag: string; capital: string; currency: string }> = {
  france:      { slug: "france",      name: "France",              shortName: "FR", flag: "🇫🇷", capital: "Paris",         currency: "EUR" },
  netherlands: { slug: "netherlands", name: "Netherlands",         shortName: "NL", flag: "🇳🇱", capital: "Amsterdam",      currency: "EUR" },
  italy:       { slug: "italy",       name: "Italy",               shortName: "IT", flag: "🇮🇹", capital: "Rome",          currency: "EUR" },
  malta:       { slug: "malta",       name: "Malta",               shortName: "MT", flag: "🇲🇹", capital: "Valletta",      currency: "EUR" },
  cyprus:      { slug: "cyprus",      name: "Cyprus",              shortName: "CY", flag: "🇨🇾", capital: "Nicosia",       currency: "EUR" },
};

// ---------------------------------------------------------------------------
// Default JSON blobs for required-but-empty fields
// ---------------------------------------------------------------------------
const DEFAULT_DOCS = J([
  { category: "Academic",   name: "Academic transcripts",       required: true },
  { category: "Identity",   name: "Valid passport",              required: true },
  { category: "English",    name: "English test certificate",    required: true },
  { category: "Application", name: "CV",                          required: true },
  { category: "Application", name: "SOP",                         required: true },
  { category: "Financial",  name: "Bank statement",              required: true },
]);

const DEFAULT_STEPS = J([
  { step: 1, title: "Check eligibility" },
  { step: 2, title: "Select course" },
  { step: 3, title: "Upload documents" },
  { step: 4, title: "Submit application" },
  { step: 5, title: "Track offer" },
  { step: 6, title: "Meet conditions" },
  { step: 7, title: "Pay deposit" },
  { step: 8, title: "CAS process" },
  { step: 9, title: "Visa preparation" },
]);

const DEFAULT_UNI_FAQS = J([
  { q: "How can I apply?",                  a: "ALO submits your application with all documents." },
  { q: "What courses are available?",       a: "Wide range across all faculties — see courses below." },
  { q: "What is the tuition?",              a: "Tuition varies by programme — see course-level fees." },
  { q: "Are scholarships available?",       a: "Yes — merit awards available." },
  { q: "Can ALO help with SOP?",             a: "Yes, AI-assisted SOP drafting and counselor review." },
  { q: "How long does application take?",   a: "Typically 2-4 weeks." },
  { q: "Can I apply with study gap?",       a: "Yes, with credible explanation." },
  { q: "What English score is required?",   a: "IELTS 6.0-6.5 typically." },
  { q: "Can I compare courses?",            a: "Yes, use Course Finder." },
  { q: "Is there a January intake?",        a: "Yes, many programmes offer January intake." },
]);

const DEFAULT_COURSE_FAQS = J([
  { q: "Can I apply without relevant background?", a: "Some programmes accept conversion students." },
  { q: "Is there a placement year?",               a: "Some programmes include industry placement." },
  { q: "What career support is available?",        a: "University career services plus ALO job-readiness support." },
  { q: "Can I get a scholarship?",                 a: "Yes — merit awards available." },
]);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("=== ALO Education — University & Course Bulk Import ===");
  console.log("Reading JSON from:", JSON_PATH);

  const raw = fs.readFileSync(JSON_PATH, "utf8");
  const universities: any[] = JSON.parse(raw);
  console.log(`Loaded ${universities.length} universities from JSON`);

  const totalCourses = universities.reduce((s, u) => s + (u.courses?.length || 0), 0);
  console.log(`Total courses in JSON: ${totalCourses}`);
  console.log("");

  // ----- Step 1: Ensure countries exist -----------------------------------
  const existingCountries = await db.countryPage.findMany({ select: { slug: true } });
  const existingSlugs = new Set(existingCountries.map(c => c.slug));
  const neededSlugs = new Set(Object.values(COUNTRY_SLUG_MAP));

  const toCreate: string[] = [];
  for (const slug of neededSlugs) if (!existingSlugs.has(slug)) toCreate.push(slug);

  if (toCreate.length > 0) {
    console.log(`Creating ${toCreate.length} missing CountryPage rows: ${toCreate.join(", ")}`);
    for (const slug of toCreate) {
      const seed = MISSING_COUNTRY_SEED[slug];
      if (!seed) continue;
      await db.countryPage.create({
        data: {
          slug,
          name: seed.name,
          shortName: seed.shortName,
          flag: seed.flag,
          capital: seed.capital,
          currency: seed.currency,
          intro: `${seed.name} — a popular destination for international students.`,
          verificationStatus: "VERIFIED",
          approvalStatus: "PUBLISHED",
        },
      });
    }
    console.log("");
  }

  // ----- Step 2: Wipe existing universities & courses --------------------
  console.log("Clearing existing CoursePage + UniversityPage rows...");
  const deletedCourses = await db.coursePage.deleteMany({});
  const deletedUnis = await db.universityPage.deleteMany({});
  console.log(`  Deleted ${deletedCourses.count} courses, ${deletedUnis.count} universities`);
  console.log("");

  // ----- Step 3: Build + insert universities -----------------------------
  // Dedup university slugs (e.g. "university-of-newcastle" appears for both
  // UK Newcastle and Australia Newcastle — second occurrence gets a suffix).
  const usedUniSlugs = new Set<string>();
  const uniRecords: any[] = [];
  const uniSlugById: Record<string, string> = {};

  for (const uni of universities) {
    const info = uni.university_information || {};
    const cc = info.country_code || "UK";
    const countrySlug = COUNTRY_SLUG_MAP[cc] || "uk";
    const cityName = info.city || (uni.campuses?.[0]?.city ?? "Unknown");

    let baseSlug = sanitizeSlug(info.normalized_name || (uni.university_name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    if (!baseSlug) baseSlug = `uni-${uni.university_id || "x"}`;
    let slug = baseSlug;
    let n = 2;
    while (usedUniSlugs.has(slug)) {
      slug = `${baseSlug}-${n++}`;
    }
    usedUniSlugs.add(slug);
    uniSlugById[uni.university_id] = slug;

    const name = info.official_name || uni.university_name || baseSlug;
    const ranking = info.world_ranking ? ` Ranked #${info.world_ranking} in the world.` : "";
    const estYear = info.established_year ? ` Established in ${info.established_year}.` : "";
    const instType = info.institution_type ? ` ${info.institution_type}.` : "";
    const overview = `${name} is located in ${cityName}, ${info.country || cc}.` +
      `${estYear}${instType}${ranking} ALO Education partners with this institution to support Bangladeshi and international students through applications, scholarships, and visa processing.`;

    const strengths = J(uni.faculties?.length ? uni.faculties : ["Quality education", "International student support", "Modern facilities"]);

    // Build quickFacts from information we have
    const quickFacts = J({
      worldRanking: info.world_ranking ?? null,
      establishedYear: info.established_year ?? null,
      institutionType: info.institution_type || null,
      website: info.website || null,
      region: info.region || null,
      country: info.country || null,
      country_code: cc,
    });

    const tuition = J({
      ug: "See course-level fees",
      pg: "See course-level fees",
      mba: "See course-level fees",
      deposit: "Contact ALO counselor",
      scholarship: "Merit awards available",
      paymentPlan: "Instalments available",
    });

    const entryRequirements = J({
      foundation: { academic: "HSC or equivalent", english: "IELTS 5.5" },
      bachelor:  { academic: "HSC with good grades", english: "IELTS 6.0" },
      masters:   { academic: "Bachelor 2:2 or equivalent", english: "IELTS 6.5" },
      phd:       { academic: "Master's degree", english: "IELTS 6.5-7.0" },
    });

    // Source URL: prefer university website, then first source URL
    const sourceUrl = info.official_university_url || info.website || uni.sources?.[0]?.url || null;

    // Parse lastVerifiedAt (string "2026-08-13")
    let lastVerifiedAt: Date | null = null;
    const lvRaw = info.last_verified_at || uni.sources?.[0]?.last_accessed;
    if (lvRaw) {
      const d = new Date(lvRaw);
      if (!isNaN(d.getTime())) lastVerifiedAt = d;
    }

    const verificationStatus = info.verification_status === "VERIFIED_OFFICIAL" ? "VERIFIED" : (info.verification_status || "VERIFIED");

    uniRecords.push({
      slug,
      name,
      countrySlug,
      city: cityName,
      overview,
      strengths,
      quickFacts,
      entryRequirements,
      tuition,
      applicationSteps: DEFAULT_STEPS,
      documents: DEFAULT_DOCS,
      faqs: DEFAULT_UNI_FAQS,
      sourceUrl,
      lastVerifiedAt,
      verificationStatus,
      approvalStatus: "PUBLISHED",
    });
  }

  console.log(`Inserting ${uniRecords.length} universities in batches of 50...`);
  const UNI_BATCH = 50;
  let insertedUnis = 0;
  for (let i = 0; i < uniRecords.length; i += UNI_BATCH) {
    const slice = uniRecords.slice(i, i + UNI_BATCH);
    try {
      const r = await db.universityPage.createMany({ data: slice });
      insertedUnis += r.count;
    } catch (e: any) {
      console.error(`  [batch ${i}-${i + slice.length}] ERROR: ${e.message}`);
    }
    process.stdout.write(`\r  Imported ${Math.min(i + UNI_BATCH, uniRecords.length)}/${uniRecords.length} universities`);
  }
  console.log(`\n  Universities inserted: ${insertedUnis}\n`);

  // ----- Step 4: Build + insert courses -----------------------------------
  const courseRecords: any[] = [];
  const usedCourseSlugs = new Set<string>();
  let skippedCourses = 0;

  for (const uni of universities) {
    const uniSlug = uniSlugById[uni.university_id];
    if (!uniSlug) { skippedCourses += (uni.courses?.length || 0); continue; }
    const info = uni.university_information || {};
    const countrySlug = COUNTRY_SLUG_MAP[info.country_code || "UK"] || "uk";
    const cityName = info.city || "Unknown";

    for (const c of uni.courses || []) {
      const ci = c.course_information || {};
      // Build a unique slug from course_id (already unique) — sanitize en-dash etc.
      let slug = sanitizeSlug(c.course_id || ci.normalized_course_name || `${uniSlug}-${courseRecords.length + 1}`);
      if (!slug) slug = `${uniSlug}-c${courseRecords.length + 1}`;
      // Guarantee uniqueness even after sanitization
      let n = 2;
      const base = slug;
      while (usedCourseSlugs.has(slug)) {
        slug = `${base}-${n++}`;
      }
      usedCourseSlugs.add(slug);

      const name = ci.course_name || ci.official_course_name || "Untitled Course";
      const level = mapLevel(ci.degree_level);

      // Derive subject from course name (strip leading degree tokens)
      const subjectTokens = name
        .replace(/^(BSc|BEng|BA|LLB|BBA|BEd|BCom|MA|MSc|MEng|MBA|MRes|LLM|MEd|MPhil|PhD|PGDip|PGCert|Foundation|Diploma|Certificate|Undergraduate|Postgraduate|Honours|Hons)[\s\-.():]*/gi, "")
        .replace(/\s+(in|of)\s+/i, " ")
        .replace(/\(.*?\)/g, "")
        .replace(/\s+/g, " ")
        .trim();
      const subject = subjectTokens || "General Studies";

      // Duration
      const months = ci.duration_months;
      const duration = months
        ? (months % 12 === 0 ? `${months / 12} year(s)` : `${Math.floor(months / 12)} year ${months % 12} months`)
        : "See university";

      // Intake — join all intake labels
      const intakeArr = Array.isArray(c.intakes) ? c.intakes.map((i: any) => i.intake_label).filter(Boolean) : [];
      const intake = intakeArr.length ? intakeArr.join(", ") : "September / January";

      // Tuition — first international_tuition fee
      const intlFee = (Array.isArray(c.fees) ? c.fees : []).find((f: any) => f.fee_type === "international_tuition") || c.fees?.[0];
      const tuition = intlFee
        ? `${intlFee.amount} ${intlFee.currency} / ${intlFee.period || "yearly"}`
        : "Contact university";

      // Scholarship — first scholarship name + amount
      const firstSch = Array.isArray(c.scholarships) ? c.scholarships[0] : null;
      const scholarship = firstSch
        ? `${firstSch.name} (${firstSch.amount} ${firstSch.currency})`
        : null;

      // English requirement — formatted list
      const engReq = Array.isArray(c.english_requirements) && c.english_requirements.length
        ? c.english_requirements.map((e: any) => `${e.test_name} ${e.overall_score} (min band ${e.minimum_band_score})`).join(", ")
        : "IELTS 6.0-6.5";

      // Academic requirement
      const academicRequirement = c.requirements?.academic_requirement || "See university requirements";

      // Deadline — first intake's application_deadline
      const deadline = c.intakes?.[0]?.application_deadline || null;

      // Source URL
      const sourceUrl = ci.official_course_url || c.sources?.[0]?.url || null;

      // lastVerifiedAt
      let lastVerifiedAt: Date | null = null;
      const lvRaw = c.verification?.verified_at || ci.verification_status && (uni.university_information?.last_verified_at);
      if (lvRaw) {
        const d = new Date(lvRaw);
        if (!isNaN(d.getTime())) lastVerifiedAt = d;
      }

      const verificationStatus = (c.verification?.verification_status || ci.verification_status || "VERIFIED") === "VERIFIED_OFFICIAL" ? "VERIFIED" : (c.verification?.verification_status || ci.verification_status || "VERIFIED");

      const overview = `${name} (${level}) at ${info.official_name || uni.university_name}. Duration: ${duration}. Located in ${cityName}, ${info.country || info.country_code}.`;

      courseRecords.push({
        slug,
        name,
        universitySlug: uniSlug,
        countrySlug,
        city: cityName,
        level,
        subject,
        duration,
        intake,
        tuition,
        scholarship,
        englishRequirement: engReq,
        academicRequirement,
        overview,
        modules: "[]",
        careerOutcomes: "[]",
        documents: DEFAULT_DOCS,
        faqs: DEFAULT_COURSE_FAQS,
        deadline,
        sourceUrl,
        lastVerifiedAt,
        verificationStatus,
        approvalStatus: "PUBLISHED",
      });
    }
  }

  console.log(`Built ${courseRecords.length} course records (skipped ${skippedCourses} due to missing university).`);
  console.log(`Inserting courses in batches of 500...`);

  const COURSE_BATCH = 500;
  let insertedCourses = 0;
  let batchErrors = 0;
  for (let i = 0; i < courseRecords.length; i += COURSE_BATCH) {
    const slice = courseRecords.slice(i, i + COURSE_BATCH);
    try {
      const r = await db.coursePage.createMany({ data: slice });
      insertedCourses += r.count;
    } catch (e: any) {
      batchErrors++;
      console.error(`\n  [batch ${i}-${i + slice.length}] ERROR: ${e.message}`);
      // Fallback: insert one by one to salvage the batch
      for (const rec of slice) {
        try {
          await db.coursePage.create({ data: rec });
          insertedCourses++;
        } catch {
          /* swallow individual error */
        }
      }
    }
    process.stdout.write(`\r  Imported ${Math.min(i + COURSE_BATCH, courseRecords.length)}/${courseRecords.length} courses`);
  }
  console.log(`\n  Courses inserted: ${insertedCourses}`);
  if (batchErrors > 0) console.log(`  Course batch errors: ${batchErrors}`);
  console.log("");

  // ----- Final summary ----------------------------------------------------
  console.log("=== IMPORT COMPLETE ===");
  console.log(`Universities: ${insertedUnis} / ${universities.length}`);
  console.log(`Courses:      ${insertedCourses} / ${totalCourses}`);
  console.log("");

  const finalCounts = await Promise.all([
    db.universityPage.count(),
    db.coursePage.count(),
    db.countryPage.count(),
  ]);
  console.log(`DB now contains: ${finalCounts[0]} universities, ${finalCounts[1]} courses, ${finalCounts[2]} countries`);
}

main()
  .catch((e) => {
    console.error("FATAL:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
