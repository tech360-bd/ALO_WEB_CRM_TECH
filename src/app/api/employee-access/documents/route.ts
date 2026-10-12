import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { canViewEmployeeDocument } from '@/lib/access-check-engine';

const DOC_TYPES = [
  'passport', 'nid', 'photo', 'cv', 'academic_certificate', 'experience_letter',
  'appointment_letter', 'confirmation_letter', 'increment_letter', 'promotion_letter',
  'transfer_letter', 'warning_letter', 'termination_letter', 'employment_agreement',
  'nda', 'confidentiality_agreement', 'device_agreement', 'it_policy',
  'data_privacy_agreement', 'international_agreement', 'bangladesh_employment_agreement',
  'exit_clearance', 'other_hr_document',
];

function toSafeDocument(document: any) {
  return {
    id: document.id,
    employeeId: document.employeeId,
    documentType: document.documentType,
    title: document.title,
    fileName: document.fileName,
    fileSize: document.fileSize,
    mimeType: document.mimeType,
    isMandatory: document.isMandatory,
    isVerified: document.isVerified,
    status: document.status,
    version: document.version,
    expiryDate: document.expiryDate,
    reviewerId: document.reviewerId,
    reviewNote: document.reviewNote,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    downloadUrl: `/api/employee/documents/${document.id}/download`,
  };
}

export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get('employeeId') || auth.userId;
  const roles = [...new Set([auth.userType, ...auth.roles].map((role) => role.toUpperCase()))];
  const isSelf = employeeId === auth.userId;
  const isHr = roles.some((role) => ['SUPER_ADMIN', 'ADMIN', 'HR_MANAGER'].includes(role));
  const canView = await canViewEmployeeDocument(auth.userId, roles, employeeId, 'any').catch(() => false);
  if (!isSelf && !isHr && !canView) {
    return NextResponse.json({ success: false, error: 'Permission denied for employee documents.' }, { status: 403 });
  }

  const where: Record<string, unknown> = { employeeId, isDeleted: false };
  const status = searchParams.get('status');
  if (status) where.status = status;
  try {
    const docs = await db.employeeDocument.findMany({ where, orderBy: { createdAt: 'desc' } });
    const versions = docs.length
      ? await db.employeeDocumentVersion.findMany({
          where: { employeeDocumentId: { in: docs.map((document) => document.id) } },
          select: { id: true, employeeDocumentId: true, version: true, fileName: true, status: true, uploadedBy: true, reviewerId: true, reviewNote: true, createdAt: true },
          orderBy: [{ employeeDocumentId: 'asc' }, { version: 'desc' }],
        })
      : [];
    return NextResponse.json({
      success: true,
      documents: docs.map(toSafeDocument),
      versions: versions.map((version) => ({
        ...version,
        downloadUrl: version.status === 'historical' || version.status === 'current'
          ? `/api/employee/documents/${version.employeeDocumentId}/download?version=${version.version}`
          : undefined,
      })),
      docTypes: DOC_TYPES,
      restriction: 'Historical versions are retained; file paths and storage identifiers are not exposed.',
    });
  } catch {
    return NextResponse.json({ success: false, error: 'Employee documents are temporarily unavailable.' }, { status: 503 });
  }
}

// The legacy metadata-only contract accepted a client-supplied filesystem path.
// It is deliberately disabled; actual file bytes must go through the canonical
// multipart upload route at /api/employee/documents.
export async function POST() {
  return NextResponse.json({
    success: false,
    error: 'Metadata-only document uploads are disabled. Upload actual file bytes with multipart/form-data to /api/employee/documents.',
  }, { status: 405, headers: { Allow: 'GET' } });
}
