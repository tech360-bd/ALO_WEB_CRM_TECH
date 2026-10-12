import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const country = await db.countryPage.findFirst({
      where: { slug, approvalStatus: 'PUBLISHED' },
      select: {
        slug: true,
        name: true,
        shortName: true,
        flag: true,
        capital: true,
        currency: true,
        intro: true,
        quickFacts: true,
        whyStudy: true,
        scholarships: true,
        cities: true,
        faqs: true,
        universities: {
          where: { approvalStatus: 'PUBLISHED' },
          select: {
            slug: true,
            name: true,
            city: true,
            ranking: true,
            tuitionRange: true,
            logo: true,
            campusImage: true,
            scholarshipAvailable: true,
            countrySlug: true,
            _count: { select: { courses: { where: { approvalStatus: 'PUBLISHED' } } } },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!country) {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    // Get courses for all universities in this country
    const courses = await db.coursePage.findMany({
      where: { countrySlug: slug, approvalStatus: 'PUBLISHED' },
      select: {
        slug: true,
        name: true,
        universitySlug: true,
        city: true,
        level: true,
        subject: true,
        duration: true,
        tuition: true,
        tuitionCurrency: true,
        englishRequirement: true,
        scholarship: true,
        scholarshipAvailable: true,
      },
      orderBy: { name: 'asc' },
    });

    // Get scholarships for this country
    const scholarships = await db.scholarship.findMany({
      where: { countrySlug: slug, status: 'OPEN' },
      select: {
        slug: true,
        name: true,
        universitySlug: true,
        amount: true,
        currency: true,
        eligibility: true,
        deadline: true,
        fundingType: true,
      },
      orderBy: { name: 'asc' },
    });

    // Get university names for lookup
    const uniNames = new Map(country.universities.map(u => [u.slug, u.name]));

    return NextResponse.json(
      {
        country: {
          ...country,
          universities: country.universities.map(u => ({
            slug: u.slug,
            name: u.name,
            city: u.city,
            ranking: u.ranking,
            tuitionRange: u.tuitionRange,
            logo: u.logo,
            campusImage: u.campusImage,
            scholarshipAvailable: u.scholarshipAvailable,
          })),
          courses: courses.map(c => ({
            slug: c.slug,
            name: c.name,
            universitySlug: c.universitySlug,
            universityName: uniNames.get(c.universitySlug) || '',
            city: c.city,
            level: c.level,
            subject: c.subject,
            duration: c.duration,
            tuition: c.tuition,
            tuitionCurrency: c.tuitionCurrency,
            englishRequirement: c.englishRequirement,
            scholarship: c.scholarship,
            scholarshipAvailable: c.scholarshipAvailable,
          })),
          scholarships: scholarships.map(s => ({
            slug: s.slug,
            name: s.name,
            universityName: s.universitySlug ? uniNames.get(s.universitySlug) : undefined,
            amount: s.amount,
            currency: s.currency,
            eligibility: s.eligibility,
            deadline: s.deadline,
            fundingType: s.fundingType,
          })),
          stats: {
            universities: country.universities.length,
            courses: courses.length,
            scholarships: scholarships.length,
            avgTuition: country.quickFacts ? (JSON.parse(country.quickFacts).tuitionRange || '') : '',
            popularIntakes: ['September', 'January'],
            englishReq: country.quickFacts ? (JSON.parse(country.quickFacts).englishTests || '') : '',
          },
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      }
    );
  } catch (error) {
    console.error('Country detail API error:', error);
    return NextResponse.json(
      { error: 'Failed to load country' },
      { status: 500 }
    );
  }
}
