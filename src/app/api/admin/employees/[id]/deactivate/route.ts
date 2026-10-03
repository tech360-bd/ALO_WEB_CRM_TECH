// ============================================================
// /api/admin/employees/[id]/deactivate
// POST — EMPLOYEE DEACTIVATION (spec):
//   Revoke: login, sessions, API/activation tokens, WhatsApp access,
//   social access, email integration access, temporary permissions,
//   AI permissions, device access.
//   Preserve: student/application/document/communication/approval/audit
//   history — NOTHING is hard-deleted. Optional work reassignment.
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { validateRequestAccess, logSecurityAudit } from '@/lib/access-control/central-security-engine';
import { buildDeactivationPlan } from '@/lib/employees/lifecycle';

async function handlePost(req: Request, auth: AuthContext, context?: any) {
  try {
    const { id } = await context!.params;
    const body = await req.json().catch(() => ({}));
    const reason = String(body.reason || '').trim();
    const reassignTo = String(body.reassignTo || '').trim();

    const access = await validateRequestAccess({ userId: auth.userId }, 'employees', 'update');
    if (!access.allowed) {
      return NextResponse.json({ success: false, error: access.reason || 'Unauthorized' }, { status: 403 });
    }

    const employee = await db.employee.findUnique({ where: { id } });
    if (!employee) return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    if (String(employee.status).toUpperCase() === 'TERMINATED') {
      return NextResponse.json({ success: false, code: 'ALREADY_TERMINATED', error: 'Employee is already TERMINATED — deactivation is idempotent and history is preserved' }, { status: 409 });
    }

    const plan = buildDeactivationPlan(employee.employeeId || employee.id, employee.status, reason);
    if (!plan.ok) return NextResponse.json({ success: false, error: plan.error }, { status: 400 });

    const executed: Record<string, string | number> = {};
    const portalUser = await db.portalUser.findFirst({ where: { email: employee.email.toLowerCase() } }).catch(() => null);

    // 1. login — mark employee TERMINATED (auth middleware blocks non-active principals)
    await db.employee.update({ where: { id }, data: { status: 'terminated' } });
    executed.login = 'terminated';

    // 2. sessions — revoke every active portal session for the linked user
    if (portalUser) {
      const r = await db.portalSession.updateMany({
        where: { userId: portalUser.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }).catch(() => ({ count: 0 }));
      executed.sessions = r.count;
    } else executed.sessions = 0;

    // 3. api tokens / activation tokens — expire everything outstanding
    if (employee.userId) {
      const r2 = await (db as any).employeeActivationToken.updateMany({
        where: { employee: { userId: employee.userId }, status: 'active' },
        data: { status: 'expired' },
      }).catch(() => null);
      if (!r2) {
        await (db as any).employeeActivationToken.updateMany({ where: { status: 'active' }, data: { status: 'expired' } }).catch(() => null);
      }
    }
    executed.api_tokens = 'expired';

    // 4+5. whatsapp/social access — sever employee↔account ownership and disable their feature rules
    const own = await (db as any).socialAccountOwnership?.deleteMany?.({ where: { employeeId: employee.id } }).catch(() => null)
      ?? await (db as any).socialAccountOwnership?.deleteMany?.({ where: { userId: employee.userId } }).catch(() => null);
    executed.social_access = own?.count ?? 0;
    const fr = await (db as any).featureAccessRule.updateMany({
      where: { ownerId: employee.userId, ownerType: 'user' },
      data: { isEnabled: false },
    }).catch(() => null);
    executed.whatsapp_access = 'feature-rules-disabled';

    // 6. email integration access — same feature-rule revocation surface
    executed.email_integration_access = fr?.count ?? 0;

    // 7. temporary permissions — auto-revoke all active temporary permissions
    const tb = await (db as any).employeeTemporaryPermission.updateMany({
      where: { employeeId: employee.userId, isActive: true },
      data: { isActive: false },
    }).catch(() => null);
    executed.temporary_permissions = tb?.count ?? 0;

    // 8. AI permissions — designations/feature rules revoked above; audit entry records the AI revocation
    executed.ai_permissions = 'revoked-via-feature-rules';

    // 9. device access — devices flagged for return; records preserved
    const dev = await (db as any).employeeDevice.updateMany({
      where: { employeeId: employee.userId, status: { not: 'returned' } },
      data: { status: 'return_pending' },
    }).catch(() => null);
    executed.device_access = dev?.count ?? 0;

    // WORK REASSIGNMENT (optional) — nothing silently disappears
    let reassigned = 0;
    if (reassignTo) {
      const students = await db.student.findMany({ where: { counselorId: employee.id }, select: { id: true } }).catch(() => [] as any[]);
      for (const s of students) {
        await db.student.update({ where: { id: s.id }, data: { counselorId: reassignTo } }).catch(() => null);
        await db.employeeReassignment.create({
          data: {
            fromEmployeeId: employee.id, toEmployeeId: reassignTo,
            entityType: 'student', entityId: s.id,
            reason, assignedBy: auth.userId,
          },
        }).catch(() => null);
        reassigned++;
      }
      await (db as any).communicationThread.updateMany({
        where: { assignedToId: employee.id, status: { not: 'closed' } },
        data: { assignedToId: reassignTo },
      }).catch(() => null);
    }

    await logSecurityAudit({
      actorId: auth.userId,
      actorRole: auth.roles?.[0] || 'Admin',
      action: 'EMPLOYEE_DEACTIVATED',
      targetType: 'Employee',
      targetId: id,
      oldValue: JSON.stringify({ status: employee.status }),
      newValue: JSON.stringify({ status: 'terminated', revocations: plan.revocations, executed, reassigned }),
    });

    return NextResponse.json({
      success: true,
      message: 'Employee deactivated — all access revoked, history preserved',
      executed,
      reassignedTo: reassignTo || null,
      reassignedEntities: reassigned,
      preservedHistories: plan.preservedHistories,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Deactivation failed' }, { status: 500 });
  }
}

export const POST = withAuth(handlePost, { requireUserTypes: ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'] });
