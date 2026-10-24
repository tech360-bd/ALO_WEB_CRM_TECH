import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { canAccessFeatureEngine } from '@/lib/employee-access-engine';
import { writePortalAudit } from '@/lib/transactional-audit';

const RuleInput = z.object({
  id: z.string().min(1).max(191).optional(),
  ownerType: z.enum(['EMPLOYEE', 'USER']),
  ownerId: z.string().min(1).max(191),
  featureKey: z.string().min(1).max(191).regex(/^[a-zA-Z0-9_.-]+$/),
  isEnabled: z.boolean(),
  requiresApproval: z.boolean(),
  limitValue: z.number().int().min(0).max(2147483647),
  reason: z.string().trim().min(8).max(500),
}).strict();

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    const featureKey = req.nextUrl.searchParams.get('featureKey');
    const action = req.nextUrl.searchParams.get('action') || 'view';
    if (featureKey) {
      if (featureKey.length > 191 || action.length > 32) return NextResponse.json({ success: false, error: 'Invalid feature request.' }, { status: 400 });
      const allowed = await canAccessFeatureEngine(auth.userId, auth.roles, featureKey, action);
      return NextResponse.json({ success: true, featureKey, action, allowed });
    }
    if (!await canAccessFeatureEngine(auth.userId, auth.roles, 'employee.permissions', 'manage')) {
      return NextResponse.json({ success: false, error: 'Permission management access required.' }, { status: 403 });
    }
    const rules = await db.featureAccessRule.findMany({
      where: { ownerType: { in: ['EMPLOYEE', 'USER', 'employee', 'user'] } },
      orderBy: { updatedAt: 'desc' }, take: 100,
    });
    return NextResponse.json({ success: true, rules });
  } catch {
    return NextResponse.json({ success: false, error: 'Feature permissions are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    // Granting/revoking permissions is a human master-authority operation.
    if (auth.actingAsSessionId || auth.actorUserId !== auth.userId ||
        ![auth.userType, ...auth.roles].some(role => role.toUpperCase() === 'SUPER_ADMIN')) {
      return NextResponse.json({ success: false, error: 'A non-acting Super Admin session is required.' }, { status: 403 });
    }
    const parsed = RuleInput.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid permission rule. Supply owner, exact feature/action key, enabled state, approval gate, quota and reason.' }, { status: 400 });
    const { id, reason, ...input } = parsed.data;
    const employee = await db.employee.findUnique({ where: input.ownerType === 'EMPLOYEE' ? { id: input.ownerId } : { userId: input.ownerId } })
      || (input.ownerType === 'EMPLOYEE' ? await db.employee.findUnique({ where: { userId: input.ownerId } }) : null);
    if (!employee) return NextResponse.json({ success: false, error: 'Employee target not found.' }, { status: 404 });
    if (input.ownerType === 'EMPLOYEE') input.ownerId = employee.id;
    const rule = await db.$transaction(async tx => {
      const previous = id ? await tx.featureAccessRule.findUnique({ where: { id } }) : null;
      if (id && (!previous || !['EMPLOYEE', 'USER', 'employee', 'user'].includes(previous.ownerType))) throw new Error('Invalid rule target');
      const data = id
        ? await tx.featureAccessRule.update({ where: { id }, data: { ...input, updatedBy: auth.actorUserId } })
        : await tx.featureAccessRule.create({ data: { ...input, createdBy: auth.actorUserId, updatedBy: auth.actorUserId } });
      await writePortalAudit(tx, auth, input.isEnabled ? 'PERMISSION_GRANTED' : 'PERMISSION_REVOKED', 'FeatureAccessRule', data.id,
        { reason, previous, current: data }, req);
      return data;
    });
    return NextResponse.json({ success: true, data: rule }, { status: id ? 200 : 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Permission change could not be saved and audited.' }, { status: 503 });
  }
}
