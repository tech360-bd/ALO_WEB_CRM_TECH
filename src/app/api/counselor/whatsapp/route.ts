import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');

    const where: any = { channel: 'whatsapp' };
    if (studentId) where.studentId = studentId;
    if (!auth.roles.includes('super_admin') && !auth.roles.includes('admin')) {
      where.assignedToId = auth.userId;
    }

    const threads = await db.communicationThread.findMany({ where, orderBy: { lastMessageAt: 'desc' }, take: 50 });
    const messages = await db.whatsAppMessageArchive.findMany({
      where: studentId ? { studentId } : {},
      orderBy: { timestamp: 'desc' },
      take: 100,
    }).catch(() => []);

    return NextResponse.json({ success: true, threads, messages, officialNumberNote: 'One official number 01805020100 multi-counselor routing, SLA 30/40/50 office-hours Sat-Thu 09-18 Fri closed' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
