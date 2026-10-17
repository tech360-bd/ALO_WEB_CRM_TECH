import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Public Scholarships API — no auth required.
 *
 * Returns ONLY public-safe scholarship fields joined with the parent
 * university's public fields.
 *
 * Supports:
 *   ?country=<slug-or-name>      (filter by country — matches either slug or
 *                                human-readable country name, case-insensitive)
 *   ?universityId=<id>           (filter by university id)
 *   ?type=<type>                 (full, partial, merit, need_based)
 *   ?search=<text>               (name / description contains)
 *   ?limit=20                    (pagination size, max 50)
 *   ?page=1                      (pagination page)
 *
 * Response shape:
 *   {
 *     scholarships: [...],
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
    const type = searchParams.get('type')?.trim() || '';

    // Resolve country slug → list of name/slug case variants to match on
    // Scholarship.country. SQLite (dev DB) does not support Prisma's
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

    // Accept either 'active' or 'published' for backward compatibility.
    // Build the where clause using AND for all combining filters so that
    // status, search, and country filters all apply together (rather than
    // OR-combining them which would leak rows).
    const andClauses: Record<string, unknown>[] = [
      {
        OR: [{ status: 'active' }, { status: 'published' }],
      },
    ];
    if (universityId) andClauses.push({ universityId });
    if (type) andClauses.push({ type });
    if (search) {
      const searchVariants = Array.from(
        new Set([search, search.toLowerCase(), search.toUpperCase()])
      );
      andClauses.push({
        OR: searchVariants.flatMap((s) => [
          { name: { contains: s } },
          { description: { contains: s } },
        ]),
      });
    }
    if (countryNames.length > 0) {
      andClauses.push({
        OR: countryNames.map((c) => ({
          country: { equals: c },
        })),
      });
    }
    const where: Record<string, unknown> =
      andClauses.length === 1 ? andClauses[0] : { AND: andClauses };

    const skip = (page - 1) * limit;

    const [scholarships, total] = await Promise.all([
      db.scholarship.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ deadline: 'asc' }, { name: 'asc' }],
        select: {
          id: true,
          name: true,
          description: true,
          amount: true,
          eligibility: true,
          deadline: true,
          type: true,
          country: true,
          university: {
            select: {
              id: true,
              name: true,
              slug: true,
              country: true,
              city: true,
            },
          },
        },
      }),
      db.scholarship.count({ where }),
    ]);

    return NextResponse.json({
      scholarships,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('public/scholarships GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
