// GET  /api/super-admin/permissions/temporary — every temporary grant + expiry state
// POST /api/super-admin/permissions/temporary — grant a time-boxed permission
//
// Temporary grants are the "give this counselor marketing access for the
// Eid campaign, then have it lapse automatically" control. They are stored in
// `employee_temporary_permissions`, whose expiry is already evaluated
// server-side by src/lib/employee-temporary-permissions.ts.
//
// The window is capped at 30 days — matching MAX_TEMPORARY_PERMISSION_DAYS —
// so "temporary" cannot silently become permanent.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdminOrActing, requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable } from '@/lib/super-admin/http';
import { MAX_TEMPORARY_PERMISSION_DAYS, temporaryPermissionIsEffective } from '@/lib/employee-temporary-permissions';

export const dynamic = 'force-dynamic';

async function handleGet(request: Request, auth: AuthContext) {
  const guard = requireSuperAdminOrActing(auth);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const employeeId = (url.searchParams.get('employeeId') || '').trim().slice(0, 191);

  try {
    const grants = await db.employeeTemporaryPermission.findMany({
      where: employeeId ? { employeeId } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
    });

    const employeeIds = [...new Set(grants.map((grant) => grant.employeeId))];
    const employees = await db.employee.findMany({
      where: { id: { in: employeeIds } },
      select: { id: true, name: true, employeeId: true, role: true },
    });
    const employeeById = new Map(employees.map((row) => [row.id, row]));

    const now = new Date();
    return NextResponse.json({
      success: true,
      maxDays: MAX_TEMPORARY_PERMISSION_DAYS,
      grants: grants.map((grant) => ({
        id: grant.id,
        employeeId: grant.employeeId,
        employeeName: employeeById.get(grant.employeeId)?.name || '',
        employeeCode: employeeById.get(grant.employeeId)?.employeeId || '',
        featureKey: grant.featureKey,
        action: grant.action,
        scopeType: grant.scopeType,
        reason: grant.reason,
        grantedBy: grant.grantedBy,
        startDate: grant.startDate.toISOString(),
        endDate: grant.endDate.toISOString(),
        expiresAt: grant.expiresAt.toISOString(),
        isActive: grant.isActive,
        effectiveNow: temporaryPermissionIsEffective(
          {
            active: grant.active,
            isActive: grant.isActive,
            startDate: grant.startDate,
            endDate: grant.endDate,
            expiresAt: grant.expiresAt,
          },
          now,
        ),
      })),
    });
  } catch (error) {
    return unavailable('super-admin/permissions/temporary GET', error);
  }
}

const Body = z.object({
  employeeId: z.string().trim().min(1).max(191),
  featureKey: z.string().trim().min(3).max(191).regex(/^[a-zA-Z0-9_.-]+$/),
  action: z.string().trim().min(2).max(40).regex(/^[a-z_]+$/).default('view'),
  scopeType: z.enum(['own', 'assigned', 'team', 'branch', 'country', 'all']).default('own'),
  scopeId: z.string().trim().max(191).default(''),
  days: z.number().int().min(1).max(MAX_TEMPORARY_PERMISSION_DAYS),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePost(request: Request, auth: AuthContext) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');
  const input = parsed.data;

  try {
    const employee = await db.employee.findUnique({ where: { id: input.employeeId } });
    if (!employee) return notFound('Employee not found.');

    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + input.days * 24 * 60 * 60 * 1000);
    const permissionKey = `${input.featureKey}.${input.action}`;

    const grant = await db.$transaction(async (tx) => {
      const created = await tx.employeeTemporaryPermission.create({
        data: {
          employeeId: input.employeeId,
          featureKey: input.featureKey,
          permissionKey,
          action: input.action,
          scopeType: input.scopeType,
          scopeId: input.scopeId,
          grantedBy: auth.actorUserId,
          reason: input.reason,
          startDate,
          endDate,
          expiresAt: endDate,
          isActive: true,
          active: true,
        },
      });
      await writePortalAudit(tx, auth, 'TEMPORARY_PERMISSION_GRANTED', 'EmployeeTemporaryPermission', created.id, {
        reason: input.reason,
        employeeId: input.employeeId,
        employeeCode: employee.employeeId,
        permissionKey,
        scopeType: input.scopeType,
        scopeId: input.scopeId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }, request);
      return created;
    });

    return NextResponse.json({
      success: true,
      grant: {
        id: grant.id,
        permissionKey: grant.permissionKey,
        startDate: grant.startDate.toISOString(),
        endDate: grant.endDate.toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    return unavailable('super-admin/permissions/temporary POST', error);
  }
}

export const GET = withAuth(handleGet);
export const POST = withAuth(handlePost);
