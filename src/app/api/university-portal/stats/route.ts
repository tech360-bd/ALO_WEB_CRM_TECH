import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import {
  institutionRecruitmentStats,
  resolveUniversityPortalContextByEmail,
} from '@/lib/university-portal';
import { isFeatureEnabled } from '@/lib/feature-flags';

// ============================================================
// GET /api/university-portal/stats (spec s39)
// Recruitment statistics for the representative's OWN institution only.
// ============================================================

export const GET = withAuth(async (_request: Request, auth) => {
  const gated = await isFeatureEnabled('UNIVERSITY_PORTAL', { userId: auth.userId, roles: auth.roles });
  if (!gated) {
    return NextResponse.json({ success: false, status: 'NOT_CONFIGURED', error: 'University portal disabled.' }, { status: 404 });
  }

  const portal = await resolveUniversityPortalContextByEmail(auth.email);
  if (!portal) {
    return NextResponse.json({ success: false, error: 'No active university portal account.' }, { status: 403 });
  }

  try {
    const stats = await institutionRecruitmentStats(portal);
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Stats failed';
    return NextResponse.json(
      { success: false, error: message },
      { status: message.startsWith('PERMISSION_DENIED') ? 403 : 500 },
    );
  }
}, { requireUserTypes: ['UNIVERSITY', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'] });
