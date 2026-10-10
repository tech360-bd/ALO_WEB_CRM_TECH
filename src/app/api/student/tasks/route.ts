import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { resolveStudentAccess } from '@/lib/student-resource-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/student/tasks
 *
 * Student-scoped task list (spec §58). Returns the tasks attached to *this*
 * student's own applications, resolved through resolveStudentAccess so the
 * student id is derived from the session rather than trusted from the request.
 *
 * Cancelled tasks are internal workflow noise and are never shown to a student.
 */
export async function GET(request: NextRequest) {
  const access = await resolveStudentAccess(request, request.nextUrl.searchParams.get('studentId'));
  if (access instanceof NextResponse) return access;

  const status = request.nextUrl.searchParams.get('status');

  try {
    const applications = await db.application.findMany({
      where: { studentId: access.studentId },
      select: { id: true },
    });

    if (applications.length === 0) {
      return NextResponse.json({ success: true, data: [], total: 0 });
    }

    const where: Record<string, unknown> = {
      applicationId: { in: applications.map((application) => application.id) },
      status: { not: 'CANCELLED' },
    };
    if (status && ['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
      where.status = status;
    }

    const tasks = await db.applicationTask.findMany({
      where,
      include: {
        application: {
          select: { id: true, applicationCode: true, universityName: true, courseName: true },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ success: true, data: tasks, total: tasks.length });
  } catch (error) {
    console.error('[student/tasks] error:', error);
    return NextResponse.json(
      { success: false, error: 'We could not load your tasks. Please try again.' },
      { status: 500 },
    );
  }
}
