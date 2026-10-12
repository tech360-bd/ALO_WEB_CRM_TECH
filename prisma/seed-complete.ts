/// <reference types="node" />
import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

function loadCSV(filePath: string) {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf-8');
  return parse(content, { columns: true, skip_empty_lines: true });
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

async function seedUniversities() {
  // Synthetic datasets are read only from the non-production fixture archive (no root fallback).
  const root = path.resolve(__dirname, '..', 'fixtures', 'synthetic-catalogue');
  const uniPath = path.join(root, 'universities.csv');
  const coursesPath = path.join(root, 'courses.csv');
  const intakesPath = path.join(root, 'course_intakes.csv');
  const feesPath = path.join(root, 'tuition_fees.csv');
  const reqsPath = path.join(root, 'course_requirements.csv');
  const engPath = path.join(root, 'english_requirements.csv');

  const universities = loadCSV(uniPath);
  const courses = loadCSV(coursesPath);
  const intakes = loadCSV(intakesPath);
  const fees = loadCSV(feesPath);
  const reqs = loadCSV(reqsPath);
  const engs = loadCSV(engPath);

  console.log(`[Seed] Universities CSV: ${universities.length}, Courses: ${courses.length}, Intakes: ${intakes.length}, Fees: ${fees.length}`);

  // GCU London verification - log GCU courses
  const gcuCourses = courses.filter((c:any)=> c.university_id==='UNI-UN-0090');
  console.log(`[Seed] GCU London (UNI-UN-0090) courses: ${gcuCourses.length}`);
  gcuCourses.slice(0,3).forEach((c:any)=> console.log(`  - ${c.course_title} (${c.course_id}) ${c.duration_months}mo`));

  if (universities.length===0) {
    console.log('[Seed] No universities.csv found - skipping university seed');
    return;
  }

  console.log(`[Seed] Upserting ${universities.length} universities (560 required) ...`);
  // Batch upsert 50 at a time
  for (let i=0;i<universities.length;i+=50) {
    const batch = universities.slice(i,i+50);
    await db.$transaction(batch.map((u:any)=> db.crmUniversity.upsert({
      where: { universityId: u.university_id },
      update: {
        name: u.name,
        slug: slugify(u.name),
        country: u.country,
        city: u.city,
        website: u.website,
        officialUrl: u.website,
        worldRanking: parseInt(u.world_ranking||'0',10),
        ranking: parseInt(u.world_ranking||'0',10),
        founded: parseInt(u.founded||'0',10),
        type: u.type,
        verificationStatus: u.verification_status||'VERIFIED_OFFICIAL',
        status: u.status||'active',
        lastVerifiedAt: '2026-09-15',
        sourceUrl: u.website,
        sourceUrls: JSON.stringify([u.website]),
      },
      create: {
        universityId: u.university_id,
        universityCode: u.university_id,
        name: u.name,
        slug: slugify(u.name),
        country: u.country,
        city: u.city,
        website: u.website,
        officialUrl: u.website,
        worldRanking: parseInt(u.world_ranking||'0',10),
        ranking: parseInt(u.world_ranking||'0',10),
        founded: parseInt(u.founded||'0',10),
        type: u.type,
        verificationStatus: u.verification_status||'VERIFIED_OFFICIAL',
        status: u.status||'active',
        lastVerifiedAt: '2026-09-15',
        sourceUrl: u.website,
        sourceUrls: JSON.stringify([u.website]),
        rankingYear: 2026,
        publicationStatus: 'published',
        visibility: 'public',
      }
    })));
    console.log(`  batch ${i/50+1}/${Math.ceil(universities.length/50)} done`);
  }

  console.log(`[Seed] Upserting ${courses.length} courses (11200 required) ...`);
  for (let i=0;i<courses.length;i+=100) {
    const batch = courses.slice(i,i+100);
    await db.$transaction(batch.map((c:any)=> {
      const slug = slugify(c.course_title);
      // Determine officialUrl - GCU London courses have detailed URLs, others use pattern
      let officialUrl = c.official_course_url || c.officialUrl || '';
      if (!officialUrl || officialUrl==='') {
        if (c.university_id==='UNI-UN-0090') {
          // GCU London real URLs - map by title
          const map: Record<string,string> = {
            'MSc Advanced Computer Science': 'https://www.gcu.ac.uk/study/courses/msc-advanced-computer-science-multiple-locations',
            'MSc Computer Science': 'https://www.gcu.ac.uk/study/courses/pg/msc-computer-science-multiple-locations',
            'MSc Environmental Management (Waste, Energy, Water, Oil and Gas)': 'https://www.gcu.ac.uk/study/courses/msc-environmental-management-waste,-energy,-water,-oil-and-gas-london',
            'MSc International Management and Business Development': 'https://www.gcu.ac.uk/study/courses/msc-international-management-and-business-development-london',
            'MSc International Marketing': 'https://www.gcu.ac.uk/study/courses/pg/msc-international-marketing',
            'MPH Master of Public Health': 'https://www.gcu.ac.uk/study/courses/pg/mph-master-of-public-health-multiple-locations',
          };
          officialUrl = map[c.course_title] || `https://www.gcu.ac.uk/study/courses/${slug}`;
        } else {
          // generic pattern for other universities
          const uni = universities.find((u:any)=> u.university_id===c.university_id);
          const domain = uni ? new URL(uni.website).hostname : 'example.edu';
          officialUrl = `https://${domain}/courses/${slug}`;
        }
      }
      return db.crmCourse.upsert({
        where: { courseId: c.course_id },
        update: {
          courseTitle: c.course_title,
          name: c.course_title,
          slug,
          studyLevel: c.study_level,
          programLevel: c.program_level,
          subjectArea: c.subject_area,
          durationMonths: parseInt(c.duration_months||'0',10),
          officialUrl,
          country: universities.find((u:any)=> u.university_id===c.university_id)?.country || '',
          city: universities.find((u:any)=> u.university_id===c.university_id)?.city || '',
          verificationStatus: c.verification_status||'CROSS_SOURCE_VERIFIED',
          status: c.status||'active',
          lastVerifiedAt: '2026-09-15',
        },
        create: {
          courseId: c.course_id,
          courseCode: c.course_id,
          universityId: c.university_id,
          courseTitle: c.course_title,
          name: c.course_title,
          slug,
          studyLevel: c.study_level,
          programLevel: c.program_level,
          subjectArea: c.subject_area,
          durationMonths: parseInt(c.duration_months||'0',10),
          officialUrl,
          country: universities.find((u:any)=> u.university_id===c.university_id)?.country || '',
          city: universities.find((u:any)=> u.university_id===c.university_id)?.city || '',
          verificationStatus: c.verification_status||'CROSS_SOURCE_VERIFIED',
          status: c.status||'active',
          lastVerifiedAt: '2026-09-15',
          publicationStatus: 'published',
          visibility: 'public',
          currency: 'GBP',
        }
      });
    }));
    if (i % 1000===0) console.log(`  courses ${i}/${courses.length}`);
  }

  // Intakes + fees via CrmCourseIntakeFee
  console.log(`[Seed] Upserting ${intakes.length} intakes/fees (145600 intakes, 13 per course Jan2027-Jan2028) ...`);
  // Build fee map by course_intake_id
  const feeByIntake: Record<string, any> = {};
  for (const f of fees) {
    feeByIntake[f.course_intake_id] = f;
  }
  for (let i=0;i<intakes.length;i+=100) {
    const batch = intakes.slice(i,i+100);
    await db.$transaction(batch.map((it:any)=> {
      const fee = feeByIntake[it.course_intake_id];
      const intakeYear = parseInt(it.intake_year,10);
      const tuition = fee ? parseFloat(fee.amount||'0') : 0;
      return db.crmCourseIntakeFee.upsert({
        where: { id: it.course_intake_id }, // use intake id as id if schema allows; else we need unique composite. But schema id is cuid - we use courseId+intakeMonth+Year as unique? Fallback to create
        update: {
          intakeYear,
          intakeMonth: it.intake_month,
          intakeName: `${it.intake_month} ${it.intake_year}`,
          applicationDeadline: it.application_deadline,
          tuitionCurrency: fee?.currency || 'GBP',
          yearlyTuition: tuition,
          totalTuition: tuition,
          feeSourceUrl: fee ? `https://example.edu/fees` : '',
          intakeSourceUrl: it.official_source_url || it.source_url || '',
          lastCheckedAt: it.last_verified_at || '2026-09-15',
          verificationStatus: it.verification_status || 'VERIFIED_OFFICIAL',
          status: it.intake_status || 'active',
        },
        create: {
          id: it.course_intake_id,
          universityId: courses.find((c:any)=> c.course_id===it.course_id)?.university_id || '',
          courseId: it.course_id,
          intakeYear,
          intakeMonth: it.intake_month,
          intakeName: `${it.intake_month} ${it.intake_year}`,
          applicationDeadline: it.application_deadline,
          tuitionCurrency: fee?.currency || 'GBP',
          yearlyTuition: tuition,
          totalTuition: tuition,
          feeSourceUrl: fee ? `https://example.edu/fees` : '',
          intakeSourceUrl: it.official_source_url || it.source_url || '',
          lastCheckedAt: it.last_verified_at || '2026-09-15',
          verificationStatus: it.verification_status || 'VERIFIED_OFFICIAL',
          status: it.intake_status || 'active',
        }
      });
    }));
    if (i % 1000===0) console.log(`  intakes ${i}/${intakes.length}`);
  }

  // Requirements
  console.log(`[Seed] Upserting ${reqs.length} academic requirements ...`);
  for (let i=0;i<reqs.length;i+=100) {
    const batch = reqs.slice(i,i+100);
    await db.$transaction(batch.map((r:any)=> db.crmCourseRequirement.upsert({
      where: { id: r.course_requirement_id },
      update: {
        academicReq: r.academic_requirement,
        minScore: r.min_score,
        gradingSystem: r.grading_system,
        portfolioRequired: r.portfolio_required==='yes',
        interviewRequired: r.interview_required==='yes',
        verificationStatus: 'VERIFIED_OFFICIAL',
        lastCheckedAt: '2026-09-15',
      },
      create: {
        id: r.course_requirement_id,
        universityId: courses.find((c:any)=> c.course_id===r.course_id)?.university_id || '',
        courseId: r.course_id,
        academicReq: r.academic_requirement,
        minScore: r.min_score,
        gradingSystem: r.grading_system,
        portfolioRequired: r.portfolio_required==='yes',
        interviewRequired: r.interview_required==='yes',
        verificationStatus: 'VERIFIED_OFFICIAL',
        lastCheckedAt: '2026-09-15',
      }
    })));
  }

  // English requirements are stored in CrmCourseRequirement as well (ielts fields) - merge
  console.log(`[Seed] Merging ${engs.length} english requirements into CrmCourseRequirement ...`);
  // Group engs by course_id
  const engByCourse: Record<string, any[]> = {};
  for (const e of engs) {
    if (!engByCourse[e.course_id]) engByCourse[e.course_id]=[];
    engByCourse[e.course_id].push(e);
  }
  for (const [courseId, tests] of Object.entries(engByCourse)) {
    const ielts = tests.find((t:any)=> t.test_name==='IELTS');
    const pte = tests.find((t:any)=> t.test_name==='PTE');
    if (ielts) {
      try {
        await db.crmCourseRequirement.updateMany({
          where: { courseId },
          data: {
            englishTest: 'IELTS',
            ieltsOverall: parseFloat(ielts.overall_score||'0'),
            ieltsMinBand: parseFloat(ielts.minimum_band_score||'0'),
            pteOverall: pte ? parseFloat(pte.overall_score||'0') : 0,
            pteMinBand: pte ? parseFloat(pte.minimum_band_score||'0') : 0,
            componentScores: JSON.stringify(Object.fromEntries(tests.map((t:any)=> [t.test_name, { overall: t.overall_score, minBand: t.minimum_band_score }]))),
          }
        });
      } catch {}
    }
  }

  console.log(`[Seed] University master seeding complete: ${universities.length} universities, ${courses.length} courses, ${intakes.length} intakes verified 2026-09-15`);
}

async function seedComplete() {
  console.log('[Seed] Starting complete production-safe MySQL seed (system administrator and roles).');

  const adminEmail = process.env.SEED_SUPER_ADMIN_EMAIL || 'admin@aloeducation.com';
  const adminPassword = process.env.SEED_SUPER_ADMIN_PASSWORD;

  if (!adminPassword || adminPassword.length < 12) {
    throw new Error('SEED_SUPER_ADMIN_PASSWORD must be set to a unique value with at least 12 characters.');
  }

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);

  await db.user.upsert({
    where: { email: adminEmail },
    update: { role: 'SUPER_ADMIN', permissions: JSON.stringify(['ALL']) },
    create: { email: adminEmail, name: 'Initial Super Admin', role: 'SUPER_ADMIN', permissions: JSON.stringify(['ALL']) },
  });

  await db.deploymentSequence.upsert({ where: { name: 'complete-production-seed' }, update: {}, create: { name: 'complete-production-seed' } });

  const superAdminRole = await db.portalRole.upsert({ where: { name: 'SUPER_ADMIN' }, update: { label: 'Super Admin', isSystem: true }, create: { name: 'SUPER_ADMIN', label: 'Super Admin', description: 'Initial system administrator role.', isSystem: true } });
  const allPermission = await db.portalPermission.upsert({ where: { module_feature_action: { module: 'system', feature: 'all', action: 'manage' } }, update: {}, create: { module: 'system', feature: 'all', action: 'manage', description: 'Full system administration permission.' } });
  await db.portalRolePermission.upsert({ where: { roleId_permissionId: { roleId: superAdminRole.id, permissionId: allPermission.id } }, update: { granted: true }, create: { roleId: superAdminRole.id, permissionId: allPermission.id, granted: true, assignedBy: 'complete-production-seed' } });
  const portalAdmin = await db.portalUser.upsert({ where: { email: adminEmail }, update: { passwordHash: adminPasswordHash, userType: 'SUPER_ADMIN', status: 'active', firstLoginRequired: true }, create: { email: adminEmail, passwordHash: adminPasswordHash, name: 'Initial Super Admin', userType: 'SUPER_ADMIN', status: 'active', firstLoginRequired: true, emailVerified: true } });
  await db.portalUserRole.upsert({ where: { userId_roleId: { userId: portalAdmin.id, roleId: superAdminRole.id } }, update: {}, create: { userId: portalAdmin.id, roleId: superAdminRole.id, assignedBy: 'complete-production-seed' } });
  await db.employeeCommunicationProfile.upsert({ where: { employeeId: 'system-initial-admin' }, update: {}, create: { employeeId: 'system-initial-admin', employeeName: 'Initial Super Admin', officialEmail: adminEmail, officialPhone: '', whatsappAccess:false, facebookAccess:false, instagramAccess:false, emailAccess:true, assignedBranch:'unassigned', assignedDepartments:JSON.stringify(['Administration']), channelPermissions:JSON.stringify({email:true}), workingHoursStart:'10:00', workingHoursEnd:'18:00' } });

  // University/course catalogue seeding is OFF by default and impossible in production.
  // The synthetic CSVs (fixtures/synthetic-catalogue/universities.csv, courses.csv, ...) are
  // template-generated (e.g. 20 identical course titles per university, a
  // fixed lastVerifiedAt date, every course/intake labelled VERIFIED_OFFICIAL)
  // and this function upserts them as `published`. Loading them would label
  // unverified data as verified and overwrite catalogue rows on every run.
  // University data must arrive through the reviewed CSV import instead
  // (/admin/data-import). Set ALO_SEED_UNIVERSITY_CATALOGUE=1 only on a
  // disposable development database; the flag is ignored when NODE_ENV=production.
  if (process.env.ALO_SEED_UNIVERSITY_CATALOGUE === '1' && process.env.NODE_ENV === 'production') {
    console.warn('[Seed] ALO_SEED_UNIVERSITY_CATALOGUE=1 ignored: synthetic catalogue data is never seeded in production.');
  } else if (process.env.ALO_SEED_UNIVERSITY_CATALOGUE === '1') {
    console.warn('[Seed] ALO_SEED_UNIVERSITY_CATALOGUE=1 — loading template catalogue CSVs (development only).');
    await seedUniversities();
  } else {
    console.log('[Seed] Skipping university/course catalogue seed (use the reviewed CSV import).');
  }

  console.log('[Seed] Completed complete production-safe MySQL seed.');
}

seedComplete().catch((e)=>{console.error('[Seed Error]',e); process.exit(1);}).finally(async()=>{await db.$disconnect();});
