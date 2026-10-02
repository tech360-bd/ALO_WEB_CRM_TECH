// @ts-nocheck
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================
// UNIVERSITY DETAIL + COURSE DETAIL API (by slug)
// Brand: ALO Education — Blue #0B5ED7, Orange #F97316
// ============================================================

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    // --- Try CrmUniversity first ---
    let university = await db.crmUniversity.findFirst({
      where: {
        OR: [
          { slug },
          { universityId: slug },
          { name: { contains: slug.replace(/-/g, ' ') } },
        ],
      },
      include: {
        courses: {
          where: { status: 'active' },
          take: 50,
          include: {
            intakeFees: true,
            requirements: true,
          },
        },
      },
    });

    if (university) {
      // Fetch related universities (same country, different university)
      const relatedUniversities = await db.crmUniversity.findMany({
        where: {
          country: university.country,
          id: { not: university.id },
        },
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
        university,
        courses: university.courses,
        relatedUniversities,
      });
    }

    // --- Try CrmCourse ---
    let course = await db.crmCourse.findFirst({
      where: {
        OR: [
          { slug },
          { courseId: slug },
          { courseTitle: { contains: slug.replace(/-/g, ' ') } },
        ],
      },
      include: {
        university: true,
        intakeFees: true,
        requirements: true,
        scholarshipRecords: true,
      },
    });

    if (course) {
      // Fetch related courses (same subject area or same university)
      const relatedCourses = await db.crmCourse.findMany({
        where: {
          OR: [
            { subjectArea: course.subjectArea },
            { universityId: course.universityId },
          ],
          id: { not: course.id },
          status: 'active',
        },
        include: {
          university: {
            select: {
              id: true,
              universityId: true,
              name: true,
              slug: true,
              city: true,
              country: true,
              ranking: true,
            },
          },
          intakeFees: true,
        },
        take: 4,
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({
        type: 'course',
        course,
        university: course.university || null,
        relatedCourses,
      });
    }

    // --- Neither found ---
    return NextResponse.json(
      { error: 'Not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Slug detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch details' },
      { status: 500 }
    );
  }
}
