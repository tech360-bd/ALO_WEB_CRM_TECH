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
      return NextResponse.json({ success: false, error: 'University slug required' }, { status: 400 });
    }

    const cleanSlug = slug.trim();

    const university = await db.crmUniversity.findFirst({
      where: {
        OR: [
          { slug: cleanSlug },
          { universityId: cleanSlug },
          { id: cleanSlug },
          { name: { contains: cleanSlug.replace(/-/g, ' ') } },
        ],
      },
      include: {
        rankingRecords: {
          orderBy: { rankingYear: 'desc' },
        },
        scholarshipRecords: {
          where: { status: 'active' },
          take: 10,
        },
        courses: {
          take: 20,
          include: {
            intakeFees: {
              take: 2,
              orderBy: { intakeYear: 'asc' },
            },
            requirements: {
              take: 1,
            },
          },
        },
        _count: {
          select: {
            courses: true,
            scholarshipRecords: true,
          },
        },
      },
    });

    if (!university) {
      return NextResponse.json({ success: false, error: 'University not found' }, { status: 404 });
    }

    const auth = await getOptionalAuth(request);
    const roles = auth?.roles || [];
    const isPrivileged = roles.some((r) =>
      ['SUPER_ADMIN', 'ADMIN', 'COUNSELOR', 'STAFF', 'APPLICATION_OFFICER', 'super_admin', 'admin', 'counselor'].includes(r)
    );

    let parsedCampuses: string[] = [];
    try {
      if (university.campuses) {
        parsedCampuses = JSON.parse(university.campuses);
      }
    } catch {
      parsedCampuses = university.campusName ? [university.campusName] : ['Main Campus'];
    }

    const output: any = {
      id: university.id,
      universityId: university.universityId,
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
      popularCourses: university.courses.map((c) => ({
        id: c.id,
        courseId: c.courseId,
        courseTitle: c.courseTitle,
        slug: c.slug || c.courseId.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        studyLevel: c.studyLevel,
        subjectArea: c.subjectArea,
        durationMonths: c.durationMonths,
        qualification: c.qualification,
        tuitionFee: c.intakeFees?.[0]?.yearlyTuition || 0,
        currency: c.intakeFees?.[0]?.tuitionCurrency || 'GBP',
        intakes: c.intakeFees || [],
        requirements: c.requirements?.[0] || null,
      })),
      createdAt: university.createdAt,
      updatedAt: university.updatedAt,
    };

    if (isPrivileged) {
      output.sourceUrl = university.sourceUrl;
      output.lastVerifiedAt = university.lastVerifiedAt;
      output.verificationStatus = university.verificationStatus;
      output.status = university.status;
      output.publicationStatus = university.publicationStatus;
    }

    return NextResponse.json({ success: true, data: output });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch university details' },
      { status: 500 }
    );
  }
}
