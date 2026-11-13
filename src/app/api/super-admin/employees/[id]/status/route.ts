// PATCH /api/super-admin/employees/{id}/status
//
// Suspend / reactivate / lock an employee account. Requires the real,
// non-acting Super Admin and a written reason of at least 8 characters.
// The mutation and its audit row are written in one transaction, so a
// status change can never exist without its audit trail.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';

const ALLOWED_STATUSES = ['active', 'pending', 'suspended', 'resigned', 'terminated', 'locked'] as const;

const Body = z.object({
  status: z.enum(ALLOWED_STATUSES),
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
  revokeSessions: z.boolean().optional(),
}).strict();

async function handlePatch(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Cross-origin mutation denied.' }, { status: 403 });
  }

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid request body.' },
      { status: 400 },
    );
  }

  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee) {
    return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
  }
  if (employee.userId === auth.actorUserId) {
    return NextResponse.json({ success: false, error: 'You cannot change your own account status.' }, { status: 400 });
  }

  const targetRoles = await db.portalUserRole.findMany({
    where: { userId: employee.userId },
    include: { role: { select: { name: true } } },
  });
  const isSuperAdminTarget = targetRoles.some(({ role }) => role.name.toLowerCase() === 'super_admin');
  if (isSuperAdminTarget && parsed.data.status !== 'active') {
    return NextResponse.json(
      { success: false, error: 'A SUPER_ADMIN account cannot be suspended or locked from this endpoint.' },
      { status: 403 },
    );
  }

  const { status, reason, revokeSessions } = parsed.data;

  try {
    const result = await db.$transaction(async (tx) => {
      const before = { employeeStatus: employee.status };
      await tx.employee.update({ where: { id }, data: { status } });
      await tx.portalUser.update({ where: { id: employee.userId }, data: { status } });

      let revoked = 0;
      if (revokeSessions || status !== 'active') {
        const update = await tx.portalSession.updateMany({
          where: { userId: employee.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        revoked = update.count;
      }

      await writePortalAudit(
        tx,
        auth,
        status === 'active' ? 'EMPLOYEE_REACTIVATED' : 'EMPLOYEE_STATUS_CHANGED',
        'Employee',
        id,
        { reason, before, after: { employeeStatus: status, portalUserStatus: status }, revokedSessions: revoked },
        request,
      );

      return { revoked };
    });

    return NextResponse.json({
      success: true,
      employeeId: employee.employeeId,
      status,
      revokedSessions: result.revoked,
    });
  } catch (error) {
    console.error('[super-admin/employees/status] failed', error);
    return NextResponse.json(
      { success: false, error: 'Status change could not be applied and audited.' },
      { status: 503 },
    );
  }
}

export const PATCH = withAuth(handlePatch);
