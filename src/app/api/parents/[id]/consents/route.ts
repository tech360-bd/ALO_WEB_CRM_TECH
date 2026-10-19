import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { CONSENT_TYPES, recordConsent } from '@/lib/parent-guardian';

// ============================================================
// GET  /api/parents/[id]/consents — full consent history (never just current)
// POST /api/parents/[id]/consents — record a grant or a revocation
//
// Consent is versioned and append-only: a revocation is a NEW row, so the
// history of what a family agreed to, and when, can never be rewritten (s67).
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'];
type RouteContext = { params: Promise<{ id: string }> };

export const GET = withAuth(async (_request: Request, _auth, context: RouteContext) => {
  const { id } = await context.params;
  const consents = await db.parentGuardianConsent.findMany({
    where: { parentId: id },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ success: true, consentTypes: CONSENT_TYPES, consents, count: consents.length });
}, { requireUserTypes: STAFF_TYPES });

export const POST = withAuth(async (request: Request, auth, context: RouteContext) => {
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'A JSON body is required' }, { status: 400 });
  }

  try {
    const consent = await recordConsent({
      parentId: id,
      consentType: String(body.consentType || ''),
      granted: body.granted === true,
      method: typeof body.method === 'string' ? body.method : '',
      evidenceRef: typeof body.evidenceRef === 'string' ? body.evidenceRef : '',
      version: typeof body.version === 'string' ? body.version : '1.0',
      ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
    });

    await logAuditAction(auth, consent.granted ? 'PARENT_CONSENT_GRANTED' : 'PARENT_CONSENT_REVOKED', 'ParentGuardianConsent', consent.id, {
      parentId: id,
      consentType: consent.consentType,
      method: consent.method,
    });

    return NextResponse.json({ success: true, consent }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Consent recording failed' },
      { status: 400 },
    );
  }
}, { requireUserTypes: STAFF_TYPES });
