import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import {
  proposeStatusUpdate,
  resolveUniversityPortalContextByEmail,
} from '@/lib/university-portal';
import { isFeatureEnabled } from '@/lib/feature-flags';

// ============================================================
// POST /api/university-portal/applications/[id]/propose-status (spec s39, s116)
//
// A representative PROPOSES a stage change; ALO remains the system of record.
// The proposal is durably logged and queued for ALO approval — it never mutates
// the authoritative pipeline directly.
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
  const proposedStage = String(body?.proposedStage || '').trim();
  if (!proposedStage) {
    return NextResponse.json({ success: false, error: 'proposedStage is required' }, { status: 400 });
  }

  try {
    const result = await proposeStatusUpdate(portal, id, proposedStage, String(body?.note || ''));
    return NextResponse.json({ success: true, ...result }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Proposal failed';
    const denied = message === 'TENANT_MISMATCH' || message.startsWith('PERMISSION_DENIED');
    return NextResponse.json({ success: false, error: message }, { status: denied ? 403 : 400 });
  }
}, { requireUserTypes: ['UNIVERSITY', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'] });
