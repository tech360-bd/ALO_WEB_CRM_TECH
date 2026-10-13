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
  metaTitle: true,
  metaDescription: true,
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const scholarship = await db.scholarship.findUnique({
      where: { slug },
      select: PUBLIC_SCHOLARSHIP_FIELDS,
    });

    if (!scholarship || scholarship.status !== 'OPEN') {
      return NextResponse.json({ error: 'Scholarship not found' }, { status: 404 });
    }

    // Fetch related university and course info
    const [universityInfo, courseInfo, countryInfo] = await Promise.all([
      scholarship.universitySlug
        ? db.universityPage.findUnique({
            where: { slug: scholarship.universitySlug, approvalStatus: 'PUBLISHED' },
            select: {
              name: true,
              slug: true,
              logo: true,
              city: true,
              countrySlug: true,
            },
          })
        : null,
      scholarship.courseSlug
        ? db.coursePage.findUnique({
            where: { slug: scholarship.courseSlug, approvalStatus: 'PUBLISHED' },
            select: { name: true, slug: true, level: true, subject: true },
          })
        : null,
      scholarship.countrySlug
        ? db.countryPage.findUnique({
            where: { slug: scholarship.countrySlug, approvalStatus: 'PUBLISHED' },
            select: { name: true, shortName: true, flag: true, slug: true },
          })
        : null,
    ]);

    const safeScholarship = {
      ...scholarship,
      universityName: universityInfo?.name ?? null,
      universityInfo: universityInfo ?? null,
      courseInfo: courseInfo ?? null,
      countryInfo: countryInfo ?? null,
    };

    return NextResponse.json(
      { scholarship: safeScholarship },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Scholarship detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to load scholarship' },
      { status: 500 }
    );
  }
}
