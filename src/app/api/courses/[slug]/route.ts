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
  scholarship: true,
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
  modules: true,
  careerOutcomes: true,
  internship: true,
  placement: true,
  coop: true,
  requiredDocuments: true,
  visaNotes: true,
  deadline: true,
  matchScore: true,
  approvalStatus: true,
  metaTitle: true,
  metaDescription: true,
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const course = await db.coursePage.findFirst({
      where: { slug, approvalStatus: 'PUBLISHED' },
      select: {
        ...PUBLIC_COURSE_FIELDS,
        universitySlug: true,
        university: {
          select: {
            name: true,
            slug: true,
            city: true,
            logo: true,
            campusImage: true,
            ranking: true,
            countrySlug: true,
            country: {
              select: { name: true, shortName: true, flag: true, slug: true },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    return NextResponse.json(
      { course },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Course detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to load course' },
      { status: 500 }
    );
  }
}
