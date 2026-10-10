import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { removePrivateFile, storePrivateFile } from '@/lib/storage/private-file-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp',
};

function detectMime(bytes: Buffer): string | null {
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString('ascii') === '%PDF-') return 'application/pdf';
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (bytes.length >= 6 && ['GIF87a', 'GIF89a'].includes(bytes.subarray(0, 6).toString('ascii'))) return 'image/gif';
  return null;
}

function safeOriginalName(value: string): string | null {
  const name = value.split(/[\\/]/).pop()?.trim() || '';
  if (!name || name.length > 191 || /[\u0000-\u001f]/.test(name)) return null;
  return name;
}

async function getPartner(authUserId: string) {
  return db.partnerProfile.findUnique({ where: { userId: authUserId } });
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const partner = await getPartner(auth.userId);
    if (!partner) return NextResponse.json({ success: false, error: 'Partner profile not found.' }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') || '').trim().slice(0, 80);
    const status = (searchParams.get('status') || '').trim().slice(0, 40);
    const search = (searchParams.get('search') || '').trim().slice(0, 100);
    const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const limit = Number.isFinite(requestedLimit) ? Math.min(100, Math.max(1, requestedLimit)) : 20;

    const where: Record<string, unknown> = { studentProfile: { partnerId: partner.partnerId } };
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { fileName: { contains: search } },
        { studentProfile: { fullName: { contains: search }, partnerId: partner.partnerId } },
        { studentProfile: { studentId: { contains: search }, partnerId: partner.partnerId } },
      ];
    }

    const [documents, total, stats] = await Promise.all([
      db.portalStudentDocument.findMany({
        where,
        select: {
          id: true,
          name: true,
          category: true,
          fileName: true,
          fileSize: true,
          status: true,
          rejectionReason: true,
          uploadedAt: true,
          createdAt: true,
          updatedAt: true,
          studentProfile: { select: { id: true, fullName: true, studentId: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.portalStudentDocument.count({ where }),
      db.portalStudentDocument.groupBy({
        by: ['status'],
        where: { studentProfile: { partnerId: partner.partnerId } },
        _count: { id: true },
      }),
    ]);

    const statusCounts = Object.fromEntries(stats.map((entry) => [entry.status, entry._count.id]));
    return NextResponse.json({
      success: true,
      data: documents.map((document) => ({
        ...document,
        downloadUrl: `/api/partner/documents/${document.id}/download`,
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: statusCounts,
    });
  } catch (error) {
    console.error('[PARTNER DOCUMENTS GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch partner documents.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let stored: Awaited<ReturnType<typeof storePrivateFile>> | null = null;
  try {
    const auth = await authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;
    const partner = await getPartner(auth.userId);
    if (!partner) return NextResponse.json({ success: false, error: 'Partner profile not found.' }, { status: 404 });

    let form: FormData;
    try { form = await request.formData(); } catch {
      return NextResponse.json({ success: false, error: 'Upload actual file bytes using multipart/form-data.' }, { status: 415 });
    }

    const studentProfileId = String(form.get('studentProfileId') || '').trim();
    const category = String(form.get('category') || '').trim();
    const file = form.get('file');
    if (!studentProfileId || !category || category.length > 80 || /[\u0000-\u001f]/.test(category) || !(file instanceof File) || !file.size || file.size > MAX_FILE_BYTES) {
      return NextResponse.json({ success: false, error: 'A student, document category, and non-empty file up to 20 MB are required.' }, { status: 400 });
    }
    const fileName = safeOriginalName(file.name);
    if (!fileName) return NextResponse.json({ success: false, error: 'File name is invalid.' }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    const mimeType = detectMime(bytes);
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    if (!mimeType || MIME_BY_EXTENSION[extension] !== mimeType || (file.type && file.type !== mimeType)) {
      return NextResponse.json({ success: false, error: 'File content does not match an allowed PDF or image type.' }, { status: 400 });
    }

    const studentProfile = await db.portalStudentProfile.findFirst({
      where: { id: studentProfileId, partnerId: partner.partnerId },
      select: { id: true, studentId: true, fullName: true },
    });
    if (!studentProfile) return NextResponse.json({ success: false, error: 'Student profile not found for this partner.' }, { status: 404 });

    stored = await storePrivateFile(bytes, fileName);
    const document = await db.$transaction(async (tx) => {
      const created = await tx.portalStudentDocument.create({
        data: {
          studentProfileId: studentProfile.id,
          name: fileName,
          category,
          fileName,
          storagePath: stored!.storagePath,
          mimeType,
          fileHash: stored!.fileHash,
          fileSize: stored!.fileSize,
          status: 'pending',
          uploadedAt: new Date().toISOString(),
        },
        select: {
          id: true,
          name: true,
          category: true,
          fileName: true,
          fileSize: true,
          status: true,
          uploadedAt: true,
          createdAt: true,
          studentProfile: { select: { id: true, fullName: true, studentId: true } },
        },
      });
      await tx.portalTimelineEvent.create({
        data: {
          studentProfileId: studentProfile.id,
          channel: 'portal',
          messageType: 'document',
          content: `A ${category} document was uploaded for review by the partner account.`,
          senderName: auth.name,
          senderType: 'partner',
          visibility: 'student_visible',
        },
      });
      await tx.portalAuditLog.create({
        data: {
          actorUserId: auth.userId,
          action: 'PARTNER_DOCUMENT_UPLOADED',
          entityType: 'PortalStudentDocument',
          entityId: created.id,
          metadata: JSON.stringify({ studentId: studentProfile.studentId, category, fileHash: stored!.fileHash }),
        },
      });
      return created;
    });

    return NextResponse.json({
      success: true,
      data: { ...document, downloadUrl: `/api/partner/documents/${document.id}/download` },
      message: 'File bytes were stored privately and queued for document review.',
    }, { status: 201 });
  } catch (error) {
    if (stored?.storagePath) await removePrivateFile(stored.storagePath).catch(() => {});
    console.error('[PARTNER DOCUMENTS POST] Error:', error);
    return NextResponse.json({ success: false, error: 'Document upload could not be completed.' }, { status: 503 });
  }
}

// Document review decisions belong to internal document staff, not the partner.
export async function PUT() {
  return NextResponse.json({ success: false, error: 'Partners cannot approve or reject uploaded documents.' }, { status: 403 });
}
