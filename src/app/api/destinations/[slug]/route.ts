// ============================================================
// /api/destinations/[slug]
// GET — Public dynamic destination country API
// Returns verified country data, quick facts, entry reqs, visa steps,
// linked courses, linked universities, scholarships, sources & FAQs
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { COUNTRY_DESTINATIONS } from '@/lib/country-destinations-data';
import {
  publicCoursesInCountryWhere,
  publicScholarshipsInCountryWhere,
  publicUniversitiesInCountryWhere,
  stripInternalFields,
} from '@/lib/public-catalog';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const normalizedSlug = slug.toLowerCase().trim();

    const dbCountry = await db.country.findFirst({
      where: {
        OR: [
          { slug: normalizedSlug },
          { code: normalizedSlug.toUpperCase() },
          { countryCode: normalizedSlug.toUpperCase() },
        ],
      },
      include: {
        quickFacts: true,
        cities: true,
        pathways: true,
        reasons: true,
        entryReqs: true,
        englishTests: true,
        visaSteps: { orderBy: { stepNumber: 'asc' } },
        workRightRules: true,
        faqs: { orderBy: { sortOrder: 'asc' } },
        sources: true,
      },
    });

    // Never fall back to another country's data (e.g. UK rules for an unknown slug).
    const staticData = COUNTRY_DESTINATIONS[normalizedSlug] ?? null;
    if (!dbCountry && !staticData) {
      return NextResponse.json({ success: false, error: 'Destination not found' }, { status: 404 });
    }
    const countryName = staticData?.name || dbCountry?.name || '';
    const countryCode = staticData?.code || dbCountry?.code || dbCountry?.countryCode || countryName;

    // Linked records follow the canonical public catalogue rules
    // (published + verified + source-linked, internal fields stripped).
    const [linkedCourses, linkedUniversities, linkedScholarships] = await Promise.all([
      db.crmCourse.findMany({
        where: publicCoursesInCountryWhere(countryName, countryCode),
        take: 12,
        orderBy: { createdAt: 'desc' },
      }),
      db.crmUniversity.findMany({
        take: 8,
        where: publicUniversitiesInCountryWhere(countryName, countryCode),
        orderBy: { name: 'asc' },
      }),
      db.crmScholarship.findMany({
        where: publicScholarshipsInCountryWhere(countryName, countryCode),
        take: 6,
      }),
    ]);

    const result = {
      country: dbCountry || staticData,
      staticFallback: staticData,
      linkedCourses: stripInternalFields(linkedCourses),
      linkedUniversities: stripInternalFields(linkedUniversities),
      linkedScholarships: stripInternalFields(linkedScholarships),
      isDbMatched: !!dbCountry,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[api/destinations] lookup failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ success: false, error: 'Destination data is temporarily unavailable' }, { status: 500 });
  }
}
