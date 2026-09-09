import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, auth) => {
    try {
      const { id } = await params;
      const course = await db.crmCourse.findFirst({
        where: {
          OR: [{ id }, { courseId: id }, { slug: id }],
        },
        include: {
          university: true,
          intakeFees: true,
          requirements: true,
          scholarshipRecords: true,
        },
      });

      if (!course) {
        return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: course });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
    }
  })(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, auth) => {
    try {
      const isAuthorized = auth.roles.some((r) => ['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(r));
      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'UNAUTHORIZED: Admin authority required' }, { status: 403 });
      }

      const { id } = await params;
      const body = await req.json();

      const existing = await db.crmCourse.findFirst({
        where: { OR: [{ id }, { courseId: id }] },
      });

      if (!existing) {
        return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
      }

      const updated = await db.crmCourse.update({
        where: { id: existing.id },
        data: {
          courseTitle: body.courseTitle !== undefined ? body.courseTitle : existing.courseTitle,
          studyLevel: body.studyLevel !== undefined ? body.studyLevel : existing.studyLevel,
          subjectArea: body.subjectArea !== undefined ? body.subjectArea : existing.subjectArea,
          disciplineArea: body.disciplineArea !== undefined ? body.disciplineArea : existing.disciplineArea,
          durationMonths: body.durationMonths !== undefined ? body.durationMonths : existing.durationMonths,
          qualification: body.qualification !== undefined ? body.qualification : existing.qualification,
          deliveryMode: body.deliveryMode !== undefined ? body.deliveryMode : existing.deliveryMode,
          campus: body.campus !== undefined ? body.campus : existing.campus,
          placementOption: body.placementOption !== undefined ? body.placementOption : existing.placementOption,
          onlineOption: body.onlineOption !== undefined ? body.onlineOption : existing.onlineOption,
          sourceUrl: body.sourceUrl !== undefined ? body.sourceUrl : existing.sourceUrl,
          status: body.status !== undefined ? body.status : existing.status,
          verificationStatus: body.sourceUrl ? 'VERIFIED' : existing.verificationStatus,
          lastVerifiedAt: new Date().toISOString(),
        },
      });

      if (body.tuitionFee !== undefined) {
        await db.crmCourseIntakeFee.updateMany({
          where: { courseId: existing.courseId },
          data: {
            yearlyTuition: body.tuitionFee,
            depositAmount: body.depositAmount || 0,
            tuitionCurrency: body.currency || 'GBP',
          },
        });
      }

      if (body.ieltsOverall !== undefined || body.academicReq !== undefined) {
        await db.crmCourseRequirement.updateMany({
          where: { courseId: existing.courseId },
          data: {
            academicReq: body.academicReq,
            ieltsOverall: body.ieltsOverall,
            ieltsMinBand: body.ieltsMinBand,
            pteOverall: body.pteOverall,
          },
        });
      }

      await db.crmAuditLog.create({
        data: {
          actorUserId: auth.userId || 'system',
          actorRole: auth.roles[0] || 'ADMIN',
          action: 'UPDATE_COURSE',
          targetCollection: 'CrmCourse',
          targetId: existing.id,
          beforeData: JSON.stringify({ title: existing.courseTitle, status: existing.status }),
          afterData: JSON.stringify({ title: updated.courseTitle, status: updated.status }),
        },
      }).catch(() => null);

      return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to update course' }, { status: 500 });
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, auth) => {
    try {
      const isSuperAdmin = auth.roles.some((r) => ['SUPER_ADMIN', 'super_admin'].includes(r));
      if (!isSuperAdmin) {
        return NextResponse.json({ success: false, error: 'UNAUTHORIZED: Super Admin authority required' }, { status: 403 });
      }

      const { id } = await params;
      const existing = await db.crmCourse.findFirst({
        where: { OR: [{ id }, { courseId: id }] },
      });

      if (!existing) {
        return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
      }

      const archived = await db.crmCourse.update({
        where: { id: existing.id },
        data: { status: 'archived', publicationStatus: 'archived' },
      });

      await db.crmAuditLog.create({
        data: {
          actorUserId: auth.userId || 'system',
          actorRole: auth.roles[0] || 'SUPER_ADMIN',
          action: 'ARCHIVE_COURSE',
          targetCollection: 'CrmCourse',
          targetId: existing.id,
          beforeData: JSON.stringify({ title: existing.courseTitle, status: existing.status }),
          afterData: JSON.stringify({ status: 'archived' }),
        },
      }).catch(() => null);

      return NextResponse.json({ success: true, message: 'Course archived successfully', data: archived });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to archive course' }, { status: 500 });
    }
  })(request);
}
