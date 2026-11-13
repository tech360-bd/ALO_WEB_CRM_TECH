import { NextResponse } from 'next/server';
import { authenticateUnified } from '@/lib/unified-auth';
import { getStudentPartnerBranding, getPartnerUserBranding } from '@/lib/partner/partner-branding-service';
import type { PortalFooterContext, PortalFooterScope } from '@/lib/portal/footer-context';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/portal/footer-context
 *
 * Answers one question for the footer every signed-in portal user sees:
 * "does this person belong to a B2B partner?".
 *
 *   • ALO student              → { scope: 'student',  partner: null }
 *   • B2B-linked student       → { scope: 'student',  partner: {...} }
 *   • ALO employee             → { scope: 'employee', partner: null }
 *   • Partner's own portal user → { scope: 'partner',  partner: {...} }
 *   • Signed out               → 401 (the public footer already rendered)
 *
 * The partner is resolved from the session only. A client can never ask for a
 * different partner's branding by sending an id.
 */
export async function GET(req: Request) {
  const auth = await authenticateUnified(req);
  if (auth instanceof NextResponse) {
    return NextResponse.json(
      { success: false, error: 'Not signed in.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (auth.type === 'student') {
    const partner = await getStudentPartnerBranding({
      id: auth.data.studentId,
      studentId: auth.data.studentCode,
    });
    const body: PortalFooterContext = { scope: 'student', partner };
    return NextResponse.json({ success: true, ...body }, { headers: { 'Cache-Control': 'private, no-store' } });
  }

  const portal = auth.data;
  const scope: PortalFooterScope = portal.partnerId
    ? 'partner'
    : portal.userType === 'EMPLOYEE'
      ? 'employee'
      : 'counselor';
  const partner = portal.partnerId ? await getPartnerUserBranding(portal.userId) : null;
  const body: PortalFooterContext = { scope, partner };
  return NextResponse.json({ success: true, ...body }, { headers: { 'Cache-Control': 'private, no-store' } });
}
