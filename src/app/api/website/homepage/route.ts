import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getPublicMetrics } from '@/lib/verified-metrics';

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
      metrics,
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
      // Centralized verified-metrics service (Part 13) — governed rows win,
      // live DB aggregates fill the rest. Never hardcoded.
      getPublicMetrics(),
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

    // Stats come from the centralized verified-metrics service so every
    // public surface shares one governed source (Part 13).
    const stats = {
      totalUniversities: metrics.metrics['universities.total']?.value ?? 0,
      totalCourses: metrics.metrics['courses.total']?.value ?? 0,
      totalScholarships: metrics.metrics['scholarships.total']?.value ?? 0,
      countryCounts: metrics.countryCounts,
      metricStatus: {
        universities: metrics.metrics['universities.total']?.status ?? 'UNVERIFIED',
        courses: metrics.metrics['courses.total']?.status ?? 'UNVERIFIED',
        scholarships: metrics.metrics['scholarships.total']?.status ?? 'UNVERIFIED',
      },
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
