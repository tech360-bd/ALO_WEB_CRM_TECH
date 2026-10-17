import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { computeVisaReadiness } from '@/lib/visa-readiness';
import { verifyAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // SECURITY: require authenticated session
  const auth = await verifyAuth(request);
  if ('error' in auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 });
    }
    const readiness = await computeVisaReadiness(studentId);
    const visaFile = await db.visaFile.findFirst({
      where: { studentId, status: 'active' },
      include: { checklist: true, ukviInterviews: { include: { questions: true } } },
    });
    const timeline = await db.studentTimeline.findMany({
      where: { studentId, isPublic: true },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return NextResponse.json({ ...readiness, visaFile, timeline });
  } catch (error) {
    console.error('Visa readiness GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
