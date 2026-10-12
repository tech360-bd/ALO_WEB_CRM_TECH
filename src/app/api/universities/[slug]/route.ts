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
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const university = await db.universityPage.findFirst({
      where: { slug, approvalStatus: 'PUBLISHED' },
      select: {
        ...PUBLIC_UNIVERSITY_FIELDS,
        country: {
          select: { name: true, shortName: true, flag: true, slug: true, capital: true, currency: true },
        },
        courses: {
          where: { approvalStatus: 'PUBLISHED' },
          select: {
            slug: true,
            name: true,
            level: true,
            subject: true,
            duration: true,
            tuition: true,
            tuitionCurrency: true,
            intake: true,
            scholarshipAvailable: true,
            deliveryMode: true,
            degreeType: true,
          },
        },
      },
    });

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 });
    }

    return NextResponse.json(
      { university },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('University detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to load university' },
      { status: 500 }
    );
  }
}
