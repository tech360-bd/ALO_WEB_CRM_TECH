import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';
import { changedFields, invalidUrlField, presentControlFields, verificationAfterEdit } from '@/lib/course-finder/crm-edit-verification';

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
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return NextResponse.json({ success: false, error: 'A JSON object body is required' }, { status: 400 });
      }
      // Phase 1 review (P1-D): an edit is not verification or publication.
      const control = presentControlFields(body);
      if (control.length) {
        return NextResponse.json({ success: false, error: `Control fields cannot be set by editing: ${control.join(', ')}` }, { status: 400 });
      }
      if (body.tuitionFee !== undefined && !(typeof body.currency === 'string' && /^[A-Za-z]{3}$/.test(body.currency))) {
        return NextResponse.json({ success: false, error: 'A three-letter currency code is required when changing tuition (no default currency is assumed).' }, { status: 400 });
      }

      const existing = await db.crmCourse.findFirst({
        where: { OR: [{ id }, { courseId: id }] },
      });

      if (!existing) {
        return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
      }
      const badUrl = invalidUrlField(body, ['sourceUrl'], existing as any);
      if (badUrl) return NextResponse.json({ success: false, error: `${badUrl} must be an https official source URL` }, { status: 400 });

      const data: Record<string, unknown> = {
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
      };
      const factFields = Object.keys(data).filter((f) => f !== 'status');
      const changed = changedFields(data, existing as any, factFields);
      const feeOrRequirementChanged = body.tuitionFee !== undefined || body.depositAmount !== undefined
        || body.ieltsOverall !== undefined || body.academicReq !== undefined;
      // Never upgraded, never re-dated here.
      data.verificationStatus = verificationAfterEdit(existing.verificationStatus, changed.length > 0 || feeOrRequirementChanged);

      const updated = await db.crmCourse.update({
        where: { id: existing.id },
        data: data as any,
      });

      if (body.tuitionFee !== undefined) {
        await db.crmCourseIntakeFee.updateMany({
          where: { courseId: existing.courseId },
          data: {
            yearlyTuition: body.tuitionFee,
            depositAmount: body.depositAmount || 0,
            tuitionCurrency: String(body.currency).toUpperCase(),
            // Changed fee facts need review again.
            verificationStatus: 'NEEDS_REVIEW',
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
            verificationStatus: 'NEEDS_REVIEW',
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
          beforeData: JSON.stringify({ title: existing.courseTitle, status: existing.status, verificationStatus: existing.verificationStatus }),
          afterData: JSON.stringify({ title: updated.courseTitle, status: updated.status, verificationStatus: updated.verificationStatus, changedFields: changed }),
        },
      }).catch(() => null);

      return NextResponse.json({ success: true, data: updated });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to update course' }, { status: 500 });
    }
  }, { requireUserTypes: ['ADMIN', 'SUPER_ADMIN'] })(request);
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
