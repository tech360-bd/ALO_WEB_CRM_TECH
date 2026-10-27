// GET /api/super-admin/employees
//
// Employee Control Center data source. Returns every employee with the
// attributes the Super Admin needs to operate the account: RBAC roles
// (authoritative, from portal_user_roles), live session count, open task
// count, and whether the account is eligible for Acting-As.
//
// Listing the full staff directory is a sensitive read and is audited.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext, logAuditAction } from '@/lib/auth-middleware';
import { requireSuperAdminOrActing, requireSuperAdmin, isActingAs, isSameOrigin } from '@/lib/super-admin/access';
import { createEmployeeAccount } from '@/lib/employees/create';
import type { EmployeeControlRow } from '@/lib/super-admin/types';

export const dynamic = 'force-dynamic';

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

/** Runs a query and degrades to a typed empty result instead of throwing. */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

async function handleGet(request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const search = (url.searchParams.get('q') || '').trim().toLowerCase().slice(0, 80);
  const status = (url.searchParams.get('status') || '').trim().toLowerCase().slice(0, 40);
  const role = (url.searchParams.get('role') || '').trim().toLowerCase().slice(0, 60);
  const limit = Math.min(Number(url.searchParams.get('limit') || 200), 500);

  try {
    const employees = await db.employee.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(role ? { role: { contains: role } } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search } },
                { email: { contains: search } },
                { employeeId: { contains: search } },
                { department: { contains: search } },
                { branch: { contains: search } },
              ],
            }
          : {}),
      },
      orderBy: [{ isOnline: 'desc' }, { name: 'asc' }],
      take: limit,
    });

    const userIds = employees.map((row) => row.userId);
    const now = new Date();

    const dayStart = new Date();
    dayStart.setHours(0, 0, 0, 0);

    const [users, sessionCounts, taskCounts, activeToday] = await Promise.all([
      db.portalUser.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          status: true,
          emailVerified: true,
          userType: true,
          roles: { include: { role: { select: { name: true } } } },
        },
      }),
      safe(() => db.portalSession.groupBy({
        by: ['userId'],
        where: { userId: { in: userIds }, revokedAt: null, expiresAt: { gt: now } },
        _count: { _all: true },
      }), [] as Array<{ userId: string; _count: { _all: number } }>),
      safe(() => db.task.groupBy({
        by: ['assigneeId'],
        where: { assigneeId: { in: userIds }, status: { in: ['PENDING', 'IN_PROGRESS'] } },
        _count: { _all: true },
      }), [] as Array<{ assigneeId: string; _count: { _all: number } }>),
      safe(() => db.portalAuditLog.groupBy({
        by: ['actorUserId'],
        where: { actorUserId: { in: userIds }, createdAt: { gte: dayStart } },
        _count: { _all: true },
      }), [] as Array<{ actorUserId: string; _count: { _all: number } }>),
    ]);

    const userById = new Map<string, (typeof users)[number]>(users.map((user) => [user.id, user] as [string, (typeof users)[number]]));
    const sessionsById = new Map<string, number>(sessionCounts.map((row) => [row.userId, row._count._all] as [string, number]));
    const tasksById = new Map<string, number>(taskCounts.map((row) => [row.assigneeId, row._count._all] as [string, number]));
    const actionsTodayById = new Map<string, number>(activeToday.map((row) => [row.actorUserId, row._count._all] as [string, number]));

    const rows: EmployeeControlRow[] = employees.map((employee) => {
      const user = userById.get(employee.userId);
      const assignedRoles = user?.roles.map(({ role }) => role.name) || [];
      const isPrivileged = assignedRoles.some((name) =>
        ['admin', 'super_admin'].includes(name.toLowerCase()));
      const eligible = Boolean(
        user
        && user.status.toLowerCase() === 'active'
        && user.emailVerified
        && user.userType === 'EMPLOYEE'
        && employee.status.toLowerCase() === 'active'
        && !isPrivileged
        && employee.userId !== auth.actorUserId,
      );

      return {
        id: employee.id,
        userId: employee.userId,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        department: employee.department,
        branch: employee.branch,
        destinationFocus: parseJsonArray(employee.destinationFocus),
        status: employee.status,
        isOnline: employee.isOnline,
        lastLoginAt: employee.lastLoginAt?.toISOString() || null,
        joinedAt: employee.joinedAt.toISOString(),
        activeSessions: sessionsById.get(employee.userId) || 0,
        openTasks: tasksById.get(employee.userId) || 0,
        actionsToday: actionsTodayById.get(employee.userId) || 0,
        assignedRoles,
        actingAsEligible: eligible,
        performanceScore: null,
      };
    });

    await logAuditAction(auth, 'EMPLOYEE_DIRECTORY_VIEWED', 'Employee', 'directory', {
      returned: rows.length,
      filtered: Boolean(search || status || role),
    });

    const summary = {
      total: rows.length,
      active: rows.filter((row) => row.status.toLowerCase() === 'active').length,
      online: rows.filter((row) => row.isOnline).length,
      suspended: rows.filter((row) => ['suspended', 'locked'].includes(row.status.toLowerCase())).length,
      pending: rows.filter((row) => row.status.toLowerCase() === 'pending').length,
      actingAsEligible: rows.filter((row) => row.actingAsEligible).length,
      missingRoles: rows.filter((row) => row.assignedRoles.length === 0).length,
    };

    return NextResponse.json({ success: true, employees: rows, summary, actingAs: isActingAs(auth) });
  } catch (error) {
    console.error('[super-admin/employees] query failed', error);
    return NextResponse.json({ success: false, error: 'Employee directory is temporarily unavailable.' }, { status: 503 });
  }
}

const CreateEmployee = z.object({
  fullName: z.string().trim().min(2).max(191),
  companyEmail: z.string().trim().email().max(191),
  designation: z.string().trim().min(2).max(191),
  department: z.string().trim().max(191).default(''),
  branch: z.string().trim().max(191).default(''),
  role: z.enum([
    'STAFF', 'EMPLOYEE', 'HR_MANAGER', 'FINANCE', 'COUNSELOR', 'APPLICATION_TEAM',
    'VISA_OFFICER', 'MARKETING_MANAGER', 'MARKETING', 'FRONT_DESK', 'BRANCH_MANAGER', 'SUPPORT_STAFF',
  ]),
  phone: z.string().trim().max(50).default(''),
  joinDate: z.string().trim().max(40).optional(),
  emergencyContact: z.string().trim().max(191).optional(),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePost(request: Request, auth: AuthContext) {
  // Creating a staff account is a privileged mutation: real, non-acting
  // Super Admin only. Account provisioning reuses the existing, audited
  // createEmployeeAccount service rather than a second implementation.
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Cross-origin mutation denied.' }, { status: 403 });
  }

  const parsed = CreateEmployee.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid request body.' },
      { status: 400 },
    );
  }

  try {
    const { reason, ...input } = parsed.data;
    const result = await createEmployeeAccount({ ...input, office: input.branch, reason }, auth, request);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, emailSent: result.emailSent, data: result.data }, { status: 201 });
  } catch (error) {
    console.error('[super-admin/employees POST] failed', error);
    return NextResponse.json(
      { success: false, error: 'Employee account creation is temporarily unavailable.' },
      { status: 503 },
    );
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
