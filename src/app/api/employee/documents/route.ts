import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { logSecurityAudit } from '@/lib/access-control/central-security-engine';
import { authenticateRequest } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { removePrivateFile, storePrivateFile } from '@/lib/storage/private-file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MIME_BY_EXTENSION: Record<string, string> = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };
const MANDATORY_TYPES = new Set(['passport','nid','photo','cv','certificates','experience_letter','appointment_letter','confirmation_letter','increment_letter','promotion_letter','transfer_letter','warning_letter','termination_letter','employment_agreement','nda','confidentiality_agreement','device_agreement','it_policy','data_privacy_agreement','international_agreement','bangladesh_agreement','exit_clearance']);
const DOCUMENT_TYPES = new Set([...MANDATORY_TYPES, 'other']);
const STAFF_ROLES = new Set(['EMPLOYEE','HR','HR_MANAGER','SUPER_ADMIN','COUNSELOR','APPLICATION_TEAM','VISA_OFFICER','VISA_INTERVIEW_OFFICER','BRANCH_MANAGER','FRONT_DESK','SUPPORT_STAFF','MARKETING_MANAGER','MARKETING','FINANCE','ENGLISH_TRAINER']);
const HR_ROLES = new Set(['HR','HR_MANAGER','SUPER_ADMIN']);

function rolesOf(auth: { userType: string; roles: string[] }): Set<string> { return new Set([auth.userType, ...auth.roles].map((role) => role.toUpperCase())); }
function isSuperAdmin(auth: { userType: string; roles: string[] }): boolean { const roles = rolesOf(auth); return roles.has('SUPER_ADMIN'); }
function hasEmployeeAccess(auth: { userType: string; roles: string[] }): boolean { return [...rolesOf(auth)].some((role) => STAFF_ROLES.has(role)); }
function canManageOtherEmployeeDocuments(auth: { userType: string; roles: string[] }): boolean { return [...rolesOf(auth)].some((role) => HR_ROLES.has(role)); }

function detectMime(bytes: Buffer): string | null {
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))) return 'image/gif';
  return null;
}

function safeDownloadDocument(document: any) {
  return {
    id: document.id, employeeId: document.employeeId, documentType: document.documentType, title: document.title,
    fileName: document.fileName, fileSize: document.fileSize, mimeType: document.mimeType, isMandatory: document.isMandatory,
    isVerified: document.isVerified, status: document.status, version: document.version, expiryDate: document.expiryDate,
    createdAt: document.createdAt, updatedAt: document.updatedAt, downloadUrl: `/api/employee/documents/${document.id}/download`,
  };
}

async function resolveEmployee(value: string) {
  const employee = await db.employee.findFirst({ where: { OR: [{ id: value }, { userId: value }, { employeeId: value }] }, select: { id: true, userId: true, employeeId: true, status: true, role: true } });
  const hr = await db.employeeHR.findFirst({ where: { OR: [{ employeeId: value }, ...(employee ? [{ userId: employee.userId }] : [])] }, select: { employeeId: true, userId: true } });
  const userId = employee?.userId || hr?.userId || '';
  if (!userId) return null;
  const [account, currentEmployee] = await Promise.all([
    db.portalUser.findUnique({ where: { id: userId }, select: { id: true, userType: true, status: true } }),
    employee ? Promise.resolve(employee) : db.employee.findUnique({ where: { userId }, select: { id: true, userId: true, employeeId: true, status: true, role: true } }),
  ]);
  if (!account || ['STUDENT', 'PARTNER'].includes(account.userType.toUpperCase())) return null;
  if (!currentEmployee || currentEmployee.status.toLowerCase() !== 'active' || account.status.toLowerCase() !== 'active') return null;
  const identifiers = [...new Set([userId, currentEmployee.id, currentEmployee.employeeId, hr?.employeeId].filter((item): item is string => Boolean(item)))];
  return { userId, employeeId: currentEmployee.id, identifiers };
}

