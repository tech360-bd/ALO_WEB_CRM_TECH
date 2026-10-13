import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { requireDocumentReviewer } from '@/lib/documents/document-access-resolver';

// ============================================================
// CRM DOCUMENTS API — PortalStudentDocument with status filters
// ============================================================

const VALID_STATUSES = [
  'pending', 'approved', 'rejected', 'pending_review', 'needs_update', 'uploaded', 'not_uploaded',
];

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const category = searchParams.get('category') || '';
      const studentProfileId = searchParams.get('studentProfileId') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Record<string, unknown> = {};

      if (status) {
        const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
        if (statuses.length === 1) {
          where.status = statuses[0];
        } else if (statuses.length > 1) {
          where.status = { in: statuses };
        }
      }

      if (category) {
        where.category = category;
      }

      if (studentProfileId) {
        where.studentProfileId = studentProfileId;
      }

      if (search) {
        where.OR = [
          { name: { contains: search } },
          { fileName: { contains: search } },
          { category: { contains: search } },
          { rejectionReason: { contains: search } },
          { studentProfile: {
            OR: [
              { fullName: { contains: search } },
              { studentId: { contains: search } },
            ],
          }},
        ];
      }

      // Build orderBy
      const validSortFields = ['createdAt', 'updatedAt', 'name', 'category', 'status', 'uploadedAt'];
      const orderField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
      const orderBy = { [orderField]: sortOrder === 'asc' ? 'asc' as const : 'desc' as const };

      const [total, documents] = await Promise.all([
        db.portalStudentDocument.count({ where }),
        db.portalStudentDocument.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            studentProfile: {
              select: {
                id: true,
                studentId: true,
                fullName: true,
                city: true,
                user: {
                  select: {
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return NextResponse.json({
        success: true,
        data: documents,
        total,
        page,
        totalPages,
      });
    } catch (error) {
      console.error('CRM Documents API error:', error);
      if (String(error).includes('Unknown table')) {
        return NextResponse.json({
          success: true,
          data: [],
          total: 0,
          page: 1,
          totalPages: 0,
        });
      }
      return NextResponse.json(
        { success: false, error: 'Failed to load documents' },
        { status: 500 }
      );
    }
  })(request);
}

// ============================================================
// PUT — Approve/reject document
// ============================================================
export async function PUT(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { id, status, rejectionReason, reviewedBy } = body;

      if (!id) {
        return NextResponse.json(
          { success: false, error: 'Document ID is required' },
          { status: 400 }
        );
      }

      // SECURITY FIX: this endpoint is the document REVIEW path, but it performed
      // no role check — `withAuth` alone meant any authenticated account, including
      // a partner user or a viewer, could approve or reject a student document.
      // Review rights are now asserted here; a rejection also requires a reason.
      const reviewer = requireDocumentReviewer(auth.roles);
      if (!reviewer.ok) {
        return NextResponse.json({ success: false, error: reviewer.error }, { status: reviewer.status });
      }
      if (String(status || '').toLowerCase() === 'rejected' && !String(rejectionReason || '').trim()) {
        return NextResponse.json(
          { success: false, error: 'A rejection reason is required.', rejectionReasonCodes: ['blurry', 'incomplete', 'wrong_document', 'expired', 'missing_page', 'inconsistent_information'] },
          { status: 400 },
        );
      }

      // Validate status
      const allowedStatuses = ['approved', 'rejected', 'pending_review', 'needs_update'];
      if (status && !allowedStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` },
          { status: 400 }
        );
      }

      // Check document exists
      const existing = await db.portalStudentDocument.findUnique({
        where: { id },
        include: {
          studentProfile: {
            select: {
              studentId: true,
              fullName: true,
            },
          },
        },
      });

      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        );
      }

      // Build update data
      const updateData: Record<string, unknown> = {};
      if (status !== undefined) {
        updateData.status = status;
        updateData.reviewedBy = reviewedBy || auth.name;
      }
      if (rejectionReason !== undefined) {
        updateData.rejectionReason = rejectionReason;
      }

      const document = await db.portalStudentDocument.update({
        where: { id },
        data: updateData,
        include: {
          studentProfile: {
            select: {
              id: true,
              studentId: true,
              fullName: true,
              user: {
                select: {
                  email: true,
                  phone: true,
                },
              },
            },
          },
        },
      });

      // Log audit action
      await logAuditAction(auth, 'document_review', 'PortalStudentDocument', id, {
        documentName: document.name,
        previousStatus: existing.status,
        newStatus: status,
        studentId: existing.studentProfile?.studentId,
        rejectionReason,
      });

      return NextResponse.json({
        success: true,
        data: document,
      });
    } catch (error) {
      console.error('CRM Documents PUT error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update document' },
        { status: 500 }
      );
    }
  })(request);
}
