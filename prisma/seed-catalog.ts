/**
 * ALO Education — Catalog Seed (Jan 2027 – Jan 2028)
 * ================================================
 * Loads the complete verified university + course catalog into the
 * CrmUniversity / CrmCourse / CrmCourseIntakeFee / CrmCourseRequirement
 * tables so that EVERY university and EVERY course appears in the public
 * Course Finder, university list, and course detail pages.
 *
 * Source CSVs (uploaded by data team):
 *   upload/01_universities.csv         — 325 universities
 *   upload/02_courses.csv              — 1,508 courses
 *   upload/03_course_intakes_fees.csv  — 1,517 intakes with fees
 *   upload/04_course_requirements.csv  — 1,521 entry requirements
 *
 * Visibility (matches src/lib/public-catalog.ts):
 *   status              = "active"
 *   verificationStatus  = "VERIFIED"
 *   publicationStatus   = "published"
 *   visibility          = "public"
 *
 * Run:
 *   UPLOAD_DIR=/home/z/my-project/upload npx tsx prisma/seed-catalog.ts
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const db = new PrismaClient({
  log: ["error"],
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const UPLOAD_DIR = process.env.UPLOAD_DIR || join(__dirname, "seed-data");
const NOW_ISO = new Date("2026-11-17T00:00:00Z").toISOString();

// ── Minimal RFC-4180 CSV parser (handles quoted fields, embedded commas,
//    embedded newlines, and doubled quotes). No external dependency. ─────
function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else { inQuotes = false; }
      } else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field); field = ""; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
      else if (ch === '\r') { /* skip — handle \r\n */ }
      else { field += ch; }
    }
  }
  // last field/row
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1)
    .filter(r => r.some(c => c.trim() !== ""))
    .map(r => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => { obj[h] = (r[idx] || "").trim(); });
      return obj;
    });
}

// ── Country mapping (Country table uses slug as @unique) ────────────────
interface CountrySpec { code: string; slug: string; name: string; currency: string; capital: string; accentColor: string; }
const COUNTRIES: CountrySpec[] = [
  { code: "GB", slug: "united-kingdom", name: "United Kingdom", currency: "GBP", capital: "London", accentColor: "#0B5ED7" },
  { code: "AU", slug: "australia",      name: "Australia",      currency: "AUD", capital: "Canberra", accentColor: "#1B9E4A" },
  { code: "CA", slug: "canada",         name: "Canada",         currency: "CAD", capital: "Ottawa", accentColor: "#D62828" },
  { code: "US", slug: "united-states",  name: "United States",  currency: "USD", capital: "Washington", accentColor: "#1D3557" },
  { code: "IE", slug: "ireland",        name: "Ireland",        currency: "EUR", capital: "Dublin", accentColor: "#2A9D8F" },
  { code: "DE", slug: "germany",        name: "Germany",        currency: "EUR", capital: "Berlin", accentColor: "#E76F51" },
  { code: "MY", slug: "malaysia",       name: "Malaysia",       currency: "MYR", capital: "Kuala Lumpur", accentColor: "#F4A100" },
  { code: "NL", slug: "netherlands",    name: "Netherlands",    currency: "EUR", capital: "Amsterdam", accentColor: "#FF6B35" },
  { code: "SE", slug: "sweden",         name: "Sweden",         currency: "SEK", capital: "Stockholm", accentColor: "#264653" },
  { code: "NZ", slug: "new-zealand",    name: "New Zealand",    currency: "NZD", capital: "Wellington", accentColor: "#2DB67C" },
];

function loadCsv(name: string): Record<string, string>[] {
  const path = join(UPLOAD_DIR, name);
  if (!existsSync(path)) {
    console.warn(`⚠ CSV not found: ${path} — skipping`);
    return [];
  }
  const text = readFileSync(path, "utf-8");
  return parseCsv(text);
}

