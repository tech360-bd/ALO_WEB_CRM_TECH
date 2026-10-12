import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  publicCourseIdentifierWhere,
  publicCourseWhere,
  publicIntakeWhere,
  publicRequirementWhere,
  publicUniversityIdentifierWhere,
  publicUniversityWhere,
  stripInternalFields,
} from '@/lib/public-catalog';

// ============================================================
// PUBLIC UNIVERSITY / COURSE DETAIL API (by identifier)
//
// Exact matches on slug / universityId / courseId / id only.
// Only published, VERIFIED, source-linked records are returned, and internal
// fields (notes, commissions, contact data) are stripped from every object.
// ============================================================

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;

    const universityWhere = publicUniversityIdentifierWhere(slug);
    if (!universityWhere) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const university = await db.crmUniversity.findFirst({
      where: universityWhere as any,
      include: {
        courses: {
          where: publicCourseWhere() as any,
          take: 50,
          include: {
            intakeFees: { where: publicIntakeWhere() as any, take: 10 },
            requirements: { where: publicRequirementWhere() as any, take: 5 },
          },
        },
      },
    });

    if (university) {
      const relatedUniversities = await db.crmUniversity.findMany({
        where: {
          AND: [publicUniversityWhere(), { country: university.country }, { id: { not: university.id } }],
        } as any,
        select: {
          id: true,
          universityId: true,
          name: true,
          slug: true,
          city: true,
          country: true,
          worldRanking: true,
          ranking: true,
          featured: true,
          scholarships: true,
        },
        take: 4,
        orderBy: { ranking: 'asc' },
      });

      return NextResponse.json({
        type: 'university',
        university: stripInternalFields(university as any),
        courses: (university.courses as any[]).map((c) => stripInternalFields(c)),
        relatedUniversities,
      });
    }

    const courseWhere = publicCourseIdentifierWhere(slug);
    const course = courseWhere
      ? await db.crmCourse.findFirst({
          where: courseWhere as any,
          include: {
            university: true,
            intakeFees: { where: publicIntakeWhere() as any },
            requirements: { where: publicRequirementWhere() as any },
            scholarshipRecords: { where: { status: 'active', verificationStatus: { in: ['VERIFIED', 'verified'] } } },
          },
        })
      : null;

    if (course) {
      const relatedCourses = await db.crmCourse.findMany({
        where: {
          AND: [
            publicCourseWhere(),
            { id: { not: course.id } },
            { OR: [{ subjectArea: course.subjectArea }, { universityId: course.universityId }] },
          ],
        } as any,
        include: {
          university: {
            select: { id: true, universityId: true, name: true, slug: true, city: true, country: true, ranking: true },
          },
          intakeFees: { where: publicIntakeWhere() as any, take: 1 },
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        type: 'course',
        course: stripInternalFields(course as any),
        university: course.university ? stripInternalFields(course.university as any) : null,
        relatedCourses: (relatedCourses as any[]).map((c) => stripInternalFields(c)),
      });
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error('[api/course-finder/[slug]] error', error);
    return NextResponse.json({ error: 'Failed to fetch details' }, { status: 500 });
  }
}
