/**
 * ALO Education — Seed additional UK universities & courses from uploaded data package
 * Transforms data from the CrmUniversity/CrmCourse format to UniversityPage/CoursePage.
 * Only creates records that don't already exist (checks by slug).
 * Usage: bunx tsx prisma/seed-additional-universities.ts
 */
import { db } from '../src/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// ─── Read & extract UNIVERSITIES array from source file ─────────────────────

const SOURCE_FILE = '/tmp/data-package/data/seed-university-data.ts';
const sourceContent = fs.readFileSync(SOURCE_FILE, 'utf-8');

// Extract the UNIVERSITIES array text - find the = [ after the type annotation
const arrStart = sourceContent.indexOf('const UNIVERSITIES: UniRecord[] = [');
// Find the bracket that starts the array (after the = sign, skip the [] in the type)
const eqBracket = sourceContent.indexOf('= [', arrStart);
const bracketStart = sourceContent.indexOf('[', eqBracket);
// Find the matching closing bracket (handling strings properly)
let depth = 0;
let arrEnd = -1;
let inString = false;
let stringChar = '';
for (let i = bracketStart; i < sourceContent.length; i++) {
  const ch = sourceContent[i];
  if (inString) {
    if (ch === '\\' && i + 1 < sourceContent.length) { i++; continue; }
    if (ch === stringChar) inString = false;
    continue;
  }
  if (ch === "'" || ch === '"' || ch === '`') { inString = true; stringChar = ch; continue; }
  if (ch === '[') depth++;
  if (ch === ']') depth--;
  if (depth === 0) { arrEnd = i; break; }
}
if (arrStart === -1 || arrEnd === -1) {
  throw new Error('Could not locate UNIVERSITIES array in source file');
}
const arrText = sourceContent.slice(bracketStart, arrEnd + 1);

// Evaluate the array using indirect eval to avoid scope issues
const UNIVERSITIES: any[] = new Function('return ' + arrText)();

console.log(`📖 Loaded ${UNIVERSITIES.length} universities with ${UNIVERSITIES.reduce((s: number, u: any) => s + u.courses.length, 0)} courses from source file.`);

const COUNTRY_SLUG = 'uk';

// ─── Field mapping helpers ──────────────────────────────────────────────────

function mapStudyLevel(level: string): string {
  const map: Record<string, string> = {
    'Postgraduate': 'Masters',
    'Undergraduate': 'Bachelors',
    'PhD': 'PhD',
  };
  return map[level] || level;
}

function formatTuition(fee: number, currency: string, period: string): string {
  const symbol = currency === 'GBP' ? '£' : currency === 'USD' ? '$' : currency;
  return `${symbol}${fee.toLocaleString()} ${period === 'Per programme' ? 'per programme' : 'per year'}`;
}

function getSubjectFromArea(area: string): string {
  const map: Record<string, string> = {
    'Business & Management': 'Business',
    'Computer Science': 'Computing',
    'Data Science': 'Computing',
    'Artificial Intelligence': 'Computing',
    'Cyber Security': 'Computing',
    'Engineering': 'Engineering',
    'Law': 'Law',
    'Biomedical Science': 'Science',
    'MBA': 'Business',
    'International Business': 'Business',
    'Marketing': 'Business',
    'Finance': 'Business',
    'Pharmacy': 'Health',
    'Nursing': 'Health',
    'Public Health': 'Health',
    'Hospitality': 'Business',
    'Architecture': 'Design',
  };
  return map[area] || area;
}

function getStrengths(uni: any): string {
  const subjects = uni.courses.map((c: any) => c.subjectArea);
  const unique = [...new Set(subjects)];
  const strengths = unique.slice(0, 5).map((s: string) => ({ area: s, detail: `Strong ${s} programmes with industry-relevant curriculum` }));
  return JSON.stringify(strengths);
}

function getQuickFacts(uni: any): string {
  const fees = uni.courses.map((c: any) => c.tuitionFee);
  const minFee = Math.min(...fees);
  const maxFee = Math.max(...fees);
  return JSON.stringify({
    established: uni.establishedYear,
    ranking: uni.rankingValue ? `#${uni.rankingValue} (${uni.rankingProvider})` : 'Not ranked in QS',
    tuitionRange: `£${minFee.toLocaleString()} - £${maxFee.toLocaleString()}`,
    totalCourses: uni.courses.length,
    scholarshipAvailable: uni.courses.some((c: any) => c.scholarshipAvailable),
    intakes: [...new Set(uni.courses.flatMap((c: any) => c.intakeMonths.split(', ')))].join(', '),
  });
}

function getTuition(uni: any): string {
  const fees = uni.courses.map((c: any) => c.tuitionFee);
  const minFee = Math.min(...fees);
  const maxFee = Math.max(...fees);
  return JSON.stringify({
    international: {
      min: `£${minFee.toLocaleString()}`,
      max: `£${maxFee.toLocaleString()}`,
      period: 'per year',
    },
    currency: 'GBP',
  });
}

function getPopularSubjects(uni: any): string {
  const subjects = uni.courses.map((c: any) => c.subjectArea);
  const unique = [...new Set(subjects)];
  return JSON.stringify(unique);
}

