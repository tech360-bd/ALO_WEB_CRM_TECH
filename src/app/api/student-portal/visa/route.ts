import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

// ============================================================
// GET /api/student-portal/visa
// Returns visa readiness data: checklist items and readiness report
// ============================================================
export async function GET(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const applicationId = searchParams.get('applicationId') || '';
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '50', 10);
      const category = searchParams.get('category') || '';
      const status = searchParams.get('status') || '';

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

      // Build checklist where
      const checklistWhere: Record<string, unknown> = { studentId: profile.id };
      if (applicationId) checklistWhere.applicationId = applicationId;
      if (category) checklistWhere.category = category;
      if (status) checklistWhere.status = status;

      // Build report where
      const reportWhere: Record<string, unknown> = { studentId: profile.id };
      if (applicationId) reportWhere.applicationId = applicationId;

      const [checklistItems, checklistTotal, reports] = await Promise.all([
        db.visaChecklistItem.findMany({
          where: checklistWhere,
          orderBy: { createdAt: 'asc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        db.visaChecklistItem.count({ where: checklistWhere }),
        db.visaReadinessReport.findMany({
          where: reportWhere,
          orderBy: { generatedAt: 'desc' },
          take: 5,
        }),
      ]);

      // Calculate readiness summary
      const completedCount = await db.visaChecklistItem.count({
        where: { ...checklistWhere, status: 'completed' },
      });
      const pendingCount = await db.visaChecklistItem.count({
        where: { ...checklistWhere, status: 'pending' },
      });

      return NextResponse.json({
        success: true,
        data: {
          checklistItems,
          reports,
          summary: {
            total: checklistTotal,
            completed: completedCount,
            pending: pendingCount,
            readinessPercent: checklistTotal > 0
              ? Math.round((completedCount / checklistTotal) * 100)
              : 0,
          },
        },
        total: checklistTotal,
        page,
        totalPages: Math.ceil(checklistTotal / limit),
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to fetch visa readiness data';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}

// ============================================================
// POST /api/student-portal/visa
// Create a visa checklist item
// ============================================================
export async function POST(request: Request) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { item, category, isRequired, applicationId, note } = body;

      if (!item || !item.trim()) {
        return NextResponse.json(
          { success: false, error: 'Checklist item name is required.' },
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

      const checklistItem = await db.visaChecklistItem.create({
        data: {
          studentId: profile.id,
          applicationId: applicationId || '',
          item: item.trim(),
          category: category || 'general',
          isRequired: isRequired !== undefined ? isRequired : true,
          status: 'pending',
          note: note || '',
        },
      });

      // Audit log
      await logAuditAction(auth, 'VISA_CHECKLIST_ITEM_CREATED', 'VisaChecklistItem', checklistItem.id, {
        item: item.trim(),
        category: category || 'general',
      });

      return NextResponse.json({ success: true, data: checklistItem }, { status: 201 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to create checklist item';
      return NextResponse.json({ success: false, error: message }, { status: 500 });
    }
  }, { requireUserTypes: ['STUDENT'] })(request);
}
