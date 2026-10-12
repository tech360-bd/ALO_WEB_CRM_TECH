import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_SCHOLARSHIP_FIELDS = {
  scholarshipCode: true,
  name: true,
  slug: true,
  countrySlug: true,
  universitySlug: true,
  courseSlug: true,
  studyLevel: true,
  subject: true,
  amount: true,
  currency: true,
  fundingType: true,
  eligibility: true,
  minimumRequirements: true,
  coverage: true,
  openingDate: true,
  deadline: true,
  decisionDate: true,
  documentsRequired: true,
  applicationMethod: true,
  applicationUrl: true,
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');
    const university = searchParams.get('university');

    const where: Record<string, unknown> = { status: 'OPEN' };

    if (country) {
      where.countrySlug = country;
    }
    if (university) {
      where.universitySlug = university;
    }

    const [scholarships, total] = await Promise.all([
      db.scholarship.findMany({
        where,
        select: PUBLIC_SCHOLARSHIP_FIELDS,
        orderBy: { name: 'asc' },
      }),
      db.scholarship.count({ where }),
    ]);

    // Enrich with university names
    const universitySlugs = [...new Set(scholarships.map((s) => s.universitySlug).filter(Boolean))] as string[];
    const universities = universitySlugs.length > 0
      ? await db.universityPage.findMany({
          where: { slug: { in: universitySlugs } },
          select: { slug: true, name: true },
        })
      : [];
    const uniMap = new Map(universities.map((u) => [u.slug, u.name]));

    const safeScholarships = scholarships.map((s) => ({
      ...s,
      universityName: s.universitySlug ? uniMap.get(s.universitySlug) ?? null : null,
    }));

    return NextResponse.json(
      { scholarships: safeScholarships, total },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Scholarships API error:', error);
    return NextResponse.json(
      { error: 'Failed to load scholarships' },
      { status: 500 }
    );
  }
}
