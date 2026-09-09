import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { courseId, universityId, intakeYear, intakeMonth } = body;

      if (!courseId) {
        return NextResponse.json({ success: false, error: 'courseId is required' }, { status: 400 });
      }

      // Find or create student record for this user
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

      // Find course details
      const course = await db.crmCourse.findFirst({
        where: { OR: [{ courseId }, { id: courseId }] },
        include: { university: true, intakeFees: true, requirements: true },
      });

      if (!course) {
        return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
      }

      const targetIntake = intakeMonth || course.intakeFees?.[0]?.intakeMonth || 'September';
      const targetYear = intakeYear || course.intakeFees?.[0]?.intakeYear || 2026;

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
          applicationCode: appCode,
          studentId: student.id,
          universityName: course.university?.name || universityId || '',
          courseName: course.courseTitle,
          intake: `${targetIntake} ${targetYear}`,
          country: course.country || course.university?.country || 'United Kingdom',
          campus: course.campus || 'Main Campus',
          level: course.studyLevel || 'Postgraduate',
          stage: 'counseling',
          status: 'draft',
          reviewStatus: 'pending',
          documentStatus: 'pending',
          paymentStatus: 'pending',
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

      // Create Timeline Entry
      await db.timelineEvent.create({
        data: {
          studentId: student.id,
          stage: 'counseling',
          title: `Application Drafted: ${course.courseTitle}`,
          description: `Student initiated university application for ${course.university?.name} (${targetIntake} ${targetYear}). Document checklist created.`,
          actor: auth.name || 'Student',
        },
      }).catch(() => null);

      return NextResponse.json({
        success: true,
        message: 'Application draft created successfully with document checklist.',
        applicationId: application.id,
        applicationCode: application.applicationCode,
        data: application,
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
    }
  })(request);
}
