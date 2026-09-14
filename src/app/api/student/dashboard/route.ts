import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';

export const GET = withStudentAuth(async (request, auth) => {
  try {
    const student = await db.student.findUnique({
      where: { id: auth.studentId },
      select: {
        id: true,
        studentId: true,
        name: true,
        email: true,
        phone: true,
        profileComplete: true,
        journeyStage: true,
        counselorName: true,
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }

    const applicationsList = await db.application.findMany({
      where: { studentId: auth.studentId },
      select: { id: true, stage: true, status: true },
    });

    const activeApplications = applicationsList.filter(app => app.status === 'active');

    const stages = applicationsList.reduce((acc, app) => {
      acc[app.stage] = (acc[app.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const documents = await db.studentDocument.findMany({
      where: { studentId: auth.studentId },
    });

    const docStats = {
      total: documents.length,
      verified: documents.filter(d => d.status === 'verified').length,
      missing: documents.filter(d => d.status === 'not_uploaded').length,
      pending: documents.filter(d => d.status === 'under_review').length,
    };

    const messages = await db.studentMessage.findMany({
      where: { studentId: auth.studentId },
      orderBy: { createdAt: 'desc' },
    });

    const unreadMessages = messages.filter(m => !m.isRead).length;
    const lastMessage = messages.length > 0 ? {
      content: messages[0].message,
      createdAt: messages[0].createdAt,
    } : undefined;

    const nextBestActions = await db.studentNextBestAction.findMany({
      where: { studentId: auth.studentId, status: { not: "COMPLETED" } },
    });

    const priorityOrder: Record<string, number> = { urgent: 1, high: 2, medium: 3, low: 4 };
    nextBestActions.sort((a, b) => (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5));
    const topNextBestActions = nextBestActions.slice(0, 3);

    const timeline = await db.timelineEvent.findMany({
      where: { studentId: auth.studentId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const visaReadiness = await db.visaReadinessReport.findFirst({
      where: { studentId: auth.studentId },
      orderBy: { generatedAt: 'desc' },
    });

    const recentDocuments = await db.studentDocument.findMany({
      where: { studentId: auth.studentId },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    // Upcoming deadlines logic - find applications with deadlines
    const appsWithDeadlines = await db.application.findMany({
      where: {
        studentId: auth.studentId,
        deadline: { not: '' }
      },
      select: {
        id: true,
        universityName: true,
        deadline: true,
      }
    });

    const upcomingDeadlines = appsWithDeadlines.map(app => ({
      applicationId: app.id,
      universityName: app.universityName,
      deadline: app.deadline,
      type: 'Application Deadline'
    }));

    // Sort deadlines if they are valid dates... let's just leave it as is or try to sort if it's ISO
    // Here we'll just keep it simple.

    const interviewPrograms: any[] = []; // Schema doesn't support linking AiInterviewSession to application

    return NextResponse.json({
      success: true,
      data: {
        student,
        applications: {
          total: applicationsList.length,
          active: activeApplications.length,
          stages,
        },
        documents: docStats,
        messages: {
          unread: unreadMessages,
          lastMessage,
        },
        nextBestActions: topNextBestActions,
        timeline,
        visaReadiness,
        recentDocuments,
        upcomingDeadlines,
        interviewPrograms
      }
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load dashboard data' },
      { status: 500 }
    );
  }
});
