import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import {
  requestDocument,
  resolveUniversityPortalContextByEmail,
} from '@/lib/university-portal';
import { isFeatureEnabled } from '@/lib/feature-flags';

// ============================================================
// POST /api/university-portal/applications/[id]/request-document (spec s39)
// ============================================================

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const gated = await isFeatureEnabled('UNIVERSITY_PORTAL', { userId: auth.userId, roles: auth.roles });
  if (!gated) {
    return NextResponse.json({ success: false, status: 'NOT_CONFIGURED', error: 'University portal disabled.' }, { status: 404 });
  }

  const portal = await resolveUniversityPortalContextByEmail(auth.email);
  if (!portal) {
    return NextResponse.json({ success: false, error: 'No active university portal account.' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const documentType = String(body?.documentType || '').trim();
  if (!documentType) {
    return NextResponse.json({ success: false, error: 'documentType is required' }, { status: 400 });
  }

  try {
    const activity = await requestDocument(portal, id, documentType, String(body?.reason || ''));
    return NextResponse.json({ success: true, activityId: activity.id, documentType }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    const denied = message === 'TENANT_MISMATCH' || message.startsWith('PERMISSION_DENIED');
    return NextResponse.json({ success: false, error: message }, { status: denied ? 403 : 400 });
  }
}, { requireUserTypes: ['UNIVERSITY', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'] });