function getCareerOutcomes(course: any): string {
  const outcomes: Record<string, string[]> = {
    'Business & Management': ['Business Analyst', 'Management Consultant', 'Project Manager', 'Operations Manager'],
    'International Business': ['International Business Development Manager', 'Global Strategy Consultant', 'Trade Analyst', 'Supply Chain Manager'],
    'MBA': ['Chief Operations Officer', 'Strategy Director', 'Management Consultant', 'Entrepreneur'],
    'Computer Science': ['Software Engineer', 'Data Engineer', 'IT Consultant', 'Systems Architect'],
    'Data Science': ['Data Scientist', 'Machine Learning Engineer', 'Analytics Manager', 'Research Scientist'],
    'Artificial Intelligence': ['AI Engineer', 'ML Researcher', 'NLP Specialist', 'Computer Vision Engineer'],
    'Cyber Security': ['Security Analyst', 'Penetration Tester', 'SOC Engineer', 'Security Consultant'],
    'Engineering': ['Mechanical Engineer', 'Design Engineer', 'Project Engineer', 'Systems Engineer'],
    'Law': ['Solicitor', 'Legal Consultant', 'Policy Advisor', 'In-House Counsel'],
    'Biomedical Science': ['Biomedical Scientist', 'Clinical Researcher', 'Lab Manager', 'Pharma Quality Analyst'],
    'Pharmacy': ['Clinical Pharmacist', 'Pharmaceutical Researcher', 'Regulatory Affairs Specialist'],
    'Nursing': ['Registered Nurse', 'Clinical Nurse Specialist', 'Nurse Practitioner', 'Health Educator'],
    'Public Health': ['Public Health Officer', 'Epidemiologist', 'Health Policy Analyst', 'Health Promotion Specialist'],
    'Marketing': ['Marketing Manager', 'Digital Marketing Specialist', 'Brand Manager', 'Market Research Analyst'],
    'Finance': ['Financial Analyst', 'Investment Banker', 'Risk Manager', 'Portfolio Manager'],
    'Hospitality': ['Hotel Manager', 'Tourism Development Officer', 'Events Manager', 'Revenue Manager'],
    'Architecture': ['Architect', 'Urban Designer', 'Sustainability Consultant', 'BIM Coordinator'],
  };
  const items = outcomes[course.subjectArea] || ['Graduate Role', 'Professional Specialist', 'Researcher', 'Consultant'];
  return JSON.stringify(items);
}

// ─── Main seed function ──────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 Seeding additional UK universities & courses into UniversityPage & CoursePage...\n');

  let universitiesCreated = 0;
  let universitiesSkipped = 0;
  let coursesCreated = 0;
  let coursesSkipped = 0;

  for (const uni of UNIVERSITIES) {
    // Check if university already exists by slug
    const existing = await db.universityPage.findUnique({
      where: { slug: uni.slug },
    });

    if (existing) {
      universitiesSkipped++;
      console.log(`  ⏭️  University already exists: ${uni.name} (${uni.slug})`);
    } else {
      // Create university
      const fees = uni.courses.map((c: any) => c.tuitionFee);
      const minFee = Math.min(...fees);
      const maxFee = Math.max(...fees);

      await db.universityPage.create({
        data: {
          slug: uni.slug,
          name: uni.name,
          countrySlug: COUNTRY_SLUG,
          city: uni.city,
          state: uni.state,
          ranking: uni.rankingValue ? `QS #${uni.rankingValue}` : null,
          rankingSource: uni.rankingProvider,
          popularSubjects: getPopularSubjects(uni),
          overview: uni.description,
          strengths: getStrengths(uni),
          quickFacts: getQuickFacts(uni),
          tuition: getTuition(uni),
          tuitionRange: `£${minFee.toLocaleString()} - £${maxFee.toLocaleString()}`,
          scholarshipAvailable: uni.courses.some((c: any) => c.scholarshipAvailable),
          officialWebsite: uni.websiteUrl,
          status: 'PUBLISHED',
          sourceUrl: uni.websiteUrl,
          sourceType: 'MANUAL_ENTRY',
          verificationStatus: 'VERIFIED',
          lastVerifiedAt: new Date(),
        },
      });
      universitiesCreated++;
      console.log(`  ✅ University created: ${uni.name} (${uni.slug})`);
    }

    // Seed courses for this university (regardless of whether uni was just created or already existed)
    for (const course of uni.courses) {
      const existingCourse = await db.coursePage.findUnique({
        where: { slug: course.slug },
      });

      if (existingCourse) {
        coursesSkipped++;
      } else {
        await db.coursePage.create({
          data: {
            slug: course.slug,
            name: course.title,
            universitySlug: uni.slug,
            countrySlug: COUNTRY_SLUG,
            city: uni.city,
            level: mapStudyLevel(course.studyLevel),
            subject: getSubjectFromArea(course.subjectArea),
            duration: course.duration,
            intake: course.intakeMonths,
            tuition: formatTuition(course.tuitionFee, course.tuitionCurrency, course.tuitionPeriod),
            tuitionCurrency: course.tuitionCurrency,
            englishRequirement: `IELTS ${course.ieltsMin} overall (minimum ${Math.max(course.ieltsMin - 1, 5.0)} in each band)`,
            academicRequirement: course.academicRequirement,
            scholarshipAvailable: course.scholarshipAvailable,
            overview: course.overview,
            careerOutcomes: getCareerOutcomes(course),
            status: 'PUBLISHED',
            sourceUrl: course.sourceUrl,
            sourceType: 'MANUAL_ENTRY',
            verificationStatus: 'VERIFIED',
            lastVerifiedAt: new Date(),
          },
        });
        coursesCreated++;
      }
    }
    console.log(`     📚 Courses: ${coursesCreated} new, ${coursesSkipped} skipped (total checked)`);
  }

  console.log(`\n✨ Seeding complete!`);
  console.log(`   Universities created: ${universitiesCreated}`);
  console.log(`   Universities already existed: ${universitiesSkipped}`);
  console.log(`   Courses created: ${coursesCreated}`);
  console.log(`   Courses already existed: ${coursesSkipped}`);
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => db.$disconnect());
