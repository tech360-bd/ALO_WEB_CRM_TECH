import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { normalizeBdPhone, OFFICIAL_NUMBERS, MAIN_NUMBER, COO_NUMBER, seedOfficialNumberPool } from '@/lib/whatsapp-number-pool';

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
function safeNumber(number: Record<string, any>) {
  const { metaPhoneNumberId, metaBusinessAccountId, ...safe } = number;
  return {
    ...safe,
    connectionStatus: number.connectionStatus === 'connected' ? 'configured_unverified' : number.connectionStatus,
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
        expected: 20,
        connected: 0,
        configured: numbers.filter((number) => Boolean(number.metaPhoneNumberId)).length,
        disconnected: numbers.filter((number) => !number.metaPhoneNumberId).length,
        main: numbers.find((number) => number.phoneNumber === MAIN_NUMBER) ? safeNumber(numbers.find((number) => number.phoneNumber === MAIN_NUMBER)!) : null,
        coo: numbers.find((number) => number.phoneNumber === COO_NUMBER) ? safeNumber(numbers.find((number) => number.phoneNumber === COO_NUMBER)!) : null,
        employeePool: numbers.filter((number) => OFFICIAL_NUMBERS.slice(2).includes(number.phoneNumber)).length,
      },
      officialRange: { start: '01805020100', end: '01805020119', total: 20 },
      integrationState: 'CONFIGURATION_REQUIRES_PROVIDER_VERIFICATION',
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
    if (!isSuperAdmin(auth)) return NextResponse.json({ success: false, error: 'Super Admin access required to initialize the official number pool.' }, { status: 403 });
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
      return NextResponse.json({ success: true, result, message: 'Pool entries are database records only; no Meta connection is implied.' });
    } catch {
      return NextResponse.json({ success: false, error: 'Official number pool could not be initialized.' }, { status: 503 });
    }
  }

  if (!canAssign(auth)) return NextResponse.json({ success: false, error: 'WhatsApp number assignment permission required.' }, { status: 403 });
  const inputPhone = typeof body.phoneNumber === 'string' ? body.phoneNumber.trim() : '';
  if (!OFFICIAL_NUMBERS.includes(inputPhone)) {
    return NextResponse.json({ success: false, error: 'Phone must be in the official ALO range 01805020100–01805020119.' }, { status: 400 });
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
  const poolIndex = OFFICIAL_NUMBERS.indexOf(inputPhone);
  if ((poolIndex === 0 && ownerType && ownerType !== 'ALO_MAIN') || (poolIndex === 1 && ownerType && ownerType !== 'COO')) {
    return NextResponse.json({ success: false, error: 'The main and COO number ownership is fixed by ALO policy.' }, { status: 400 });
  }
  if (employeeOwnerId && poolIndex < 2) {
    return NextResponse.json({ success: false, error: 'The main and COO numbers cannot be assigned as employee numbers.' }, { status: 400 });
  }
  if (employeeOwnerId) {
    const employee = await db.employee.findFirst({ where: { OR: [{ id: employeeOwnerId }, { userId: employeeOwnerId }, { employeeId: employeeOwnerId }] }, select: { id: true, status: true } }).catch(() => null);
    if (!employee || employee.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'Select an active employee record.' }, { status: 400 });
  }

  try {
    const existing = await db.whatsAppOfficialNumber.findUnique({ where: { phoneNumber: inputPhone } });
    const index = OFFICIAL_NUMBERS.indexOf(inputPhone);
    const defaults = {
      ownerType: index === 0 ? 'ALO_MAIN' : index === 1 ? 'COO' : 'EMPLOYEE',
      isDefaultSender: index === 0,
      isComplaintSender: index === 0,
      isFollowUpSender: index === 0,
      isSupport247: index === 1,
      displayName: index === 0 ? 'ALO Education Main' : index === 1 ? 'ALO COO 24/7' : `ALO Employee ${index - 1}`,
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
    )) data.connectionStatus = 'disconnected';

    const updated = await db.$transaction(async (tx) => {
      const record = existing
        ? await tx.whatsAppOfficialNumber.update({ where: { id: existing.id }, data })
        : await tx.whatsAppOfficialNumber.create({
            data: {
              ...defaults,
              phoneNumber: inputPhone,
              normalizedPhone: normalizeBdPhone(inputPhone),
              purpose: index === 0 ? 'Main WhatsApp - Complaint - Follow-up - Default automation sender' : index === 1 ? 'COO - 24/7 urgent support - Escalation' : 'Employee WhatsApp',
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
