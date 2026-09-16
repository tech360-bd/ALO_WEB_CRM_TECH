// ALO Education — Consolidated Dashboard Alarm Service
// Merges: src/app/api/dashboard-alarm/route.ts (portalNotification, 20, critical) +
//         src/app/api/dashboard/alarm/route.ts (dashboardAlarm, RBAC, 100, enrichment, POST acknowledge)
// Preserves ALL required functionality — lossless 2026-09-14

import { db } from '@/lib/db';

// ── Simple portalNotification alarm (from dashboard-alarm) ──
export async function getPortalNotificationAlarms(userId: string) {
  const alarms = await (db as any).portalNotification.findMany({
    where: { userId, isRead: false },
    orderBy: { createdAt: 'desc' },
    take: 20,
  }).catch(() => []);
  const critical = alarms.filter((a: any) => a.type === 'critical' || a.priority === 'high');
  return { alarms, stats: { total: alarms.length, critical: critical.length, unread: alarms.length } };
}

// ── Full SLA dashboardAlarm (from dashboard/alarm) ──
export interface AlarmQuery {
  status?: string;
  escalationLevel?: number;
  branch?: string;
  assignedTo?: string;
}
export async function getDashboardAlarms(auth: any, query: AlarmQuery) {
  const where: any = {};
  if (query.status) where.status = query.status;
  if (query.escalationLevel) where.escalationLevel = query.escalationLevel;
  if (query.branch) where.branch = query.branch;
  if (query.assignedTo) where.assignedEmployee = query.assignedTo;

  const isSuperAdmin = auth.roles?.includes('super_admin') || auth.roles?.includes('admin') || auth.roles?.includes('CEO') || auth.roles?.includes('COO');
  if (!isSuperAdmin) {
    if (auth.roles?.includes('branch_manager')) {
      const emp = await (db as any).employee.findFirst({ where: { userId: auth.userId } }).catch(() => null);
      if (emp?.branch) where.branch = emp.branch;
    } else {
      where.assignedEmployee = auth.userId;
    }
  }

  const alarms = await (db as any).dashboardAlarm.findMany({
    where,
    orderBy: [{ escalationLevel: 'desc' }, { createdAt: 'asc' }],
    take: 100,
  }).catch(() => []);

  const enriched = await Promise.all(alarms.map(async (alarm: any) => {
    let studentName = alarm.studentName;
    let maskedPhone = alarm.maskedPhone;
    let unmaskedPhone = alarm.unmaskedPhone;
    if (alarm.studentId) {
      try {
        const student = await (db as any).student.findUnique({ where: { id: alarm.studentId } }).catch(() => null) ||
                        await (db as any).portalStudentProfile.findFirst({ where: { studentId: alarm.studentId } }).catch(() => null);
        if (student) {
          studentName = (student as any).fullName || (student as any).name || studentName;
          const phone = (student as any).phone || (student as any).mobile || '';
          if (phone) {
            const canSeeUnmasked = isSuperAdmin || auth.roles?.includes('branch_manager');
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
      unmaskedPhone: isSuperAdmin || auth.roles?.includes('branch_manager') ? alarm.unmaskedPhone || maskedPhone : maskedPhone,
      canSeeUnmasked: isSuperAdmin || auth.roles?.includes('branch_manager'),
    };
  }));
  return enriched;
}

export async function acknowledgeAlarm(alarmId: string, auth: any) {
  const updated = await (db as any).dashboardAlarm.update({
    where: { id: alarmId },
    data: { status: 'acknowledged', acknowledgedBy: auth.userId, acknowledgedAt: new Date() },
  });
  await (db as any).aloAuditLog.create({
    data: { actorType: auth.roles?.[0] || 'employee', actorName: auth.name || auth.userId, action: 'ALARM_ACKNOWLEDGED', resource: 'DashboardAlarm', resourceId: alarmId, details: JSON.stringify({ alarmId }), createdAt: new Date() },
  }).catch(() => null);
  return updated;
}

export async function resolveAlarm(alarmId: string, auth: any) {
  const updated = await (db as any).dashboardAlarm.update({
    where: { id: alarmId },
    data: { status: 'resolved', resolvedBy: auth.userId, resolvedAt: new Date() },
  });
  await (db as any).aloAuditLog.create({
    data: { actorType: auth.roles?.[0] || 'employee', actorName: auth.name || auth.userId, action: 'ALARM_RESOLVED', resource: 'DashboardAlarm', resourceId: alarmId, details: JSON.stringify({ alarmId }), createdAt: new Date() },
  }).catch(() => null);
  return updated;
}

// ── Unified alarm view (combines both models) — used by consolidated route ──
export async function getUnifiedAlarms(auth: any, query: AlarmQuery) {
  const [portal, sla] = await Promise.all([
    getPortalNotificationAlarms(auth.userId).catch(() => ({ alarms: [], stats: { total: 0, critical: 0, unread: 0 } })),
    getDashboardAlarms(auth, query).catch(() => []),
  ]);
  return {
    portalNotifications: portal.alarms,
    portalStats: portal.stats,
    slaAlarms: sla,
    total: portal.stats.total + (Array.isArray(sla) ? sla.length : 0),
  };
}
