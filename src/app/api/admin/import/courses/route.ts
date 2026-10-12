import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const isAuthorized = ['user', 'portal'].includes(auth.identityDomain || '') && ['ADMIN', 'SUPER_ADMIN'].includes(auth.userType.toUpperCase());
      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'UNAUTHORIZED: Admin authority required' }, { status: 403 });
      }

      if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required' }, { status: 403 });
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== 'object') return NextResponse.json({ success: false, error: 'Invalid import body' }, { status: 400 });
      const { rows, dryRun } = body;

      if (!Array.isArray(rows) || rows.length === 0 || rows.length > 500) {
        return NextResponse.json({ success: false, error: 'Provide between 1 and 500 rows' }, { status: 400 });
      }

      if (rows.some(row => !row || typeof row !== 'object' || Array.isArray(row) || Object.values(row).some(value => typeof value !== 'string' || value.length > 191))) return NextResponse.json({ success: false, error: 'Import cells must be strings of at most 191 characters' }, { status: 400 });
      const validRows: any[] = [];
      const duplicateRows: any[] = [];
      const invalidRows: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const courseTitle = (r.course_title || r.title || r.name || '').trim();
        const universityId = (r.university_id || r.university_code || r.university || '').trim();
        const studyLevel = (r.study_level || r.level || '').trim();
        const tuitionFee = parseFloat(r.tuition_fee || r.tuition || '0') || 0;
        const currency = (r.currency || '').trim();
        const courseCode = (r.course_code || r.courseId || `CRS-${Date.now().toString(36).toUpperCase()}-${i}`).trim();

        if (!courseTitle || !universityId) {
          invalidRows.push({ rowIndex: i + 1, row: r, reason: 'Missing courseTitle or universityId' });
          continue;
        }

        const uni = await db.crmUniversity.findFirst({
          where: {
            OR: [
              { universityId },
              { name: universityId },
            ],
          },
        });

        if (!uni) {
          invalidRows.push({ rowIndex: i + 1, row: r, reason: `University '${universityId}' not found in database.` });
          continue;
        }

        const existing = await db.crmCourse.findFirst({
          where: {
            universityId: uni.universityId,
            courseTitle,
            studyLevel,
          },
        });

        if (existing) {
          duplicateRows.push({ rowIndex: i + 1, row: r, matchedId: existing.courseId, matchedTitle: existing.courseTitle });
        } else {
          validRows.push({
            courseData: {
              courseId: courseCode,
              universityId: uni.universityId,
              courseTitle,
              slug: `${courseTitle}-${uni.name}`.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
              studyLevel,
              subjectArea: (r.subject_area || r.subject || '').trim(),
              disciplineArea: (r.discipline || '').trim(),
              durationMonths: parseInt(r.duration_months || '0', 10) || 0,
              qualification: (r.qualification || '').trim(),
              deliveryMode: (r.delivery_mode || '').trim(),
              campus: (r.campus || uni.campusName || '').trim(),
              city: uni.city,
              country: uni.country,
              sourceUrl: (r.source_url || '').trim(),
              status: 'active',
              publicationStatus: 'draft',
              verificationStatus: 'NEEDS_REVIEW',
              lastVerifiedAt: '',
            },
            feeData: {
              universityId: uni.universityId,
              courseId: courseCode,
              intakeYear: parseInt(r.intake_year || '0', 10) || 0,
              intakeMonth: (r.intake_month || '').trim(),
              yearlyTuition: tuitionFee,
              tuitionCurrency: currency,
              feeSourceUrl: (r.source_url || '').trim(),
              verificationStatus: 'NEEDS_REVIEW',
            },
          });
        }
      }

      if (dryRun) {
        return NextResponse.json({
          success: true,
          preview: {
            totalRows: rows.length,
            validCount: validRows.length,
            duplicateCount: duplicateRows.length,
            invalidCount: invalidRows.length,
            sampleValid: validRows.slice(0, 5),
            duplicates: duplicateRows,
            errors: invalidRows,
          },
        });
      }

      const importedCount = await db.$transaction(async (tx) => {
        let importedCount = 0;
        for (const item of validRows) {
          await tx.crmCourse.create({ data: item.courseData });
          if (item.feeData.yearlyTuition > 0 && item.feeData.intakeYear > 0 && item.feeData.intakeMonth && item.feeData.tuitionCurrency) {
            await tx.crmCourseIntakeFee.create({ data: { ...item.feeData, verificationStatus: 'NEEDS_REVIEW' } });
          }
          importedCount++;
        }

        await tx.crmAuditLog.create({
          data: {
            actorUserId: auth.userId || 'system',
            actorRole: auth.roles[0] || 'ADMIN',
            action: 'BATCH_IMPORT_COURSES',
            targetCollection: 'CrmCourse',
            targetId: `BATCH-CRS-${Date.now()}`,
            afterData: JSON.stringify({ importedCount, skippedDuplicates: duplicateRows.length }),
          },
        });

        return importedCount;
      }, { timeout: 30000 });

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${importedCount} courses. Skipped ${duplicateRows.length} duplicates.`,
        importedCount,
        skippedDuplicates: duplicateRows.length,
        errors: invalidRows,
      });
    } catch {
      return NextResponse.json({ success: false, error: 'Import failed; no batch records were committed.' }, { status: 500 });
    }
  })(request);
}
