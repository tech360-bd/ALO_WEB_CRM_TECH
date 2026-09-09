import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const GET = withAuth(
  async (req: Request, auth: AuthContext) => {
    try {
      const updates = await db.universityUpdateRequest.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        success: true,
        count: updates.length,
        updates,
      });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to fetch university updates' },
        { status: 500 }
      );
    }
  },
  { requireRoles: ['super_admin', 'admin'] }
);

export const PATCH = withAuth(
  async (req: Request, auth: AuthContext) => {
    try {
      const body = await req.json();
      const { requestId, action = 'approve', newValue } = body;

      const updateReq = await db.universityUpdateRequest.findUnique({
        where: { id: requestId },
      });

      if (!updateReq) {
        return NextResponse.json(
          { success: false, error: 'Update request not found' },
          { status: 404 }
        );
      }

      if (action === 'approve') {
        const valToApply = newValue || updateReq.newValue;

        // Apply change to crmCourse if courseId exists
        if (updateReq.courseId) {
          const updateData: any = {};
          if (updateReq.fieldName === 'tuitionFee') updateData.tuitionFee = parseFloat(valToApply);
          else if (updateReq.fieldName === 'intake') updateData.intakeMonths = valToApply;
          else if (updateReq.fieldName === 'entryRequirement') updateData.academicRequirements = valToApply;
          else if (updateReq.fieldName === 'englishRequirement') updateData.englishRequirements = valToApply;

          if (Object.keys(updateData).length > 0) {
            await db.crmCourse.update({
              where: { courseId: updateReq.courseId },
              data: updateData,
            });
          }
        }

        // Mark update request as approved
        await db.universityUpdateRequest.update({
          where: { id: requestId },
          data: {
            status: 'approved',
            reviewedBy: auth.name || auth.email,
          },
        });

        // Audit log
        await db.portalAuditLog.create({
          data: {
            actorUserId: auth.userId,
            action: 'university.update.approved',
            entityType: 'UniversityUpdateRequest',
            entityId: requestId,
            metadata: JSON.stringify({ fieldName: updateReq.fieldName, valToApply }),
            ipAddress: '',
            userAgent: '',
          },
        });

        return NextResponse.json({
          success: true,
          message: 'University update approved and published to website & CRM.',
        });
      } else if (action === 'reject') {
        await db.universityUpdateRequest.update({
          where: { id: requestId },
          data: {
            status: 'rejected',
            reviewedBy: auth.name || auth.email,
          },
        });

        return NextResponse.json({
          success: true,
          message: 'University update request rejected.',
        });
      }

      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to process update request' },
        { status: 500 }
      );
    }
  },
  { requireRoles: ['super_admin'] }
);
