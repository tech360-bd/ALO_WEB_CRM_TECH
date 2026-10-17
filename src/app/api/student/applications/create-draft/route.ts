import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { publicCourseWhere, publicIntakeWhere } from '@/lib/public-catalog';

const INTAKE_MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

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

      // Find or create the student's CRM record only after course/intake checks pass.
      let student = await db.student.findFirst({
        where: {
          OR: [
            { id: auth.userId },
            { studentId: auth.userId },
            { email: auth.email },
          ],
        },
      });

      if (!student) {
        student = await db.student.create({
          data: {
            id: auth.userId || `STU-${Date.now()}`,
            studentId: `STU-${Date.now().toString(36).toUpperCase()}`,
            name: auth.name || 'Student Applicant',
            email: auth.email || 'student@aloeducation.com',
            phone: '',
            journeyStage: 'application_drafted',
          },
        });
      }

      // Prevent duplicate draft for same student + course
      const existingApp = await db.application.findFirst({
        where: {
          studentId: student.id,
          courseName: course.courseTitle,
          status: 'draft',
        },
      });

      if (existingApp) {
        return NextResponse.json({
          success: true,
          message: 'Existing application draft loaded.',
          applicationId: existingApp.id,
          data: existingApp,
        });
      }

      const appCode = `APP-${Date.now().toString(36).toUpperCase()}`;

      // Create Application Draft
      const application = await db.application.create({
        data: {
          applicationId: appCode,
          studentId: student.id,
          universityName: course.university?.name || '',
          courseName: course.courseTitle,
          intake: targetIntake,
          country: course.country || course.university?.country || '',
          level: course.studyLevel || course.programLevel || '',
          stage: 'counseling',
          status: 'draft',
        },
      });

      // Create Document Checklist items for Student
      const requiredDocs = [
        { category: 'Passport', fileName: 'Valid Passport (Information Pages)' },
        { category: 'Academic', fileName: 'Academic Certificate & Transcript' },
        { category: 'English', fileName: 'English Proficiency Certificate (IELTS/PTE/MOI)' },
        { category: 'SOP', fileName: 'Statement of Purpose (SOP)' },
        { category: 'CV', fileName: 'Curriculum Vitae (CV) / Resume' },
        { category: 'References', fileName: 'Academic or Professional Recommendation Letters' },
      ];

      for (const doc of requiredDocs) {
        await db.studentDocument.create({
          data: {
            studentId: student.id,
            category: doc.category,
            fileName: doc.fileName,
            status: 'not_uploaded',
          },
        }).catch(() => null);
      }

      // Create Timeline Entry without implying an intake when none was confirmed.
      const intakeContext = targetIntake ? ` (${targetIntake})` : ' (intake not yet confirmed)';
      await db.timelineEvent.create({
        data: {
          studentId: student.id,
          stage: 'counseling',
          title: `Application Drafted: ${course.courseTitle}`,
          description: `Student initiated university application for ${course.university?.name || 'the selected university'}${intakeContext}. Document checklist created.`,
          actor: auth.name || 'Student',
        },
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message: 'Application draft created successfully with document checklist.',
        databaseId: application.id,
        applicationId: application.applicationId,
        data: application,
      });
    } catch (error) {
      console.error('[student/applications/create-draft] failed', error);
      return NextResponse.json({ success: false, error: 'Failed to create application draft' }, { status: 500 });
    }
  })(request);
}
