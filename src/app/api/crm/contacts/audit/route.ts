/** Contact Hub — immutable contact audit trail (permission gated). */
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { contactHubPermissionDenied } from '@/lib/contacts/hub-access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = withAuth(async (req: Request, auth: AuthContext) => {
  const denied = contactHubPermissionDenied(auth, 'contacts.audit.view', ['BRANCH_MANAGER']);
  if (denied) return denied;
  const contactId = new URL(req.url).searchParams.get('contactId')?.trim().slice(0, 128) || '';
  try {
    const [portalEvents, appEvents] = await Promise.all([
      db.portalAuditLog.findMany({
        where: { entityType: 'WhatsAppContact', ...(contactId ? { entityId: contactId } : {}) },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }).catch(() => []),
      db.auditLog.findMany({
        where: { resource: { in: ['WhatsAppContact', 'ConsentRecord', 'ContactMatchReview'] }, ...(contactId ? { resourceId: contactId } : {}) },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }).catch(() => []),
    ]);
    const events = [...portalEvents, ...appEvents]
      .map((event) => ({
        id: (event as { id: string }).id,
        action: (event as { action: string }).action,
        actor: (event as { actorUserId?: string; userId?: string }).actorUserId || (event as { userId?: string }).userId || 'system',
        resource: (event as { entityType?: string; resource?: string }).entityType || (event as { resource?: string }).resource || '',
        resourceId: (event as { entityId?: string; resourceId?: string }).entityId || (event as { resourceId?: string }).resourceId || '',
        createdAt: (event as { createdAt: Date }).createdAt,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 100);
    return NextResponse.json({ success: true, events, count: events.length, integrationState: 'LIVE_DB' }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Audit trail is temporarily unavailable.' }, { status: 503 });
  }
}, { requirePermissions: ['contacts.view'] });
