import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Public Courses API — no auth required.
 *
 * Returns ONLY public-safe course fields joined with the parent university's
 * public fields. No internal notes, no application counts, no commission data.
 *
 * Supports:
 *   ?country=<slug-or-name>      (filter by country — matches either slug or
 *                                human-readable country name. SQLite is
 *                                case-sensitive so we pre-compute case variants)
 *   ?universityId=<id>           (filter by university id)
 *   ?level=<level>               (foundation, undergraduate, postgraduate, phd,
 *                                 diploma)
 *   ?field=<text>                (course field contains)
 *   ?search=<text>               (course name / field contains)
 *   ?scholarshipAvailable=true
 *   ?limit=20                    (pagination size, max 50)
 *   ?page=1                      (pagination page)
 *
 * Response shape:
 *   {
 *     courses: [...],
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
    const universityId = searchParams.get('universityId')?.trim() || '';
    const level = searchParams.get('level')?.trim() || '';
    const field = searchParams.get('field')?.trim() || '';
    const scholarshipAvailable = searchParams.get('scholarshipAvailable');

    // Resolve country slug → list of name/slug case variants to match on
    // University.country. SQLite (dev DB) does not support Prisma's
    // `mode: 'insensitive'` option, so we pre-compute several case variants
    // and use plain `equals` queries below.
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
        countryNames = Array.from(
          new Set([country, country.toLowerCase(), country.toUpperCase()])
        );
      }
    }

    // Build the where clause using AND for all combining filters.
    const andClauses: Array<Record<string, unknown>> = [{ status: 'active' }];
    if (universityId) andClauses.push({ universityId });
    if (level) andClauses.push({ level });
    if (field) {
      const fieldVariants = Array.from(
        new Set([field, field.toLowerCase(), field.toUpperCase()])
      );
      andClauses.push({
        OR: fieldVariants.map((f) => ({ field: { contains: f } })),
      });
    }
    if (scholarshipAvailable === 'true') andClauses.push({ scholarshipAvailable: true });

    if (search) {
      const searchVariants = Array.from(
        new Set([search, search.toLowerCase(), search.toUpperCase()])
      );
      andClauses.push({
        OR: searchVariants.flatMap((s) => [
          { name: { contains: s } },
          { field: { contains: s } },
        ]),
      });
    }

    if (countryNames.length > 0) {
      andClauses.push({
        university: {
          OR: countryNames.map((c) => ({ country: { equals: c } })),
        },
      });
    }

    const where: Record<string, unknown> =
      andClauses.length === 1 ? andClauses[0] : { AND: andClauses };

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      db.course.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ name: 'asc' }],
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
          field: true,
          duration: true,
          tuitionFee: true,
          currency: true,
          entryRequirements: true,
          englishRequirement: true,
          scholarshipAvailable: true,
          description: true,
          careerPaths: true,
          university: {
            select: {
              id: true,
              name: true,
              slug: true,
              country: true,
              city: true,
              logoUrl: true,
              ranking: true,
            },
          },
        },
      }),
      db.course.count({ where }),
    ]);

    return NextResponse.json({
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('public/courses GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
