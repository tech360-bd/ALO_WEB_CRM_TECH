import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, logAuditAction } from '@/lib/auth-middleware';

const ADMIN_ROLES = new Set(['SUPER_ADMIN', 'ADMIN']);
const CHANNELS = new Set(['WHATSAPP', 'SMS', 'EMAIL', 'PHONE', 'FACEBOOK', 'INSTAGRAM']);
const STATUSES = new Set(['OPTED_IN', 'OPTED_OUT', 'PENDING', 'UNKNOWN']);
function isAdministrator(auth: { userType: string; roles: string[] }) {
  return [auth.userType, ...auth.roles].some((role) => ADMIN_ROLES.has(role.toUpperCase()));
}

// Global consent-ledger access is privileged because it contains student/lead identifiers.
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdministrator(auth)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });

  try {
    const records = await db.consentRecord.findMany({
      orderBy: { createdAt: 'desc' }, take: 500,
      select: { id: true, studentId: true, leadId: true, channel: true, consentStatus: true, preferredLanguage: true, consentDate: true, optOutDate: true, consentSource: true, createdAt: true },
    });
    return NextResponse.json({
      records,
      stats: {
        total: records.length,
        optedIn: records.filter((record) => record.consentStatus === 'OPTED_IN').length,
        optedOut: records.filter((record) => record.consentStatus === 'OPTED_OUT').length,
        unknown: records.filter((record) => record.consentStatus === 'UNKNOWN' || record.consentStatus === 'PENDING').length,
      },
      verification: 'Manually recorded consent evidence is not independently verified by an external provider.',
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Consent records are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

// Manual administrator entry only. This endpoint does not ingest provider STOP/unsubscribe events.
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdministrator(auth)) return NextResponse.json({ success: false, error: 'Administrator access is required.' }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return NextResponse.json({ success: false, error: 'Invalid consent record.' }, { status: 400 });
    body = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const inputStudent = typeof body.studentId === 'string' ? body.studentId.trim() : '';
  const inputLead = typeof body.leadId === 'string' ? body.leadId.trim() : '';
  const channel = typeof body.channel === 'string' ? body.channel.trim().toUpperCase() : '';
  const consentStatus = typeof body.consentStatus === 'string' ? body.consentStatus.trim().toUpperCase() : '';
  const evidenceReference = typeof body.evidenceReference === 'string' ? body.evidenceReference.trim() : '';
  if (Boolean(inputStudent) === Boolean(inputLead)) return NextResponse.json({ success: false, error: 'Provide exactly one existing student ID or lead ID.' }, { status: 400 });
  if (!CHANNELS.has(channel) || !STATUSES.has(consentStatus)) return NextResponse.json({ success: false, error: 'Unsupported channel or consent status.' }, { status: 400 });
  if ((consentStatus === 'OPTED_IN' || consentStatus === 'OPTED_OUT') && (evidenceReference.length < 4 || evidenceReference.length > 250)) {
    return NextResponse.json({ success: false, error: 'A 4–250 character evidence note or record reference is required for opt-in/opt-out.' }, { status: 400 });
  }

  try {
    let studentId: string | null = null;
    let leadId: string | null = null;
    if (inputStudent) {
      const student = await db.student.findFirst({ where: { OR: [{ id: inputStudent }, { studentId: inputStudent }] }, select: { id: true } });
      if (!student) return NextResponse.json({ success: false, error: 'The referenced CRM record was not found.' }, { status: 404 });
      studentId = student.id;
    }
    if (inputLead) {
      const lead = await db.lead.findFirst({ where: { OR: [{ id: inputLead }, { leadId: inputLead }] }, select: { id: true } });
      if (!lead) return NextResponse.json({ success: false, error: 'The referenced CRM record was not found.' }, { status: 404 });
      leadId = lead.id;
    }

    const now = new Date();
    const record = await db.consentRecord.create({
      data: {
        studentId,
        leadId,
        channel,
        consentStatus,
        consentDate: consentStatus === 'OPTED_IN' ? now : null,
        optOutDate: consentStatus === 'OPTED_OUT' ? now : null,
        consentSource: 'MANUAL_ADMIN_ASSERTION',
      },
      select: { id: true, studentId: true, leadId: true, channel: true, consentStatus: true, consentDate: true, optOutDate: true, createdAt: true },
    });

    await logAuditAction(auth, 'CONSENT_RECORD_MANUALLY_RECORDED', 'ConsentRecord', record.id, {
      consentStatus,
      channel,
      source: 'MANUAL_ADMIN_ASSERTION',
      evidenceReference: evidenceReference || null,
      externalEvidenceVerified: false,
    });

    return NextResponse.json({
      record,
      message: `Consent record saved as ${consentStatus}. Manual evidence was not independently verified.`,
      verification: 'NOT VERIFIED — manual evidence assertion only; provider or source verification is not implemented.',
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Consent record could not be saved.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
