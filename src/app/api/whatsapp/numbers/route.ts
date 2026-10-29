import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { normalizeBdPhone, toBdDisplayPhone, OFFICIAL_NUMBERS, EMPLOYEE_POOL, MAIN_NUMBER, COO_NUMBER, seedOfficialNumberPool, getWhatsAppNumberConfigStatus } from '@/lib/whatsapp-number-pool';
import { getWhatsAppAccessToken, getWhatsAppGraphUrl } from '@/lib/whatsapp-config';

function roles(auth: AuthContext): Set<string> {
  return new Set(auth.roles.map((role) => role.toLowerCase()));
}
function isSuperAdmin(auth: AuthContext): boolean {
  return roles(auth).has('super_admin');
}
function canView(auth: AuthContext): boolean {
  return isSuperAdmin(auth) || auth.permissions.includes('whatsapp.numbers.view');
}
function canAssign(auth: AuthContext): boolean {
  return isSuperAdmin(auth) || auth.permissions.includes('whatsapp.numbers.assign');
}
function maskIdentifier(value: string | null | undefined): string {
  if (!value) return '';
  const clean = value.trim();
  return clean.length <= 4 ? '••••' : `${'•'.repeat(Math.min(12, clean.length - 4))}${clean.slice(-4)}`;
}
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
function isRecentlyVerified(number: Record<string, any>, now = Date.now()): boolean {
  return number.activeStatus === 'active'
    && number.connectionStatus === 'connected'
    && Boolean(number.metaPhoneNumberId)
    && !number.lastConnectionCheckError
    && Boolean(number.lastConnectionCheckAt)
    && now - new Date(number.lastConnectionCheckAt).getTime() >= 0
    && now - new Date(number.lastConnectionCheckAt).getTime() <= VERIFICATION_TTL_MS;
}
function safeNumber(number: Record<string, any>) {
  const { metaPhoneNumberId, metaBusinessAccountId, ...safe } = number;
  return {
    ...safe,
    connectionStatus: number.connectionStatus === 'connected' && !isRecentlyVerified(number) ? 'configured_unverified' : number.connectionStatus,
    metaConfigured: Boolean(metaPhoneNumberId),
    metaPhoneNumberIdMasked: maskIdentifier(metaPhoneNumberId),
    metaBusinessAccountIdMasked: maskIdentifier(metaBusinessAccountId),
  };
}

export const GET = withAuth(async (_req: Request, auth: AuthContext) => {
  if (!canView(auth)) return NextResponse.json({ success: false, error: 'WhatsApp number view permission required.' }, { status: 403 });
  try {
    // Reads must not seed or otherwise mutate production data.
    const numbers = await db.whatsAppOfficialNumber.findMany({ orderBy: { phoneNumber: 'asc' } });
    return NextResponse.json({
      success: true,
      numbers: numbers.map(safeNumber),
      stats: {
        total: numbers.length,
        expected: OFFICIAL_NUMBERS.length,
        connected: numbers.filter((number) => isRecentlyVerified(number)).length,
        configured: numbers.filter((number) => Boolean(number.metaPhoneNumberId)).length,
        disconnected: numbers.filter((number) => !isRecentlyVerified(number)).length,
        main: numbers.find((number) => number.phoneNumber === MAIN_NUMBER) ? safeNumber(numbers.find((number) => number.phoneNumber === MAIN_NUMBER)!) : null,
        coo: numbers.find((number) => number.phoneNumber === COO_NUMBER) ? safeNumber(numbers.find((number) => number.phoneNumber === COO_NUMBER)!) : null,
        employeePool: numbers.filter((number) => EMPLOYEE_POOL.includes(number.phoneNumber)).length,
      },
      configuredNumbers: getWhatsAppNumberConfigStatus(),
      integrationState: numbers.some((number) => isRecentlyVerified(number)) ? 'PROVIDER_VERIFIED_RECENTLY' : 'CONFIGURATION_REQUIRES_PROVIDER_VERIFICATION',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'WhatsApp number configuration could not be loaded.' }, { status: 503 });
  }
});

