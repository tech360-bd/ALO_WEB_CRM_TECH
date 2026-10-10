import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOptionalAuth } from '@/lib/auth-middleware';
import { publicCourseIdentifierWhere, publicCourseWhere, stripInternalFields } from '@/lib/public-catalog';

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
    const auth = await getOptionalAuth(request);
    const roles = auth?.roles || [];
    const isPrivileged = roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'STAFF', 'APPLICATION_OFFICER', 'super_admin', 'admin', 'counselor'].includes(r)
    );

    // Exact identifiers only (slug, courseId, id). A fuzzy title match could
    // return a different course than the one the visitor requested.
    // Public visitors are restricted to the canonical public-visibility rule in the query itself.
    const identifierWhere = isPrivileged
      ? { OR: [{ slug: cleanSlug }, { courseId: cleanSlug }, { id: cleanSlug }] }
      : publicCourseIdentifierWhere(cleanSlug);
    if (!identifierWhere) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const course = await db.crmCourse.findFirst({
      where: identifierWhere as any,
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
            publicationStatus: true,
            verificationStatus: true,
            slug: true,
            description: true,
            campuses: true,
          },
        },
        intakeFees: {
          ...(!isPrivileged ? { where: { status: 'active', verificationStatus: 'VERIFIED' } } : {}),
          orderBy: [{ intakeYear: 'asc' }, { intakeMonth: 'asc' }],
        },
        requirements: {
          ...(!isPrivileged ? { where: { verificationStatus: 'VERIFIED' } } : {}),
        },
        scholarshipRecords: {
          where: !isPrivileged
            ? { status: 'active', verificationStatus: { in: ['VERIFIED', 'verified'] } }
            : { status: 'active' },
        },
        // Commission data is internal: only staff/admin roles receive it.
        ...(isPrivileged ? { commissions: true } : {}),
      },
    });

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    const publiclyPublishable = course.status.toLowerCase() === 'active'
      && course.verificationStatus.toUpperCase() === 'VERIFIED'
      && course.publicationStatus.toUpperCase() === 'PUBLISHED'
      && Boolean(course.sourceUrl.trim() || course.officialUrl.trim());
    if (!isPrivileged && !publiclyPublishable) {
      return NextResponse.json({ success: false, error: 'No published, verified, source-linked course record is available.' }, { status: 404 });
    }

    const similarCourses = await db.crmCourse.findMany({
      where: {
        id: { not: course.id },
        AND: [
          { OR: [{ subjectArea: course.subjectArea }, { universityId: course.universityId }] },
          ...(!isPrivileged ? [publicCourseWhere()] : []),
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
    const tuitionValue = primaryIntake?.yearlyTuition > 0
      ? primaryIntake.yearlyTuition
      : isPrivileged && course.tuitionFee > 0 ? course.tuitionFee : null;
    const publicUniversityIsVerified = isPrivileged || (
      course.university?.status?.toLowerCase() === 'active'
      && course.university?.verificationStatus?.toUpperCase() === 'VERIFIED'
      && course.university?.publicationStatus?.toUpperCase() === 'PUBLISHED'
      && Boolean(course.university?.sourceUrl?.trim() || course.university?.officialUrl?.trim())
    );

    const result: any = {
      id: course.id,
      courseId: course.courseId,
      courseTitle: course.courseTitle,
      slug: course.slug || course.courseId.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      studyLevel: course.studyLevel || course.programLevel || null,
      programLevel: course.programLevel || null,
      subjectArea: course.subjectArea || course.disciplineArea || null,
      disciplineArea: course.disciplineArea || null,
      durationMonths: course.durationMonths > 0 ? course.durationMonths : null,
      qualification: course.qualification || null,
      description: course.description || null,
      deliveryMode: course.deliveryMode || course.attendanceMode || null,
      city: course.city || (publicUniversityIsVerified ? course.university?.city : null) || null,
      country: course.country || (publicUniversityIsVerified ? course.university?.country : null) || null,
      campus: course.campus || (publicUniversityIsVerified ? course.university?.campusName : null) || null,
      tuitionFee: tuitionValue,
      currency: tuitionValue ? (primaryIntake?.tuitionCurrency || (isPrivileged ? course.currency : null) || null) : null,
      depositAmount: primaryIntake?.depositAmount > 0 ? primaryIntake.depositAmount : null,
      depositCurrency: primaryIntake?.depositAmount > 0 ? primaryIntake.depositCurrency || null : null,
      appFeeAmount: primaryIntake?.appFeeAmount > 0 ? primaryIntake.appFeeAmount : null,
      appFeeCurrency: primaryIntake?.appFeeAmount > 0 ? primaryIntake.appFeeCurrency || null : null,
      publicTags: course.publicTags ? course.publicTags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      careerOutcomes: course.careerOutcomes || null,
      placementOption: course.placementOption,
      workPlacementAvailable: course.workPlacementAvailable,
      coOpAvailable: course.coOpAvailable,
      onlineOption: course.onlineOption,
      partTimeOption: course.partTimeOption,
      sandwichYearOption: course.sandwichYearOption,
      internationalEligibility: course.internationalEligibility,
      officialUrl: course.officialUrl || null,
      officialApplicationUrl: course.officialApplicationUrl || null,
      university: publicUniversityIsVerified ? course.university : {
        id: null,
        universityId: null,
        name: null,
        slug: null,
        city: null,
        country: null,
        verificationStatus: 'RESEARCH_REQUIRED',
      },
      intakes: course.intakeFees || [],
      requirements: primaryReq || null,
      allRequirements: course.requirements || [],
      scholarships: course.scholarshipRecords || [],
      similarCourses: similarCourses.map((s) => ({
        ...s,
        tuitionFee: s.intakeFees?.[0]?.yearlyTuition > 0 ? s.intakeFees[0].yearlyTuition : null,
        currency: s.intakeFees?.[0]?.yearlyTuition > 0 ? s.intakeFees[0].tuitionCurrency || null : null,
      })),
      sourceUrl: course.sourceUrl || course.officialUrl || null,
      lastVerifiedAt: course.lastVerifiedAt || null,
      verificationStatus: course.verificationStatus,
      status: course.status,
      publicationStatus: course.publicationStatus,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };

    // Partners are NOT given commission rows: CrmCommission has no partner
    // ownership column, so no row can be proven to belong to the requesting partner.
    if (isPrivileged) {
      result.commissions = course.commissions || [];
    }

    return NextResponse.json({ success: true, data: stripInternalFields(result) });
  } catch (error: any) {
    console.error('[api/courses/[slug]] error', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch course details' },
      { status: 500 }
    );
  }
}
