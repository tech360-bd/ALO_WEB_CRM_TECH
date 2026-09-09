import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!["ADMIN", "SUPER_ADMIN", "EMPLOYEE"].includes(auth.userType)) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const studyLevel = searchParams.get('studyLevel') || '';
    const subjectArea = searchParams.get('subjectArea') || '';
    const intakeYear = searchParams.get('intakeYear') || '';
    const intakeMonth = searchParams.get('intakeMonth') || '';
    const tuitionMin = searchParams.get('tuitionMin');
    const tuitionMax = searchParams.get('tuitionMax');
    const scholarship = searchParams.get('scholarship') || '';
    const ieltsMin = searchParams.get('ieltsMin');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.CrmCourseIntakeFeeWhereInput = {};

    if (country) {
      where.course = {
        ...((where.course as Prisma.CrmCourseWhereInput) || {}),
        university: {
          country: { contains: country },
        },
      };
    }

    if (search) {
      const searchWhere = {
        OR: [
          { course: { courseTitle: { contains: search } } },
          { course: { university: { name: { contains: search } } } },
          { course: { subjectArea: { contains: search } } },
        ],
      };
      if (where.AND) {
        where.AND = [...(where.AND as Prisma.CrmCourseIntakeFeeWhereInput[]), searchWhere];
      } else {
        where.AND = [searchWhere];
      }
    }

    if (studyLevel) {
      const levelWhere = { course: { studyLevel: { contains: studyLevel } } };
      if (where.AND) {
        where.AND = [...(where.AND as Prisma.CrmCourseIntakeFeeWhereInput[]), levelWhere];
      } else {
        where.AND = [levelWhere];
      }
    }

    if (subjectArea) {
      const subjectWhere = { course: { subjectArea: { contains: subjectArea } } };
      if (where.AND) {
        where.AND = [...(where.AND as Prisma.CrmCourseIntakeFeeWhereInput[]), subjectWhere];
      } else {
        where.AND = [subjectWhere];
      }
    }

    if (intakeYear) {
      where.intakeYear = parseInt(intakeYear, 10);
    }

    if (intakeMonth) {
      where.intakeMonth = { contains: intakeMonth };
    }

    if (tuitionMin !== null && tuitionMin !== '') {
      where.yearlyTuition = { ...(where.yearlyTuition as Prisma.FloatFilter | undefined), gte: parseFloat(tuitionMin) };
    }

    if (tuitionMax !== null && tuitionMax !== '') {
      where.yearlyTuition = { ...(where.yearlyTuition as Prisma.FloatFilter | undefined), lte: parseFloat(tuitionMax) };
    }

    if (ieltsMin !== null && ieltsMin !== '') {
      const ieltsWhere = { course: { university: { ieltsMin: { lte: parseFloat(ieltsMin) } } } };
      if (where.AND) {
        where.AND = [...(where.AND as Prisma.CrmCourseIntakeFeeWhereInput[]), ieltsWhere];
      } else {
        where.AND = [ieltsWhere];
      }
    }

    const [total, intakes] = await Promise.all([
      db.crmCourseIntakeFee.count({ where }),
      db.crmCourseIntakeFee.findMany({
        where,
        include: {
          course: {
            include: {
              university: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
      }),
    ]);

    // Scholarship filter
    let scholarshipKeys: Set<string> | null = null;
    if (scholarship === 'true' || scholarship === '1') {
      const scholarshipRecords = await db.crmScholarship.findMany({
        where: { status: 'active' },
        select: { universityId: true, courseId: true },
      });
      scholarshipKeys = new Set(scholarshipRecords.map((s) => `${s.universityId}:${s.courseId}`));
    }

    // Pre-fetch commissions for this set of intakes
    const intakeKeys = intakes.map(
      (i) => `${i.universityId}|${i.courseId}|${i.intakeYear}|${i.intakeMonth}`
    );
    const commissions = await db.crmCommission.findMany({
      where: {
        OR: intakeKeys.map((key) => {
          const [uid, cid, iy, im] = key.split('|');
          return { universityId: uid, courseId: cid, intakeYear: parseInt(iy, 10), intakeMonth: im };
        }),
      },
    });
    const commissionMap = new Map<string, typeof commissions[number]>(
      commissions.map((c) => [`${c.universityId}|${c.courseId}|${c.intakeYear}|${c.intakeMonth}`, c])
    );

    const courses = intakes
      .filter((intake) => {
        if (scholarshipKeys) {
          if (!scholarshipKeys.has(`${intake.universityId}:${intake.courseId}`)) return false;
        }
        return true;
      })
      .map((intake) => {
        const uni = intake.course.university;
        const commissionKey = `${intake.universityId}|${intake.courseId}|${intake.intakeYear}|${intake.intakeMonth}`;
        const commission = commissionMap.get(commissionKey);

        return {
          universityId: intake.universityId,
          universityName: uni.name,
          country: uni.country,
          city: uni.city,
          universityRanking: uni.ranking,
          universityWorldRanking: uni.worldRanking,
          universityType: uni.type,
          universityWebsite: uni.website,
          courseId: intake.courseId,
          courseTitle: intake.course.courseTitle,
          studyLevel: intake.course.studyLevel,
          programLevel: intake.course.programLevel,
          subjectArea: intake.course.subjectArea,
          disciplineArea: intake.course.disciplineArea,
          durationMonths: intake.course.durationMonths,
          publicTags: intake.course.publicTags,
          courseStatus: intake.course.status,
          intakeYear: intake.intakeYear,
          intakeMonth: intake.intakeMonth,
          intakeName: intake.intakeName,
          applicationDeadline: intake.applicationDeadline,
          appFeeCurrency: intake.appFeeCurrency,
          appFeeAmount: intake.appFeeAmount,
          tuitionCurrency: intake.tuitionCurrency,
          yearlyTuition: intake.yearlyTuition,
          totalTuition: intake.totalTuition,
          depositCurrency: intake.depositCurrency,
          depositAmount: intake.depositAmount,
          intakeStatus: intake.status,
          // CRM-only fields
          internalExpected: commission?.internalExpected || 0,
          internalIncreased: commission?.internalIncreased || 0,
          partnerCommission: commission?.partnerCommission || 0,
          internalNotes: commission?.internalNotes || '',
          sourceUrl: uni.sourceUrl,
          lastVerifiedAt: uni.lastVerifiedAt,
          universityStatus: uni.status,
        };
      });

    return NextResponse.json({
      courses,
      total,
      page,
      limit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}