import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { canViewEmployeeProfile, isHR, isSuperAdmin } from '@/lib/hrms/rbac';
import { writePortalAudit } from '@/lib/transactional-audit';
import { mutationOriginAllowed } from '@/lib/request-origin';

const MANDATORY_TYPES = [
  'passport', 'nid', 'photo', 'cv', 'certificates', 'experience_letter', 'appointment_letter', 'confirmation_letter',
  'increment_letter', 'promotion_letter', 'transfer_letter', 'warning_letter', 'termination_letter', 'employment_agreement',
  'nda', 'confidentiality_agreement', 'device_agreement', 'it_policy', 'data_privacy_agreement', 'international_agreement', 'bangladesh_agreement', 'exit_clearance',
];

async function resolveEmployee(userId: string, employeeId: string) {
  const hr = employeeId
    ? await db.employeeHR.findUnique({ where: { employeeId }, select: { id: true, userId: true, employeeId: true, status: true } })
    : await db.employeeHR.findUnique({ where: { userId }, select: { id: true, userId: true, employeeId: true, status: true } });
  const employee = hr
    ? await db.employee.findUnique({ where: { userId: hr.userId }, select: { id: true, userId: true, employeeId: true, status: true } })
    : employeeId
      ? await db.employee.findFirst({ where: { OR: [{ id: employeeId }, { employeeId }] }, select: { id: true, userId: true, employeeId: true, status: true } })
      : await db.employee.findUnique({ where: { userId }, select: { id: true, userId: true, employeeId: true, status: true } });
  if (hr) return { userId: hr.userId, employeeId: hr.employeeId, identifiers: [...new Set([hr.employeeId, hr.userId, employee?.id, employee?.employeeId].filter((value): value is string => Boolean(value)))], status: employee?.status || hr.status };
  if (!employee) return null;
  return { userId: employee.userId, employeeId: employee.employeeId, identifiers: [...new Set([employee.id, employee.userId, employee.employeeId].filter(Boolean))], status: employee.status };
}

async function requireActiveActor(auth: AuthContext) {
  if (isSuperAdmin(auth)) return true;
  const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { status: true } });
  return Boolean(employee && employee.status.toLowerCase() === 'active');
}

export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    const roles = new Set([auth.userType, ...auth.roles].map((role) => role.toLowerCase()));
    if (roles.has('student') || roles.has('partner')) return NextResponse.json({ success: false, error: 'Employee documents are not available to student or partner accounts.' }, { status: 403 });
    if (!await requireActiveActor(auth).catch(() => false)) return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
    const url = new URL(req.url);
    const requestedUserId = url.searchParams.get('userId')?.trim() || auth.userId;
    const requestedEmployeeId = url.searchParams.get('employeeId')?.trim() || '';
    try {
      const target = await resolveEmployee(requestedUserId, requestedEmployeeId);
      if (!target) return NextResponse.json({ success: false, error: 'Employee not found.' }, { status: 404 });
      if (!canViewEmployeeProfile(auth, target.userId, target.employeeId)) return NextResponse.json({ success: false, error: 'Access denied to document center.' }, { status: 403 });
      const active = await db.employee.findUnique({ where: { userId: target.userId }, select: { status: true } });
      if (!active || active.status.toLowerCase() !== 'active') return NextResponse.json({ success: false, error: 'Active employee record not found.' }, { status: 404 });
      const identifiers = [...new Set(target.identifiers.filter(Boolean))];
      const docs = await db.employeeDocument.findMany({
        where: { employeeId: { in: identifiers }, isDeleted: false },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true, employeeId: true, documentType: true, title: true, fileName: true, fileSize: true, mimeType: true,
          isMandatory: true, isVerified: true, status: true, version: true, expiryDate: true, createdAt: true, updatedAt: true,
          versions: { orderBy: { version: 'desc' }, select: { id: true, version: true, fileName: true, status: true, createdAt: true } },
        },
      });
      const missing = MANDATORY_TYPES.filter((type) => !docs.some((doc) => doc.documentType.toLowerCase() === type));
      await db.$transaction(async (tx) => {
        await writePortalAudit(tx, auth, 'EMPLOYEE_DOCUMENT_CENTER_VIEWED', 'EmployeeDocument', target.employeeId, { targetUserId: target.userId, count: docs.length, missingCount: missing.length }, req);
      });
      const data = docs.map((doc) => ({ ...doc, downloadUrl: `/api/employee/documents/${doc.id}/download` }));
      return NextResponse.json({ success: true, data, mandatory: MANDATORY_TYPES, missing, canUpload: true }, { headers: { 'Cache-Control': 'private, no-store' } });
    } catch {
      return NextResponse.json({ success: false, error: 'Employee documents are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  })(request);
}

export async function POST() {
  return NextResponse.json({ success: false, error: 'Path or URL based document uploads are disabled. Upload actual file bytes through /api/employee/documents.' }, { status: 405, headers: { Allow: 'GET, DELETE' } });
}

export async function DELETE(request: Request) {
  return withAuth(async (req, auth) => {
    if (!isHR(auth) && !isSuperAdmin(auth)) return NextResponse.json({ success: false, error: 'HR or Super Admin permission is required for document archival.' }, { status: 403 });
    if (!await requireActiveActor(auth).catch(() => false)) return NextResponse.json({ success: false, error: 'An active HR employee account is required.' }, { status: 403 });
    if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
    const body: unknown = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ success: false, error: 'A document id and archival reason are required.' }, { status: 400 });
    const id = typeof (body as Record<string, unknown>).id === 'string' ? String((body as Record<string, unknown>).id).trim() : '';
    const reason = typeof (body as Record<string, unknown>).reason === 'string' ? String((body as Record<string, unknown>).reason).trim() : '';
    if (!id || id.length > 191 || reason.length < 8 || reason.length > 500) return NextResponse.json({ success: false, error: 'A valid document id and reason of 8 to 500 characters are required.' }, { status: 400 });
    try {
      const doc = await db.employeeDocument.findUnique({ where: { id } });
      if (!doc || doc.isDeleted) return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
      if (MANDATORY_TYPES.includes(doc.documentType.toLowerCase())) return NextResponse.json({ success: false, error: 'Mandatory documents cannot be deleted or archived from this workflow.' }, { status: 409 });
      const updated = await db.$transaction(async (tx) => {
        const result = await tx.employeeDocument.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date(), deletedBy: auth.actorUserId } });
        await writePortalAudit(tx, auth, 'EMPLOYEE_DOCUMENT_ARCHIVED', 'EmployeeDocument', id, { employeeId: doc.employeeId, reason }, req);
        return result;
      });
      return NextResponse.json({ success: true, data: { id: updated.id, status: 'archived' } });
    } catch {
      return NextResponse.json({ success: false, error: 'Document archival could not be completed.' }, { status: 503 });
    }
  })(request);
}
