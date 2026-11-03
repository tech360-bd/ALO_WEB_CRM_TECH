import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { requireDocumentReviewer } from '@/lib/documents/document-access-resolver';
import { canReadDocumentsByRole, canReviewDocuments, isAdminLike } from '@/lib/documents/document-access';

// ============================================================
// CRM DOCUMENTS API — PortalStudentDocument with status filters
// ============================================================

const VALID_STATUSES = [
  'pending', 'approved', 'rejected', 'pending_review', 'needs_update', 'uploaded', 'not_uploaded',
];

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      // SECURITY FIX: this list previously ran under `withAuth` alone, so ANY
      // authenticated account — including a partner or student portal identity —
      // could page through every student's documents, together with the
      // student's name, email and phone. It is a staff document queue, so it now
      // requires a document-read role, and non-administrative readers (counselor,
      // senior counselor, finance) only see students assigned to them.
      if (!canReadDocumentsByRole(auth.roles)) {
        return NextResponse.json(
          { success: false, error: 'Your role cannot list student documents.' },
          { status: 403 },
        );
      }
      const actorIsAdmin = isAdminLike(auth.roles);
      const actorIsReviewer = canReviewDocuments(auth.roles);
      const assignedOnly = !actorIsAdmin && !actorIsReviewer;

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

      // Build where clause. Archived documents are history and never part of the
      // live review queue.
      const where: Record<string, unknown> = { isArchived: false };

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

      if (assignedOnly) {
        // Deny-by-default: an unassigned student simply does not match.
        where.studentProfile = { counselorId: auth.userId };
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
              // Contact details are deliberately not returned: this is a
              // document queue, not a contact sheet, and the review UI never
              // renders them.
              select: {
                id: true,
                studentId: true,
                fullName: true,
                city: true,
              },
            },
          },
        }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return NextResponse.json({
        success: true,
        // Staff can open either table through the authorized staff download route.
        data: documents.map((document) => ({
          ...document,
          downloadUrl: `/api/counselor/documents/${document.id}/download`,
        })),
        total,
        page,
        totalPages,
        scope: assignedOnly ? 'assigned_students' : 'all_students',
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

      // Review policy for versioned slots: approving a replacement supersedes the
      // earlier versions of the same document type, but only now — never at
      // upload time — so an unreviewed file can never masquerade as approved and
      // the previously approved file stays downloadable until this point.
      let supersededCount = 0;
      if (String(status || '').toLowerCase() === 'approved') {
        const superseded = await db.portalStudentDocument.updateMany({
          where: {
            studentProfileId: existing.studentProfileId,
            category: existing.category,
            id: { not: id },
            isArchived: false,
            status: { in: ['pending', 'pending_review', 'uploaded', 'needs_update', 'approved'] },
          },
          data: { status: 'superseded' },
        });
        supersededCount = superseded.count;
      }

      // Log audit action
      await logAuditAction(auth, 'document_review', 'PortalStudentDocument', id, {
        documentName: document.name,
        previousStatus: existing.status,
        newStatus: status,
        studentId: existing.studentProfile?.studentId,
        rejectionReason,
        version: document.version,
        supersededEarlierVersions: supersededCount,
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
