// POST /api/super-admin/employees/{id}/revoke-sessions
//
// Terminates every live session for an employee (including any Acting-As
// session bound to them) and writes an audit row in the same transaction.

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { writePortalAudit } from '@/lib/transactional-audit';
import { requireSuperAdmin, isSameOrigin } from '@/lib/super-admin/access';

const Body = z.object({
  reason: z.string().trim().min(8).max(500),
}).strict();

async function handlePost(request: Request, auth: AuthContext, context?: { params: Promise<{ id: string }> }) {
  const guard = requireSuperAdmin(auth);
  if (!guard.ok) return guard.response;
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Cross-origin mutation denied.' }, { status: 403 });
  }

  const { id } = await context!.params;
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'A reason of at least 8 characters is required.' },
      { status: 400 },
    );
  }

  const employee = await db.employee.findUnique({ where: { id } });
  if (!employee) {
    return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
  }

  try {
    const revoked = await db.$transaction(async (tx) => {
      const update = await tx.portalSession.updateMany({
        where: { userId: employee.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      await writePortalAudit(
        tx,
        auth,
        'EMPLOYEE_SESSIONS_REVOKED',
        'Employee',
        id,
        { reason: parsed.data.reason, revokedSessions: update.count },
        request,
      );
      return update.count;
    });

    return NextResponse.json({ success: true, revokedSessions: revoked });
  } catch (error) {
    console.error('[super-admin/employees/revoke-sessions] failed', error);
    return NextResponse.json(
      { success: false, error: 'Session revocation could not be applied and audited.' },
      { status: 503 },
    );
  }
}

export const POST = withAuth(handlePost);
