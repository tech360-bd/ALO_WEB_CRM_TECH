// GET   /api/super-admin/employees/{id} — full employee record
// PATCH /api/super-admin/employees/{id} — assign role / branch / department / country
//
// Assignment changes are what the Employee Control Center's "Assign Role",
// "Assign Branch", "Assign Country" and "Assign Department" actions call.
// Every change writes a before/after audit row in the same transaction.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable, jsonArray } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

async function handleGet(_request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;
  const { id } = await context!.params;

  try {
    const employee = await db.employee.findUnique({ where: { id } });
    if (!employee) return notFound('Employee not found.');

    const [user, sessions, tasks, groupGrants, audit] = await Promise.all([
      db.portalUser.findUnique({
        where: { id: employee.userId },
        select: {
          id: true, email: true, name: true, userType: true, status: true,
          emailVerified: true, lastLoginAt: true,
          roles: { select: { role: { select: { id: true, name: true, label: true } } } },
        },
      }),
      db.portalSession.findMany({
        where: { userId: employee.userId, revokedAt: null, expiresAt: { gt: new Date() } },
        select: { id: true, deviceName: true, ipAddress: true, createdAt: true, expiresAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      db.task.findMany({
        where: { assigneeId: employee.userId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        select: { id: true, title: true, status: true, priority: true, dueDate: true },
        take: 25,
      }),
      db.permissionGroupGrant.findMany({
        where: { ownerType: 'USER', ownerId: employee.userId },
        include: { group: { select: { key: true, name: true, riskLevel: true } } },
      }).catch(() => []),
      db.portalAuditLog.findMany({
        where: { OR: [{ entityId: id, entityType: 'Employee' }, { actorUserId: employee.userId }] },
        orderBy: { createdAt: 'desc' },
        take: 25,
        select: { id: true, action: true, entityType: true, entityId: true, actorUserId: true, createdAt: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        userId: employee.userId,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        whatsapp: employee.whatsapp,
        role: employee.role,
        designation: employee.designation,
        department: employee.department,
        branch: employee.branch,
        destinationFocus: jsonArray(employee.destinationFocus),
        status: employee.status,
        isOnline: employee.isOnline,
        joinedAt: employee.joinedAt.toISOString(),
        lastLoginAt: employee.lastLoginAt?.toISOString() || null,
      },
      account: user ? {
        emailVerified: user.emailVerified,
        userType: user.userType,
        status: user.status,
        roles: user.roles.map((row) => row.role),
        // Per-user ALLOW/DENY overrides live in their own table; surfaced from
        // the dedicated endpoint (/users/{id}/permissions) to keep this
        // payload to a single user read.
        permissionOverridesUrl: `/api/super-admin/users/${employee.userId}/permissions`,
      } : null,
      activeSessions: sessions.map((session) => ({
        id: session.id,
        device: session.deviceName.startsWith('ALO_ACTING_AS:') ? 'Acting-As session' : session.deviceName || 'Unknown',
        ip: session.ipAddress,
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
      })),
      openTasks: tasks,
      permissionGroupGrants: groupGrants.map((grant) => ({
        id: grant.id,
        groupKey: grant.group?.key || '',
        groupName: grant.group?.name || '',
        riskLevel: grant.group?.riskLevel || 'standard',
        expiresAt: grant.expiresAt?.toISOString() || null,
        isActive: grant.isActive,
      })),
      recentAudit: audit.map((row) => ({
        id: row.id,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        createdAt: row.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return unavailable('super-admin/employees/{id} GET', error);
  }
}

const Body = z.object({
  role: z.string().trim().max(60).optional(),
  department: z.string().trim().max(191).optional(),
  branch: z.string().trim().max(191).optional(),
  designation: z.string().trim().max(191).optional(),
  destinationFocus: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePatch(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const { reason, destinationFocus, ...changes } = parsed.data;

  if (Object.keys(changes).length === 0 && destinationFocus === undefined) {
    return badRequest('No changes supplied.');
  }

  try {
    const employee = await db.employee.findUnique({ where: { id } });
    if (!employee) return notFound('Employee not found.');

    const before = {
      role: employee.role,
      department: employee.department,
      branch: employee.branch,
      designation: employee.designation,
      destinationFocus: employee.destinationFocus,
    };

    const updated = await db.$transaction(async (tx) => {
      const row = await tx.employee.update({
        where: { id },
        data: {
          ...changes,
          ...(destinationFocus ? { destinationFocus: JSON.stringify(destinationFocus) } : {}),
        },
      });
      await writePortalAudit(tx, auth, 'EMPLOYEE_ASSIGNMENT_CHANGED', 'Employee', id, {
        reason,
        before,
        after: {
          role: row.role,
          department: row.department,
          branch: row.branch,
          designation: row.designation,
          destinationFocus: row.destinationFocus,
        },
      }, request);
      return row;
    });

    return NextResponse.json({
      success: true,
      employee: {
        id: updated.id,
        role: updated.role,
        department: updated.department,
        branch: updated.branch,
        designation: updated.designation,
        destinationFocus: jsonArray(updated.destinationFocus),
      },
    });
  } catch (error) {
    return unavailable('super-admin/employees/{id} PATCH', error);
  }
}

export const GET = withAuth(handleGet);
export const PATCH = withAuth(handlePatch);
