import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Public single-country API — no auth required.
 *
 * Returns the public projection of a single Country matched by slug.
 * Returns 404 if the slug does not exist or status !== 'active'.
 *
 * Also returns derived counters (courseCount, universityCount from DB rows,
 * scholarshipCount) so a client can render "X universities, Y courses" without
 * a second round-trip.
 *
 * NOTE: SQLite (the dev DB) does not support Prisma's `mode: 'insensitive'`
 * option, so country matching on University.country is done with an exact
 * string compare against the country name + slug (case-sensitive). The slug
 * from the URL is always lowercase, so we additionally try a case-folded
 * JS-side match for the country name.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const country = await db.country.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        flagEmoji: true,
        description: true,
        whyStudy: true,
        costOfLiving: true,
        visaInfo: true,
        workRights: true,
        postStudyWork: true,
        popular: true,
        universityCount: true,
        avgTuition: true,
        language: true,
        currency: true,
        bannerUrl: true,
        status: true,
        updatedAt: true,
      },
    });

    if (!country || country.status !== 'active') {
      return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    // Match University.country by either slug or human-readable name. Since
    // the DB stores country names like "UK", "Canada", "Australia" (mixed
    // case) and SQLite is case-sensitive, we try several variants.
    const countryVariants = Array.from(
      new Set([
        country.slug,
        country.name,
        country.slug.toLowerCase(),
        country.slug.toUpperCase(),
        country.name.toLowerCase(),
        country.name.toUpperCase(),
      ])
    );

    // Filter out empty strings
    const validVariants = countryVariants.filter((v) => Boolean(v));

    const uniWhere = {
      OR: validVariants.map((v) => ({ country: { equals: v } })),
    };

    const courseWhere = {
      university: uniWhere,
    };

    const scholarshipWhere = {
      OR: validVariants.map((v) => ({ country: { equals: v } })),
    };

    const [uniByAny, courseCount, scholarshipCount] = await Promise.all([
      db.university.count({ where: uniWhere }),
      db.course.count({ where: courseWhere }),
      db.scholarship.count({ where: scholarshipWhere }),
    ]);
    const liveUniversityCount = uniByAny;

    return NextResponse.json({
      country,
      counts: {
        universities: Math.max(country.universityCount || 0, liveUniversityCount),
        courses: courseCount,
        scholarships: scholarshipCount,
      },
    });
  } catch (error) {
    console.error('public/countries/[slug] GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
