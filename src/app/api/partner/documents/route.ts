import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// ============================================================
// GET — List partner's student documents with filters and search
// ============================================================
export async function GET(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const partner = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Build query filter
    const where: Record<string, unknown> = {
      studentProfile: { partnerId: partner.partnerId },
    };

    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { fileName: { contains: search } },
      ];
    }

    // Fetch documents with student info
    const [documents, total] = await Promise.all([
      db.portalStudentDocument.findMany({
        where,
        include: {
          studentProfile: {
            select: {
              id: true,
              fullName: true,
              studentId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.portalStudentDocument.count({ where }),
    ]);

    // Compute document stats
    const stats = await db.portalStudentDocument.groupBy({
      by: ['status'],
      where: {
        studentProfile: { partnerId: partner.partnerId },
      },
      _count: { id: true },
    });

    const statusCounts: Record<string, number> = {};
    for (const s of stats) {
      statusCounts[s.status] = s._count.id;
    }

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: statusCounts,
    });
  } catch (error) {
    console.error('[PARTNER DOCUMENTS GET] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch documents' }, { status: 500 });
  }
}

// ============================================================
// POST — Create a new document metadata record
// ============================================================
export async function POST(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const partner = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      studentProfileId,
      name,
      fileName,
      fileSize,
      category,
      uploadedAt,
    } = body;

    // Validate required fields
    if (!studentProfileId) {
      return NextResponse.json({ success: false, error: 'studentProfileId is required' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ success: false, error: 'Document name is required' }, { status: 400 });
    }
    if (!fileName) {
      return NextResponse.json({ success: false, error: 'fileName is required' }, { status: 400 });
    }

    // Verify student belongs to this partner
    const studentProfile = await db.portalStudentProfile.findUnique({
      where: { id: studentProfileId },
    });
    if (!studentProfile) {
      return NextResponse.json({ success: false, error: 'Student profile not found' }, { status: 404 });
    }
    if (studentProfile.partnerId !== partner.partnerId) {
      return NextResponse.json({ success: false, error: 'Student does not belong to your partner account' }, { status: 403 });
    }

    // Create document record
    const document = await db.portalStudentDocument.create({
      data: {
        studentProfileId,
        name,
        fileName,
        fileSize: fileSize || 0,
        category: category || 'other',
        uploadedAt: uploadedAt || new Date().toISOString(),
        status: 'pending',
      },
      include: {
        studentProfile: {
          select: {
            id: true,
            fullName: true,
            studentId: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: document }, { status: 201 });
  } catch (error) {
    console.error('[PARTNER DOCUMENTS POST] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create document' }, { status: 500 });
  }
}

// ============================================================
// PUT — Update document status (verified, rejected, needs_info)
// ============================================================
export async function PUT(request: Request) {
  try {
    const authResult = await authenticateRequest(request);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult;

    const partner = await db.partnerProfile.findUnique({
      where: { userId: auth.userId },
    });
    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner profile not found' }, { status: 404 });
    }

    const body = await request.json();
    const { documentId, status, rejectionReason } = body;

    if (!documentId) {
      return NextResponse.json({ success: false, error: 'documentId is required' }, { status: 400 });
    }
    if (!status) {
      return NextResponse.json({ success: false, error: 'status is required' }, { status: 400 });
    }

    // Validate allowed statuses
    const allowedStatuses = ['pending', 'verified', 'rejected', 'needs_info'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify document belongs to partner's student
    const document = await db.portalStudentDocument.findUnique({
      where: { id: documentId },
      include: { studentProfile: true },
    });
    if (!document) {
      return NextResponse.json({ success: false, error: 'Document not found' }, { status: 404 });
    }
    if (document.studentProfile.partnerId !== partner.partnerId) {
      return NextResponse.json({ success: false, error: 'Document does not belong to your partner account' }, { status: 403 });
    }

    // Build update data
    const updateData: Record<string, unknown> = { status };
    if (rejectionReason !== undefined) {
      updateData.rejectionReason = rejectionReason;
    }
    if (status === 'verified') {
      updateData.reviewedBy = auth.name || auth.userId;
    }

    const updated = await db.portalStudentDocument.update({
      where: { id: documentId },
      data: updateData,
      include: {
        studentProfile: {
          select: {
            id: true,
            fullName: true,
            studentId: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('[PARTNER DOCUMENTS PUT] Error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update document' }, { status: 500 });
  }
}
