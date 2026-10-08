import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const VIEW_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER']);
const MANAGE_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);
function hasRole(auth: { userType: string; roles: string[] }, roles: Set<string>) {
  return [auth.userType, ...auth.roles].some((role) => roles.has(role.toUpperCase()));
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, VIEW_ROLES)) return NextResponse.json({ success: false, error: 'Connected-account status access is not permitted.' }, { status: 403 });
  try {
    const records = await db.connectedAccount.findMany({
      orderBy: { platform: 'asc' },
      select: { id: true, platform: true, accountName: true, accountId: true, connectionStatus: true, tokenExpiry: true, lastSync: true, lastActivity: true, assignedTo: true, assignedBranch: true, createdAt: true, updatedAt: true },
    });
    return NextResponse.json({
      accounts: records.map((record) => ({
        ...record,
        reportedConnectionStatus: record.connectionStatus,
        connectionStatus: record.connectionStatus === 'DISCONNECTED' ? 'DISCONNECTED' : 'NOT_VERIFIED',
        lastSync: null,
        lastActivity: null,
        providerEvidence: 'NOT VERIFIED — provider connection and live test were not verified',
      })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Connected accounts are temporarily unavailable.' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, MANAGE_ROLES)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A valid JSON body is required.' }, { status: 400 });
  if (body.accessTokenEnc || body.refreshTokenEnc || body.connectionStatus === 'CONNECTED') {
    return NextResponse.json({ success: false, error: 'This endpoint cannot accept credentials or assert a provider connection. No data was stored.' }, { status: 501 });
  }

  const platform = typeof body.platform === 'string' ? body.platform.trim().toUpperCase() : '';
  const accountName = typeof body.accountName === 'string' ? body.accountName.trim() : '';
  const accountId = typeof body.accountId === 'string' ? body.accountId.trim() : '';
  const assignedTo = typeof body.assignedTo === 'string' ? body.assignedTo.trim() : 'COMPANY';
  if (!platform || platform.length > 50 || !accountName || accountName.length > 191 || accountId.length > 191 || assignedTo.length > 191) {
    return NextResponse.json({ success: false, error: 'Platform, account name, and valid configuration values are required.' }, { status: 400 });
  }

  try {
    const account = await db.connectedAccount.create({
      data: {
        platform,
        accountName,
        accountId: accountId || null,
        assignedTo: assignedTo || 'COMPANY',
        connectionStatus: 'DISCONNECTED',
        accessTokenEnc: null,
        refreshTokenEnc: null,
        tokenExpiry: null,
        lastSync: null,
        lastActivity: null,
      },
      select: { id: true, platform: true, accountName: true, accountId: true, connectionStatus: true, assignedTo: true, tokenExpiry: true, lastSync: true, lastActivity: true, createdAt: true },
    });
    await logAuditAction(auth, 'CONNECTED_ACCOUNT_PLACEHOLDER_CREATED', 'ConnectedAccount', account.id, { platform, providerConnected: false });
    return NextResponse.json({
      account: { ...account, connectionStatus: 'CONFIGURATION_REQUIRED', providerEvidence: 'NOT VERIFIED — this is a disconnected placeholder only' },
      message: 'Configuration placeholder created. No provider credentials were stored and no connection was established.',
    }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: 'Account placeholder could not be created.' }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasRole(auth, MANAGE_ROLES)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });
  const body = await req.json().catch(() => null);
  const id = typeof body?.id === 'string' ? body.id : '';
  const action = typeof body?.action === 'string' ? body.action.toLowerCase() : '';
  if (!id || !['sync', 'disconnect', 'reconnect'].includes(action)) return NextResponse.json({ success: false, error: 'Account id and valid action are required.' }, { status: 400 });

  if (action !== 'disconnect') {
    return NextResponse.json({
      success: false,
      status: 'NOT_VERIFIED',
      error: action === 'sync'
        ? 'A local timestamp is not a provider sync. No sync was performed.'
        : 'A provider reconnect cannot be completed until official OAuth and live verification are implemented.',
      verification: 'NOT VERIFIED — EXTERNAL ACCESS REQUIRED',
    }, { status: 501 });
  }

  try {
    const existing = await db.connectedAccount.findUnique({ where: { id }, select: { id: true, platform: true } });
    if (!existing) return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 });
    const account = await db.connectedAccount.update({
      where: { id },
      data: { connectionStatus: 'DISCONNECTED', accessTokenEnc: null, refreshTokenEnc: null, tokenExpiry: null },
      select: { id: true, platform: true, accountName: true, accountId: true, connectionStatus: true, assignedTo: true, tokenExpiry: true, lastSync: true, lastActivity: true },
    });
    await logAuditAction(auth, 'CONNECTED_ACCOUNT_DISCONNECTED_LOCALLY', 'ConnectedAccount', id, { platform: existing.platform, externalRevocation: 'not_performed' });
    return NextResponse.json({
      account: { ...account, connectionStatus: 'DISCONNECTED' },
      message: 'Local credentials were cleared. Provider-side revocation was not performed or verified.',
      providerRevocation: 'NOT VERIFIED — EXTERNAL ACCESS REQUIRED',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Account could not be disconnected locally.' }, { status: 503 });
  }
}
