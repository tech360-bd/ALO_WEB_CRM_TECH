import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'active';
    const escalationLevel = searchParams.get('escalationLevel');
    const branch = searchParams.get('branch');
    const assignedTo = searchParams.get('assignedTo');

    const where: any = {};
    if (status) where.status = status;
    if (escalationLevel) where.escalationLevel = parseInt(escalationLevel);
    if (branch) where.branch = branch;
    if (assignedTo) where.assignedEmployee = assignedTo;

    // RBAC: counselor sees only assigned, branch manager sees branch, admin sees all
    const isSuperAdmin = auth.roles.includes('super_admin') || auth.roles.includes('admin') || auth.roles.includes('CEO') || auth.roles.includes('COO');
    if (!isSuperAdmin) {
      if (auth.roles.includes('branch_manager')) {
        // Branch manager sees branch alarms - need branch from employee profile
        const emp = await db.employee.findFirst({ where: { userId: auth.userId } }).catch(() => null);
        if (emp?.branch) where.branch = emp.branch;
      } else {
        // Counselor sees only assigned
        where.assignedEmployee = auth.userId;
      }
    }

    const alarms = await db.dashboardAlarm.findMany({
      where,
      orderBy: [{ escalationLevel: 'desc' }, { createdAt: 'asc' }],
      take: 100,
    });

    // Enrich with student info (masked phone per permission)
    const enriched = await Promise.all(alarms.map(async (alarm) => {
      let studentName = alarm.studentName;
      let maskedPhone = alarm.maskedPhone;
      let unmaskedPhone = alarm.unmaskedPhone;

      if (alarm.studentId) {
        try {
          const student = await db.student.findUnique({ where: { id: alarm.studentId } }).catch(() => null) ||
                          await db.portalStudentProfile.findFirst({ where: { studentId: alarm.studentId } }).catch(() => null);
          if (student) {
            studentName = (student as any).fullName || (student as any).name || studentName;
            const phone = (student as any).phone || (student as any).mobile || '';
            if (phone) {
              // Mask per permission: counselor sees masked unless permission
              const canSeeUnmasked = isSuperAdmin || auth.roles.includes('branch_manager');
              maskedPhone = phone.slice(0, 3) + '****' + phone.slice(-3);
              unmaskedPhone = canSeeUnmasked ? phone : maskedPhone;
            }
          }
        } catch {}
      }

      return {
        ...alarm,
        studentName,
        maskedPhone,
        unmaskedPhone: isSuperAdmin || auth.roles.includes('branch_manager') ? alarm.unmaskedPhone || maskedPhone : maskedPhone,
        canSeeUnmasked: isSuperAdmin || auth.roles.includes('branch_manager'),
      };
    }));

    return NextResponse.json({
      success: true,
      alarms: enriched,
      count: enriched.length,
      message: enriched.length > 0 ? 'Urgent WhatsApp student message pending. Reply now.' : 'No active alarms',
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
      const updated = await db.dashboardAlarm.update({
        where: { id: alarmId },
        data: {
          status: 'acknowledged',
          acknowledgedBy: auth.userId,
          acknowledgedAt: new Date(),
        },
      });

      await db.aloAuditLog.create({
        data: {
          actorType: auth.roles[0] || 'employee',
          actorName: auth.name || auth.userId,
          action: 'ALARM_ACKNOWLEDGED',
          resource: 'DashboardAlarm',
          resourceId: alarmId,
        },
      }).catch(() => {});

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'resolve') {
      const updated = await db.dashboardAlarm.update({
        where: { id: alarmId },
        data: {
          status: 'resolved',
          resolvedBy: auth.userId,
          resolvedAt: new Date(),
        },
      });

      await db.aloAuditLog.create({
        data: {
          actorType: auth.roles[0] || 'employee',
          actorName: auth.name || auth.userId,
          action: 'ALARM_RESOLVED',
          resource: 'DashboardAlarm',
          resourceId: alarmId,
        },
      }).catch(() => {});

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'create_test_alarm') {
      const isAuthorized = auth.roles.includes('super_admin') || auth.roles.includes('admin');
      if (!isAuthorized) return NextResponse.json({ success: false, error: 'Admin required' }, { status: 403 });

      const alarm = await db.dashboardAlarm.create({
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
