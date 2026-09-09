import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

// ============================================================
// STUDENT 360 — UNIFIED PROFILE API
// GET /api/counselor/students/:studentId
// One Student, One Profile, Many Views
// Requires: EMPLOYEE userType
// ============================================================

const EMPLOYEE_AUTH = {
  requireUserTypes: ['EMPLOYEE', 'SUPER_ADMIN', 'ADMIN'],
};

export const GET = withAuth(async (
  request: Request,
  auth: AuthContext
) => {
  // Extract studentId from URL — dynamic route param
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const studentId = pathParts[pathParts.length - 1];

  try {
    // Fetch core student record
    const student = await db.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json(
        { success: false, error: 'Student not found' },
        { status: 404 }
      );
    }

    // Fetch all related data in parallel
    const [
      educationRecords,
      passport,
      englishTests,
      applications,
      studentVisibleComments,
      internalComments,
      timelineEvents,
      profileSections,
    ] = await Promise.all([
      db.studentEducation.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      }),
      db.studentPassport.findFirst({
        where: { studentId },
      }),
      db.studentEnglishTest.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      }),
      db.application.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      }),
      db.studentVisibleComment.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      }),
      db.internalComment.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      }),
      db.timelineEvent.findMany({
        where: { studentId },
        orderBy: { createdAt: 'desc' },
      }),
      db.studentProfileSection.findMany({
        where: { studentId },
      }),
    ]);

    const studentProfile = {
      id: student.id,
      studentId: student.studentId,
      name: student.name,
      email: student.email,
      phone: student.phone,
      userType: student.userType,
      journeyStage: student.journeyStage,
      status: student.status,
      currentCountry: student.currentCountry,
      currentCity: student.currentCity,
      source: 'portal',
      partnerTag: null,
      assignedCounselor: student.counselorName || null,
      counselorId: student.counselorId || null,
      profileComplete: student.profileComplete,

      personal: {
        dateOfBirth: '',
        gender: '',
        nationality: passport?.nationality || 'Bangladeshi',
        city: student.currentCity,
      },

      education: educationRecords.map(edu => ({
        level: edu.level,
        institution: edu.institution,
        degree: edu.degree || edu.field,
        gpa: edu.gpa,
        startYear: edu.startYear,
        endYear: edu.endYear,
      })),

      passport: passport ? {
        number: passport.passportNumber,
        expiryDate: passport.expiryDate,
        issueDate: passport.issueDate,
      } : null,

      englishTests: englishTests.map(test => ({
        testType: test.testType,
        overall: test.overallScore,
        reading: test.readingScore,
        writing: test.writingScore,
        listening: test.listeningScore,
        speaking: test.speakingScore,
        testDate: test.testDate,
      })),

      applications: applications.map(app => ({
        id: app.id,
        university: app.universityName,
        course: app.courseName,
        country: app.country,
        intake: app.intake,
        stage: app.stage,
        status: app.status,
        submissionChannel: 'direct',
        counselorId: app.counselorId,
        counselorName: app.counselorName,
      })),

      studentVisibleComments: studentVisibleComments.map(c => ({
        id: c.id,
        author: c.authorName,
        role: c.authorRole,
        content: c.content,
        time: c.createdAt.toISOString(),
        isAi: c.isAiGenerated,
      })),

      internalComments: internalComments.map(c => ({
        id: c.id,
        author: c.authorName,
        role: c.authorRole,
        commentType: c.commentType,
        visibility: c.visibility,
        content: c.content,
        time: c.createdAt.toISOString(),
      })),

      timeline: timelineEvents.map(event => ({
        stage: event.stage,
        title: event.title,
        description: event.description,
        actor: event.actor,
        channel: 'portal',
        timestamp: event.createdAt.toISOString(),
      })),

      profileSections: profileSections.map(section => ({
        section: section.section,
        status: section.status,
        completedAt: section.completedAt?.toISOString() || null,
      })),
    };

    return NextResponse.json({
      success: true,
      data: studentProfile,
    });
  } catch (error) {
    console.error('Student profile error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load student profile' },
      { status: 500 }
    );
  }
}, EMPLOYEE_AUTH);
