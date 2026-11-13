import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { getPartnerBranding, savePartnerBranding } from '@/lib/partner/partner-branding-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function isAloSuperAdmin(auth: { userType: string; roles: string[] }): boolean {
  return auth.userType === 'SUPER_ADMIN' || auth.roles.some((role) => role.toLowerCase() === 'super_admin');
}

/**
 * Partner branding — the logo and colour scheme shown in the footer block that
 * a B2B partner's own students see.
 *
 * GET  /api/partner/branding            → the caller's tenant branding
 * GET  /api/partner/branding?partnerId= → same, for an ALO Super Admin
 * PUT  /api/partner/branding            → save (partner Super Admin, or ALO Super Admin)
 *
 * Tenant scope always comes from the session. A partner user can never read or
 * write another partner's branding by changing the query string: `partnerId` is
 * honoured only for an ALO Super Admin.
 */
export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;

  const requestedPartnerId = new URL(request.url).searchParams.get('partnerId')?.trim() || '';
  const partnerId = isAloSuperAdmin(auth) && requestedPartnerId ? requestedPartnerId : auth.partnerId || '';
  if (!partnerId) {
    return NextResponse.json({ success: false, error: 'Partner identity required.' }, { status: 403 });
  }

  const branding = await getPartnerBranding(partnerId);
  return NextResponse.json(
    { success: true, partnerId, branding },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}

export async function PUT(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ success: false, error: 'Cross-origin request denied.' }, { status: 403 });
  }
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;

  const canManageOwnTenant = Boolean(auth.partnerId) && (
    auth.partnerRole === 'PARTNER_SUPER_ADMIN'
    || auth.roles.some((role) => ['partner_super_admin', 'partnersuperadmin', 'super_admin'].includes(role.toLowerCase()))
  );
  const aloSuperAdmin = isAloSuperAdmin(auth);

  if (!canManageOwnTenant && !aloSuperAdmin) {
    return NextResponse.json(
      { success: false, error: 'Only a Partner Super Admin can change the partner branding.' },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'Invalid branding payload.' }, { status: 400 });
  }
  const payload = body as Record<string, unknown>;
  const requestedPartnerId = typeof payload.partnerId === 'string' ? payload.partnerId.trim() : '';
  const partnerId = aloSuperAdmin && requestedPartnerId ? requestedPartnerId : auth.partnerId || '';
  if (!partnerId) {
    return NextResponse.json({ success: false, error: 'Partner identity required.' }, { status: 403 });
  }

  // Only branding fields are accepted; partnerId/updatedById are never taken
  // from the payload on the partner path.
  const saved = await savePartnerBranding({
    partnerId,
    updatedById: auth.userId,
    branding: {
      displayName: payload.displayName as string | undefined,
      tagline: payload.tagline as string | undefined,
      logoUrl: payload.logoUrl as string | undefined,
      primaryColor: payload.primaryColor as string | undefined,
      secondaryColor: payload.secondaryColor as string | undefined,
      accentColor: payload.accentColor as string | undefined,
      websiteUrl: payload.websiteUrl as string | undefined,
      supportEmail: payload.supportEmail as string | undefined,
      supportPhone: payload.supportPhone as string | undefined,
      showInFooter: payload.showInFooter as boolean | undefined,
    },
  });

  if (!saved.ok) {
    return NextResponse.json({ success: false, error: saved.error, field: saved.field }, { status: 400 });
  }

  // Partner users live in PortalUser, not User, so the audit row carries no
  // User FK; the acting portal user id is recorded in the detail payload.
  await db.auditLog.create({
    data: {
      userId: null,
      action: 'PARTNER_BRANDING_UPDATE',
      resource: 'PartnerBranding',
      resourceId: partnerId,
      actorRole: auth.partnerRole || auth.userType || '',
      details: JSON.stringify({ updatedById: auth.userId, partnerId }),
    },
  }).catch(() => { /* audit logging must never block the save */ });

  return NextResponse.json(
    { success: true, partnerId, branding: saved.branding },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
