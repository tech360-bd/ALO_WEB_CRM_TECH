import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const search = searchParams.get('search') || '';
      const universityId = searchParams.get('universityId') || '';
      const studyLevel = searchParams.get('studyLevel') || '';
      const country = searchParams.get('country') || '';
      const status = searchParams.get('status') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10)));
      const skip = (page - 1) * limit;

      const where: any = {};
      if (search) {
        where.OR = [
          { courseTitle: { contains: search } },
          { courseId: { contains: search } },
          { subjectArea: { contains: search } },
        ];
      }
      if (universityId && universityId !== 'all') where.universityId = universityId;
      if (studyLevel && studyLevel !== 'all') where.studyLevel = studyLevel;
      if (country && country !== 'all') where.country = { contains: country };
      if (status && status !== 'all') where.status = status;

      const [total, courses] = await Promise.all([
        db.crmCourse.count({ where }),
        db.crmCourse.findMany({
          where,
          skip,
          take: limit,
          orderBy: { courseTitle: 'asc' },
          include: {
            university: {
              select: {
                name: true,
                country: true,
                city: true,
                universityId: true,
              },
            },
            intakeFees: {
              take: 2,
            },
            requirements: {
              take: 1,
            },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        data: courses,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
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
      const {
        courseTitle,
        universityId,
        studyLevel,
        subjectArea,
        disciplineArea,
        durationMonths,
        qualification,
        deliveryMode,
        campus,
        city,
        country,
        tuitionFee,
        currency,
        depositAmount,
        appFeeAmount,
        intakes,
        academicReq,
        ieltsOverall,
        ieltsMinBand,
        pteOverall,
        toeflOverall,
        detOverall,
        moiAccepted,
        publicTags,
        placementOption,
        onlineOption,
        officialUrl,
        sourceUrl,
        forceCreate,
      } = body;

      if (!courseTitle || !universityId) {
        return NextResponse.json({ success: false, error: 'Course title and University ID are required' }, { status: 400 });
      }

      const uni = await db.crmUniversity.findFirst({
        where: { OR: [{ universityId }, { id: universityId }] },
      });
      if (!uni) {
        return NextResponse.json({ success: false, error: `University '${universityId}' not found in database.` }, { status: 404 });
      }

      const normalizedTitle = courseTitle.trim().toLowerCase();
      const existing = await db.crmCourse.findFirst({
        where: {
          universityId: uni.universityId,
          courseTitle: { contains: normalizedTitle },
          studyLevel: studyLevel || undefined,
        },
      });

      if (existing && !forceCreate) {
        return NextResponse.json({
          success: false,
          duplicateDetected: true,
          existingCourse: {
            id: existing.id,
            courseId: existing.courseId,
            courseTitle: existing.courseTitle,
            universityId: existing.universityId,
          },
          error: `Possible duplicate detected: '${existing.courseTitle}' already exists for ${uni.name}.`,
        }, { status: 409 });
      }

      const genCourseCode = `CRS-${uni.universityId.replace('UNI-', '')}-${Date.now().toString(36).toUpperCase()}`;
      const slug = `${courseTitle}-${uni.name}`.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      const newCourse = await db.crmCourse.create({
        data: {
          courseId: genCourseCode,
          universityId: uni.universityId,
          courseTitle,
          slug,
          studyLevel: studyLevel || 'Postgraduate',
          subjectArea: subjectArea || 'General',
          disciplineArea: disciplineArea || '',
          durationMonths: durationMonths || 12,
          qualification: qualification || 'MSc',
          deliveryMode: deliveryMode || 'Full-time On Campus',
          campus: campus || uni.campusName || 'Main Campus',
          city: city || uni.city,
          country: country || uni.country,
          publicTags: Array.isArray(publicTags) ? publicTags.join(', ') : (publicTags || ''),
          placementOption: placementOption || false,
          onlineOption: onlineOption || false,
          officialUrl: officialUrl || '',
          sourceUrl: sourceUrl || '',
          status: 'verified',
          verificationStatus: sourceUrl ? 'VERIFIED' : 'NEEDS_REVIEW',
          lastVerifiedAt: new Date().toISOString(),
        },
      });

      if (tuitionFee !== undefined || (intakes && intakes.length > 0)) {
        const defaultIntake = intakes?.[0] || { intakeMonth: 'September', intakeYear: 2026 };
        await db.crmCourseIntakeFee.create({
          data: {
            universityId: uni.universityId,
            courseId: newCourse.courseId,
            intakeYear: defaultIntake.intakeYear || 2026,
            intakeMonth: defaultIntake.intakeMonth || 'September',
            applicationDeadline: defaultIntake.deadline || 'Rolling',
            tuitionCurrency: currency || 'GBP',
            yearlyTuition: tuitionFee || 0,
            depositCurrency: currency || 'GBP',
            depositAmount: depositAmount || 0,
            appFeeAmount: appFeeAmount || 0,
            feeSourceUrl: sourceUrl || '',
            verificationStatus: sourceUrl ? 'VERIFIED' : 'NEEDS_REVIEW',
          },
        });
      }

      if (academicReq || ieltsOverall) {
        await db.crmCourseRequirement.create({
          data: {
            universityId: uni.universityId,
            courseId: newCourse.courseId,
            academicReq: academicReq || 'Recognized Bachelor degree with minimum 60% or GPA 3.0',
            ieltsOverall: ieltsOverall || 6.5,
            ieltsMinBand: ieltsMinBand || 6.0,
            pteOverall: pteOverall || 58,
            toeflOverall: toeflOverall || 80,
            detOverall: detOverall || 115,
            moiAccepted: moiAccepted || false,
            officialRequirementUrl: sourceUrl || '',
            verificationStatus: sourceUrl ? 'VERIFIED' : 'NEEDS_REVIEW',
          },
        });
      }

      await db.crmAuditLog.create({
        data: {
          actorUserId: auth.userId || 'system',
          actorRole: auth.roles[0] || 'ADMIN',
          action: 'CREATE_COURSE',
          targetCollection: 'CrmCourse',
          targetId: newCourse.id,
          afterData: JSON.stringify({ title: courseTitle, uni: uni.name, code: genCourseCode }),
        },
      }).catch(() => null);

      return NextResponse.json({ success: true, data: newCourse });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed to create course' }, { status: 500 });
    }
  })(request);
}
