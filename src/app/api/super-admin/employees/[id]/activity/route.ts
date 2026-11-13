// GET /api/super-admin/employees/{id}/activity
//
// Consolidates "today activity" for an employee from the systems that actually
// record it: audit rows they produced, tasks they completed, messages they
// sent, and sessions they opened. Nothing is inferred — an empty source simply
// contributes zero.

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { logAuditAction } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing } from '@/lib/super-admin/access';
import { notFound, unavailable, safeRows } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

async function handleGet(_request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const { id } = await context!.params;
  const since = new Date();
  since.setHours(0, 0, 0, 0);

  try {
    const employee = await db.employee.findUnique({ where: { id } });
    if (!employee) return notFound('Employee not found.');

    const [auditRows, tasksCompleted, tasksOpen, messages, sessions] = await Promise.all([
      safeRows<{ id: string; action: string; entityType: string; entityId: string; createdAt: Date }>(
        () => db.portalAuditLog.findMany({
          where: { actorUserId: employee.userId, createdAt: { gte: since } },
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: { id: true, action: true, entityType: true, entityId: true, createdAt: true },
        }),
      ),
      safeRows<{ id: string; title: string; completedAt: Date | null }>(
        () => db.task.findMany({
          where: { assigneeId: employee.userId, status: 'COMPLETED', completedAt: { gte: since } },
          take: 50,
          select: { id: true, title: true, completedAt: true },
        }),
      ),
      safeRows<{ id: string; title: string; status: string; dueDate: string | null }>(
        () => db.task.findMany({
          where: { assigneeId: employee.userId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
          take: 50,
          select: { id: true, title: true, status: true, dueDate: true },
        }),
      ),
      safeRows<{ id: string; createdAt: Date }>(
        () => db.communicationMessage.findMany({
          where: { senderUserId: employee.userId, createdAt: { gte: since } },
          take: 100,
          select: { id: true, createdAt: true },
        }),
      ),
      safeRows<{ id: string; deviceName: string; ipAddress: string; createdAt: Date }>(
        () => db.portalSession.findMany({
          where: { userId: employee.userId, createdAt: { gte: since } },
          take: 50,
          select: { id: true, deviceName: true, ipAddress: true, createdAt: true },
        }),
      ),
    ]);

    await logAuditAction(auth, 'EMPLOYEE_ACTIVITY_VIEWED', 'Employee', id, {
      employeeCode: employee.employeeId,
      auditRows: auditRows.length,
    });

    return NextResponse.json({
      success: true,
      employeeId: employee.employeeId,
      windowStart: since.toISOString(),
      summary: {
        actionsToday: auditRows.length,
        tasksCompletedToday: tasksCompleted.length,
        openTasks: tasksOpen.length,
        messagesSentToday: messages.length,
        sessionsOpenedToday: sessions.length,
        lastLoginAt: employee.lastLoginAt?.toISOString() || null,
        isOnline: employee.isOnline,
      },
      actions: auditRows.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        at: row.createdAt.toISOString(),
      })),
      completedTasks: tasksCompleted.map((row) => ({
        id: row.id,
        title: row.title,
        completedAt: row.completedAt?.toISOString() || null,
      })),
      openTasks: tasksOpen,
      sessions: sessions.map((row) => ({
        id: row.id,
        device: row.deviceName.startsWith('ALO_ACTING_AS:') ? 'Acting-As session' : row.deviceName || 'Unknown',
        ip: row.ipAddress,
        at: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return unavailable('super-admin/employees/{id}/activity', error);
  }
}

export const GET = withAuth(handleGet);
