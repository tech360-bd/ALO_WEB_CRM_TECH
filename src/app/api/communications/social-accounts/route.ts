import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const VIEW_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER', 'MARKETING']);
const MANAGE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);

function hasRole(auth: { userType: string; roles: string[] }, allowed: Set<string>) {
  return [auth.userType, ...auth.roles].some((role) => allowed.has(role.toUpperCase()));
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, VIEW_ROLES)) return NextResponse.json({ success: false, error: 'Social account status access is not permitted.' }, { status: 403 });

  try {
    const platform = req.nextUrl.searchParams.get('platform');
    const ownerEmployeeId = req.nextUrl.searchParams.get('ownerEmployeeId');
    const records = await db.socialAccountOwnership.findMany({
      where: { ...(platform ? { platform } : {}), ...(ownerEmployeeId ? { ownerEmployeeId } : {}) },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        connectedAccountId: true,
        platform: true,
        accountId: true,
        accountName: true,
        accountType: true,
        ownerEmployeeId: true,
        organization: true,
        connectionStatus: true,
        permissions: true,
        tokenStatus: true,
        webhookStatus: true,
        requiresConfig: true,
        lastSync: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    const socialAccounts = records.map((record) => ({
      ...record,
      // Legacy status fields are not provider evidence. A visible account is
      // not considered connected until OAuth, webhook and live tests are stored.
      connectionStatus: 'NOT_VERIFIED',
      reportedConnectionStatus: record.connectionStatus,
      tokenStatus: 'NOT_VERIFIED',
      webhookStatus: 'NOT_VERIFIED',
      requiresConfig: true,
      lastSync: null,
      providerEvidence: 'NOT VERIFIED — external provider connection and live test were not verified',
    }));
    return NextResponse.json({ socialAccounts });
  } catch {
    return NextResponse.json({ success: false, error: 'Social account records are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, MANAGE_ROLES)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: 'A valid JSON body is required.' }, { status: 400 });
  }
  const platform = typeof body.platform === 'string' ? body.platform.trim().toUpperCase() : '';
  const accountName = typeof body.accountName === 'string' ? body.accountName.trim() : '';
  const accountType = typeof body.accountType === 'string' ? body.accountType.toUpperCase() : 'OFFICIAL';
  const ownerEmployeeId = typeof body.ownerEmployeeId === 'string' ? body.ownerEmployeeId.trim() : '';
  const organization = typeof body.organization === 'string' ? body.organization.trim() : 'ALO Education';
  if (!platform || platform.length > 50 || !accountName || accountName.length > 191 || !['OFFICIAL', 'EMPLOYEE_PERSONAL'].includes(accountType)) {
    return NextResponse.json({ success: false, error: 'A valid platform, account name, and account type are required.' }, { status: 400 });
  }
  if (ownerEmployeeId.length > 191 || organization.length > 191) {
    return NextResponse.json({ success: false, error: 'Owner or organization value is too long.' }, { status: 400 });
  }
  if (['CONNECTED', 'VALID', 'ACTIVE'].some((value) => [body.connectionStatus, body.tokenStatus, body.webhookStatus].includes(value)) || body.requiresConfig === false) {
    return NextResponse.json({ success: false, error: 'Unverified provider state cannot be set by this endpoint.' }, { status: 409 });
  }

  try {
    const socialAccount = await db.socialAccountOwnership.create({
      data: {
        platform,
        accountName,
        accountType,
        ownerEmployeeId: ownerEmployeeId || null,
        organization: organization || 'ALO Education',
        connectionStatus: 'DISCONNECTED',
        permissions: '[]',
        tokenStatus: 'NONE',
        webhookStatus: 'INACTIVE',
        requiresConfig: true,
      },
      select: {
        id: true, platform: true, accountName: true, accountType: true,
        ownerEmployeeId: true, organization: true, connectionStatus: true,
        permissions: true, tokenStatus: true, webhookStatus: true,
        requiresConfig: true, createdAt: true, updatedAt: true,
      },
    });
    await logAuditAction(auth, 'SOCIAL_ACCOUNT_PLACEHOLDER_CREATED', 'SocialAccountOwnership', socialAccount.id, {
      platform,
      accountType,
      externalConnection: 'not_configured',
    });
    return NextResponse.json({
      socialAccount: {
        ...socialAccount,
        connectionStatus: 'NOT_VERIFIED',
        tokenStatus: 'NOT_VERIFIED',
        webhookStatus: 'NOT_VERIFIED',
        requiresConfig: true,
        providerEvidence: 'NOT VERIFIED — this is a configuration placeholder only',
      },
    }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Social account placeholder could not be created.' }, { status: 503 });
  }
}
