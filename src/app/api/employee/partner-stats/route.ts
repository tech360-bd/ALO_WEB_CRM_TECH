import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { validateRequestAccess } from '@/lib/access-control/central-security-engine';
import { writePortalAudit } from '@/lib/transactional-audit';

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    const access = await validateRequestAccess({ userId: auth.userId }, 'employee.partner.stats', 'view', { ownerId: auth.userId, assigneeId: auth.userId });
    if (!access.allowed) return NextResponse.json({ success: false, error: 'Partner report permission required.' }, { status: 403 });
    const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { partnerGroups: true } });
    let assignments: unknown;
    try { assignments = JSON.parse(employee?.partnerGroups || '[]'); } catch { assignments = null; }
    if (access.scope !== 'GLOBAL' && (!Array.isArray(assignments) || assignments.some(id => typeof id !== 'string' || !id.trim()))) {
      return NextResponse.json({ success: false, error: 'Partner assignments require administrator review.' }, { status: 403 });
    }
    const partnerIds = Array.isArray(assignments) ? [...new Set(assignments.filter((id): id is string => typeof id === 'string').map(id => id.trim()))] : [];
    const scope = access.scope === 'GLOBAL' ? {} : { partnerId: { in: partnerIds } };
    const [all, pending, active, partnerLeads, pendingSeatRequests, pendingQuotaRequests] = await Promise.all([
      db.partnerProfile.groupBy({ by: ['partnerId'], where: scope }),
      db.partnerProfile.groupBy({ by: ['partnerId'], where: { ...scope, approvalStatus: { in: ['pending', 'PENDING'] } } }),
      db.partnerProfile.groupBy({ by: ['partnerId'], where: { ...scope, approvalStatus: { in: ['active', 'ACTIVE', 'approved', 'APPROVED'] } } }),
      db.partnerLead.count({ where: scope }),
      db.partnerUserSeatRequest.count({ where: { ...scope, status: { in: ['pending', 'PENDING'] } } }),
      db.extraQuotaRequest.count({ where: { ...scope, status: { in: ['pending', 'PENDING'] } } }),
    ]);
    await db.$transaction(async tx => { await writePortalAudit(tx, auth, 'PARTNER_REPORT_VIEWED', 'PartnerReport', auth.userId, { scope: access.scope, assignedPartnerCount: partnerIds.length }, req); });
    return NextResponse.json({ success: true, stats: { totalPartners: all.length, pendingPartners: pending.length, activePartners: active.length, partnerLeads, pendingSeatRequests, pendingQuotaRequests }, privacy: 'Counts are limited to centrally authorized partner assignments; companies are counted once across employee seats.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Partner statistics are unavailable. Retry when the database and audit service are available.' }, { status: 503 });
  }
}
