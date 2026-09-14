import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================
// PUBLIC COURSE FINDER API
// Returns courses with university info via manual joins.
// Public (no auth) — used by the public website course finder.
// ============================================================

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const country = searchParams.get('country') || searchParams.get('countries') || '';
    const studyLevel = searchParams.get('studyLevel') || searchParams.get('studyLevels') || '';
    const subjectArea = searchParams.get('subjectArea') || '';
    const englishTest = searchParams.get('englishTest') || searchParams.get('english_requirements')?.split(':')[0] || '';
    const englishScore = searchParams.get('englishScore') || searchParams.get('english_requirements')?.split(':')[1] || '';
    const ieltsMinParam = searchParams.get('ieltsMin') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '20', 10) || 20));
    const skip = (page - 1) * limit;

    // Build course where clause
    const courseWhere: Record<string, unknown> = { status: 'active' };

    if (search) {
      courseWhere.OR = [
        { courseTitle: { contains: search } },
        { subjectArea: { contains: search } },
      ];
    }
    if (studyLevel) {
      // support comma separated list
      const levels = studyLevel.split(',').map(s => s.trim()).filter(Boolean);
      if (levels.length === 1) {
        courseWhere.studyLevel = { contains: levels[0] };
      } else if (levels.length > 1) {
        courseWhere.OR = levels.map(l => ({ studyLevel: { contains: l } }));
      }
    }
    if (subjectArea) {
      courseWhere.subjectArea = { contains: subjectArea };
    }

    // If country filter, fetch matching university IDs first — support comma list
    let universityIds: string[] | null = null;
    if (country) {
      const countryList = country.split(',').map(c => c.trim()).filter(Boolean);
      const unis = await (db as any).crmUniversity.findMany({
        where: {
          OR: countryList.map(c => ({ country: { contains: c } })),
        },
        select: { universityId: true },
      });
      universityIds = (unis as any[]).map((u: any) => u.universityId);
      if (!universityIds || universityIds.length === 0) {
        return NextResponse.json({
          success: true,
          courses: [],
          total: 0,
          page,
          limit,
          pages: 0,
        });
      }
      courseWhere.universityId = { in: universityIds };
    }

    // English requirements filter — DB-driven via CrmCourseRequirement
    if (englishTest) {
      try {
        const testLower = englishTest.toLowerCase();
        // Map test slug to requirement field
        let reqWhere: any = {};
        if (testLower.includes('ielts')) {
          reqWhere = { englishTest: { contains: 'IELTS' } };
          if (ieltsMinParam || englishScore) {
            const minScore = parseFloat(ieltsMinParam || englishScore) || 0;
            if (minScore > 0) reqWhere.ieltsOverall = { lte: minScore + 1.5 }; // allow courses requiring <= user's target + margin
          }
        } else if (testLower.includes('pte')) {
          reqWhere = { OR: [{ englishTest: { contains: 'PTE' } }, { pteOverall: { gt: 0 } }] };
        } else if (testLower.includes('toefl')) {
          reqWhere = { OR: [{ englishTest: { contains: 'TOEFL' } }, { toeflOverall: { gt: 0 } }] };
        } else if (testLower.includes('duolingo') || testLower.includes('det')) {
          reqWhere = { OR: [{ englishTest: { contains: 'Duolingo' } }, { englishTest: { contains: 'DET' } }, { detOverall: { gt: 0 } }] };
        } else if (testLower.includes('oietc') || testLower.includes('oxford') || testLower.includes('languagecert') || testLower.includes('oet') || testLower.includes('moi')) {
          reqWhere = { englishTest: { contains: testLower } };
        } else {
          reqWhere = { englishTest: { contains: englishTest } };
        }

        const matchingReqs = await (db as any).crmCourseRequirement.findMany({
          where: reqWhere,
          select: { courseId: true },
          take: 5000,
        });
        const matchingCourseIds = [...new Set(matchingReqs.map((r: any) => r.courseId))];
        if (matchingCourseIds.length > 0) {
          // Intersect with existing courseWhere if university filter exists
          const existingCourseIds = (courseWhere as any).universityId ? undefined : undefined;
          // If we already have university filter, we need to filter further
          if (matchingCourseIds.length > 0) {
            (courseWhere as any).courseId = { in: matchingCourseIds };
          }
        }
        // If no matching requirements found, we don't filter out all courses — we show note "Requirement not available in database. Check university course page." via frontend
      } catch (e) {
        console.log('English requirement filter fallback — CrmCourseRequirement table may not have data:', (e as any).message);
      }
    }

    // Fetch courses
    const [total, courses] = await Promise.all([
      db.crmCourse.count({ where: courseWhere }),
      db.crmCourse.findMany({
        where: courseWhere,
        skip,
        take: limit,
        orderBy: [{ createdAt: 'desc' }],
      }),
    ]);

    // Fetch related universities and intake fees in parallel
    const uniIds = [...new Set((courses as any[]).map((c: any) => c.universityId))];
    const courseIdsForFee = (courses as any[]).map((c: any) => c.courseId);

    const [universities, intakeFees] = await Promise.all([
      (db as any).crmUniversity.findMany({
        where: { universityId: { in: uniIds } },
      }),
      (db as any).crmCourseIntakeFee.findMany({
        where: {
          courseId: { in: courseIdsForFee },
          status: 'active',
        },
        orderBy: { intakeYear: 'desc' },
      }),
    ]);

    const uniMap = new Map<string, any>((universities as any[]).map((u: any) => [u.universityId, u]));
    const feeMap = new Map<string, any>();
    for (const f of intakeFees as any[]) {
      if (!feeMap.has(f.courseId)) feeMap.set(f.courseId, f);
    }

    // Compose response
    const result = (courses as any[]).map((c: any) => {
      const uni = uniMap.get(c.universityId) as any;
      const fee = feeMap.get(c.courseId) as any;
      return {
        universityId: c.universityId,
        universityName: uni?.name || '',
        country: uni?.country || '',
        city: uni?.city || '',
        universityRanking: uni?.ranking || 0,
        universityWorldRanking: uni?.worldRanking || 0,
        universityType: uni?.type || '',
        universityWebsite: uni?.website || '',
        universityOfficialUrl: uni?.officialUrl || '',
        universityVerificationStatus: uni?.verificationStatus || uni?.status || 'NEEDS_REVIEW',
        universityPublicationStatus: uni?.publicationStatus || 'draft',
        universityLastVerifiedAt: uni?.lastVerifiedAt || '',
        universitySourceUrl: uni?.sourceUrl || '',
        ieltsMin: uni?.ieltsMin || 0,
        scholarships: uni?.scholarships || false,
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        qualification: c.qualification || '',
        studyLevel: c.studyLevel,
        programLevel: c.programLevel,
        subjectArea: c.subjectArea,
        disciplineArea: c.disciplineArea,
        campus: c.campus || uni?.campusName || '',
        deliveryMode: c.deliveryMode || '',
        attendanceMode: c.attendanceMode || '',
        internationalEligibility: c.internationalEligibility || 'not_verified',
        officialCourseUrl: c.officialUrl || '',
        officialApplicationUrl: c.officialApplicationUrl || '',
        courseVerificationStatus: c.verificationStatus || c.status || 'NEEDS_REVIEW',
        coursePublicationStatus: c.publicationStatus || 'draft',
        courseLastVerifiedAt: c.lastVerifiedAt || '',
        courseSourceUrl: c.sourceUrl || '',
        durationMonths: c.durationMonths,
        publicTags: c.publicTags,
        intakeYear: fee?.intakeYear || 0,
        intakeMonth: fee?.intakeMonth || '',
        intakeName: fee?.intakeName || '',
        applicationDeadline: fee?.applicationDeadline || '',
        appFeeCurrency: fee?.appFeeCurrency || '',
        appFeeAmount: fee?.appFeeAmount || 0,
        tuitionCurrency: fee?.tuitionCurrency || '',
        yearlyTuition: fee?.yearlyTuition || 0,
        totalTuition: fee?.totalTuition || 0,
        tuitionPeriod: fee?.tuitionPeriod || '',
        feeSourceUrl: fee?.feeSourceUrl || '',
        intakeSourceUrl: fee?.intakeSourceUrl || '',
        feeVerificationStatus: fee?.verificationStatus || 'NEEDS_REVIEW',
        depositCurrency: fee?.depositCurrency || '',
        depositAmount: fee?.depositAmount || 0,
      };
    });

    return NextResponse.json({
      success: true,
      courses: result,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Course finder API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}
