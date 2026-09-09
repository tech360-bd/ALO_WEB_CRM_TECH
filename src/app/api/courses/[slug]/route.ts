import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOptionalAuth } from '@/lib/auth-middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ success: false, error: 'Course slug required' }, { status: 400 });
    }

    const cleanSlug = slug.trim();

    const course = await db.crmCourse.findFirst({
      where: {
        OR: [
          { slug: cleanSlug },
          { courseId: cleanSlug },
          { id: cleanSlug },
          { courseTitle: { contains: cleanSlug.replace(/-/g, ' ') } },
        ],
      },
      include: {
        university: {
          select: {
            id: true,
            universityId: true,
            name: true,
            country: true,
            city: true,
            campusName: true,
            ranking: true,
            worldRanking: true,
            type: true,
            founded: true,
            students: true,
            intlStudents: true,
            ieltsMin: true,
            tuitionRange: true,
            scholarships: true,
            website: true,
            officialUrl: true,
            sourceUrl: true,
            lastVerifiedAt: true,
            status: true,
            slug: true,
            description: true,
            campuses: true,
            logoSourceUrl: true,
            heroImageSourceUrl: true,
          },
        },
        intakeFees: {
          orderBy: [{ intakeYear: 'asc' }, { intakeMonth: 'asc' }],
        },
        requirements: true,
        scholarshipRecords: {
          where: { status: 'active' },
        },
        commissions: true,
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    // RBAC Check for field sanitation
    const auth = await getOptionalAuth(request);
    const roles = auth?.roles || [];
    const isPrivileged = roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'STAFF', 'APPLICATION_OFFICER', 'super_admin', 'admin', 'counselor'].includes(r)
    );
    const isPartner = roles.some((r) => ['PARTNER', 'partner', 'AGENT', 'agent'].includes(r));

    const similarCourses = await db.crmCourse.findMany({
      where: {
        id: { not: course.id },
        OR: [
          { subjectArea: course.subjectArea },
          { universityId: course.universityId },
        ],
      },
      take: 4,
      select: {
        id: true,
        courseId: true,
        courseTitle: true,
        slug: true,
        studyLevel: true,
        subjectArea: true,
        durationMonths: true,
        country: true,
        city: true,
        university: {
          select: {
            name: true,
            country: true,
            city: true,
            worldRanking: true,
            logoSourceUrl: true,
            heroImageSourceUrl: true,
          },
        },
        intakeFees: {
          take: 1,
          select: {
            yearlyTuition: true,
            tuitionCurrency: true,
            intakeMonth: true,
            intakeYear: true,
          },
        },
      },
    });

    const primaryIntake = course.intakeFees?.[0];
    const primaryReq = course.requirements?.[0];

    const result: any = {
      id: course.id,
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      slug: course.slug || course.courseId.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      studyLevel: course.studyLevel || 'Postgraduate',
      programLevel: course.programLevel,
      subjectArea: course.subjectArea || 'General',
      disciplineArea: course.disciplineArea,
      durationMonths: course.durationMonths || 12,
      qualification: course.qualification || 'Master of Science',
      deliveryMode: course.deliveryMode || 'Full-time On Campus',
      city: course.city || course.university?.city || '',
      country: course.country || course.university?.country || 'United Kingdom',
      campus: course.campus || course.university?.campusName || 'Main Campus',
      tuitionFee: primaryIntake?.yearlyTuition || 0,
      currency: primaryIntake?.tuitionCurrency || 'GBP',
      depositAmount: primaryIntake?.depositAmount || 0,
      appFeeAmount: primaryIntake?.appFeeAmount || 0,
      publicTags: course.publicTags ? course.publicTags.split(',').map((t: string) => t.trim()) : [],
      placementOption: course.placementOption,
      onlineOption: course.onlineOption,
      partTimeOption: course.partTimeOption,
      sandwichYearOption: course.sandwichYearOption,
      internationalEligibility: course.internationalEligibility,
      officialUrl: course.officialUrl,
      officialApplicationUrl: course.officialApplicationUrl,
      university: course.university,
      intakes: course.intakeFees || [],
      requirements: primaryReq || null,
      allRequirements: course.requirements || [],
      scholarships: course.scholarshipRecords || [],
      similarCourses: similarCourses.map((s) => ({
        ...s,
        tuitionFee: s.intakeFees?.[0]?.yearlyTuition || 0,
        currency: s.intakeFees?.[0]?.tuitionCurrency || 'GBP',
      })),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };

    if (isPrivileged) {
      result.sourceUrl = course.sourceUrl;
      result.lastVerifiedAt = course.lastVerifiedAt;
      result.verificationStatus = course.verificationStatus;
      result.status = course.status;
      result.publicationStatus = course.publicationStatus;
      result.commissions = course.commissions || [];
    } else if (isPartner) {
      result.commissions = (course.commissions || []).map((comm: any) => ({
        partnerCommission: comm.partnerCommission,
      }));
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch course details' },
      { status: 500 }
    );
  }
}
