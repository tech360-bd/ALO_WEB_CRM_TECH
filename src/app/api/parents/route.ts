import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import {
  ACCESS_LEVELS,
  CHANNELS,
  CONSENT_TYPES,
  RELATIONSHIPS,
  createParentGuardian,
  listParentsForStudent,
} from '@/lib/parent-guardian';

// ============================================================
// GET  /api/parents?studentId=… — list parents/guardians for a student (s13)
// POST /api/parents            — create a parent/guardian record
//
// Staff-only. A parent's own access goes through /api/parents/portal/me, which
// is strictly capability-gated — this route must never be reachable by a parent
// because it would expose other families' contact details.
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'];

export const GET = withAuth(async (request: Request, _auth) => {
  const url = new URL(request.url);
  const studentId = url.searchParams.get('studentId') || '';
  if (!studentId) {
    return NextResponse.json({ success: false, error: 'studentId is required' }, { status: 400 });
  }
  const parents = await listParentsForStudent(studentId);
  return NextResponse.json({ success: true, parents, count: parents.length });
}, { requireUserTypes: STAFF_TYPES });

export const POST = withAuth(async (request: Request, auth) => {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'A JSON body is required' }, { status: 400 });
  }
  if (!body.studentId || !String(body.fullName || '').trim()) {
    return NextResponse.json(
      { success: false, error: 'studentId and fullName are required' },
      { status: 400 },
    );
  }

  try {
    const parent = await createParentGuardian({
      studentId: String(body.studentId),
      fullName: String(body.fullName),
      relationship: body.relationship,
      email: body.email,
      phone: body.phone,
      whatsapp: body.whatsapp,
      country: body.country,
      city: body.city,
      occupation: body.occupation,
      isPrimaryContact: body.isPrimaryContact === true,
      isFinancialSponsor: body.isFinancialSponsor === true,
      communicationPrefs: Array.isArray(body.communicationPrefs) ? body.communicationPrefs : undefined,
      notificationPrefs: Array.isArray(body.notificationPrefs) ? body.notificationPrefs : undefined,
      accessLevel: body.accessLevel,
      portalEnabled: body.portalEnabled === true,
      notes: body.notes,
      actorId: auth.actorUserId,
      consents: Array.isArray(body.consents) ? body.consents : undefined,
    });

    await logAuditAction(auth, 'PARENT_GUARDIAN_CREATED', 'ParentGuardian', parent.id, {
      studentId: parent.studentId,
      relationship: parent.relationship,
      accessLevel: parent.accessLevel,
      portalEnabled: parent.portalEnabled,
    });

    return NextResponse.json({ success: true, parent }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Creation failed' },
      { status: 400 },
    );
  }
}, { requireUserTypes: STAFF_TYPES });

export const OPTIONS = withAuth(async () => {
  return NextResponse.json({
    success: true,
    relationships: RELATIONSHIPS,
    accessLevels: ACCESS_LEVELS,
    consentTypes: CONSENT_TYPES,
    channels: CHANNELS,
  });
}, { requireUserTypes: STAFF_TYPES });
