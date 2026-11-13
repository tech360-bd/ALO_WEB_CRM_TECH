import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { OFFICIAL_SEAL, type SealDocumentKind } from '@/lib/brand/brand-assets';
import { getOfficialSealPng, isSealAuthorized } from '@/lib/documents/official-documents';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The ONLY HTTP surface for the official ALO Education seal.
 *
 * The seal file lives outside `public/` (`src/lib/documents/assets/`), so it
 * has no static URL anyone could download. This route serves it exclusively
 * to a Super Admin in their own session — ADMIN, PARTNER_SUPER_ADMIN and
 * acting-as sessions are rejected by `isSealAuthorized` — for an official
 * document kind, and writes an audit record BEFORE responding. If the audit
 * record cannot be persisted, the seal is not served (fail closed).
 *
 * Server-rendered documents (salary slip, offer letter) embed the seal
 * directly via `buildOfficialDocumentHtml`; this route exists for on-screen
 * previews such as the HR agreement letterhead preview.
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;

  const documentType = (new URL(request.url).searchParams.get('documentType') || '') as SealDocumentKind;
  const isOfficialKind = (OFFICIAL_SEAL.appliesTo as readonly string[]).includes(documentType);
  if (!isOfficialKind || !isSealAuthorized(auth)) {
    return NextResponse.json(
      { success: false, error: 'The official seal can only be used by a Super Admin on an official document.' },
      { status: 403, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  try {
    await db.portalAuditLog.create({
      data: {
        actorUserId: auth.actorUserId || auth.userId,
        action: 'OFFICIAL_SEAL_ACCESSED',
        entityType: 'OfficialSeal',
        entityId: documentType,
        ipAddress: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '',
        userAgent: request.headers.get('user-agent') || '',
        metadata: JSON.stringify({
          effectiveUserId: auth.userId,
          userType: auth.userType,
          documentType,
        }),
      },
    });

    const bytes = await getOfficialSealPng();
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': String(bytes.length),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': 'inline; filename="alo-official-seal.png"',
      },
    });
  } catch (error) {
    console.error('[OFFICIAL SEAL] GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Official seal is temporarily unavailable.' },
      { status: 503, headers: { 'Cache-Control': 'private, no-store' } },
    );
  }
}
