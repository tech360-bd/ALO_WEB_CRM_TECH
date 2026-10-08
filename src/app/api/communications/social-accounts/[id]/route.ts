import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const VIEW_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER', 'MARKETING']);
const MANAGE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

function hasRole(auth: { userType: string; roles: string[] }, allowed: Set<string>) {
  return [auth.userType, ...auth.roles].some((role) => allowed.has(role.toUpperCase()));
}

async function getAuthorizedAccount(request: Request, id: string, allowed: Set<string>) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return { response: auth } as const;
  if (!hasRole(auth, allowed)) {
    return { response: NextResponse.json({ success: false, error: 'Social account access is not permitted.' }, { status: 403 }) } as const;
  }
  const record = await db.socialAccountOwnership.findUnique({
    where: { id },
    select: { id: true, platform: true, accountName: true, accountType: true, ownerEmployeeId: true, connectionStatus: true, tokenStatus: true, webhookStatus: true, requiresConfig: true },
  });
  if (!record) return { response: NextResponse.json({ success: false, error: 'Social account not found.' }, { status: 404 }) } as const;
  return { auth, record } as const;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const access = await getAuthorizedAccount(request, id, VIEW_ROLES);
    if ('response' in access) return access.response;
    return NextResponse.json({
      socialAccount: {
        ...access.record,
        connectionStatus: 'NOT_VERIFIED',
        tokenStatus: 'NOT_VERIFIED',
        webhookStatus: 'NOT_VERIFIED',
        requiresConfig: true,
        providerEvidence: 'NOT VERIFIED — no OAuth, webhook, or live-test evidence is stored',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Social account status is temporarily unavailable.' }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, MANAGE_ROLES)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid JSON body is required.' }, { status: 400 });
  const existing = await db.socialAccountOwnership.findUnique({ where: { id }, select: { id: true, platform: true, accountType: true } });
  if (!existing) return NextResponse.json({ success: false, error: 'Social account not found.' }, { status: 404 });

  // A timestamp supplied by the browser is not a provider sync, and status
  // fields cannot be promoted to connected/valid/active without evidence.
  if (body.lastSync !== undefined || body.connectionStatus !== undefined && !['DISCONNECTED', 'disconnected'].includes(body.connectionStatus) ||
      body.tokenStatus !== undefined && !['NONE', 'REVOKED', 'none', 'revoked'].includes(body.tokenStatus) ||
      body.webhookStatus !== undefined && !['INACTIVE', 'inactive'].includes(body.webhookStatus) ||
      body.requiresConfig === false) {
    return NextResponse.json({ success: false, error: 'Provider state can only be changed after a real provider exchange and verification; no sync was recorded.' }, { status: 409 });
  }

  const data: any = {
    connectionStatus: 'DISCONNECTED',
    tokenStatus: body.tokenStatus?.toUpperCase() === 'REVOKED' ? 'REVOKED' : 'NONE',
    webhookStatus: 'INACTIVE',
    requiresConfig: true,
  };
  if (body.permissions !== undefined) {
    if (!Array.isArray(body.permissions) || body.permissions.some((permission: unknown) => !['canSend', 'canManage', 'canView'].includes(String(permission)))) {
      return NextResponse.json({ success: false, error: 'Permissions must be a list of known capability flags.' }, { status: 400 });
    }
    data.permissions = JSON.stringify(body.permissions);
  }
  if (body.ownerEmployeeId !== undefined) {
    if (body.ownerEmployeeId !== null && (typeof body.ownerEmployeeId !== 'string' || body.ownerEmployeeId.length > 191)) {
      return NextResponse.json({ success: false, error: 'Invalid employee owner id.' }, { status: 400 });
    }
    data.ownerEmployeeId = body.ownerEmployeeId || null;
  }
  if (body.accountType !== undefined) {
    if (!['OFFICIAL', 'EMPLOYEE_PERSONAL'].includes(String(body.accountType).toUpperCase())) {
      return NextResponse.json({ success: false, error: 'Invalid social account type.' }, { status: 400 });
    }
    data.accountType = String(body.accountType).toUpperCase();
  }
  if (body.requiresConfig !== undefined && body.requiresConfig !== true) {
    return NextResponse.json({ success: false, error: 'Unverified provider connections must remain configuration-required.' }, { status: 409 });
  }

  try {
    const socialAccount = await db.socialAccountOwnership.update({
      where: { id },
      data,
      select: { id: true, platform: true, accountName: true, accountType: true, ownerEmployeeId: true, permissions: true, createdAt: true, updatedAt: true },
    });
    await logAuditAction(auth, 'SOCIAL_ACCOUNT_CONFIGURATION_UPDATED', 'SocialAccountOwnership', id, {
      platform: existing.platform,
      accountType: socialAccount.accountType,
      providerConnection: 'not_verified',
    });
    return NextResponse.json({
      socialAccount: {
        ...socialAccount,
        connectionStatus: 'NOT_VERIFIED',
        tokenStatus: 'NOT_VERIFIED',
        webhookStatus: 'NOT_VERIFIED',
        requiresConfig: true,
        lastSync: null,
        providerEvidence: 'NOT VERIFIED — this is configuration metadata only',
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Social account configuration could not be updated.' }, { status: 503 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, MANAGE_ROLES)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });
  const { id } = await params;

  try {
    const existing = await db.socialAccountOwnership.findUnique({ where: { id }, select: { id: true, platform: true, accountName: true } });
    if (!existing) return NextResponse.json({ success: false, error: 'Social account not found.' }, { status: 404 });
    await db.socialAccountOwnership.update({
      where: { id },
      data: {
        ownerEmployeeId: null,
        permissions: '[]',
        connectionStatus: 'DISCONNECTED',
        tokenStatus: 'REVOKED',
        webhookStatus: 'INACTIVE',
        requiresConfig: true,
      },
    });
    await logAuditAction(auth, 'SOCIAL_ACCOUNT_DISCONNECTED_LOCALLY', 'SocialAccountOwnership', id, {
      platform: existing.platform,
      externalRevocation: 'not_performed',
    });
    return NextResponse.json({
      success: true,
      status: 'DISCONNECTED_LOCALLY',
      message: 'Local access metadata was cleared. Provider-side revocation was not performed or verified.',
      providerRevocation: 'NOT VERIFIED — EXTERNAL ACCESS REQUIRED',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Social account could not be disconnected locally.' }, { status: 503 });
  }
}