export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON request body.' }, { status: 400 });
  }

  if (body.action === 'seed_official_pool') {
    if (!isSuperAdmin(auth)) return NextResponse.json({ success: false, error: 'Super Admin access required to initialize configured sender records.' }, { status: 403 });
    try {
      const result = await seedOfficialNumberPool();
      await db.crmAuditLog.create({
        data: {
          actorUserId: auth.userId,
          actorRole: auth.roles.join(','),
          action: 'WHATSAPP_OFFICIAL_NUMBER_POOL_INITIALIZED',
          afterData: JSON.stringify({ created: result.created, total: result.count }),
        },
      });
      return NextResponse.json({ success: true, result, message: 'Configured numbers are stored as disconnected records; neither ownership nor Meta connectivity is implied.' });
    } catch {
      return NextResponse.json({ success: false, error: 'Official number pool could not be initialized.' }, { status: 503 });
    }
  }

  if (body.action === 'verify_connection') {
    if (!isSuperAdmin(auth) && !auth.permissions.includes('whatsapp.numbers.api_config')) {
      return NextResponse.json({ success: false, error: 'Super Admin or WhatsApp API configuration permission required.' }, { status: 403 });
    }
    const phone = typeof body.phoneNumber === 'string' ? toBdDisplayPhone(body.phoneNumber) : '';
    if (!phone || !OFFICIAL_NUMBERS.includes(phone)) return NextResponse.json({ success: false, error: 'Phone must be in the operator-configured sender list.' }, { status: 400 });
    const number = await db.whatsAppOfficialNumber.findUnique({ where: { phoneNumber: phone } });
    if (!number) return NextResponse.json({ success: false, error: 'Initialize configured sender records and review this number first.' }, { status: 404 });
    const now = new Date();
    const token = getWhatsAppAccessToken();
    const url = number.metaPhoneNumberId && /^\d+$/.test(number.metaPhoneNumberId.trim())
      ? getWhatsAppGraphUrl(number.metaPhoneNumberId.trim())
      : null;
    if (!token || !url) {
      const errorCode = !token ? 'CLOUD_API_TOKEN_NOT_CONFIGURED' : 'META_PHONE_NUMBER_ID_MISSING_OR_INVALID';
      const updated = await db.whatsAppOfficialNumber.update({ where: { id: number.id }, data: { connectionStatus: 'error', lastConnectionCheckAt: now, lastConnectionCheckError: errorCode } });
      await db.auditLog.create({ data: { userId: auth.userId, action: 'WHATSAPP_NUMBER_CONNECTION_CHECK_FAILED', resource: 'WhatsAppOfficialNumber', resourceId: number.id, actorRole: auth.roles.join(','), details: JSON.stringify({ phoneNumber: phone, errorCode }) } }).catch(() => {});
      return NextResponse.json({ success: false, error: errorCode, data: safeNumber(updated) }, { status: 503 });
    }

    try {
      const providerUrl = new URL(url);
      providerUrl.searchParams.set('fields', 'id,display_phone_number,verified_name,quality_rating,whatsapp_business_account');
      const response = await fetch(providerUrl, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(12000), redirect: 'error' });
      const data: any = await response.json().catch(() => ({}));
      const providerCode = Number(data?.error?.code);
      const providerWabaId = typeof data?.whatsapp_business_account?.id === 'string' ? data.whatsapp_business_account.id : '';
      const expectedPhoneMatches = typeof data?.display_phone_number === 'string' && normalizeBdPhone(data.display_phone_number) === number.normalizedPhone;
      const idMatches = String(data?.id || '') === number.metaPhoneNumberId;
      const wabaMatches = !number.metaBusinessAccountId || !providerWabaId || number.metaBusinessAccountId === providerWabaId;
      const verified = response.ok && idMatches && expectedPhoneMatches && wabaMatches;
      const errorCode = verified ? '' : !response.ok
        ? `META_GRAPH_HTTP_${response.status}${Number.isFinite(providerCode) ? `_CODE_${providerCode}` : ''}`
        : !idMatches ? 'META_PHONE_NUMBER_ID_MISMATCH'
        : !expectedPhoneMatches ? 'META_DISPLAY_PHONE_MISMATCH'
        : 'META_BUSINESS_ACCOUNT_MISMATCH';
      const updated = await db.whatsAppOfficialNumber.update({
        where: { id: number.id },
        data: {
          connectionStatus: verified ? 'connected' : 'error',
          lastConnectionCheckAt: now,
          lastConnectionCheckError: errorCode,
          ...(verified && providerWabaId && !number.metaBusinessAccountId ? { metaBusinessAccountId: providerWabaId } : {}),
        },
      });
      await db.auditLog.create({
        data: {
          userId: auth.userId,
          action: verified ? 'WHATSAPP_NUMBER_CONNECTION_VERIFIED' : 'WHATSAPP_NUMBER_CONNECTION_CHECK_FAILED',
          resource: 'WhatsAppOfficialNumber',
          resourceId: number.id,
          actorRole: auth.roles.join(','),
          details: JSON.stringify({ phoneNumber: phone, verified, errorCode: errorCode || undefined, qualityRating: verified ? data?.quality_rating : undefined }),
        },
      }).catch(() => {});
      return NextResponse.json({ success: verified, verified, error: errorCode || undefined, data: safeNumber(updated) }, { status: verified ? 200 : 502 });
    } catch {
      const updated = await db.whatsAppOfficialNumber.update({ where: { id: number.id }, data: { connectionStatus: 'error', lastConnectionCheckAt: now, lastConnectionCheckError: 'META_GRAPH_REQUEST_FAILED' } }).catch(() => null);
      await db.auditLog.create({ data: { userId: auth.userId, action: 'WHATSAPP_NUMBER_CONNECTION_CHECK_FAILED', resource: 'WhatsAppOfficialNumber', resourceId: number.id, actorRole: auth.roles.join(','), details: JSON.stringify({ phoneNumber: phone, errorCode: 'META_GRAPH_REQUEST_FAILED' }) } }).catch(() => {});
      return NextResponse.json({ success: false, verified: false, error: 'META_GRAPH_REQUEST_FAILED', data: updated ? safeNumber(updated) : undefined }, { status: 502 });
    }
  }

  if (!canAssign(auth)) return NextResponse.json({ success: false, error: 'WhatsApp number assignment permission required.' }, { status: 403 });
  const inputPhone = typeof body.phoneNumber === 'string' ? toBdDisplayPhone(body.phoneNumber) : '';
  if (!inputPhone || !OFFICIAL_NUMBERS.includes(inputPhone)) {
    return NextResponse.json({ success: false, error: 'Phone must be a valid Bangladesh mobile number listed in the deployment configuration.' }, { status: 400 });
  }
  const sensitiveFields = ['metaPhoneNumberId', 'metaBusinessAccountId'];
  const attemptsSensitiveUpdate = sensitiveFields.some((field) => Object.prototype.hasOwnProperty.call(body, field));
  if (attemptsSensitiveUpdate && !isSuperAdmin(auth)) {
    return NextResponse.json({ success: false, error: 'Only Super Admin may configure Meta number identifiers.' }, { status: 403 });
  }
  const stringField = (name: string, max: number): string | undefined => {
    if (!Object.prototype.hasOwnProperty.call(body, name)) return undefined;
    if (typeof body[name] !== 'string' || body[name].length > max) throw new Error(`Invalid ${name}.`);
    return (body[name] as string).trim();
  };

  let displayName: string | undefined;
  let ownerType: string | undefined;
  let employeeOwnerId: string | undefined;
  let branch: string | undefined;
  let department: string | undefined;
  let metaPhoneNumberId: string | undefined;
  let metaBusinessAccountId: string | undefined;
  let reason: string;
  try {
    displayName = stringField('displayName', 150);
    ownerType = stringField('ownerType', 32)?.toUpperCase();
    employeeOwnerId = stringField('employeeOwnerId', 191);
    branch = stringField('branch', 100);
    department = stringField('department', 100);
    metaPhoneNumberId = stringField('metaPhoneNumberId', 100);
    metaBusinessAccountId = stringField('metaBusinessAccountId', 100);
    reason = stringField('reason', 500) || '';
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Invalid input.' }, { status: 400 });
  }
  if (ownerType && !['ALO_MAIN', 'COO', 'EMPLOYEE', 'BRANCH', 'DEPARTMENT'].includes(ownerType)) {
    return NextResponse.json({ success: false, error: 'Unsupported owner type.' }, { status: 400 });
  }
  const isMainNumber = inputPhone === MAIN_NUMBER;
  const isCooNumber = inputPhone === COO_NUMBER && !isMainNumber;
  if ((isMainNumber && ownerType && ownerType !== 'ALO_MAIN') || (isCooNumber && ownerType && ownerType !== 'COO')) {
    return NextResponse.json({ success: false, error: 'Configured main and urgent-support number roles cannot be reassigned.' }, { status: 400 });
  }
  if (employeeOwnerId && (isMainNumber || isCooNumber)) {
    return NextResponse.json({ success: false, error: 'Configured shared numbers cannot be assigned to an individual employee.' }, { status: 400 });
  }
  if (employeeOwnerId) {
    const employee = await db.employee.findFirst({ where: { OR: [{ id: employeeOwnerId }, { userId: employeeOwnerId }, { employeeId: employeeOwnerId }] }, select: { id: true, status: true } }).catch(() => null);
    if (!employee || employee.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'Select an active employee record.' }, { status: 400 });
  }

  try {
    const existing = await db.whatsAppOfficialNumber.findUnique({ where: { phoneNumber: inputPhone } });
    const employeeIndex = EMPLOYEE_POOL.indexOf(inputPhone);
    const defaults = {
      ownerType: isMainNumber ? 'ALO_MAIN' : isCooNumber ? 'COO' : 'EMPLOYEE',
      isDefaultSender: isMainNumber,
      isComplaintSender: isMainNumber,
      isFollowUpSender: isMainNumber,
      isSupport247: isCooNumber,
      displayName: isMainNumber ? 'Configured ALO main sender' : isCooNumber ? 'Configured urgent-support sender' : `Configured employee sender ${employeeIndex + 1}`,
    };
    const data: Record<string, unknown> = {};
    if (displayName !== undefined) data.displayName = displayName;
    if (ownerType !== undefined) data.ownerType = ownerType;
    if (employeeOwnerId !== undefined) data.employeeOwnerId = employeeOwnerId;
    if (branch !== undefined) data.branch = branch;
    if (department !== undefined) data.department = department;
    if (metaPhoneNumberId !== undefined) data.metaPhoneNumberId = metaPhoneNumberId;
    if (metaBusinessAccountId !== undefined) data.metaBusinessAccountId = metaBusinessAccountId;
    if (attemptsSensitiveUpdate && (
      metaPhoneNumberId !== undefined && metaPhoneNumberId !== (existing?.metaPhoneNumberId || '')
      || metaBusinessAccountId !== undefined && metaBusinessAccountId !== (existing?.metaBusinessAccountId || '')
    )) {
      data.connectionStatus = 'disconnected';
      data.lastConnectionCheckAt = null;
      data.lastConnectionCheckError = '';
    }

    const updated = await db.$transaction(async (tx) => {
      const record = existing
        ? await tx.whatsAppOfficialNumber.update({ where: { id: existing.id }, data })
        : await tx.whatsAppOfficialNumber.create({
            data: {
              ...defaults,
              phoneNumber: inputPhone,
              normalizedPhone: normalizeBdPhone(inputPhone),
              purpose: isMainNumber ? 'Configured main sender; provider ownership must be verified before use' : isCooNumber ? 'Configured urgent-support sender; provider ownership must be verified before use' : 'Configured employee sender; provider ownership must be verified before use',
              connectionStatus: 'disconnected',
              activeStatus: 'active',
              ...data,
            },
          });
      await tx.whatsAppNumberAssignmentAudit.create({
        data: {
          numberId: record.id,
          phoneNumber: inputPhone,
          changedById: auth.userId,
          changedByName: auth.name || '',
          changedByRole: auth.roles.join(','),
          previousOwnerType: existing?.ownerType || '',
          newOwnerType: record.ownerType,
          previousEmployee: existing?.employeeOwnerId || '',
          newEmployee: record.employeeOwnerId,
          previousBranch: existing?.branch || '',
          newBranch: record.branch,
          previousValue: JSON.stringify(existing || {}),
          newValue: JSON.stringify(record),
          reason: reason || 'WhatsApp number configuration updated',
          ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim().slice(0, 100) || '',
          userAgent: (req.headers.get('user-agent') || '').slice(0, 500),
        },
      });
      await tx.crmAuditLog.create({
        data: {
          actorUserId: auth.userId,
          actorRole: auth.roles.join(','),
          action: 'WHATSAPP_NUMBER_ASSIGNMENT',
          targetCollection: 'WhatsAppOfficialNumber',
          targetId: record.id,
          afterData: JSON.stringify({ phoneNumber: inputPhone, changedFields: Object.keys(data) }),
        },
      });
      return record;
    });
    return NextResponse.json({ success: true, data: safeNumber(updated) });
  } catch {
    return NextResponse.json({ success: false, error: 'WhatsApp number update could not be saved.' }, { status: 503 });
  }
});
