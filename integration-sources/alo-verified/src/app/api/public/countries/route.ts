import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Public Countries API — no auth required.
 *
 * Returns ONLY public-safe country fields. The Country model only contains
 * public information, but we project explicitly so internal fields can never
 * leak if the model grows later.
 *
 * Supports:
 *   ?status=active            (default: active)
 *   ?popular=true             (only popular destinations)
 *   ?limit=50                 (pagination size, max 100)
 *   ?page=1                   (pagination page)
 *
 * Response shape:
 *   { countries: [...], pagination: { page, limit, total, totalPages } }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limitParam = parseInt(searchParams.get('limit') || '50', 10) || 50;
    const limit = Math.min(100, Math.max(1, limitParam));
    const popular = searchParams.get('popular');
    const status = searchParams.get('status') || 'active';

    const where: Record<string, unknown> = { status };
    if (popular === 'true') where.popular = true;

    const skip = (page - 1) * limit;

    const [countries, total] = await Promise.all([
      db.country.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ popular: 'desc' }, { name: 'asc' }],
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
      }),
      db.country.count({ where }),
    ]);

    return NextResponse.json({
      countries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('public/countries GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
