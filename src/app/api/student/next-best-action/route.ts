import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withStudentAuth } from '@/lib/student-auth';

export const GET = withStudentAuth(async (request, auth) => {
  try {
    const nextBestActions = await db.studentNextBestAction.findMany({
      where: { 
        studentId: auth.studentId, 
        isCompleted: false 
      }
    });

    const priorityOrder: Record<string, number> = { urgent: 1, high: 2, medium: 3, low: 4 };
    
    nextBestActions.sort((a, b) => {
      const priorityA = priorityOrder[a.priority] || 5;
      const priorityB = priorityOrder[b.priority] || 5;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // If priorities are equal, sort by createdAt (older first)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const top10 = nextBestActions.slice(0, 10);

    return NextResponse.json({ success: true, data: top10 });
  } catch (error) {
    console.error('NextBestAction GET Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch actions' }, { status: 500 });
  }
});
