import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_UNIVERSITY_FIELDS = {
  slug: true,
  name: true,
  countrySlug: true,
  city: true,
  state: true,
  address: true,
  ranking: true,
  studentsCount: true,
  accommodation: true,
  popularSubjects: true,
  logo: true,
  campusImage: true,
  overview: true,
  internationalInfo: true,
  whyChoose: true,
  studentSupport: true,
  studentLife: true,
  careerInfo: true,
  applicationProcess: true,
  strengths: true,
  quickFacts: true,
  tuition: true,
  tuitionRange: true,
  scholarshipAvailable: true,
  applicationFee: true,
  depositInfo: true,
  requiredDocuments: true,
  importantDeadlines: true,
  officialWebsite: true,
  internationalUrl: true,
  applicationUrl: true,
  scholarshipUrl: true,
  contactEmail: true,
  metaTitle: true,
  metaDescription: true,
  approvalStatus: true,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const where: Record<string, unknown> = { approvalStatus: 'PUBLISHED' };

    if (country) {
      where.countrySlug = country;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { city: { contains: search } },
      ];
    }

    const [universities, total] = await Promise.all([
      db.universityPage.findMany({
        where,
        select: {
          ...PUBLIC_UNIVERSITY_FIELDS,
          country: {
            select: { name: true, shortName: true, flag: true, slug: true },
          },
          _count: {
            select: { courses: { where: { approvalStatus: 'PUBLISHED' } } },
          },
        },
        orderBy: { name: 'asc' },
        take: Math.min(limit, 100),
        skip: offset,
      }),
      db.universityPage.count({ where }),
    ]);

    const safeUniversities = universities.map((u) => ({
      ...u,
      courseCount: u._count.courses,
      _count: undefined,
    }));

    return NextResponse.json(
      { universities: safeUniversities, total },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Universities API error:', error);
    return NextResponse.json(
      { error: 'Failed to load universities' },
      { status: 500 }
    );
  }
}
