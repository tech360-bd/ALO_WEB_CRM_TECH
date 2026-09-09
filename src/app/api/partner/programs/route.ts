import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const isAuthorized = auth.roles.some((r) =>
        ['PARTNER', 'partner', 'SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(r)
      );
      if (!isAuthorized) {
        return NextResponse.json({ success: false, error: 'UNAUTHORIZED: Partner authority required' }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const studentId = searchParams.get('studentId') || '';
      const search = searchParams.get('search') || '';
      const country = searchParams.get('country') || '';
      const universityId = searchParams.get('universityId') || '';
      const studyLevel = searchParams.get('studyLevel') || '';
      const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
      const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
      const skip = (page - 1) * limit;

      let studentContext: any = null;
      if (studentId) {
        const partnerStudent = await db.student.findFirst({
          where: {
            id: studentId,
          },
        });

        if (partnerStudent) {
          studentContext = partnerStudent;
        }
      }

      const where: any = {};
      if (search) {
        where.OR = [
          { courseTitle: { contains: search } },
          { subjectArea: { contains: search } },
          { universityId: { contains: search } },
        ];
      }
      if (country && country !== 'all') where.country = { contains: country };
      if (universityId && universityId !== 'all') where.universityId = universityId;
      if (studyLevel && studyLevel !== 'all') where.studyLevel = studyLevel;

      const [total, courses] = await Promise.all([
        db.crmCourse.count({ where }),
        db.crmCourse.findMany({
          where,
          skip,
          take: limit,
          include: {
            university: {
              select: {
                name: true,
                country: true,
                city: true,
                worldRanking: true,
                universityId: true,
                slug: true,
              },
            },
            intakeFees: { take: 2, orderBy: { intakeYear: 'asc' } },
            requirements: { take: 1 },
            scholarshipRecords: { take: 2, where: { status: 'active' } },
            commissions: {
              take: 1,
              select: {
                partnerCommission: true,
              },
            },
          },
        }),
      ]);

      const enriched = courses.map((c: any) => {
        let eligibilityStatus: 'Eligible' | 'Likely Eligible' | 'Need Review' = 'Likely Eligible';
        let matchScore = 85;

        if (studentContext) {
          eligibilityStatus = 'Eligible';
          matchScore = 92;
        }

        return {
          id: c.id,
          courseId: c.courseId,
          courseTitle: c.courseTitle,
          slug: c.slug,
          studyLevel: c.studyLevel,
          subjectArea: c.subjectArea,
          durationMonths: c.durationMonths,
          qualification: c.qualification,
          country: c.country || c.university?.country,
          city: c.city || c.university?.city,
          tuitionFee: c.intakeFees?.[0]?.yearlyTuition || 0,
          currency: c.intakeFees?.[0]?.tuitionCurrency || 'GBP',
          intakes: c.intakeFees || [],
          requirements: c.requirements?.[0] || null,
          scholarships: c.scholarshipRecords || [],
          university: c.university,
          eligibilityStatus,
          matchScore,
          partnerCommission: c.commissions?.[0]?.partnerCommission || 1500,
        };
      });

      return NextResponse.json({
        success: true,
        data: enriched,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
      });
    } catch (error: any) {
      return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
    }
  })(request);
}
