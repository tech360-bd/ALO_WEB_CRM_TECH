import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/db', () => ({
  db: {
    portalNotification: { findMany: vi.fn().mockResolvedValue([{ id: '1', type: 'critical', priority: 'high' }, { id: '2', type: 'info' }]) },
    dashboardAlarm: {
      findMany: vi.fn().mockResolvedValue([{ id: 'a1', escalationLevel: 1, studentId: 's1', studentName: 'Test', maskedPhone: '018****', status: 'active' }]),
      update: vi.fn().mockResolvedValue({ id: 'a1', status: 'acknowledged' }),
      create: vi.fn().mockResolvedValue({ id: 'a2' }),
    },
    employee: { findFirst: vi.fn().mockResolvedValue({ branch: 'Dhaka' }) },
    student: { findUnique: vi.fn().mockResolvedValue(null) },
    portalStudentProfile: { findFirst: vi.fn().mockResolvedValue(null) },
    aloAuditLog: { create: vi.fn().mockResolvedValue({}) },
  }
}));

import { getPortalNotificationAlarms, getDashboardAlarms, acknowledgeAlarm, getUnifiedAlarms } from '@/lib/dashboard-alarm-service';

describe('Consolidated Dashboard Alarm Service — lossless', () => {
  it('getPortalNotificationAlarms returns 20 critical stats', async () => {
    const res = await getPortalNotificationAlarms('user1');
    expect(res.alarms).toHaveLength(2);
    expect(res.stats.total).toBe(2);
    expect(res.stats.critical).toBe(1);
  });

  it('getDashboardAlarms enriches and masks (preserves RBAC)', async () => {
    const auth = { userId: 'counselor1', roles: ['counselor'], name: 'C' };
    const alarms = await getDashboardAlarms(auth, { status: 'active' });
    expect(alarms).toHaveLength(1);
    expect(alarms[0].id).toBe('a1');
  });

  it('acknowledgeAlarm updates and audits', async () => {
    const auth = { userId: 'u1', roles: ['super_admin'], name: 'Admin' };
    const updated = await acknowledgeAlarm('a1', auth);
    expect(updated.status).toBe('acknowledged');
  });

  it('getUnifiedAlarms combines both models', async () => {
    const auth = { userId: 'user1', roles: ['super_admin'], name: 'Admin' };
    const unified = await getUnifiedAlarms(auth, { status: 'active' });
    expect(unified.portalNotifications).toHaveLength(2);
    expect(unified.slaAlarms).toHaveLength(1);
    expect(unified.total).toBe(3);
  });
});
