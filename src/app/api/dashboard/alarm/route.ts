import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { getDashboardAlarms, acknowledgeAlarm, resolveAlarm } from '@/lib/dashboard-alarm-service';
// Consolidated 2026-09-14 via src/lib/dashboard-alarm-service.ts — preserves RBAC, enrichment, masking, acknowledge/resolve/create_test
// Original GET/POST logic moved to service for lossless consolidation with src/app/api/dashboard-alarm/route.ts

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const query = {
      status: searchParams.get('status') || 'active',
      escalationLevel: searchParams.get('escalationLevel') ? parseInt(searchParams.get('escalationLevel')!) : undefined,
      branch: searchParams.get('branch') || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
    };
    const alarms = await getDashboardAlarms(auth, query);
    return NextResponse.json({
      success: true,
      alarms,
      count: alarms.length,
      message: alarms.length > 0 ? 'Urgent WhatsApp student message pending. Reply now.' : 'No active alarms',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { action, alarmId } = body;

    if (action === 'acknowledge') {
      const updated = await acknowledgeAlarm(alarmId, auth);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'resolve') {
      const updated = await resolveAlarm(alarmId, auth);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'create_test_alarm') {
      const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('admin');
      if (!isAuthorized) return NextResponse.json({ success: false, error: 'Admin required' }, { status: 403 });

      const alarm = await (db as any).dashboardAlarm.create({
        data: {
          alarmType: body.alarmType || 'SLA_OVERDUE',
          threadId: body.threadId || 'test-thread',
          conversationId: body.conversationId || 'test-conv',
          studentId: body.studentId || 'test-student',
          studentName: body.studentName || 'Test Student',
          maskedPhone: '018****0100',
          unmaskedPhone: '01805020100',
          branch: body.branch || 'Dhaka Main',
          assignedEmployee: body.assignedEmployee || auth.userId,
          slaElapsedMinutes: body.slaElapsedMinutes || 35,
          escalationLevel: body.escalationLevel || 1,
          priority: body.priority || 'high',
          status: 'active',
        },
      });
      return NextResponse.json({ success: true, data: alarm });
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
