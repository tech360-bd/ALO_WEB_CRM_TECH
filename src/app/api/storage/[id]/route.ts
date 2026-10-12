import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { deleteFile } from '@/lib/storage-service';

function isAdmin(auth: { userType: string; roles: string[] }) {
  return ['SUPER_ADMIN', 'ADMIN'].includes(auth.userType.toUpperCase()) || auth.roles.some((role) => ['SUPER_ADMIN', 'ADMIN'].includes(role.toUpperCase()));
}

async function requireAdmin(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isAdmin(auth)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  return auth;
}

// GET /api/storage/[id] — administrator-only private metadata and audit history.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  try {
    const file = await db.fileMetadata.findUnique({
      where: { id },
      select: {
        id: true, originalName: true, mimeType: true, extension: true, sizeBytes: true,
        checksumSha256: true, storagePool: true, entityType: true, entityId: true,
        studentId: true, partnerId: true, employeeId: true, applicationId: true,
        uploadedBy: true, uploadedAt: true, source: true, visibility: true,
        accessPolicy: true, status: true, isDeleted: true, version: true,
        retentionPolicy: true, metadata: true, tags: true,
        events: { orderBy: { createdAt: 'desc' }, take: 50, select: { id: true, action: true, performedBy: true, performedAt: true, result: true } },
        versions: { select: { id: true, version: true, uploadedAt: true, uploadedBy: true, sizeBytes: true } },
      },
    });
    if (!file) return NextResponse.json({ success: false, error: 'File not found.' }, { status: 404 });
    return NextResponse.json({ file: { ...file, sizeBytes: Number(file.sizeBytes), versions: file.versions.map((version) => ({ ...version, sizeBytes: version.sizeBytes == null ? null : Number(version.sizeBytes) })) } });
  } catch {
    return NextResponse.json({ success: false, error: 'Storage metadata is temporarily unavailable.' }, { status: 503 });
  }
}

// DELETE /api/storage/[id] — admin-only soft delete; actor identity is server-derived.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 1000) : '';
  if (!reason) return NextResponse.json({ success: false, error: 'reason is required.' }, { status: 400 });
  try {
    await deleteFile(id, auth.userId, reason, req.headers.get('x-forwarded-for') || undefined);
    return NextResponse.json({ success: true, message: 'File soft-deleted. Physical file retained for audit.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Unable to update file status.' }, { status: 503 });
  }
}
