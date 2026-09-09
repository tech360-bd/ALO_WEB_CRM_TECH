// ============================================================
// /api/destinations/[slug]
// GET — Public dynamic destination country API
// Returns verified country data, quick facts, entry reqs, visa steps,
// linked courses, linked universities, scholarships, sources & FAQs
// ============================================================

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { COUNTRY_DESTINATIONS } from '@/lib/country-destinations-data';

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

    const staticData = COUNTRY_DESTINATIONS[normalizedSlug] || COUNTRY_DESTINATIONS['uk'];

    const [linkedCourses, linkedUniversities, linkedScholarships] = await Promise.all([
      db.crmCourse.findMany({
        take: 12,
        orderBy: { createdAt: 'desc' },
      }),
      db.crmUniversity.findMany({
        take: 8,
        where: {
          OR: [
            { country: { contains: staticData.name } },
            { country: { contains: staticData.code } },
          ],
        },
        orderBy: { name: 'asc' },
      }),
      db.crmScholarship.findMany({
        take: 6,
      }),
    ]);

    const result = {
      country: dbCountry || staticData,
      staticFallback: staticData,
      linkedCourses,
      linkedUniversities,
      linkedScholarships,
      isDbMatched: !!dbCountry,
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
