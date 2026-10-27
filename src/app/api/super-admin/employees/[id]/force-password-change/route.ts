// POST /api/super-admin/employees/{id}/force-password-change
//
// Flags the account so the employee must set a new password, and revokes every
// live session so a stolen cookie cannot survive the reset. The Super Admin
// never sees or sets a password: no credential is generated, transmitted or
// logged here.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';
import { badRequest, notFound, unavailable } from '@/lib/super-admin/http';

export const dynamic = 'force-dynamic';

const Body = z.object({
  reason: z.string().trim().min(8, 'A reason of at least 8 characters is required.').max(500),
}).strict();

async function handlePost(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) return badRequest('Cross-origin mutation denied.');

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return badRequest(parsed.error.issues[0]?.message || 'Invalid request body.');

  try {
    const employee = await db.employee.findUnique({ where: { id } });
    if (!employee) return notFound('Employee not found.');

    const revoked = await db.$transaction(async (tx) => {
      await tx.portalUser.update({
        where: { id: employee.userId },
        data: { firstLoginRequired: true },
      });
      const sessions = await tx.portalSession.updateMany({
        where: { userId: employee.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await writePortalAudit(tx, auth, 'EMPLOYEE_FORCE_PASSWORD_CHANGE', 'Employee', id, {
        reason: parsed.data.reason,
        employeeCode: employee.employeeId,
        revokedSessions: sessions.count,
        passwordDisclosedToAdmin: false,
      }, request);
      return sessions.count;
    });

    return NextResponse.json({
      success: true,
      message: 'The employee must set a new password at next sign-in. All live sessions were revoked.',
      revokedSessions: revoked,
    });
  } catch (error) {
    return unavailable('super-admin/employees/{id}/force-password-change', error);
  }
}

export const POST = withAuth(handlePost);
