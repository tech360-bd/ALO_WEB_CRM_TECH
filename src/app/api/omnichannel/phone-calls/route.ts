import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);
const CALL_TYPES = new Set(['INCOMING', 'OUTGOING', 'MISSED']);
const DISPOSITIONS = new Set(['ANSWERED', 'VOICEMAIL', 'MISSED', 'BUSY']);
function isAdministrator(auth: { userType: string; roles: string[] }) {
  return [auth.userType, ...auth.roles].some((role) => ADMIN_ROLES.has(role.toUpperCase()));
}
function validPhone(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length <= 32 && /^\+?[0-9()\-\s]{7,32}$/.test(value.trim());
}

// Manual call-log recording only. This endpoint does not place telephone calls.
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdministrator(auth)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    const value: unknown = await req.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
    body = value as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }
  const callType = typeof body.callType === 'string' ? body.callType.trim().toUpperCase() : '';
  const fromNumber = typeof body.fromNumber === 'string' ? body.fromNumber.trim() : '';
  const toNumber = typeof body.toNumber === 'string' ? body.toNumber.trim() : '';
  const disposition = typeof body.disposition === 'string' ? body.disposition.trim().toUpperCase() : '';
  const callNotes = typeof body.callNotes === 'string' ? body.callNotes.trim() : '';
  const duration = typeof body.duration === 'number' ? body.duration : Number(body.duration);

  if (!CALL_TYPES.has(callType) || !DISPOSITIONS.has(disposition) || !validPhone(fromNumber) || !validPhone(toNumber) || !Number.isInteger(duration) || duration < 0 || duration > 14400 || callNotes.length > 4000) {
    return NextResponse.json({ success: false, error: 'Call type, numbers, duration, disposition, or notes are invalid.' }, { status: 400 });
  }

  try {
    const call = await db.phoneCallLog.create({
      data: {
        callType,
        fromNumber,
        toNumber,
        duration: callType === 'MISSED' ? 0 : duration,
        callNotes: callNotes || null,
        disposition,
        provider: 'MANUAL_LOG',
        status: 'MANUALLY_RECORDED',
        consentRecorded: false,
      },
      select: { id: true, callType: true, fromNumber: true, toNumber: true, duration: true, callNotes: true, disposition: true, createdAt: true },
    });
    await logAuditAction(auth, 'OMNICHANNEL_MANUAL_CALL_LOG_CREATED', 'PhoneCallLog', call.id, { callType, disposition, provider: 'MANUAL_LOG' });
    return NextResponse.json({ call, operation: 'MANUAL_LOG_SAVED', callPlaced: false, timelineLinkCreated: false }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Manual call log could not be saved.' }, { status: 503 });
  }
}
