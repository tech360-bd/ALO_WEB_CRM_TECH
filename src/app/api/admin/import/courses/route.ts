import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const isAuthorized = auth.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(r));
      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'UNAUTHORIZED: Admin authority required' }, { status: 403 });
      }

      const body = await req.json();
      const { rows, dryRun } = body;

      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Rows array is required' }, { status: 400 });
      }

      const validRows: any[] = [];
      const duplicateRows: any[] = [];
      const invalidRows: any[] = [];

      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const courseTitle = (r.course_title || r.title || r.name || '').trim();
        const universityId = (r.university_id || r.university_code || r.university || '').trim();
        const studyLevel = (r.study_level || r.level || 'Postgraduate').trim();
        const tuitionFee = parseFloat(r.tuition_fee || r.tuition || '0') || 0;
        const currency = (r.currency || 'GBP').trim();
        const courseCode = (r.course_code || r.courseId || `CRS-${Date.now().toString(36).toUpperCase()}-${i}`).trim();

        if (!courseTitle || !universityId) {
          invalidRows.push({ rowIndex: i + 1, row: r, reason: 'Missing courseTitle or universityId' });
          continue;
        }

        const uni = await db.crmUniversity.findFirst({
          where: {
            OR: [
              { universityId },
              { name: { contains: universityId.toLowerCase() } },
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
            courseTitle: { contains: courseTitle.toLowerCase() },
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
              subjectArea: (r.subject_area || r.subject || 'General').trim(),
              disciplineArea: (r.discipline || '').trim(),
              durationMonths: parseInt(r.duration_months || '12', 10) || 12,
              qualification: (r.qualification || 'MSc').trim(),
              deliveryMode: (r.delivery_mode || 'Full-time On Campus').trim(),
              campus: (r.campus || uni.campusName || 'Main Campus').trim(),
              city: uni.city,
              country: uni.country,
              sourceUrl: (r.source_url || '').trim(),
              status: 'verified',
              verificationStatus: r.source_url ? 'VERIFIED' : 'NEEDS_REVIEW',
              lastVerifiedAt: new Date().toISOString(),
            },
            feeData: {
              universityId: uni.universityId,
              courseId: courseCode,
              intakeYear: parseInt(r.intake_year || '2026', 10) || 2026,
              intakeMonth: (r.intake_month || 'September').trim(),
              yearlyTuition: tuitionFee,
              tuitionCurrency: currency,
              feeSourceUrl: (r.source_url || '').trim(),
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

      let importedCount = 0;
      for (const item of validRows) {
        await db.crmCourse.create({ data: item.courseData });
        if (item.feeData.yearlyTuition > 0) {
          await db.crmCourseIntakeFee.create({ data: item.feeData }).catch(() => null);
        }
        importedCount++;
      }

      await db.crmAuditLog.create({
        data: {
          actorUserId: auth.userId || 'system',
          actorRole: auth.roles[0] || 'ADMIN',
          action: 'BATCH_IMPORT_COURSES',
          targetCollection: 'CrmCourse',
          targetId: `BATCH-CRS-${Date.now()}`,
          afterData: JSON.stringify({ importedCount, skippedDuplicates: duplicateRows.length }),
        },
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${importedCount} courses. Skipped ${duplicateRows.length} duplicates.`,
        importedCount,
        skippedDuplicates: duplicateRows.length,
        errors: invalidRows,
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed import' }, { status: 500 });
    }
  })(request);
}
