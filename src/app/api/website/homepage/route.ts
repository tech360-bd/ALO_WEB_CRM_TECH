import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [
      countries,
      services,
      englishTests,
      successStories,
      teamMembers,
      faqs,
      sections,
      countryGroups,
    ] = await Promise.all([
      db.country.findMany({
        where: { status: 'active' },
        orderBy: { sortOrder: 'asc' },
      }),
      db.homeService.findMany({
        where: { status: 'active' },
        orderBy: { sortOrder: 'asc' },
      }),
      db.websiteEnglishTest.findMany({
        where: { status: 'active' },
        orderBy: { sortOrder: 'asc' },
      }),
      db.successStory.findMany({
        where: {
          status: 'approved',
          consentStatus: 'verified',
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.teamMember.findMany({
        where: { status: 'active' },
        orderBy: { sortOrder: 'asc' },
      }),
      db.homepageFaq.findMany({
        where: { status: 'active' },
        orderBy: { sortOrder: 'asc' },
      }),
      db.homeSection.findMany({
        where: { status: 'active' },
        orderBy: { sortOrder: 'asc' },
      }),
      db.country.groupBy({
        by: ['id'],
        _sum: {
          universityCount: true,
          courseCount: true,
          scholarshipCount: true,
        },
        where: { status: 'active' },
      }),
    ]);

    // Parse JSON fields in countries
    const parsedCountries = countries.map((c) => ({
      ...c,
      popularCities: JSON.parse(c.popularCities || '[]'),
      popularIntakes: JSON.parse(c.popularIntakes || '[]'),
      studyLevels: JSON.parse(c.studyLevels || '[]'),
    }));

    // Build hero slides from countries that have hero data
    const heroSlides = parsedCountries
      .filter((c) => c.heroImage && c.heroCity)
      .map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        flag: c.flag,
        accentColor: c.accentColor,
        heroImage: c.heroImage,
        heroCity: c.heroCity,
        heroIntake: c.heroIntake,
        heroSubtitle: c.heroSubtitle,
      }));

    // Aggregate stats from country groups
    const stats = {
      totalUniversities: countryGroups.reduce((sum, g) => sum + (_sumToNum(g._sum.universityCount)), 0),
      totalCourses: countryGroups.reduce((sum, g) => sum + (_sumToNum(g._sum.courseCount)), 0),
      totalScholarships: countryGroups.reduce((sum, g) => sum + (_sumToNum(g._sum.scholarshipCount)), 0),
      countryCounts: Object.fromEntries(
        countries.map((c) => [c.slug, { universityCount: c.universityCount, courseCount: c.courseCount, scholarshipCount: c.scholarshipCount }])
      ),
    };

    return NextResponse.json({
      success: true,
      countries: parsedCountries,
      heroSlides,
      services,
      englishTests,
      successStories,
      teamMembers,
      faqs,
      stats,
      sections,
      data: {
        countries: parsedCountries,
        heroSlides,
        services,
        englishTests,
        successStories,
        teamMembers,
        faqs,
        stats,
        sections,
      },
    });
  } catch (error) {
    console.error('Homepage data fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch homepage data' },
      { status: 500 }
    );
  }
}

/** Helper to safely convert a Prisma _sum field (number | null) to a number */
function _sumToNum(val: number | null): number {
  return val ?? 0;
}
