import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { buildDuplicateKey } from '@/lib/crm/import-constants';
import { MAX_CELL_LENGTH, MAX_COURSE_TITLE_LENGTH } from '@/lib/course-finder/catalogue-import-service';
import {
  INTERNATIONAL_ELIGIBILITY_REVIEW_VALUES,
  normalizeIntakeMonth,
} from '@/lib/university-intake-window';

function getVal(row: Record<string, string>, field: string): string {
  return (row[field] || '').trim();
}

function getNum(row: Record<string, string>, field: string, fallback: number = 0): number {
  const v = getVal(row, field);
  if (!v) return fallback;
  const n = Number(v);
  return !Number.isFinite(n) ? fallback : n;
}

function getBool(row: Record<string, string>, field: string, fallback: boolean = false): boolean {
  const v = getVal(row, field).toUpperCase();
  if (v === 'TRUE') return true;
  if (v === 'FALSE') return false;
  return fallback;
}

function intakeDuplicateKey(universityId: string, courseId: string, year: string, month: string) {
  const monthNumber = normalizeIntakeMonth(month);
  return buildDuplicateKey(universityId, courseId, year, monthNumber ? String(monthNumber).padStart(2, '0') : month.trim().toLowerCase());
}

function courseOnlyDuplicateKey(universityId: string, courseId: string) {
  return `${universityId}|${courseId}|COURSE_ONLY`;
}

