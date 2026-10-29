import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  publicCourseWhere,
  publicIntakeWhere,
  publicRequirementWhere,
  publicCrmScholarshipWhere,
  ENGLISH_TEST_KEYS,
  buildEnglishTestWhere,
  intakeMonthVariants,
  type EnglishTestKey,
} from '@/lib/public-catalog';
import { parseIntakePeriodToken } from '@/lib/course-finder/intake-window';

/** Parses a bounded non-negative number; anything else is treated as absent. */
function readNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}
import { getOptionalAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || searchParams.get('search') || '';
    const country = searchParams.get('country') || '';
    const city = searchParams.get('city') || '';
    const university = searchParams.get('university') || '';
    const campus = searchParams.get('campus') || '';
    const studyLevel = searchParams.get('study_level') || searchParams.get('studyLevel') || '';
    const studyArea = searchParams.get('study_area') || searchParams.get('subjectArea') || '';
    const discipline = searchParams.get('discipline') || '';
    const intakeMonth = searchParams.get('intake') || searchParams.get('intakeMonth') || '';
    const intakeYear = searchParams.get('year') || searchParams.get('intakeYear') || '';
    const scholarship = searchParams.get('scholarship') === 'true';
    const tag = searchParams.get('tag') || '';
    const openProgram = searchParams.get('open_program') === 'true';
    // Spec §33 — the remaining canonical search parameters.
    const minTuition = readNumber(searchParams.get('min_tuition'));
    const maxTuition = readNumber(searchParams.get('max_tuition'));
    const applicationFee = searchParams.get('application_fee') || '';
    const deposit = searchParams.get('deposit') || '';
    const englishTestRaw = (searchParams.get('english_test') || '').toLowerCase();
    const englishTest = (ENGLISH_TEST_KEYS as readonly string[]).includes(englishTestRaw)
      ? (englishTestRaw as EnglishTestKey)
      : undefined;
    const englishScore = readNumber(searchParams.get('english_score'));
    const duration = readNumber(searchParams.get('duration'));
    const deadlineRaw = (searchParams.get('deadline') || '').toLowerCase();
    const deadline = deadlineRaw === 'recorded' || deadlineRaw === 'rolling' ? deadlineRaw : undefined;
    const sort = searchParams.get('sort') || 'relevance';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // RBAC Check for field sanitation
    const auth = await getOptionalAuth(request);
    const roles = auth?.roles || [];
    const isPrivileged = roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'STAFF', 'APPLICATION_OFFICER', 'super_admin', 'admin', 'counselor'].includes(r)
    );

    // Public visibility: non-staff only see published, VERIFIED, source-linked courses.
    const and: any[] = [];
    if (!isPrivileged) and.push(publicCourseWhere());

    // Every filter is its own AND clause. (The previous implementation assigned
    // `where.OR` repeatedly, so a later filter such as `university` silently
    // replaced the text-search OR instead of narrowing it.)
    if (q) {
      and.push({
        OR: [
          { courseTitle: { contains: q } },
          { subjectArea: { contains: q } },
          { disciplineArea: { contains: q } },
          { universityId: { contains: q } },
          { university: { name: { contains: q } } },
        ],
      });
    }

    if (country && country !== 'all') {
      and.push({
        OR: [
          { country: { contains: country } },
          { university: { country: { contains: country } } },
        ],
      });
    }

    if (city) and.push({ city: { contains: city } });

    if (university && university !== 'all') {
      and.push({
        OR: [
          { universityId: { contains: university } },
          { university: { name: { contains: university } } },
          { university: { slug: { contains: university } } },
        ],
      });
    }

    if (campus) and.push({ campus: { contains: campus } });
    if (studyLevel && studyLevel !== 'all') and.push({ studyLevel: { contains: studyLevel } });
    if (studyArea && studyArea !== 'all') and.push({ subjectArea: { contains: studyArea } });
    if (discipline) and.push({ disciplineArea: { contains: discipline } });
    if (openProgram) and.push({ internationalEligibility: { not: 'closed' } });
    if (tag) and.push({ publicTags: { contains: tag } });
    if (scholarship) and.push({ scholarshipRecords: { some: isPrivileged ? { status: 'active' } : publicCrmScholarshipWhere() } });

    // Intake (single month/year or the year-qualified window tokens).
    if (intakeMonth || intakeYear) {
      const periods = intakeMonth
        ? intakeMonth.split(',').map((token) => parseIntakePeriodToken(token.trim(), intakeYear ? Number(intakeYear) : undefined)).filter(Boolean)
        : [];
      if (periods.length > 0) {
        and.push({
          OR: periods.map((entry: any) => ({
            intakeFees: {
              some: {
                ...publicIntakeWhere(),
                intakeYear: entry.year,
                intakeMonth: { in: intakeMonthVariants(entry.month) },
              },
            },
          })),
        });
      } else {
        const intakeWhere: any = {};
        if (intakeMonth) intakeWhere.intakeMonth = { contains: intakeMonth };
        if (intakeYear) intakeWhere.intakeYear = Number(intakeYear);
        and.push({ intakeFees: { some: { ...publicIntakeWhere(), ...intakeWhere } } });
      }
    }

    // Tuition range — matched against verified/scheduled intake fee rows.
    if (minTuition !== undefined || maxTuition !== undefined) {
      const range: Record<string, number> = {};
      if (minTuition !== undefined) range.gte = minTuition;
      if (maxTuition !== undefined) range.lte = maxTuition;
      and.push({ intakeFees: { some: { ...publicIntakeWhere(), yearlyTuition: range } } });
    }

    // Application fee: a number means "fee at most N"; the words none/free/waived
    // mean the course carries a verified fee waiver.
    if (applicationFee) {
      const numericFee = readNumber(applicationFee);
      if (numericFee !== undefined) {
        and.push({ OR: [{ applicationFeeWaiver: true }, { applicationFee: { lte: numericFee, gt: 0 } }] });
      } else if (['none', 'free', 'waived', 'no'].includes(applicationFee.toLowerCase())) {
        and.push({ applicationFeeWaiver: true });
      }
    }

    // Deposit: a number means "deposit at most N"; low/waived means the low-deposit flag.
    if (deposit) {
      const numericDeposit = readNumber(deposit);
      if (numericDeposit !== undefined) {
        and.push({ OR: [{ lowDeposit: true }, { depositAmount: { lte: numericDeposit, gt: 0 } }] });
      } else if (['low', 'waived', 'none', 'no'].includes(deposit.toLowerCase())) {
        and.push({ lowDeposit: true });
      }
    }

    // English test / score — same rule as the public Course Finder.
    const englishClause = buildEnglishTestWhere(englishTest, englishScore);
    if (englishClause) and.push(englishClause);

    // Duration: maximum course length in months.
    if (duration !== undefined) and.push({ durationMonths: { gt: 0, lte: duration } });

    // Deadline: recorded = at least one intake carries a deadline; rolling = none does.
    if (deadline === 'recorded') {
      and.push({ intakeFees: { some: { ...publicIntakeWhere(), applicationDeadline: { not: '' } } } });
    } else if (deadline === 'rolling') {
      and.push({ NOT: { intakeFees: { some: { ...publicIntakeWhere(), applicationDeadline: { not: '' } } } } });
    }

    const where: any = and.length > 0 ? { AND: and } : {};

    let orderBy: any = { courseTitle: 'asc' };
    if (sort === 'popular') {
      orderBy = { placementOption: 'desc' };
    } else if (sort === 'newest') {
      orderBy = { createdAt: 'desc' };
    }

    const [total, courses] = await Promise.all([
      db.crmCourse.count({ where }),
      db.crmCourse.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          university: {
            select: {
              universityId: true,
              name: true,
              country: true,
              city: true,
              campusName: true,
              ranking: true,
              worldRanking: true,
              website: true,
              slug: true,
              ieltsMin: true,
              scholarships: true,
              tuitionRange: true,
              status: true,
            },
          },
          intakeFees: {
            ...(isPrivileged ? {} : { where: publicIntakeWhere() }),
            take: 4,
            orderBy: { intakeYear: 'asc' },
            select: {
              intakeYear: true,
              intakeMonth: true,
              applicationDeadline: true,
              tuitionCurrency: true,
              yearlyTuition: true,
              depositAmount: true,
              appFeeAmount: true,
            },
          },
          requirements: {
            ...(isPrivileged ? {} : { where: publicRequirementWhere() }),
            take: 2,
            select: {
              academicReq: true,
              minScore: true,
              ieltsOverall: true,
              ieltsMinBand: true,
              pteOverall: true,
              toeflOverall: true,
              detOverall: true,
              moiAccepted: true,
            },
          },
          scholarshipRecords: {
            ...(!isPrivileged ? { where: publicCrmScholarshipWhere() } : {}),
            take: 3,
            select: {
              scholarshipName: true,
              scholarshipAmount: true,
              scholarshipCurrency: true,
              deadline: true,
            },
          },
          // Commission rows are internal. Partners are not given rows because
          // CrmCommission has no partner-ownership column to prove attribution.
          commissions: isPrivileged
            ? {
                take: 1,
                select: {
                  partnerCommission: true,
                  internalExpected: true,
                  internalNotes: isPrivileged,
                },
              }
            : false,
        },
      }),
    ]);

    const sanitized = courses.map((c: any) => {
      let qualityScore = 50;
      if (c.university) qualityScore += 15;
      if (c.intakeFees && c.intakeFees.length > 0) qualityScore += 15;
      if (c.requirements && c.requirements.length > 0) qualityScore += 10;
      if (c.sourceUrl) qualityScore += 10;

      const primaryIntake = c.intakeFees?.[0];
      const primaryReq = c.requirements?.[0];
      const tuitionFee = primaryIntake?.yearlyTuition || 0;
      const currency = primaryIntake?.tuitionCurrency || 'GBP';
      const depositAmount = primaryIntake?.depositAmount || 0;
      const appFeeAmount = primaryIntake?.appFeeAmount || 0;

      const output: any = {
        id: c.id,
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        slug: c.slug || c.courseId,
        studyLevel: c.studyLevel || 'Postgraduate',
        programLevel: c.programLevel,
        subjectArea: c.subjectArea || 'General',
        disciplineArea: c.disciplineArea,
        durationMonths: c.durationMonths || 12,
        qualification: c.qualification || 'MSc',
        deliveryMode: c.deliveryMode || 'Full-time On Campus',
        city: c.city || c.university?.city || '',
        country: c.country || c.university?.country || 'United Kingdom',
        campus: c.campus || c.university?.campusName || 'Main Campus',
        tuitionFee,
        currency,
        depositAmount,
        appFeeAmount,
        publicTags: c.publicTags ? c.publicTags.split(',').map((t: string) => t.trim()) : [],
        placementOption: c.placementOption,
        onlineOption: c.onlineOption,
        internationalEligibility: c.internationalEligibility,
        university: c.university,
        intakes: c.intakeFees || [],
        requirements: primaryReq || null,
        scholarships: c.scholarshipRecords || [],
        createdAt: c.createdAt,
      };

      if (isPrivileged) {
        output.sourceUrl = c.sourceUrl;
        output.lastVerifiedAt = c.lastVerifiedAt;
        output.verificationStatus = c.verificationStatus;
        output.status = c.status;
        output.publicationStatus = c.publicationStatus;
        output.dataQualityScore = qualityScore;
        output.commissions = c.commissions || [];
      }

      return output;
    });

    return NextResponse.json({
      success: true,
      data: sanitized,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[api/courses/search] error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to search courses' },
      { status: 500 }
    );
  }
}
