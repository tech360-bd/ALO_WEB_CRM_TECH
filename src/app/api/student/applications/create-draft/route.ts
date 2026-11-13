import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { publicCourseWhere, publicIntakeWhere } from '@/lib/public-catalog';
import { DEFAULT_APPLICATION_DOCUMENT_REQUIREMENTS, refreshApplicationDocumentStatus } from '@/lib/application-manager/document-readiness';
import { createCanonicalStudent } from '@/lib/student/canonical-student';
import { randomUUID } from 'node:crypto';

const INTAKE_MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function studentSafeApplication(application: any) {
  return {
    id: application.id,
    applicationId: application.applicationId || application.applicationCode || application.id,
    applicationCode: application.applicationCode || '',
    universityId: application.universityId || '',
    universityName: application.universityName || '',
    courseId: application.courseId || '',
    courseName: application.courseName || '',
    country: application.country || '',
    intake: application.intake || '',
    level: application.level || '',
    safeStatus: application.safeStatus || 'DRAFT',
    documentStatus: application.documentStatus || 'PENDING',
    createdAt: application.createdAt || null,
    updatedAt: application.updatedAt || null,
  };
}

function intakeMonthNumber(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const normalized = String(value).trim().toLowerCase();
  if (/^\d{1,2}$/.test(normalized)) {
    const month = Number(normalized);
    return Number.isInteger(month) && month >= 1 && month <= 12 ? month : null;
  }
  if (!/^[a-z]{3,9}$/.test(normalized)) return null;
  const index = INTAKE_MONTHS.findIndex((month) => month === normalized || month.startsWith(normalized));
  return index < 0 ? null : index + 1;
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json().catch(() => null);
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json({ success: false, error: 'A valid application request is required' }, { status: 400 });
      }
      const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';
      const universityId = typeof body.universityId === 'string' ? body.universityId.trim() : '';
      const rawIntakeYear = body.intakeYear;
      const rawIntakeMonth = body.intakeMonth;

      const hasControlCharacters = [...courseId].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
      if (!courseId || courseId.length > 191 || hasControlCharacters) {
        return NextResponse.json({ success: false, error: 'A valid courseId is required' }, { status: 400 });
      }

      // Students may draft only against a published, verified, source-linked
      // course and an intake explicitly verified against its official source.
      // Never fall back to guessed country, level, intake month, or year.
      const course = await db.crmCourse.findFirst({
        where: {
          AND: [
            publicCourseWhere(),
            { OR: [{ courseId }, { id: courseId }] },
          ],
        },
        include: {
          university: true,
          intakeFees: {
            where: { ...publicIntakeWhere(), intakeSourceUrl: { not: '' } },
            orderBy: [{ intakeYear: 'asc' }, { intakeMonth: 'asc' }],
          },
        },
      });

      if (!course) {
        return NextResponse.json({ success: false, error: 'No published, verified course record is available' }, { status: 404 });
      }
      if (universityId && universityId !== course.universityId && universityId !== course.university?.id) {
        return NextResponse.json({ success: false, error: 'The selected university does not match this course' }, { status: 400 });
      }

      const hasIntakeYear = rawIntakeYear !== undefined && rawIntakeYear !== null && String(rawIntakeYear).trim() !== '';
      const hasIntakeMonth = rawIntakeMonth !== undefined && rawIntakeMonth !== null && String(rawIntakeMonth).trim() !== '';
      if (hasIntakeYear !== hasIntakeMonth) {
        return NextResponse.json({ success: false, error: 'Both intakeYear and intakeMonth are required when selecting an intake' }, { status: 400 });
      }

      let selectedIntake: (typeof course.intakeFees)[number] | null = null;
      if (hasIntakeYear) {
        if ((typeof rawIntakeYear !== 'number' && typeof rawIntakeYear !== 'string') || (typeof rawIntakeMonth !== 'number' && typeof rawIntakeMonth !== 'string')) {
          return NextResponse.json({ success: false, error: 'The selected intake is invalid' }, { status: 400 });
        }
        const year = Number(rawIntakeYear);
        const month = intakeMonthNumber(rawIntakeMonth);
        if (!Number.isInteger(year) || year < 1900 || year > 2200 || month === null) {
          return NextResponse.json({ success: false, error: 'The selected intake is invalid' }, { status: 400 });
        }
        selectedIntake = course.intakeFees.find((fee) => fee.intakeYear === year && intakeMonthNumber(fee.intakeMonth) === month) ?? null;
        if (!selectedIntake) {
          return NextResponse.json({ success: false, error: 'That intake is not recorded as source-verified for this course' }, { status: 422 });
        }
      }
      const targetIntake = selectedIntake ? `${selectedIntake.intakeMonth} ${selectedIntake.intakeYear}` : '';

      // Link the authenticated account to a canonical CRM Student record. Never
      // invent a placeholder name, email, phone, or non-canonical Student ID.
      if (!auth.name?.trim() || !auth.email?.trim()) {
        return NextResponse.json({ success: false, code: 'STUDENT_PROFILE_INCOMPLETE', error: 'Your verified account profile needs a real name and email before an application can be created.' }, { status: 422 });
      }
      const canonicalStudent = await createCanonicalStudent({ name: auth.name, email: auth.email, userId: auth.userId });
      if (!canonicalStudent.success) {
        return NextResponse.json({ success: false, code: canonicalStudent.errorCode, error: canonicalStudent.error }, { status: canonicalStudent.errorCode === 'STUDENT_EXISTS_DIFFERENT_OWNER' ? 409 : 503 });
      }
      const student = await db.student.findUnique({ where: { id: canonicalStudent.studentDbId } });
      if (!student) return NextResponse.json({ success: false, error: 'Student profile could not be resolved.' }, { status: 503 });

      // Reuse a draft for the same student, source-verified course, and intake.
      // The lookup is repeated inside the write transaction to reduce duplicate
      // drafts when the client retries the same request.

      const appCode = `APP-${randomUUID().toUpperCase()}`;

      // Create the application and its required-document checklist atomically.
      // Each placeholder is application-scoped; the submission gate can only
      // open after the latest version of every listed requirement is verified.
      const result = await db.$transaction(async (tx) => {
        const existingApp = await tx.application.findFirst({
          where: {
            studentId: student.id,
            courseId: course.courseId,
            universityId: course.universityId,
            intake: targetIntake,
            stage: { notIn: ['CLOSED', 'WITHDRAWN', 'REJECTED'] },
          },
          orderBy: { createdAt: 'desc' },
        });
        if (existingApp) return { application: existingApp, created: false };

        const created = await tx.application.create({
          data: {
            applicationCode: appCode,
            applicationId: appCode,
            studentId: student.id,
            universityId: course.universityId || '',
            universityName: course.university?.name || '',
            courseId: course.courseId,
            courseName: course.courseTitle,
            intake: targetIntake,
            country: course.country || course.university?.country || '',
            level: course.studyLevel || course.programLevel || '',
            applicationSource: 'STUDENT_SELF_APPLICATION',
            stage: 'APPLICATION_DRAFT',
            safeStatus: 'DRAFT',
            status: 'draft',
            reviewStatus: 'PENDING',
            documentStatus: 'PENDING',
            createdBy: auth.userId,
          },
        });

        for (const requirement of DEFAULT_APPLICATION_DOCUMENT_REQUIREMENTS) {
          const studentDocument = await tx.studentDocument.findFirst({
            where: { studentId: student.id, category: requirement.type, isArchived: false },
            orderBy: { version: 'desc' },
            select: { id: true, fileName: true, storagePath: true, fileHash: true, status: true, reviewedBy: true, reviewerNote: true, version: true },
          });
          const hasStoredFile = Boolean(studentDocument?.storagePath && studentDocument.fileHash);
          const studentDocumentStatus = studentDocument?.status.toLowerCase() || '';
          const linkedStatus = !hasStoredFile
            ? 'REQUIRED'
            : ['approved', 'verified'].includes(studentDocumentStatus)
              ? 'VERIFIED'
              : ['needs_update'].includes(studentDocumentStatus)
                ? 'REQUEST_AGAIN'
                : ['rejected'].includes(studentDocumentStatus)
                  ? 'REJECTED'
                  : 'UPLOADED';
          await tx.applicationDocument.create({
            data: {
              applicationId: created.id,
              studentId: student.id,
              documentId: hasStoredFile ? studentDocument!.id : '',
              documentType: requirement.type,
              fileName: hasStoredFile ? studentDocument!.fileName || requirement.label : requirement.label,
              fileUrl: '',
              status: linkedStatus,
              reviewerId: hasStoredFile ? studentDocument!.reviewedBy || '' : '',
              reviewerNote: hasStoredFile ? studentDocument!.reviewerNote || '' : '',
              visibility: 'student_visible',
              version: hasStoredFile ? studentDocument!.version || 1 : 1,
            },
          });
        }
        await refreshApplicationDocumentStatus(tx, created.id);
        await tx.applicationStageHistory.create({
          data: { applicationId: created.id, stage: 'APPLICATION_DRAFT', status: 'completed', note: 'Student application draft created.', actor: auth.userId },
        });
        await tx.applicationStatusLog.create({
          data: { applicationId: created.id, oldStatus: '', newStatus: 'APPLICATION_DRAFT', safeStatus: 'DRAFT', changedBy: auth.userId, visibility: 'public_safe', note: 'Student application draft created with a required-document checklist.' },
        });
        return { application: created, created: true };
      });
      const application = result.application;

      // Create a timeline entry only for a newly created draft.
      const intakeContext = targetIntake ? ` (${targetIntake})` : ' (intake not yet confirmed)';
      if (result.created) await db.timelineEvent.create({
        data: {
          studentId: student.id,
          stage: 'counseling',
          title: `Application Drafted: ${course.courseTitle}`,
          description: `Student initiated university application for ${course.university?.name || 'the selected university'}${intakeContext}. Document checklist created.`,
          actor: auth.name || 'Student',
        },
      }).catch(() => null);

      const safeApplication = studentSafeApplication(application);
      return NextResponse.json({
        success: true,
        message: result.created ? 'Application draft created with a document checklist.' : 'Existing application draft loaded.',
        reused: !result.created,
        databaseId: safeApplication.id,
        applicationId: safeApplication.applicationId,
        data: safeApplication,
      });
    } catch (error) {
      console.error('[student/applications/create-draft] failed', error);
      return NextResponse.json({ success: false, error: 'Failed to create application draft' }, { status: 500 });
    }
  })(request);
}
