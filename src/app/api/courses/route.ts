import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_COURSE_FIELDS = {
  slug: true,
  name: true,
  countrySlug: true,
  city: true,
  campus: true,
  level: true,
  subject: true,
  discipline: true,
  studyArea: true,
  deliveryMode: true,
  degreeType: true,
  duration: true,
  intake: true,
  tuition: true,
  tuitionCurrency: true,
  applicationFee: true,
  deposit: true,
  scholarshipAvailable: true,
  englishRequirement: true,
  academicRequirement: true,
  gpaRequirement: true,
  backlogPolicy: true,
  workExperience: true,
  portfolioRequired: true,
  interviewRequired: true,
  moiAccepted: true,
  overview: true,
  internship: true,
  placement: true,
  coop: true,
  visaNotes: true,
  deadline: true,
  matchScore: true,
  metaTitle: true,
  metaDescription: true,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const university = searchParams.get('university');
    const level = searchParams.get('level');
    const subject = searchParams.get('subject');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = { approvalStatus: 'PUBLISHED' };

    if (country) {
      where.countrySlug = country;
    }
    if (university) {
      where.universitySlug = university;
    }
    if (level) {
      where.level = level;
    }
    if (subject) {
      where.subject = subject;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { subject: { contains: search } },
        { discipline: { contains: search } },
      ];
    }

    const [courses, total] = await Promise.all([
      db.coursePage.findMany({
        where,
        select: {
          ...PUBLIC_COURSE_FIELDS,
          universitySlug: true,
          university: {
            select: {
              name: true,
              slug: true,
              city: true,
              logo: true,
              countrySlug: true,
            },
          },
        },
        orderBy: { matchScore: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
      }),
      db.coursePage.count({ where }),
    ]);

    return NextResponse.json(
      { courses, total },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Courses API error:', error);
    return NextResponse.json(
      { error: 'Failed to load courses' },
      { status: 500 }
    );
  }
}
