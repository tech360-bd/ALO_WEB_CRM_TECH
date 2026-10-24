import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { writePortalAudit } from '@/lib/transactional-audit';
import { reserveEmployeeQuota } from '@/lib/employee-access-engine';
const Input = z.object({ featureKey: z.string().min(1).max(191).regex(/^[a-zA-Z0-9_.-]+$/), requestedAmount: z.number().int().positive().optional(), reason: z.string().max(500).optional() }).strict();
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req); if (auth instanceof NextResponse) return auth;
    const requestedEmployee = req.nextUrl.searchParams.get('employeeId') || auth.userId;
    const employee = await db.employee.findFirst({ where: { OR: [{ id: requestedEmployee }, { userId: requestedEmployee }] } });
    if (!employee) return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
    const access = await validateRequestAccess({ userId: auth.userId }, 'employee.quotas', 'view', { ownerId: employee.userId, branchId: employee.branch, departmentId: employee.department });
    if (!access.allowed) return NextResponse.json({ success: false, error: 'Employee quota permission required.' }, { status: 403 });
    const partnerId = req.nextUrl.searchParams.get('partnerId');
    if (partnerId) {
      const partnerAccess = await validateRequestAccess({ userId: auth.userId }, 'partner.quotas', 'view', { ownerId: auth.userId, recordType: 'Partner', recordId: partnerId });
      if (!partnerAccess.allowed) return NextResponse.json({ success: false, error: 'Partner quota permission required.' }, { status: 403 });
      const actor = await db.employee.findUnique({ where: { userId: auth.userId } });
      let assigned: unknown; try { assigned = JSON.parse(actor?.partnerGroups || '[]'); } catch { assigned = []; }
      if (partnerAccess.scope !== 'GLOBAL' && (!Array.isArray(assigned) || !assigned.includes(partnerId))) return NextResponse.json({ success: false, error: 'Partner scope denied.' }, { status: 403 });
    }
    const [usage, partnerQuota] = await Promise.all([
      db.featureUsageLog.findMany({ where: { ownerType: 'EMPLOYEE', ownerId: employee.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
      partnerId ? db.partnerQuota.findUnique({ where: { partnerId } }) : Promise.resolve(null),
    ]);
    await db.$transaction(async tx => { await writePortalAudit(tx, auth, 'QUOTA_HISTORY_VIEWED', 'Employee', employee.id, { partnerId }, req); });
    return NextResponse.json({ success: true, employeeQuotas: usage, partnerQuotas: partnerQuota, engine: 'CENTRAL_PERMISSION_AND_SERIALIZABLE_USAGE' });
  } catch { return NextResponse.json({ success: false, error: 'Quota history unavailable.' }, { status: 503 }); }
}
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req); if (auth instanceof NextResponse) return auth;
    const parsed = Input.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid feature usage request.' }, { status: 400 });
    const result = await reserveEmployeeQuota(auth, parsed.data.featureKey);
    if (!result.allowed) return NextResponse.json({ success: false, allowed: false, currentUsage: result.currentUsage, limit: result.limit, extraRequest: null, error: 'Permission or configured quota unavailable. Additional access requires its own approval request.' }, { status: 429 });
    return NextResponse.json({ success: true, ...result });
  } catch { return NextResponse.json({ success: false, allowed: false, error: 'Usage could not be reserved and audited.' }, { status: 503 }); }
}
