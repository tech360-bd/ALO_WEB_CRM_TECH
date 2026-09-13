import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { createFollowUpScheduleForStudent, processDueFollowUps } from '@/lib/whatsapp-followup-engine';

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('studentId');
    const status = searchParams.get('status');
    const day = searchParams.get('day');

    const where: any = {};
    if (studentId) where.studentId = studentId;
    if (status) where.status = status;
    if (day) where.scheduledDay = parseInt(day);

    const schedules = await db.whatsAppFollowUpSchedule.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      take: 100,
    });

    return NextResponse.json({ success: true, schedules });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { action, studentId, leadId, contactPhone, country, intake } = body;

    if (action === 'create_for_student') {
      if (!studentId || !contactPhone) {
        return NextResponse.json({ success: false, error: 'studentId and contactPhone required' }, { status: 400 });
      }
      const created = await createFollowUpScheduleForStudent({
        studentId,
        leadId,
        contactPhone,
        country,
        intake,
      });
      return NextResponse.json({ success: true, created, count: created.length });
    }

    if (action === 'process_due') {
      const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('admin');
      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'Admin required for processing' }, { status: 403 });
      }
      const results = await processDueFollowUps();
      return NextResponse.json({ success: true, results, processed: results.length });
    }

    if (action === 'pause' || action === 'cancel') {
      const { scheduleId, reason } = body;
      if (!scheduleId) return NextResponse.json({ success: false, error: 'scheduleId required' }, { status: 400 });

      const updated = await db.whatsAppFollowUpSchedule.update({
        where: { id: scheduleId },
        data: {
          status: action === 'pause' ? 'paused' : 'cancelled',
          isPaused: action === 'pause',
          pauseReason: reason || `${action} by ${auth.userId}`,
        },
      });
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
