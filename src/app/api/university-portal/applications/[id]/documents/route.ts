import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import {
  listInstitutionApplicationDocuments,
  resolveUniversityPortalContextByEmail,
} from '@/lib/university-portal';
import { isFeatureEnabled } from '@/lib/feature-flags';

// ============================================================
// GET /api/university-portal/applications/[id]/documents (spec s39, s99)
// Throws TENANT_MISMATCH if the application belongs to another institution —
// a direct-object-reference attempt cannot read another tenant's documents.
// ============================================================

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const gated = await isFeatureEnabled('UNIVERSITY_PORTAL', { userId: auth.userId, roles: auth.roles });
  if (!gated) {
    return NextResponse.json({ success: false, status: 'NOT_CONFIGURED', error: 'University portal disabled.' }, { status: 404 });
  }

  const portal = await resolveUniversityPortalContextByEmail(auth.email);
  if (!portal) {
    return NextResponse.json({ success: false, error: 'No active university portal account.' }, { status: 403 });
  }

  try {
    const result = await listInstitutionApplicationDocuments(portal, id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Query failed';
    if (message === 'TENANT_MISMATCH') {
      return NextResponse.json({ success: false, error: 'TENANT_MISMATCH' }, { status: 403 });
    }
    if (message.startsWith('PERMISSION_DENIED')) {
      return NextResponse.json({ success: false, error: message }, { status: 403 });
    }
    if (/not found/i.test(message)) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}, { requireUserTypes: ['UNIVERSITY', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYEE'] });
