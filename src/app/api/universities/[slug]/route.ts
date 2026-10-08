import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOptionalAuth } from '@/lib/auth-middleware';
import {
  UNIVERSITY_COURSE_INTAKE_WINDOW,
  universityIntakeWindowWhere,
} from '@/lib/university-intake-window';

const isIntegerParam = (value: string | null, fallback: number) => {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : fallback;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug?.trim()) {
      return NextResponse.json({ success: false, error: 'University slug required' }, { status: 400 });
    }

    const query = new URL(request.url).searchParams;
    const includeIntakeWindow = query.get('intakeWindow') === '2027-01:2028-01';
    const coursePage = Math.max(1, isIntegerParam(query.get('coursePage'), 1));
    const courseLimit = Math.min(50, Math.max(1, isIntegerParam(query.get('courseLimit'), 12)));
    const cleanSlug = slug.trim();
    const auth = await getOptionalAuth(request);
    const roles = auth?.roles || [];
    const isPrivileged = roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'STAFF', 'APPLICATION_OFFICER', 'super_admin', 'admin', 'counselor'].includes(r)
    );

    const university = await db.crmUniversity.findFirst({
      where: {
        OR: [
          { slug: cleanSlug },
          { universityId: cleanSlug },
          { id: cleanSlug },
          { name: { contains: cleanSlug.replace(/-/g, ' ') } },
        ],
        ...(!isPrivileged ? {
          status: 'active',
          verificationStatus: 'VERIFIED',
          publicationStatus: { in: ['published', 'PUBLISHED'] },
        } : {}),
      },
      include: {
        rankingRecords: {
          ...(!isPrivileged ? { where: { verificationStatus: 'VERIFIED' } } : {}),
          orderBy: { rankingYear: 'desc' },
        },
        scholarshipRecords: {
          ...(!isPrivileged ? {
            where: { status: 'active', verificationStatus: 'VERIFIED' },
          } : {}),
          take: 10,
        },
        ...(!includeIntakeWindow ? {
          courses: {
            ...(!isPrivileged ? {
              where: {
                status: 'active',
                verificationStatus: 'VERIFIED',
                publicationStatus: { in: ['published', 'PUBLISHED'] },
              },
            } : {}),
            take: 20,
            include: {
              intakeFees: {
                ...(!isPrivileged ? {
                  where: { status: 'active', verificationStatus: 'VERIFIED' },
                } : {}),
                take: 2,
                orderBy: { intakeYear: 'asc' },
              },
              requirements: {
                ...(!isPrivileged ? { where: { verificationStatus: 'VERIFIED' } } : {}),
                take: 1,
              },
            },
          },
        } : {}),
        _count: {
          select: {
            courses: !isPrivileged ? {
              where: {
                status: 'active',
                verificationStatus: 'VERIFIED',
                publicationStatus: { in: ['published', 'PUBLISHED'] },
              },
            } : true,
            scholarshipRecords: !isPrivileged ? {
              where: { status: 'active', verificationStatus: 'VERIFIED' },
            } : true,
          },
        },
      },
    });

    if (!university) {
      return NextResponse.json({ success: false, error: 'University not found' }, { status: 404 });
    }

    let parsedCampuses: string[] = [];
    try {
      if (university.campuses) {
        const parsed = JSON.parse(university.campuses);
        parsedCampuses = Array.isArray(parsed) ? parsed.filter((campus): campus is string => typeof campus === 'string') : [];
      }
    } catch {
      parsedCampuses = university.campusName ? [university.campusName] : [];
    }

    let courses = university.courses || [];
    let intakeWindow: Record<string, unknown> | undefined;

    if (includeIntakeWindow) {
      const intakeWindowWhere = universityIntakeWindowWhere();
      const courseWhere: Record<string, unknown> = {
        universityId: university.universityId,
        status: 'active',
        verificationStatus: 'VERIFIED',
        publicationStatus: { in: ['published', 'PUBLISHED'] },
        OR: [
          {
            intakeFees: {
              some: {
                status: 'active',
                verificationStatus: 'VERIFIED',
                ...intakeWindowWhere,
              },
            },
          },
          {
            courseIntakes: {
              some: intakeWindowWhere,
            },
          },
        ],
      };

      const [totalCourses, coursesWithRecordedCode, matchingCourses] = await Promise.all([
        db.crmCourse.count({ where: courseWhere }),
        db.crmCourse.count({ where: { ...courseWhere, courseCode: { not: '' } } }),
        db.crmCourse.findMany({
          where: courseWhere,
          skip: (coursePage - 1) * courseLimit,
          take: courseLimit,
          orderBy: { courseTitle: 'asc' },
          include: {
            intakeFees: {
              where: {
                status: 'active',
                verificationStatus: 'VERIFIED',
                ...intakeWindowWhere,
              },
              orderBy: [{ intakeYear: 'asc' }, { intakeMonth: 'asc' }],
            },
            courseIntakes: {
              where: intakeWindowWhere,
              orderBy: [{ intakeYear: 'asc' }, { intakeMonth: 'asc' }],
            },
            requirements: {
              ...(!isPrivileged ? { where: { verificationStatus: 'VERIFIED' } } : {}),
              take: 1,
            },
          },
        }),
      ]);
      courses = matchingCourses;
      intakeWindow = {
        start: UNIVERSITY_COURSE_INTAKE_WINDOW.start,
        end: UNIVERSITY_COURSE_INTAKE_WINDOW.end,
        label: UNIVERSITY_COURSE_INTAKE_WINDOW.label,
        page: coursePage,
        pageSize: courseLimit,
        totalCourses,
        totalPages: Math.ceil(totalCourses / courseLimit),
        courseCodesRecorded: coursesWithRecordedCode,
        courseCodesMissing: Math.max(0, totalCourses - coursesWithRecordedCode),
        courseCodeMeaning: 'Counts non-empty CrmCourse.courseCode fields; this is not proof of complete official-code coverage.',
      };
    }

    const output: any = {
      id: university.id,
      universityId: university.universityId,
      universityCode: university.universityCode || '',
      name: university.name,
      slug: university.slug || university.universityId.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      country: university.country,
      city: university.city,
      campusName: university.campusName,
      campuses: parsedCampuses,
      ranking: university.ranking,
      worldRanking: university.worldRanking,
      type: university.type,
      founded: university.founded,
      students: university.students,
      intlStudents: university.intlStudents,
      ieltsMin: university.ieltsMin,
      tuitionRange: university.tuitionRange,
      scholarships: university.scholarships,
      description: university.description,
      featured: university.featured,
      website: university.website,
      officialUrl: university.officialUrl,
      officialCourseSearchUrl: university.officialCourseSearchUrl,
      officialScholarshipUrl: university.officialScholarshipUrl,
      officialInternationalAdmissionsUrl: university.officialInternationalAdmissionsUrl,
      officialTuitionFeeUrl: university.officialTuitionFeeUrl,
      totalCourses: university._count.courses,
      totalScholarships: university._count.scholarshipRecords,
      rankings: university.rankingRecords,
      scholarshipList: university.scholarshipRecords,
      popularCourses: courses.map((course: any) => ({
        id: course.id,
        courseId: course.courseId,
        courseCode: course.courseCode || '',
        courseTitle: course.courseTitle,
        slug: course.slug || course.courseId.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        studyLevel: course.studyLevel,
        subjectArea: course.subjectArea,
        durationMonths: course.durationMonths,
        qualification: course.qualification,
        tuitionFee: course.intakeFees?.[0]?.yearlyTuition || 0,
        currency: course.intakeFees?.[0]?.tuitionCurrency || 'GBP',
        intakes: course.intakeFees || [],
        courseIntakes: course.courseIntakes || [],
        internationalEligibility: course.internationalEligibility || 'not_verified',
        officialUrl: course.officialUrl || '',
        sourceUrl: course.sourceUrl || '',
        verificationStatus: course.verificationStatus || 'NEEDS_REVIEW',
        publicationStatus: course.publicationStatus || 'draft',
        lastVerifiedAt: course.lastVerifiedAt || '',
        requirements: course.requirements?.[0] || null,
      })),
      ...(intakeWindow ? { intakeWindow } : {}),
      createdAt: university.createdAt,
      updatedAt: university.updatedAt,
    };

    // Verification/source fields are public-facing evidence, not internal notes.
    output.sourceUrl = university.sourceUrl;
    output.lastVerifiedAt = university.lastVerifiedAt;
    output.verificationStatus = university.verificationStatus;
    output.status = university.status;
    output.publicationStatus = university.publicationStatus;

    if (isPrivileged) {
      output.updatedBy = university.updatedBy;
    }

    return NextResponse.json({ success: true, data: output });
  } catch (error: any) {
    console.error('[api/universities/[slug]] error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch university details' },
      { status: 500 }
    );
  }
}
