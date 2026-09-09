import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

type CourseCompareResult = {
  error?: string;
  universityId?: string;
  universityName?: string;
  country?: string;
  city?: string;
  universityRanking?: number;
  universityWorldRanking?: number;
  universityType?: string;
  universityWebsite?: string;
  universityFeatured?: boolean;
  courseId?: string;
  courseTitle?: string;
  studyLevel?: string;
  programLevel?: string;
  subjectArea?: string;
  disciplineArea?: string;
  durationMonths?: number;
  publicTags?: string;
  intakeYear?: number;
  intakeMonth?: string;
  intakeName?: string;
  applicationDeadline?: string;
  appFeeCurrency?: string;
  appFeeAmount?: number;
  tuitionCurrency?: string;
  yearlyTuition?: number;
  totalTuition?: number;
  depositCurrency?: string;
  depositAmount?: number;
  requirements?: Record<string, unknown> | null;
  scholarships?: Array<{ scholarshipName: string; scholarshipAmount: number; scholarshipCurrency: string }>;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { courseIds } = body;

    if (!courseIds || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json({ error: 'courseIds array is required' }, { status: 400 });
    }

    if (courseIds.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 courses can be compared at once' }, { status: 400 });
    }

    const results: CourseCompareResult[] = [];

    for (const item of courseIds) {
      const { universityId, courseId, intakeYear, intakeMonth } = item;

      if (!universityId || !courseId || !intakeYear || !intakeMonth) {
        results.push({
          error: 'Missing required fields: universityId, courseId, intakeYear, intakeMonth',
          ...item,
        });
        continue;
      }

      const intake = await db.crmCourseIntakeFee.findFirst({
        where: {
          universityId,
          courseId,
          intakeYear: parseInt(intakeYear, 10),
          intakeMonth,
          status: 'active',
        },
        include: {
          course: {
            include: {
              university: true,
            },
          },
        },
      });

      if (!intake) {
        results.push({ error: 'Course intake not found', ...item });
        continue;
      }

      // Get requirements
      const requirement = await db.crmCourseRequirement.findFirst({
        where: { universityId, courseId },
      });

      // Get scholarships (public data only)
      const scholarships = await db.crmScholarship.findMany({
        where: { universityId, courseId, status: 'active' },
        select: {
          scholarshipName: true,
          scholarshipAmount: true,
          scholarshipCurrency: true,
        },
      });

      const uni = intake.course.university;
      results.push({
        universityId,
        universityName: uni.name,
        country: uni.country,
        city: uni.city,
        universityRanking: uni.ranking,
        universityWorldRanking: uni.worldRanking,
        universityType: uni.type,
        universityWebsite: uni.website,
        universityFeatured: uni.featured,
        courseId,
        courseTitle: intake.course.courseTitle,
        studyLevel: intake.course.studyLevel,
        programLevel: intake.course.programLevel,
        subjectArea: intake.course.subjectArea,
        disciplineArea: intake.course.disciplineArea,
        durationMonths: intake.course.durationMonths,
        publicTags: intake.course.publicTags,
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
        requirements: requirement
          ? {
              academicReq: requirement.academicReq,
              gradingSystem: requirement.gradingSystem,
              minScore: requirement.minScore,
              ieltsOverall: requirement.ieltsOverall,
              ieltsMinBand: requirement.ieltsMinBand,
              pteOverall: requirement.pteOverall,
              pteMinBand: requirement.pteMinBand,
              toeflOverall: requirement.toeflOverall,
              detOverall: requirement.detOverall,
              moiAccepted: requirement.moiAccepted,
              portfolioRequired: requirement.portfolioRequired,
              interviewRequired: requirement.interviewRequired,
            }
          : null,
        scholarships,
        // NOTE: internalExpected, internalIncreased, partnerCommission, internalNotes
        // are intentionally NOT returned in the public compare endpoint
      });
    }

    return NextResponse.json({ courses: results });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}