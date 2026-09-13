/**
 * ALO Education — Seed Universities & Courses
 * Seeds the CrmUniversity and CrmCourse tables with real data
 * matching the reference site (https://alo-education-copy.base44.app).
 *
 * Run: npx tsx prisma/seed-universities.ts
 */

import { db } from '../src/lib/db';

const UNIVERSITIES = [
  // UK
  { name: 'University of Oxford', country: 'United Kingdom', city: 'Oxford', worldRanking: 1, students: 24000, founded: 1096, type: 'Public', ieltsMin: 7.0, scholarships: true, featured: true, website: 'https://www.ox.ac.uk' },
  { name: 'University of Cambridge', country: 'United Kingdom', city: 'Cambridge', worldRanking: 2, students: 24000, founded: 1209, type: 'Public', ieltsMin: 7.0, scholarships: true, featured: true, website: 'https://www.cam.ac.uk' },
  { name: 'Imperial College London', country: 'United Kingdom', city: 'London', worldRanking: 6, students: 22000, founded: 1907, type: 'Public', ieltsMin: 6.5, scholarships: true, featured: true, website: 'https://www.imperial.ac.uk' },
  { name: 'UCL', country: 'United Kingdom', city: 'London', worldRanking: 9, students: 47000, founded: 1826, type: 'Public', ieltsMin: 6.5, scholarships: true, featured: false, website: 'https://www.ucl.ac.uk' },
  { name: 'University of Edinburgh', country: 'United Kingdom', city: 'Edinburgh', worldRanking: 22, students: 45000, founded: 1583, type: 'Public', ieltsMin: 6.5, scholarships: true, featured: false, website: 'https://www.ed.ac.uk' },
  { name: 'University of Manchester', country: 'United Kingdom', city: 'Manchester', worldRanking: 34, students: 40000, founded: 1824, type: 'Public', ieltsMin: 6.0, scholarships: true, featured: false, website: 'https://www.manchester.ac.uk' },
  { name: 'University of Leeds', country: 'United Kingdom', city: 'Leeds', worldRanking: 75, students: 39000, founded: 1904, type: 'Public', ieltsMin: 6.0, scholarships: true, featured: false, website: 'https://www.leeds.ac.uk' },
  { name: 'University of Derby', country: 'United Kingdom', city: 'Derby', worldRanking: 1001, students: 22000, founded: 1992, type: 'Public', ieltsMin: 6.0, scholarships: true, featured: false, website: 'https://www.derby.ac.uk' },
  { name: 'Ravensbourne University London', country: 'United Kingdom', city: 'London', worldRanking: 1001, students: 2600, founded: 1962, type: 'Public', ieltsMin: 6.0, scholarships: true, featured: false, website: 'https://www.ravensbourne.ac.uk' },

  // USA
  { name: 'MIT', country: 'United States', city: 'Cambridge', worldRanking: 3, students: 11500, founded: 1861, type: 'Private', ieltsMin: 7.0, scholarships: true, featured: true, website: 'https://www.mit.edu' },
  { name: 'Harvard University', country: 'United States', city: 'Cambridge', worldRanking: 4, students: 23000, founded: 1636, type: 'Private', ieltsMin: 7.0, scholarships: true, featured: true, website: 'https://www.harvard.edu' },
  { name: 'Stanford University', country: 'United States', city: 'Stanford', worldRanking: 5, students: 17000, founded: 1885, type: 'Private', ieltsMin: 7.0, scholarships: true, featured: true, website: 'https://www.stanford.edu' },
  { name: 'Columbia University', country: 'United States', city: 'New York', worldRanking: 23, students: 33000, founded: 1754, type: 'Private', ieltsMin: 7.0, scholarships: true, featured: false, website: 'https://www.columbia.edu' },

  // Canada
  { name: 'University of Toronto', country: 'Canada', city: 'Toronto', worldRanking: 18, students: 97000, founded: 1827, type: 'Public', ieltsMin: 6.5, scholarships: true, featured: true, website: 'https://www.utoronto.ca' },
  { name: 'University of British Columbia', country: 'Canada', city: 'Vancouver', worldRanking: 47, students: 65000, founded: 1908, type: 'Public', ieltsMin: 6.5, scholarships: true, featured: false, website: 'https://www.ubc.ca' },
  { name: 'McGill University', country: 'Canada', city: 'Montreal', worldRanking: 30, students: 41000, founded: 1821, type: 'Public', ieltsMin: 6.5, scholarships: true, featured: false, website: 'https://www.mcgill.ca' },

  // Australia
  { name: 'University of Melbourne', country: 'Australia', city: 'Melbourne', worldRanking: 14, students: 52000, founded: 1853, type: 'Public', ieltsMin: 6.5, scholarships: true, featured: true, website: 'https://www.unimelb.edu.au' },
  { name: 'University of Sydney', country: 'Australia', city: 'Sydney', worldRanking: 19, students: 70000, founded: 1850, type: 'Public', ieltsMin: 6.5, scholarships: true, featured: false, website: 'https://www.sydney.edu.au' },
  { name: 'UNSW Sydney', country: 'Australia', city: 'Sydney', worldRanking: 19, students: 64000, founded: 1949, type: 'Public', ieltsMin: 6.5, scholarships: true, featured: false, website: 'https://www.unsw.edu.au' },
  { name: 'Monash University', country: 'Australia', city: 'Melbourne', worldRanking: 42, students: 86000, founded: 1958, type: 'Public', ieltsMin: 6.5, scholarships: true, featured: false, website: 'https://www.monash.edu' },

  // Ireland
  { name: 'Trinity College Dublin', country: 'Ireland', city: 'Dublin', worldRanking: 81, students: 18000, founded: 1592, type: 'Public', ieltsMin: 6.5, scholarships: true, featured: true, website: 'https://www.tcd.ie' },
  { name: 'University College Dublin', country: 'Ireland', city: 'Dublin', worldRanking: 171, students: 33000, founded: 1854, type: 'Public', ieltsMin: 6.5, scholarships: true, featured: false, website: 'https://www.ucd.ie' },

  // New Zealand
  { name: 'University of Auckland', country: 'New Zealand', city: 'Auckland', worldRanking: 65, students: 42000, founded: 1883, type: 'Public', ieltsMin: 6.0, scholarships: true, featured: true, website: 'https://www.auckland.ac.nz' },
  { name: 'University of Otago', country: 'New Zealand', city: 'Dunedin', worldRanking: 184, students: 21000, founded: 1869, type: 'Public', ieltsMin: 6.0, scholarships: true, featured: false, website: 'https://www.otago.ac.nz' },

  // Germany
  { name: 'Technical University of Munich', country: 'Germany', city: 'Munich', worldRanking: 28, students: 47000, founded: 1868, type: 'Public', ieltsMin: 6.5, scholarships: true, featured: true, website: 'https://www.tum.de' },
  { name: 'Heidelberg University', country: 'Germany', city: 'Heidelberg', worldRanking: 47, students: 30000, founded: 1386, type: 'Public', ieltsMin: 6.0, scholarships: true, featured: false, website: 'https://www.uni-heidelberg.de' },

  // UAE
  { name: 'NYU Abu Dhabi', country: 'Dubai/UAE', city: 'Abu Dhabi', worldRanking: 200, students: 2000, founded: 2010, type: 'Private', ieltsMin: 7.0, scholarships: true, featured: true, website: 'https://nyuad.nyu.edu' },
];