function toSlug(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function num(v: string): number {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
}

function boolStr(v: string): boolean {
  return (v || "").toLowerCase() === "true";
}

// ── 1. Ensure countries exist ───────────────────────────────────────────
async function seedCountries(): Promise<Record<string, string>> {
  console.log("\n[1/5] Seeding countries…");
  const countryIdByCode: Record<string, string> = {};
  for (const c of COUNTRIES) {
    const rec = await db.country.upsert({
      where: { slug: c.slug },
      update: { code: c.code, countryCode: c.code, name: c.name, currency: c.currency, capital: c.capital, status: "active", accentColor: c.accentColor, lastVerifiedAt: new Date(NOW_ISO) },
      create: { slug: c.slug, code: c.code, countryCode: c.code, name: c.name, currency: c.currency, capital: c.capital, status: "active", accentColor: c.accentColor, lastVerifiedAt: new Date(NOW_ISO) },
    });
    countryIdByCode[c.code] = rec.id;
  }
  console.log(`  ✓ ${COUNTRIES.length} countries ensured`);
  return countryIdByCode;
}

// ── 2. Seed universities ────────────────────────────────────────────────
async function seedUniversities(countryIdByCode: Record<string, string>): Promise<void> {
  console.log("\n[2/5] Seeding universities…");
  const rows = loadCsv("01_universities.csv");
  let n = 0;
  for (const u of rows) {
    const uid = u.university_external_id || u.id || "";
    if (!uid) continue;
    const cc = (u.country_code || "").toUpperCase();
    const countrySpec = COUNTRIES.find(c => c.code === cc) || COUNTRIES.find(c => c.code === "GB")!;
    const countryId = countryIdByCode[countrySpec.code] || countryIdByCode["GB"];
    const name = u.official_name || u.display_name || uid;
    const website = u.official_website_url || "";
    await db.crmUniversity.upsert({
      where: { universityId: uid },
      update: {
        name,
        slug: u.slug || toSlug(name),
        countryId,
        country: countrySpec.name,
        city: u.city || "",
        state: u.state_region || "",
        website,
        officialUrl: website,
        officialInternationalAdmissionsUrl: u.international_admissions_url || "",
        campusName: u.campus_names || "",
        campuses: JSON.stringify((u.campus_names || "").split(",").map(s => s.trim()).filter(Boolean)),
        type: u.institution_type || "Public",
        founded: num(u.established_year),
        verificationStatus: "VERIFIED",
        publicationStatus: "published",
        visibility: "public",
        status: "active",
        lastVerifiedAt: NOW_ISO,
        lastApprovedUpdateAt: NOW_ISO,
      },
      create: {
        universityId: uid,
        universityCode: uid,
        name,
        slug: u.slug || toSlug(name),
        countryId,
        country: countrySpec.name,
        city: u.city || "",
        state: u.state_region || "",
        website,
        officialUrl: website,
        officialInternationalAdmissionsUrl: u.international_admissions_url || "",
        campusName: u.campus_names || "",
        campuses: JSON.stringify((u.campus_names || "").split(",").map(s => s.trim()).filter(Boolean)),
        type: u.institution_type || "Public",
        founded: num(u.established_year),
        ranking: num(u.world_rank || u.ranking || "0"),
        worldRanking: num(u.world_rank || "0"),
        verificationStatus: "VERIFIED",
        publicationStatus: "published",
        visibility: "public",
        status: "active",
        lastVerifiedAt: NOW_ISO,
        lastApprovedUpdateAt: NOW_ISO,
        createdBy: "seed-catalog",
      },
    });
    n++;
  }
  console.log(`  ✓ ${n} universities seeded (expected ${rows.length})`);
}

// ── 3. Seed courses ─────────────────────────────────────────────────────
async function seedCourses(): Promise<void> {
  console.log("\n[3/5] Seeding courses…");
  const rows = loadCsv("02_courses.csv");
  let n = 0;
  for (const c of rows) {
    const cid = c.course_external_id || "";
    const uid = c.university_external_id || "";
    if (!cid || !uid) continue;
    const title = c.official_course_title || c.display_title || cid;
    const qual = c.qualification || "";
    const level = (c.study_level || qual || "").toUpperCase();
    await db.crmCourse.upsert({
      where: { courseId: cid },
      update: {
        universityId: uid,
        courseTitle: title.slice(0, 512),
        name: title,
        slug: c.slug || toSlug(title),
        qualification: qual,
        studyLevel: level,
        programLevel: level,
        subjectArea: c.subject_area || "",
        disciplineArea: c.department || c.faculty || "",
        country: (c.country_code || "").toUpperCase(),
        city: c.campus || "",
        campus: c.campus || "",
        deliveryMode: c.delivery_mode || "CAMPUS",
        attendanceMode: c.study_mode || "FULL_TIME",
        placementOption: boolStr(c.placement_available),
        internshipAvailable: boolStr(c.internship_available),
        durationMonths: num(c.duration_value) * (c.duration_unit === "Years" ? 12 : 1),
        officialUrl: c.official_course_url || "",
        description: c.course_summary_original || "",
        careerOutcomes: c.career_summary_original || "",
        verificationStatus: "VERIFIED",
        publicationStatus: "published",
        visibility: "public",
        status: "active",
        lastVerifiedAt: NOW_ISO,
        lastApprovedUpdateAt: NOW_ISO,
      },
      create: {
        courseId: cid,
        courseCode: cid,
        universityId: uid,
        courseTitle: title.slice(0, 512),
        name: title,
        slug: c.slug || toSlug(title),
        qualification: qual,
        studyLevel: level,
        programLevel: level,
        subjectArea: c.subject_area || "",
        disciplineArea: c.department || c.faculty || "",
        country: (c.country_code || "").toUpperCase(),
        city: c.campus || "",
        campus: c.campus || "",
        deliveryMode: c.delivery_mode || "CAMPUS",
        attendanceMode: c.study_mode || "FULL_TIME",
        placementOption: boolStr(c.placement_available),
        internshipAvailable: boolStr(c.internship_available),
        durationMonths: num(c.duration_value) * (c.duration_unit === "Years" ? 12 : 1),
        officialUrl: c.official_course_url || "",
        description: c.course_summary_original || "",
        careerOutcomes: c.career_summary_original || "",
        currency: "GBP",
        verificationStatus: "VERIFIED",
        publicationStatus: "published",
        visibility: "public",
        status: "active",
        lastVerifiedAt: NOW_ISO,
        lastApprovedUpdateAt: NOW_ISO,
        createdBy: "seed-catalog",
      },
    });
    n++;
  }
  console.log(`  ✓ ${n} courses seeded (expected ${rows.length})`);
}

// ── 4. Seed intakes + fees ──────────────────────────────────────────────
async function seedIntakes(): Promise<void> {
  console.log("\n[4/5] Seeding intakes + fees…");
  const rows = loadCsv("03_course_intakes_fees.csv");
  let n = 0;
  for (const i of rows) {
    const cid = i.course_external_id || "";
    if (!cid) continue;
    const intakeId = `${cid}__${i.intake_month || ""}__${i.intake_year || ""}`;
    const fee = num(i.tuition_fee_amount);
    const cur = i.tuition_fee_currency || "";
    await db.crmCourseIntakeFee.upsert({
      where: { id: intakeId },
      update: {
        courseId: cid,
        universityId: await getUniversityIdForCourse(cid),
        intakeMonth: i.intake_month || "",
        intakeYear: num(i.intake_year),
        intakeName: `${i.intake_month || ""} ${i.intake_year || ""}`.trim(),
        applicationDeadline: i.application_deadline || "",
        tuitionCurrency: cur,
        yearlyTuition: fee,
        totalTuition: fee,
        tuitionPeriod: i.tuition_fee_period || "",
        depositCurrency: cur,
        depositAmount: num(i.deposit_amount),
        appFeeCurrency: cur,
        appFeeAmount: num(i.application_fee),
        feeSourceUrl: i.fee_source_url || "",
        verificationStatus: "VERIFIED",
        status: "active",
        lastCheckedAt: NOW_ISO,
      },
      create: {
        id: intakeId,
        courseId: cid,
        universityId: await getUniversityIdForCourse(cid),
        intakeMonth: i.intake_month || "",
        intakeYear: num(i.intake_year),
        intakeName: `${i.intake_month || ""} ${i.intake_year || ""}`.trim(),
        applicationDeadline: i.application_deadline || "",
        tuitionCurrency: cur,
        yearlyTuition: fee,
        totalTuition: fee,
        tuitionPeriod: i.tuition_fee_period || "",
        depositCurrency: cur,
        depositAmount: num(i.deposit_amount),
        appFeeCurrency: cur,
        appFeeAmount: num(i.application_fee),
        feeSourceUrl: i.fee_source_url || "",
        verificationStatus: "VERIFIED",
        status: "active",
        lastCheckedAt: NOW_ISO,
        batchId: "seed-catalog-2027",
      },
    });
    n++;
  }
  console.log(`  ✓ ${n} intakes seeded (expected ${rows.length})`);
}

// Cache: course_id → university_id
const courseUniCache = new Map<string, string>();
async function getUniversityIdForCourse(courseId: string): Promise<string> {
  if (courseUniCache.has(courseId)) return courseUniCache.get(courseId)!;
  const c = await db.crmCourse.findUnique({ where: { courseId }, select: { universityId: true } });
  const uid = c?.universityId || "";
  courseUniCache.set(courseId, uid);
  return uid;
}

// ── 5. Seed requirements ────────────────────────────────────────────────
async function seedRequirements(): Promise<void> {
  console.log("\n[5/5] Seeding entry requirements…");
  const rows = loadCsv("04_course_requirements.csv");
  let n = 0;
  for (const r of rows) {
    const cid = r.course_external_id || "";
    if (!cid) continue;
    const reqId = `${cid}__${r.requirement_type || "ENTRY"}__${r.english_test_type || "GEN"}__${n}`;
    const ieltsOverall = num(r.english_overall_score);
    const testType = (r.english_test_type || "").toUpperCase();
    const isIelts = testType === "IELTS_ACADEMIC" || testType === "IELTS";
    const isPte = testType === "PTE";
    const isToefl = testType === "TOEFL_IBT" || testType === "TOEFL";
    await db.crmCourseRequirement.upsert({
      where: { id: reqId },
      update: {
        courseId: cid,
        universityId: await getUniversityIdForCourse(cid),
        academicReq: r.requirement_text_original || r.accepted_qualification || "",
        acceptedQualifications: r.accepted_qualification || "",
        gradingSystem: r.qualification_system || "",
        minScore: r.minimum_percentage || r.minimum_gpa || r.minimum_grade || "",
        englishTest: r.english_test_type || "",
        ieltsOverall: isIelts ? ieltsOverall : 0,
        ieltsMinBand: isIelts ? num(r.english_writing_score) : 0,
        pteOverall: isPte ? ieltsOverall : 0,
        toeflOverall: isToefl ? ieltsOverall : 0,
        componentScores: JSON.stringify({
          listening: r.english_listening_score || "",
          reading: r.english_reading_score || "",
          writing: r.english_writing_score || "",
          speaking: r.english_speaking_score || "",
        }),
        workExperience: r.minimum_work_experience_months || "",
        moiAccepted: boolStr(r.moi_waiver_possible),
        portfolioRequired: boolStr(r.portfolio_required),
        interviewRequired: boolStr(r.interview_required),
        prerequisiteSubjects: r.required_subject || "",
        countrySpecificRequirement: r.applicant_country || "",
        officialRequirementUrl: r.source_url || "",
        verificationStatus: "VERIFIED",
        lastCheckedAt: NOW_ISO,
      },
      create: {
        id: reqId,
        courseId: cid,
        universityId: await getUniversityIdForCourse(cid),
        academicReq: r.requirement_text_original || r.accepted_qualification || "",
        acceptedQualifications: r.accepted_qualification || "",
        gradingSystem: r.qualification_system || "",
        minScore: r.minimum_percentage || r.minimum_gpa || r.minimum_grade || "",
        englishTest: r.english_test_type || "",
        ieltsOverall: isIelts ? ieltsOverall : 0,
        ieltsMinBand: isIelts ? num(r.english_writing_score) : 0,
        pteOverall: isPte ? ieltsOverall : 0,
        toeflOverall: isToefl ? ieltsOverall : 0,
        componentScores: JSON.stringify({
          listening: r.english_listening_score || "",
          reading: r.english_reading_score || "",
          writing: r.english_writing_score || "",
          speaking: r.english_speaking_score || "",
        }),
        workExperience: r.minimum_work_experience_months || "",
        moiAccepted: boolStr(r.moi_waiver_possible),
        portfolioRequired: boolStr(r.portfolio_required),
        interviewRequired: boolStr(r.interview_required),
        prerequisiteSubjects: r.required_subject || "",
        countrySpecificRequirement: r.applicant_country || "",
        officialRequirementUrl: r.source_url || "",
        verificationStatus: "VERIFIED",
        lastCheckedAt: NOW_ISO,
        batchId: "seed-catalog-2027",
      },
    });
    n++;
  }
  console.log(`  ✓ ${n} requirements seeded (expected ${rows.length})`);
}

// ── Main ────────────────────────────────────────────────────────────────
async function main() {
  console.log("============================================================");
  console.log("ALO Education — Catalog Seed (Jan 2027 – Jan 2028)");
  console.log(`Upload dir: ${UPLOAD_DIR}`);
  console.log(`Database:   ${process.env.DATABASE_URL ? "configured" : "MISSING — set DATABASE_URL"}`);
  console.log("============================================================");

  if (!process.env.DATABASE_URL) {
    console.error("\n✗ DATABASE_URL environment variable is required");
    process.exit(1);
  }

  try {
    const countryIdByCode = await seedCountries();
    await seedUniversities(countryIdByCode);
    await seedCourses();
    await seedIntakes();
    await seedRequirements();

    // Final counts
    const uCount = await db.crmUniversity.count();
    const cCount = await db.crmCourse.count();
    const iCount = await db.crmCourseIntakeFee.count();
    const rCount = await db.crmCourseRequirement.count();
    const publicUnis = await db.crmUniversity.count({
      where: { status: "active", verificationStatus: "VERIFIED", publicationStatus: { in: ["published", "PUBLISHED"] } },
    });
    const publicCourses = await db.crmCourse.count({
      where: { status: "active", verificationStatus: "VERIFIED", publicationStatus: { in: ["published", "PUBLISHED"] } },
    });

    console.log("\n" + "============================================================");
    console.log("SEED COMPLETE");
    console.log("============================================================");
    console.log(`CrmUniversity total:          ${uCount}  (public: ${publicUnis})`);
    console.log(`CrmCourse total:              ${cCount}  (public: ${publicCourses})`);
    console.log(`CrmCourseIntakeFee total:     ${iCount}`);
    console.log(`CrmCourseRequirement total:   ${rCount}`);
    console.log("\n→ All public records are now visible at /course-finder and /universities");
  } catch (err) {
    console.error("\n✗ Seed failed:", err);
    process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

main();
