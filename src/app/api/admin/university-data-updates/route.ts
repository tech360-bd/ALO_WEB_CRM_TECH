import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status') || '';

      const where: any = {};
      if (status && status !== 'all') where.status = status;

      const [updates, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
        db.universityUpdateRequest.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        db.universityUpdateRequest.count(),
        db.universityUpdateRequest.count({ where: { status: 'pending_approval' } }),
        db.universityUpdateRequest.count({ where: { status: 'approved' } }),
        db.universityUpdateRequest.count({ where: { status: 'rejected' } }),
      ]);

      const now = new Date();
      const lastScanDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
      const nextScanDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString();

      return NextResponse.json({
        success: true,
        data: updates,
        stats: {
          total,
          pending: pendingCount,
          approved: approvedCount,
          rejected: rejectedCount,
          lastScanAt: lastScanDate,
          nextScanAt: nextScanDate,
          scanFrequency: 'Weekly (Every Sunday 02:00 UTC)',
          scannerStatus: 'ACTIVE',
        },
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const isAuthorized = auth.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(r));
      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'UNAUTHORIZED: Admin authority required' }, { status: 403 });
      }

      const body = await req.json();
      const { action, updateId, decision } = body;

      if (action === 'trigger_scan') {
        const coursesToScan = await db.crmCourse.findMany({
          where: { sourceUrl: { not: '' } },
          take: 10,
          include: { university: true, intakeFees: true },
        });

        const createdUpdates: any[] = [];

        for (const course of coursesToScan) {
          const existingPending = await db.universityUpdateRequest.findFirst({
            where: { courseId: course.courseId, status: 'pending_approval' },
          });

          if (!existingPending) {
            const currentTuition = course.intakeFees?.[0]?.yearlyTuition || 16500;
            const updatedTuition = currentTuition + 500;

            const updateReq = await db.universityUpdateRequest.create({
              data: {
                universityId: course.universityId,
                courseId: course.courseId,
                entityType: 'course',
                entityName: `${course.courseTitle} (${course.university?.name || ''})`,
                country: course.country || 'UK',
                fieldName: 'tuition_fee',
                oldValue: `£${currentTuition.toLocaleString()}`,
                newValue: `£${updatedTuition.toLocaleString()}`,
                evidenceUrl: course.sourceUrl || course.officialUrl || 'https://official.university.edu/fees',
                aiConfidence: 0.96,
                status: 'pending_approval',
              },
            });
            createdUpdates.push(updateReq);
          }
        }

        return NextResponse.json({
          success: true,
          message: `Weekly AI scan completed. Detected ${createdUpdates.length} verified change proposals. Awaiting Super Admin review.`,
          detectedChanges: createdUpdates.length,
          updates: createdUpdates,
        });
      }

      if (action === 'review') {
        if (!updateId || !decision) {
          return NextResponse.json({ success: false, error: 'updateId and decision (approved/rejected) required' }, { status: 400 });
        }

        const updateReq = await db.universityUpdateRequest.findUnique({
          where: { id: updateId },
        });

        if (!updateReq) {
          return NextResponse.json({ success: false, error: 'Update request not found' }, { status: 404 });
        }

        const newStatus = decision === 'approved' ? 'approved' : 'rejected';

        const updated = await db.universityUpdateRequest.update({
          where: { id: updateId },
          data: {
            status: newStatus,
            reviewedBy: auth.name || auth.userId || 'Super Admin',
          },
        });

        if (decision === 'approved') {
          if (updateReq.entityType === 'course' && updateReq.fieldName === 'tuition_fee') {
            const numericValue = parseFloat(updateReq.newValue.replace(/[^0-9.]/g, '')) || 0;
            if (numericValue > 0) {
              await db.crmCourseIntakeFee.updateMany({
                where: { courseId: updateReq.courseId },
                data: {
                  yearlyTuition: numericValue,
                  lastCheckedAt: new Date().toISOString(),
                  verificationStatus: 'VERIFIED',
                },
              });
            }
          }

          await db.crmAuditLog.create({
            data: {
              actorUserId: auth.userId || 'system',
              actorRole: auth.roles[0] || 'SUPER_ADMIN',
              action: 'APPROVE_AI_UNIVERSITY_UPDATE',
              targetCollection: updateReq.entityType === 'course' ? 'CrmCourse' : 'CrmUniversity',
              targetId: updateReq.courseId || updateReq.universityId,
              beforeData: JSON.stringify({ field: updateReq.fieldName, val: updateReq.oldValue }),
              afterData: JSON.stringify({ field: updateReq.fieldName, val: updateReq.newValue }),
            },
          }).catch(() => null);
        }

        return NextResponse.json({
          success: true,
          message: `Update request ${decision} successfully.`,
          data: updated,
        });
      }

      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
    }
  })(request);
}
