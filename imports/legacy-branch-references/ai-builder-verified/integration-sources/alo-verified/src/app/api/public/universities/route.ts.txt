import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Public Universities API — no auth required.
 *
 * Returns ONLY public-safe university fields. Excludes any internal notes,
 * partner / commission data (none currently on the model, but we project
 * explicitly).
 *
 * Supports:
 *   ?country=<slug-or-name>      (filter by country — matches either slug or
 *                                human-readable country name, case-insensitive)
 *   ?search=<text>               (name / city / country contains)
 *   ?scholarshipAvailable=true   (only universities flagged as having
 *                                 scholarship opportunities)
 *   ?limit=20                    (pagination size, max 50)
 *   ?page=1                      (pagination page)
 *
 * Response shape:
 *   {
 *     universities: [...],
 *     pagination: { page, limit, total, totalPages }
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limitParam = parseInt(searchParams.get('limit') || '20', 10) || 20;
    const limit = Math.min(50, Math.max(1, limitParam));
    const search = searchParams.get('search')?.trim() || '';
    const country = searchParams.get('country')?.trim() || '';
    const scholarshipAvailable = searchParams.get('scholarshipAvailable');

    // To match by country we need to look up the country record (since
    // University.country holds a name like "UK" or "Canada", but the API
    // caller supplies a slug like "uk" or "canada"). We try several case
    // variants because SQLite (dev DB) does not support Prisma's
    // `mode: 'insensitive'` option.
    let countryNames: string[] = [];
    if (country) {
      const matched = await db.country.findFirst({
        where: {
          OR: [
            { slug: { equals: country } },
            { name: { equals: country } },
            { slug: { equals: country.toLowerCase() } },
            { slug: { equals: country.toUpperCase() } },
            { name: { equals: country.toLowerCase() } },
            { name: { equals: country.toUpperCase() } },
          ],
        },
        select: { name: true, slug: true },
      });
      if (matched) {
        countryNames = Array.from(
          new Set([
            matched.name,
            matched.slug,
            matched.name.toLowerCase(),
            matched.name.toUpperCase(),
            matched.slug.toLowerCase(),
            matched.slug.toUpperCase(),
          ])
        ).filter(Boolean);
      } else {
        // fall back to the raw query string + variants — covers legacy
        // seeded data where University.country might be a slug
        countryNames = Array.from(
          new Set([country, country.toLowerCase(), country.toUpperCase()])
        );
      }
    }

    // SQLite is case-sensitive — since we pre-compute several case
    // variants above, we can use plain `equals` (no `mode`) here.
    const where: Record<string, unknown> = { status: 'active' };
    if (countryNames.length > 0) {
      where.OR = countryNames.map((c) => ({ country: { equals: c } }));
    }
    if (search) {
      // Case-insensitive search: build variants for the search term too so
      // SQLite matches both lowercase and uppercase inputs.
      const searchVariants = Array.from(
        new Set([search, search.toLowerCase(), search.toUpperCase()])
      );
      const searchClause = {
        OR: searchVariants.flatMap((s) => [
          { name: { contains: s } },
          { city: { contains: s } },
          { country: { contains: s } },
        ]),
      };
      if (where.OR) {
        // Need both country filter AND search filter
        const countryClause = where.OR;
        delete where.OR;
        where.AND = [{ OR: countryClause }, searchClause];
      } else {
        Object.assign(where, searchClause);
      }
    }
    if (scholarshipAvailable === 'true') where.scholarshipAvailable = true;

    const skip = (page - 1) * limit;

    const [universities, total] = await Promise.all([
      db.university.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ ranking: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          country: true,
          city: true,
          website: true,
          logoUrl: true,
          bannerUrl: true,
          ranking: true,
          type: true,
          description: true,
          facilities: true,
          fees: true,
          scholarshipAvailable: true,
          status: true,
        },
      }),
      db.university.count({ where }),
    ]);

    return NextResponse.json({
      universities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('public/universities GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