const COURSES = [
  // Oxford
  { uni: 'University of Oxford', title: 'BSc Computer Science', level: 'Bachelor', months: 36, tuitionFee: 38000, subject: 'Computer Science' },
  { uni: 'University of Oxford', title: 'MSc Business Management', level: 'Master', months: 12, tuitionFee: 45000, subject: 'Business' },
  // Cambridge
  { uni: 'University of Cambridge', title: 'BA Economics', level: 'Bachelor', months: 36, tuitionFee: 35000, subject: 'Economics' },
  { uni: 'University of Cambridge', title: 'MPhil Computer Science', level: 'Master', months: 12, tuitionFee: 42000, subject: 'Computer Science' },
  // Imperial
  { uni: 'Imperial College London', title: 'MSc Data Science', level: 'Master', months: 12, tuitionFee: 41000, subject: 'Data Science' },
  { uni: 'Imperial College London', title: 'BEng Mechanical Engineering', level: 'Bachelor', months: 48, tuitionFee: 39000, subject: 'Engineering' },
  // UCL
  { uni: 'UCL', title: 'MSc Machine Learning', level: 'Master', months: 12, tuitionFee: 38000, subject: 'AI/ML' },
  // Edinburgh
  { uni: 'University of Edinburgh', title: 'MA Architecture', level: 'Bachelor', months: 48, tuitionFee: 32000, subject: 'Architecture' },
  // Manchester
  { uni: 'University of Manchester', title: 'MSc Data Science', level: 'Master', months: 12, tuitionFee: 30000, subject: 'Data Science' },
  // Leeds
  { uni: 'University of Leeds', title: 'MSc Computer Science', level: 'Master', months: 12, tuitionFee: 28000, subject: 'Computer Science' },
  // Derby
  { uni: 'University of Derby', title: 'MRes Leadership and Management', level: 'Master', months: 12, tuitionFee: 18000, subject: 'Business' },
  // Ravensbourne
  { uni: 'Ravensbourne University London', title: 'BSc Business Management', level: 'Bachelor', months: 36, tuitionFee: 17000, subject: 'Business' },
  // MIT
  { uni: 'MIT', title: 'BS Computer Science', level: 'Bachelor', months: 48, tuitionFee: 55000, subject: 'Computer Science' },
  { uni: 'MIT', title: 'MS Electrical Engineering', level: 'Master', months: 24, tuitionFee: 53000, subject: 'Engineering' },
  // Harvard
  { uni: 'Harvard University', title: 'BA Economics', level: 'Bachelor', months: 48, tuitionFee: 54000, subject: 'Economics' },
  // Stanford
  { uni: 'Stanford University', title: 'MS Computer Science', level: 'Master', months: 24, tuitionFee: 55000, subject: 'Computer Science' },
  // Columbia
  { uni: 'Columbia University', title: 'MS Data Science', level: 'Master', months: 18, tuitionFee: 58000, subject: 'Data Science' },
  // Toronto
  { uni: 'University of Toronto', title: 'BSc Computer Science', level: 'Bachelor', months: 48, tuitionFee: 35000, subject: 'Computer Science' },
  // UBC
  { uni: 'University of British Columbia', title: 'MEng Mechanical', level: 'Master', months: 24, tuitionFee: 32000, subject: 'Engineering' },
  // McGill
  { uni: 'McGill University', title: 'MBA', level: 'Master', months: 24, tuitionFee: 45000, subject: 'Business' },
  // Melbourne
  { uni: 'University of Melbourne', title: 'Master of Business Analytics', level: 'Master', months: 18, tuitionFee: 47000, subject: 'Business' },
  // Sydney
  { uni: 'University of Sydney', title: 'Master of Engineering', level: 'Master', months: 18, tuitionFee: 46000, subject: 'Engineering' },
  // UNSW
  { uni: 'UNSW Sydney', title: 'MSc Computer Science', level: 'Master', months: 24, tuitionFee: 44000, subject: 'Computer Science' },
  // Monash
  { uni: 'Monash University', title: 'Master of Business Analytics', level: 'Master', months: 24, tuitionFee: 45000, subject: 'Business' },
  // TCD
  { uni: 'Trinity College Dublin', title: 'BA Business', level: 'Bachelor', months: 48, tuitionFee: 22000, subject: 'Business' },
  // Auckland
  { uni: 'University of Auckland', title: 'BE Software Engineering', level: 'Bachelor', months: 48, tuitionFee: 32000, subject: 'Engineering' },
  // TUM
  { uni: 'Technical University of Munich', title: 'MSc Computer Science', level: 'Master', months: 24, tuitionFee: 0, subject: 'Computer Science' },
  // NYU Abu Dhabi
  { uni: 'NYU Abu Dhabi', title: 'BA Computer Science', level: 'Bachelor', months: 48, tuitionFee: 58000, subject: 'Computer Science' },
];

