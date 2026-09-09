import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { buildDuplicateKey } from '@/lib/crm/import-constants';

function getVal(row: Record<string, string>, field: string): string {
  return (row[field] || '').trim();
}

function getNum(row: Record<string, string>, field: string, fallback: number = 0): number {
  const v = getVal(row, field);
  const n = Number(v);
  return isNaN(n) ? fallback : n;
}

function getBool(row: Record<string, string>, field: string, fallback: boolean = false): boolean {
  const v = getVal(row, field).toUpperCase();
  if (v === 'TRUE') return true;
  if (v === 'FALSE') return false;
  return fallback;
}

function determineStatus(row: Record<string, string>, defaultStatus: string): string {
  const explicitStatus = getVal(row, 'status').toLowerCase();
  if (['active', 'draft', 'archived', 'needs_review', 'needs_official_source'].includes(explicitStatus)) {
    return explicitStatus;
  }
  const sourceUrl = getVal(row, 'source_url');
  if (!sourceUrl) return 'needs_official_source';
  return defaultStatus;
}

export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { importType, rows, batchName } = body;

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows to import' }, { status: 400 });
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
      existingKeys.add(
        buildDuplicateKey(intake.universityId, intake.courseId, String(intake.intakeYear), intake.intakeMonth)
      );
    }

    const csvKeys = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1;
      const uid = getVal(row, 'university_id');
      const cid = getVal(row, 'course_id');
      const iyear = getNum(row, 'intake_year');
      const imonth = getVal(row, 'intake_month');

      // Duplicate check
      const key = buildDuplicateKey(uid, cid, String(iyear), imonth);
      if (existingKeys.has(key) || csvKeys.has(key)) {
        rowsDuplicate++;
        importErrors.push({
          rowNumber,
          universityId: uid,
          courseId: cid,
          field: 'duplicate_key',
          errorMessage: `Duplicate: ${uid}/${cid}/${iyear}/${imonth}`,
          severity: 'error',
          rowData: JSON.stringify(row),
        });
        continue;
      }
      csvKeys.add(key);

      try {
        // 1. Upsert University
        const existingUni = await db.crmUniversity.findUnique({
          where: { universityId: uid },
        });

        const uniStatus = determineStatus(row, 'active');

        if (existingUni) {
          await db.crmUniversity.update({
            where: { universityId: uid },
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
              website: getVal(row, 'website') || existingUni.website,
              officialUrl: getVal(row, 'official_url') || existingUni.officialUrl,
              sourceUrl: getVal(row, 'source_url') || existingUni.sourceUrl,
              lastVerifiedAt: new Date().toISOString().split('T')[0],
              status: uniStatus,
              updatedAt: new Date(),
            },
          });
        } else {
          await db.crmUniversity.create({
            data: {
              universityId: uid,
              name: getVal(row, 'university_name') || 'Unknown University',
              country: getVal(row, 'country'),
              city: getVal(row, 'city'),
              campusName: getVal(row, 'campus_name'),
              ranking: getNum(row, 'ranking'),
              worldRanking: getNum(row, 'world_ranking'),
              type: getVal(row, 'university_type') || 'Public',
              founded: getNum(row, 'founded'),
              students: getVal(row, 'students'),
              ieltsMin: getNum(row, 'ielts_min'),
              scholarships: getBool(row, 'scholarships'),
              featured: getBool(row, 'featured'),
              website: getVal(row, 'website'),
              officialUrl: getVal(row, 'official_url'),
              sourceUrl: getVal(row, 'source_url'),
              lastVerifiedAt: new Date().toISOString().split('T')[0],
              status: uniStatus,
            },
          });
        }

        // 2. Upsert Course
        const existingCourse = await db.crmCourse.findFirst({
          where: { universityId: uid, courseId: cid },
        });

        const courseStatus = determineStatus(row, 'active');

        if (existingCourse) {
          await db.crmCourse.update({
            where: { id: existingCourse.id },
            data: {
              courseTitle: getVal(row, 'course_title') || existingCourse.courseTitle,
              studyLevel: getVal(row, 'study_level') || existingCourse.studyLevel,
              programLevel: getVal(row, 'program_level') || existingCourse.programLevel,
              subjectArea: getVal(row, 'subject_area') || existingCourse.subjectArea,
              disciplineArea: getVal(row, 'discipline_area') || existingCourse.disciplineArea,
              durationMonths: getNum(row, 'duration_months', existingCourse.durationMonths),
              publicTags: getVal(row, 'public_tags') || existingCourse.publicTags,
              sourceUrl: getVal(row, 'source_url') || existingCourse.sourceUrl,
              lastVerifiedAt: new Date().toISOString().split('T')[0],
              status: courseStatus,
              updatedAt: new Date(),
            },
          });
        } else {
          await db.crmCourse.create({
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
              sourceUrl: getVal(row, 'source_url'),
              lastVerifiedAt: new Date().toISOString().split('T')[0],
              status: courseStatus,
            },
          });
        }

        // 3. Create CourseIntakeFee
        await db.crmCourseIntakeFee.create({
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
            status: 'active',
          },
        });

        // 4. Create CourseRequirement
        await db.crmCourseRequirement.create({
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
          },
        });

        // 5. Create Scholarship if data provided
        const scholarshipName = getVal(row, 'scholarship_name');
        if (scholarshipName) {
          await db.crmScholarship.create({
            data: {
              universityId: uid,
              courseId: cid,
              scholarshipName,
              scholarshipAmount: getNum(row, 'scholarship_amount'),
              scholarshipCurrency: getVal(row, 'tuition_currency').toUpperCase() || 'GBP',
              batchId,
              status: 'active',
            },
          });
        }

        // 6. Create Commission if internal data provided
        const internalExpected = getNum(row, 'internal_expected');
        if (internalExpected > 0) {
          await db.crmCommission.create({
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

        rowsImported++;
      } catch (rowError) {
        rowsFailed++;
        const msg = rowError instanceof Error ? rowError.message : 'Unknown error';
        importErrors.push({
          rowNumber,
          universityId: uid,
          courseId: cid,
          field: 'import',
          errorMessage: msg,
          severity: 'error',
          rowData: JSON.stringify(row),
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
        rollbackAvailable: rowsImported > 0,
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
        actorUserId: '',
        actorRole: 'system',
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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
}