async function requireActiveActor(auth: { userId: string; userType: string; roles: string[] }) {
  if (isSuperAdmin(auth)) return true;
  const employee = await db.employee.findUnique({ where: { userId: auth.userId }, select: { status: true } });
  return Boolean(employee && employee.status.toLowerCase() === 'active');
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasEmployeeAccess(auth)) return NextResponse.json({ success: false, error: 'Employee access required.' }, { status: 403 });
  if (!await requireActiveActor(auth).catch(() => false)) return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });

  const params = req.nextUrl.searchParams;
  const requested = (params.get('employeeId') || params.get('userId') || auth.userId).trim();
  const target = await resolveEmployee(requested).catch(() => null);
  if (!target) return NextResponse.json({ success: false, error: 'Active employee record not found.' }, { status: 404 });
  const self = target.userId === auth.userId;
  if (!self && !canManageOtherEmployeeDocuments(auth)) return NextResponse.json({ success: false, error: 'Only HR or Super Admin may view another employee’s documents.' }, { status: 403 });
  const type = params.get('documentType')?.trim().toLowerCase();
  if (type && !DOCUMENT_TYPES.has(type)) return NextResponse.json({ success: false, error: 'Unsupported document type filter.' }, { status: 400 });
  try {
    const documents = await db.employeeDocument.findMany({ where: { employeeId: { in: target.identifiers }, isDeleted: false, ...(type ? { documentType: type } : {}) }, orderBy: { createdAt: 'desc' } });
    await db.$transaction(async (tx) => {
      await logSecurityAudit({ actorId: auth.actorUserId || auth.userId, actorRole: [...rolesOf(auth)].join(','), action: 'EMPLOYEE_DOCUMENTS_VIEWED', targetType: 'EmployeeDocument', targetId: target.employeeId, newValue: JSON.stringify({ count: documents.length }), ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '', sessionIdentifier: auth.sessionId }, tx);
    });
    return NextResponse.json({ success: true, documents: documents.map(safeDownloadDocument) }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ success: false, error: 'Employee documents are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasEmployeeAccess(auth)) return NextResponse.json({ success: false, error: 'Employee access required.' }, { status: 403 });
  if (!await requireActiveActor(auth).catch(() => false)) return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
  if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ success: false, error: 'Upload actual file bytes using multipart/form-data.' }, { status: 415 }); }
  const requested = String(form.get('employeeId') || auth.userId).trim();
  const target = await resolveEmployee(requested).catch(() => null);
  if (!target) return NextResponse.json({ success: false, error: 'An active employee account is required for document uploads.' }, { status: 404 });
  const self = target.userId === auth.userId;
  if (!self && !canManageOtherEmployeeDocuments(auth)) return NextResponse.json({ success: false, error: 'Only HR or Super Admin may upload for another employee.' }, { status: 403 });

  const documentType = String(form.get('documentType') || '').trim().toLowerCase();
  const title = String(form.get('title') || '').trim();
  const expiryDate = String(form.get('expiryDate') || '').trim();
  const formFile = form.get('file');
  if (!DOCUMENT_TYPES.has(documentType) || !(formFile instanceof File) || !formFile.size || formFile.size > MAX_FILE_BYTES) return NextResponse.json({ success: false, error: 'A configured document type and non-empty file up to 20 MB are required.' }, { status: 400 });
  if (title.length > 191 || /[\u0000-\u001f]/.test(title)) return NextResponse.json({ success: false, error: 'Document title is invalid.' }, { status: 400 });
  if (expiryDate && (!/^\d{4}-\d{2}-\d{2}$/.test(expiryDate) || Number.isNaN(new Date(`${expiryDate}T00:00:00.000Z`).getTime()) || new Date(`${expiryDate}T00:00:00.000Z`).toISOString().slice(0, 10) !== expiryDate)) return NextResponse.json({ success: false, error: 'Expiry date must use YYYY-MM-DD.' }, { status: 400 });
  const bytes = Buffer.from(await formFile.arrayBuffer());
  const detectedMime = detectMime(bytes);
  const extension = formFile.name.split('.').pop()?.toLowerCase() || '';
  if (!detectedMime || MIME_BY_EXTENSION[extension] !== detectedMime || (formFile.type && formFile.type !== detectedMime)) return NextResponse.json({ success: false, error: 'File content does not match an allowed PDF or image type.' }, { status: 400 });

  const stored = await storePrivateFile(bytes, formFile.name);
  try {
    const document = await db.$transaction(async (tx) => {
      const existing = await tx.employeeDocument.findFirst({ where: { employeeId: { in: target.identifiers }, documentType, isDeleted: false }, orderBy: { updatedAt: 'desc' } });
      const nextVersion = existing ? existing.version + 1 : 1;
      if (existing) await tx.employeeDocumentVersion.updateMany({ where: { employeeDocumentId: existing.id, status: 'current' }, data: { status: 'historical' } });
      const updated = existing
        ? await tx.employeeDocument.update({ where: { id: existing.id }, data: { title: title || existing.title || documentType, filePath: stored.storagePath, fileName: formFile.name.slice(0, 191), fileSize: stored.fileSize, fileHash: stored.fileHash, mimeType: detectedMime, expiryDate: expiryDate || existing.expiryDate, uploadedBy: auth.userId, isMandatory: MANDATORY_TYPES.has(documentType), status: 'pending', isVerified: false, reviewerId: '', reviewNote: '', version: nextVersion } })
        : await tx.employeeDocument.create({ data: { employeeId: target.userId, documentType, title: title || documentType, filePath: stored.storagePath, fileName: formFile.name.slice(0, 191), fileSize: stored.fileSize, fileHash: stored.fileHash, mimeType: detectedMime, expiryDate, isMandatory: MANDATORY_TYPES.has(documentType), uploadedBy: auth.userId, status: 'pending', version: nextVersion } });
      await tx.employeeDocumentVersion.create({ data: { documentId: updated.id, employeeDocumentId: updated.id, version: nextVersion, filePath: stored.storagePath, fileName: formFile.name.slice(0, 191), fileHash: stored.fileHash, uploadedBy: auth.userId, status: 'current' } });
      await logSecurityAudit({ actorId: auth.actorUserId || auth.userId, actorRole: [...rolesOf(auth)].join(','), action: 'EMPLOYEE_DOCUMENT_UPLOADED', targetType: 'EmployeeDocument', targetId: updated.id, newValue: JSON.stringify({ documentType, targetEmployeeId: target.employeeId, fileHash: stored.fileHash, version: nextVersion }), ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '', sessionIdentifier: auth.sessionId }, tx);
      return updated;
    });
    return NextResponse.json({ success: true, document: safeDownloadDocument(document) }, { status: 201 });
  } catch {
    await removePrivateFile(stored.storagePath).catch(() => {});
    return NextResponse.json({ success: false, error: 'Employee document upload could not be completed.' }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!hasEmployeeAccess(auth) || !canManageOtherEmployeeDocuments(auth)) return NextResponse.json({ success: false, error: 'HR or Super Admin access is required to review employee documents.' }, { status: 403 });
  if (!await requireActiveActor(auth).catch(() => false)) return NextResponse.json({ success: false, error: 'An active employee account is required.' }, { status: 403 });
  if (!mutationOriginAllowed(req, auth)) return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  const body = await req.json().catch(() => null);
  const documentId = typeof body?.documentId === 'string' ? body.documentId.trim() : '';
  const action = typeof body?.action === 'string' ? body.action.toLowerCase() : '';
  const reviewNote = typeof body?.reviewNote === 'string' ? body.reviewNote.trim() : '';
  if (!documentId || !['approve', 'reject'].includes(action) || reviewNote.length > 1000 || (action === 'reject' && !reviewNote)) return NextResponse.json({ success: false, error: 'A document id and valid approve/reject decision are required; rejected documents need a reason.' }, { status: 400 });
  try {
    const document = await db.employeeDocument.findUnique({ where: { id: documentId } });
    if (!document || document.isDeleted) return NextResponse.json({ success: false, error: 'Document not found.' }, { status: 404 });
    if (document.uploadedBy === auth.userId || document.uploadedBy === auth.actorUserId) return NextResponse.json({ success: false, error: 'Document maker cannot approve their own upload.' }, { status: 403 });
    const status = action === 'approve' ? 'approved' : 'rejected';
    const updated = await db.$transaction(async (tx) => {
      const result = await tx.employeeDocument.update({ where: { id: documentId }, data: { status, isVerified: action === 'approve', reviewerId: auth.actorUserId || auth.userId, reviewNote } });
      await tx.employeeDocumentVersion.updateMany({ where: { employeeDocumentId: documentId, version: document.version, status: 'current' }, data: { reviewerId: auth.actorUserId || auth.userId, reviewNote, status } });
      await logSecurityAudit({ actorId: auth.actorUserId || auth.userId, actorRole: [...rolesOf(auth)].join(','), action: `EMPLOYEE_DOCUMENT_${status.toUpperCase()}`, targetType: 'EmployeeDocument', targetId: documentId, oldValue: JSON.stringify({ status: document.status }), newValue: JSON.stringify({ status, reviewNote }), ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '', sessionIdentifier: auth.sessionId }, tx);
      return result;
    });
    return NextResponse.json({ success: true, document: safeDownloadDocument(updated) });
  } catch {
    return NextResponse.json({ success: false, error: 'Employee document review could not be completed.' }, { status: 503 });
  }
}