async function main() {
  console.log('🌍 Seeding universities...');
  let uniCount = 0;
  for (const u of UNIVERSITIES) {
    try {
      const universityId = `UNI-${String(++uniCount).padStart(4, '0')}`;
      // Check if exists by name first
      const existing = await db.crmUniversity.findFirst({ where: { name: u.name } });
      if (existing) {
        await db.crmUniversity.update({
          where: { id: existing.id },
          data: {
            country: u.country,
            city: u.city,
            worldRanking: u.worldRanking,
            students: String(u.students),
            founded: u.founded,
            type: u.type,
            ieltsMin: u.ieltsMin,
            scholarships: u.scholarships,
            featured: u.featured,
            website: u.website,
            status: 'active',
          },
        });
      } else {
        await db.crmUniversity.create({
          data: {
            universityId,
            name: u.name,
            country: u.country,
            city: u.city,
            worldRanking: u.worldRanking,
            students: String(u.students),
            founded: u.founded,
            type: u.type,
            ieltsMin: u.ieltsMin,
            scholarships: u.scholarships,
            featured: u.featured,
            website: u.website,
            status: 'active',
          },
        });
      }
    } catch (e) {
      console.error(`Error seeding ${u.name}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log(`✓ Seeded ${uniCount} universities`);

  console.log('📚 Seeding courses...');
  let courseCount = 0;
  for (const c of COURSES) {
    try {
      const uni = await db.crmUniversity.findFirst({ where: { name: c.uni } });
      if (!uni) {
        console.warn(`University not found for course: ${c.uni} - ${c.title}`);
        continue;
      }
      const existingCourse = await db.crmCourse.findFirst({
        where: { universityId: uni.universityId, courseTitle: c.title },
      });
      if (existingCourse) {
        await db.crmCourse.update({
          where: { id: existingCourse.id },
          data: {
            studyLevel: c.level,
            durationMonths: c.months,
            subjectArea: c.subject,
            status: 'active',
          },
        });
        // Upsert tuition fee record
        const existingFee = await db.crmCourseIntakeFee.findFirst({
          where: { universityId: uni.universityId, courseId: existingCourse.courseId },
        });
        if (existingFee) {
          await db.crmCourseIntakeFee.update({
            where: { id: existingFee.id },
            data: { yearlyTuition: c.tuitionFee, tuitionCurrency: 'USD' },
          });
        } else {
          await db.crmCourseIntakeFee.create({
            data: {
              universityId: uni.universityId,
              courseId: existingCourse.courseId,
              intakeYear: new Date().getFullYear() + 1,
              intakeMonth: 'September',
              tuitionCurrency: 'USD',
              yearlyTuition: c.tuitionFee,
            },
          });
        }
      } else {
        const courseId = `CRS-${String(++courseCount).padStart(4, '0')}`;
        await db.crmCourse.create({
          data: {
            universityId: uni.universityId,
            courseId,
            courseTitle: c.title,
            studyLevel: c.level,
            durationMonths: c.months,
            subjectArea: c.subject,
            status: 'active',
          },
        });
        // Create tuition fee record
        await db.crmCourseIntakeFee.create({
          data: {
            universityId: uni.universityId,
            courseId,
            intakeYear: new Date().getFullYear() + 1,
            intakeMonth: 'September',
            tuitionCurrency: 'USD',
            yearlyTuition: c.tuitionFee,
          },
        });
      }
      courseCount++;
    } catch (e) {
      console.error(`Error seeding ${c.title}:`, e instanceof Error ? e.message : e);
    }
  }
  console.log(`✓ Seeded ${courseCount} courses`);
}

main()
  .then(() => {
    console.log('🎉 Seed completed successfully');
    process.exit(0);
  })
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  });
