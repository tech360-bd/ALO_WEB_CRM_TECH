import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';

export const PATCH = withStudentAuth(async (request, auth) => {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    // URL pattern: /api/student/next-best-action/[id]/complete
    // so [id] is the second to last part
    const id = parts[parts.length - 2];

    if (!id) {
      return NextResponse.json({ success: false, error: 'Action ID is required' }, { status: 400 });
    }

    const action = await db.studentNextBestAction.findUnique({
      where: { id },
    });

    if (!action) {
      return NextResponse.json({ success: false, error: 'Action not found' }, { status: 404 });
    }

    if (action.studentId !== auth.studentId) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    if (action.isCompleted) {
      return NextResponse.json({ success: true, data: action }); // Already completed
    }

    const updatedAction = await db.studentNextBestAction.update({
      where: { id },
      data: {
        isCompleted: true,
        completedAt: new Date()
      }
    });

    return NextResponse.json({ success: true, data: updatedAction });
  } catch (error) {
    console.error('NextBestAction Complete PATCH Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to complete action' }, { status: 500 });
  }
});
