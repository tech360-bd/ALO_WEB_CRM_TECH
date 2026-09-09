import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/documents
// Returns student's documents with pagination and category filter
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const category = searchParams.get('category') || '';
      const status = searchParams.get('status') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const where: Record<string, unknown> = { studentProfileId: profile.id };
      if (category) where.category = category;
      if (status) where.status = status;

      const orderBy: Record<string, string> = {};
      orderBy[sortBy] = sortOrder;

      const [documents, total] = await Promise.all([
        db.portalStudentDocument.findMany({
          where,
          orderBy,
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.portalStudentDocument.count({ where }),
      ]);

      return NextResponse.json({
        success: true,
        data: documents,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch documents';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// POST /api/student-portal/documents
// Create a new document record
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { name, category, fileName, fileSize } = body;

      if (!name) {
        return NextResponse.json(
          { success: false, error: 'Document name is required.' },
          { status: 400 }
        );
      }

      // Find student profile
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const document = await db.portalStudentDocument.create({
        data: {
          studentProfileId: profile.id,
          name,
          category: category || 'other',
          fileName: fileName || '',
          fileSize: fileSize || 0,
          status: 'pending',
          uploadedAt: new Date().toISOString(),
        },
      });

      // Audit log
      await logAuditAction(auth, 'DOCUMENT_UPLOADED', 'PortalStudentDocument', document.id, {
        name,
        category: category || 'other',
        fileName,
      });

      return NextResponse.json({ success: true, data: document }, { status: 201 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create document';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// PUT /api/student-portal/documents
// Update document status (e.g. approve, reject)
// ============================================================
export async function PUT(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, status, rejectionReason, name, category, fileName } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Document id is required.' },
          { status: 400 }
        );
      }

      // Verify student owns this document
      const profile = await db.portalStudentProfile.findUnique({
        where: { userId: auth.userId },
      });
      if (!profile) {
        return NextResponse.json(
          { success: false, error: 'Student profile not found.' },
          { status: 404 }
        );
      }

      const existing = await db.portalStudentDocument.findUnique({
        where: { id },
      });
      if (!existing || existing.studentProfileId !== profile.id) {
        return NextResponse.json(
          { success: false, error: 'Document not found.' },
          { status: 404 }
        );
      }

      const updateData: Record<string, unknown> = { updatedAt: new Date() };
      if (status !== undefined) updateData.status = status;
      if (rejectionReason !== undefined) updateData.rejectionReason = rejectionReason;
      if (name !== undefined) updateData.name = name;
      if (category !== undefined) updateData.category = category;
      if (fileName !== undefined) updateData.fileName = fileName;

      const updated = await db.portalStudentDocument.update({
        where: { id },
        data: updateData,
      });

      // Audit log
      await logAuditAction(auth, 'DOCUMENT_UPDATED', 'PortalStudentDocument', id, {
        updatedFields: Object.keys(updateData).filter(k => k !== 'updatedAt'),
      });

      return NextResponse.json({ success: true, data: updated });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update document';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