function universityOnlyDuplicateKey(universityId: string) {
  return `${universityId}|UNIVERSITY_ONLY`;
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
  try {
    if (!['ADMIN', 'SUPER_ADMIN'].includes(auth.userType.toUpperCase()) || !mutationOriginAllowed(req, auth)) return NextResponse.json({ error: 'Administrator and same-origin request required' }, { status: 403 });
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return NextResponse.json({ error: 'Invalid import body' }, { status: 400 });
    const { importType, rows, batchName } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
      return NextResponse.json({ error: 'Provide between 1 and 500 rows' }, { status: 400 });
    }

    if (rows.some(row => {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return true;
      if (Object.entries(row).some(([key, value]) => typeof value !== 'string' || value.length > (key === 'course_title' ? MAX_COURSE_TITLE_LENGTH : MAX_CELL_LENGTH))) return true;
      if (!['university_id', 'university_name'].every(key => getVal(row, key))) return true;
      const courseId = getVal(row, 'course_id');
      const courseTitle = getVal(row, 'course_title');
      if (!!courseId !== !!courseTitle) return true;
      const intakeYear = getVal(row, 'intake_year');
      const intakeMonth = getVal(row, 'intake_month');
      if (!!intakeYear !== !!intakeMonth) return true;
      if (!courseId && (intakeYear || intakeMonth)) return true;
      if (intakeYear && !/^\d{4}$/.test(intakeYear)) return true;
      if (intakeMonth && !normalizeIntakeMonth(intakeMonth)) return true;
      const eligibility = getVal(row, 'international_eligibility').toLowerCase();
      if (eligibility && !(INTERNATIONAL_ELIGIBILITY_REVIEW_VALUES as readonly string[]).includes(eligibility)) return true;
      return false;
    })) {
      return NextResponse.json({ error: 'Each row needs string cells (maximum 191 characters), university/course identifiers and names. Intake year/month are optional but must be provided together; eligibility must use a supported status.' }, { status: 400 });
    }

    const batchId = `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    let rowsImported = 0;
    let rowsFailed = 0;
    let rowsDuplicate = 0;
    const importErrors: { rowNumber: number; universityId: string; courseId: string; field: string; errorMessage: string; severity: string; rowData: string }[] = [];

    // Pre-check duplicates against DB
    const existingIntakes = await db.crmCourseIntakeFee.findMany({
      select: { universityId: true, courseId: true, intakeYear: true, intakeMonth: true },
    });
    const existingKeys = new Set<string>();
    for (const intake of existingIntakes) {
      existingKeys.add(intakeDuplicateKey(intake.universityId, intake.courseId, String(intake.intakeYear), intake.intakeMonth));
    }

    const csvKeys = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;
      const uid = getVal(row, 'university_id');
      const cid = getVal(row, 'course_id');
      const intakeYearText = getVal(row, 'intake_year');
      const iyear = getNum(row, 'intake_year');
      const imonth = getVal(row, 'intake_month');
      const hasCourse = !!cid;
      const hasIntake = hasCourse && !!intakeYearText && !!imonth;

      // University-only and course-only rows have separate duplicate keys; neither fabricates an intake.
      const key = !hasCourse
        ? universityOnlyDuplicateKey(uid)
        : hasIntake ? intakeDuplicateKey(uid, cid, intakeYearText, imonth) : courseOnlyDuplicateKey(uid, cid);
      if (existingKeys.has(key) || csvKeys.has(key)) {
        rowsDuplicate++;
        importErrors.push({
          rowNumber,
          universityId: uid,
          courseId: cid,
          field: 'duplicate_key',
          errorMessage: hasCourse ? `Duplicate: ${uid}/${cid}/${iyear}/${imonth}` : `Duplicate university candidate: ${uid}`,
          severity: 'error',
          rowData: JSON.stringify({ university_id: uid, course_id: cid, intake_year: intakeYearText, intake_month: imonth }).slice(0, 191),
        });
        continue;
      }
      csvKeys.add(key);

      try {
        await db.$transaction(async tx => {
        // 1. Upsert University
        const existingUni = await tx.crmUniversity.findUnique({
          where: { universityId: uid },
        });

        // An import is never verification. Do not overwrite approved/public rows;
        // those require the existing reviewed update workflow.
        const existingCourse = hasCourse ? await tx.crmCourse.findFirst({ where: { universityId: uid, courseId: cid } }) : null;
        const protectedUniversity = !!existingUni && (existingUni.verificationStatus.toUpperCase().startsWith('VERIFIED') || existingUni.publicationStatus.toUpperCase() === 'PUBLISHED');
        const protectedCourse = !!existingCourse && (existingCourse.verificationStatus.toUpperCase().startsWith('VERIFIED') || existingCourse.publicationStatus.toUpperCase() === 'PUBLISHED');
        if (protectedCourse) {
          throw new Error('Reviewed or published catalogue records require a reviewed update request, not bulk overwrite');
        }
        const uniStatus = 'draft';

        if (existingUni && !protectedUniversity) {
          const updated = await tx.crmUniversity.updateMany({
            where: { id: existingUni.id, updatedAt: existingUni.updatedAt, publicationStatus: { notIn: ['published', 'PUBLISHED'] }, verificationStatus: { notIn: ['VERIFIED', 'verified', 'VERIFIED_OFFICIAL'] } },
            data: {
              name: getVal(row, 'university_name') || existingUni.name,
              country: getVal(row, 'country') || existingUni.country,
              city: getVal(row, 'city') || existingUni.city,
              campusName: getVal(row, 'campus_name') || existingUni.campusName,
              ranking: getNum(row, 'ranking', existingUni.ranking),
              worldRanking: getNum(row, 'world_ranking', existingUni.worldRanking),
              type: getVal(row, 'university_type') || existingUni.type,
              founded: getNum(row, 'founded', existingUni.founded),
              students: getVal(row, 'students') || existingUni.students,
              ieltsMin: getNum(row, 'ielts_min', existingUni.ieltsMin),
              scholarships: getBool(row, 'scholarships', existingUni.scholarships),
              featured: getBool(row, 'featured', existingUni.featured),
              website: getVal(row, 'university_website') || getVal(row, 'website') || existingUni.website,
              officialUrl: getVal(row, 'university_official_url') || getVal(row, 'official_url') || existingUni.officialUrl,
              sourceUrl: getVal(row, 'university_source_url') || getVal(row, 'source_url') || existingUni.sourceUrl,
              lastVerifiedAt: '',
              verificationStatus: 'NEEDS_REVIEW',
              publicationStatus: 'draft',
              status: uniStatus,
              updatedAt: new Date(Math.max(Date.now(), existingUni.updatedAt.getTime() + 1)),
            },
          });
          if (updated.count !== 1) throw new Error('University changed during import; retry after review');
        } else if (!existingUni) {
          await tx.crmUniversity.create({
            data: {
              universityId: uid,
              name: getVal(row, 'university_name') || 'Unknown University',
              country: getVal(row, 'country'),
              city: getVal(row, 'city'),
              campusName: getVal(row, 'campus_name'),
              ranking: getNum(row, 'ranking'),
              worldRanking: getNum(row, 'world_ranking'),
              type: getVal(row, 'university_type'),
              founded: getNum(row, 'founded'),
              students: getVal(row, 'students'),
              ieltsMin: getNum(row, 'ielts_min'),
              scholarships: getBool(row, 'scholarships'),
              featured: getBool(row, 'featured'),
              website: getVal(row, 'university_website') || getVal(row, 'website'),
              officialUrl: getVal(row, 'university_official_url') || getVal(row, 'official_url'),
              sourceUrl: getVal(row, 'university_source_url') || getVal(row, 'source_url'),
              lastVerifiedAt: '',
              verificationStatus: 'NEEDS_REVIEW',
              publicationStatus: 'draft',
              status: uniStatus,
            },
          });
        }

        if (!hasCourse) {
          await tx.portalAuditLog.create({ data: {
            actorUserId: auth.actorUserId,
            action: 'CATALOG_ROW_IMPORTED',
            entityType: 'CrmUniversity',
            entityId: uid,
            metadata: JSON.stringify({ identityDomain: auth.identityDomain, effectiveUserId: auth.userId, batchId, universityId: uid, universityOnly: true, publicationStatus: 'draft' }),
          } });
          return;
        }

        // 2. Upsert Course
        const courseStatus = 'draft';

        if (existingCourse) {
          const updated = await tx.crmCourse.updateMany({
            where: { id: existingCourse.id, updatedAt: existingCourse.updatedAt, publicationStatus: { notIn: ['published', 'PUBLISHED'] }, verificationStatus: { notIn: ['VERIFIED', 'verified', 'VERIFIED_OFFICIAL'] } },
            data: {
              courseTitle: getVal(row, 'course_title') || existingCourse.courseTitle,
              studyLevel: getVal(row, 'study_level') || existingCourse.studyLevel,
              programLevel: getVal(row, 'program_level') || existingCourse.programLevel,
              subjectArea: getVal(row, 'subject_area') || existingCourse.subjectArea,
              disciplineArea: getVal(row, 'discipline_area') || existingCourse.disciplineArea,
              durationMonths: getNum(row, 'duration_months', existingCourse.durationMonths),
              publicTags: getVal(row, 'public_tags') || existingCourse.publicTags,
              officialUrl: getVal(row, 'course_official_url') || getVal(row, 'official_url') || existingCourse.officialUrl,
              sourceUrl: getVal(row, 'course_source_url') || getVal(row, 'source_url') || existingCourse.sourceUrl,
              internationalEligibility: getVal(row, 'international_eligibility').toLowerCase() || existingCourse.internationalEligibility,
              lastVerifiedAt: '',
              verificationStatus: 'NEEDS_REVIEW',
              publicationStatus: 'draft',
              status: courseStatus,
              updatedAt: new Date(Math.max(Date.now(), existingCourse.updatedAt.getTime() + 1)),
            },
          });
          if (updated.count !== 1) throw new Error('Course changed during import; retry after review');
        } else {
          await tx.crmCourse.create({
            data: {
              universityId: uid,
              courseId: cid,
              courseTitle: getVal(row, 'course_title') || 'Unnamed Course',
              studyLevel: getVal(row, 'study_level'),
              programLevel: getVal(row, 'program_level'),
              subjectArea: getVal(row, 'subject_area'),
              disciplineArea: getVal(row, 'discipline_area'),
              durationMonths: getNum(row, 'duration_months'),
              publicTags: getVal(row, 'public_tags'),
              officialUrl: getVal(row, 'course_official_url') || getVal(row, 'official_url'),
              sourceUrl: getVal(row, 'course_source_url') || getVal(row, 'source_url'),
              internationalEligibility: getVal(row, 'international_eligibility').toLowerCase() || 'not_verified',
              lastVerifiedAt: '',
              verificationStatus: 'NEEDS_REVIEW',
              publicationStatus: 'draft',
              status: courseStatus,
            },
          });
        }

        // Course writes above serialize this importer's duplicate check. Unique
        // universityId/courseId constraints reject concurrent creates. No retry
        // after ambiguous failures; row transaction rolls back before reporting.
        if (hasIntake) {
          const duplicateIntake = await tx.crmCourseIntakeFee.findFirst({ where: { universityId: uid, courseId: cid, intakeYear: iyear, intakeMonth: imonth }, select: { id: true } });
          if (duplicateIntake) throw new Error('Intake already exists; not duplicated');
          // 3. Create CourseIntakeFee
          await tx.crmCourseIntakeFee.create({
            data: {
              universityId: uid,
              courseId: cid,
              intakeYear: iyear,
              intakeMonth: imonth,
              intakeName: getVal(row, 'intake_name'),
              applicationDeadline: getVal(row, 'application_deadline'),
              appFeeCurrency: getVal(row, 'app_fee_currency').toUpperCase(),
              appFeeAmount: getNum(row, 'app_fee_amount'),
              tuitionCurrency: getVal(row, 'tuition_currency').toUpperCase(),
              yearlyTuition: getNum(row, 'yearly_tuition'),
              totalTuition: getNum(row, 'total_tuition'),
              depositCurrency: getVal(row, 'deposit_currency').toUpperCase(),
              depositAmount: getNum(row, 'deposit_amount'),
              batchId,
              status: 'draft',
              verificationStatus: 'NEEDS_REVIEW',
            },
          });
        }

        // Only create a requirements row when the import contains requirement facts.
        const requirementFields = [
          'academic_req', 'grading_system', 'min_score', 'ielts_overall', 'ielts_min_band',
          'pte_overall', 'pte_min_band', 'toefl_overall', 'det_overall', 'moi_accepted',
          'portfolio_required', 'interview_required',
        ];
        if (requirementFields.some((field) => getVal(row, field))) {
          await tx.crmCourseRequirement.create({
            data: {
              universityId: uid,
              courseId: cid,
              academicReq: getVal(row, 'academic_req'),
              gradingSystem: getVal(row, 'grading_system'),
              minScore: getVal(row, 'min_score'),
              ieltsOverall: getNum(row, 'ielts_overall'),
              ieltsMinBand: getNum(row, 'ielts_min_band'),
              pteOverall: getNum(row, 'pte_overall'),
              pteMinBand: getNum(row, 'pte_min_band'),
              toeflOverall: getNum(row, 'toefl_overall'),
              detOverall: getNum(row, 'det_overall'),
              moiAccepted: getBool(row, 'moi_accepted'),
              ownEnglishTest: false,
              portfolioRequired: getBool(row, 'portfolio_required'),
              interviewRequired: getBool(row, 'interview_required'),
              batchId,
              verificationStatus: 'NEEDS_REVIEW',
            },
          });
        }

        // 5. Create Scholarship if data provided
        const scholarshipName = getVal(row, 'scholarship_name');
        if (scholarshipName) {
          await tx.crmScholarship.create({
            data: {
              universityId: uid,
              courseId: cid,
              scholarshipName,
              scholarshipAmount: getNum(row, 'scholarship_amount'),
              scholarshipCurrency: getVal(row, 'tuition_currency').toUpperCase(),
              batchId,
              status: 'draft',
            verificationStatus: 'NEEDS_REVIEW',
            },
          });
        }

        // 6. Create Commission if internal data provided
        const internalExpected = getNum(row, 'internal_expected');
        if (hasIntake && internalExpected > 0) {
          await tx.crmCommission.create({
            data: {
              universityId: uid,
              courseId: cid,
              intakeYear: iyear,
              intakeMonth: imonth,
              internalExpected,
              internalIncreased: 0,
              partnerCommission: 0,
              internalNotes: getVal(row, 'internal_notes'),
              batchId,
            },
          });
        }

        await tx.portalAuditLog.create({ data: {
          actorUserId: auth.actorUserId, action: 'CATALOG_ROW_IMPORTED', entityType: 'CrmCourse', entityId: cid,
          metadata: JSON.stringify({ identityDomain: auth.identityDomain, effectiveUserId: auth.userId, batchId, universityId: uid, publicationStatus: 'draft' }),
        } });
        }, { maxWait: 5000, timeout: 20000 });

        rowsImported++;
      } catch (rowError) {
        rowsFailed++;
        console.error('[catalog.import.row]', rowError);
        const msg = rowError instanceof Error && /^(Reviewed or published|University changed|Course changed|Intake already)/.test(rowError.message) ? rowError.message : 'Row import failed; no row changes committed';
        importErrors.push({
          rowNumber,
          universityId: uid,
          courseId: cid,
          field: 'import',
          errorMessage: msg,
          severity: 'error',
          rowData: JSON.stringify({ university_id: uid, course_id: cid, intake_year: intakeYearText, intake_month: imonth }).slice(0, 191),
        });
      }
    }

    // Create ImportBatch record
    await db.crmImportBatch.create({
      data: {
        id: batchId,
        importType: importType || 'course_combined',
        fileName: batchName || 'manual_import',
        rowsReceived: rows.length,
        rowsImported,
        rowsFailed,
        rowsDuplicate,
        rowsWarning: 0,
        rowsBlocked: rowsFailed + rowsDuplicate,
        rollbackAvailable: false, // No before-image snapshot exists for updated draft rows
        status: 'completed',
      },
    });

    // Create ImportError records
    for (const err of importErrors) {
      await db.crmImportError.create({
        data: {
          batchId,
          rowNumber: err.rowNumber,
          universityId: err.universityId,
          courseId: err.courseId,
          field: err.field,
          errorMessage: err.errorMessage,
          severity: err.severity,
          rowData: err.rowData,
        },
      });
    }

    // Create AuditLog
    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.actorUserId,
        actorRole: auth.userType,
        action: 'import_batch_completed',
        targetCollection: 'CrmImportBatch',
        targetId: batchId,
        batchId,
        afterData: JSON.stringify({
          importType: importType || 'course_combined',
          rowsReceived: rows.length,
          rowsImported,
          rowsFailed,
          rowsDuplicate,
          batchName: batchName || '',
        }),
      },
    });

    return NextResponse.json({
      batchId,
      rowsImported,
      rowsFailed,
      rowsDuplicate,
      errors: importErrors,
    });
  } catch (error) {
    console.error('[catalog.import]', error);
    return NextResponse.json({ error: 'Catalogue import failed' }, { status: 500 });
  }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
}