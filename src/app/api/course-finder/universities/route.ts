import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const PAGE_SIZE_DEFAULT = 12;
const MAX_PAGE_SIZE = 100;

function parseBoundedInteger(value: string | null, fallback: number, min: number, max: number): number {
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const countries = searchParams.get('countries') || '';
    const cities = searchParams.get('cities') || '';
    const institutionType = searchParams.get('institutionType') || '';
    const rankingProvider = searchParams.get('rankingProvider') || '';
    const rankingMin = searchParams.get('rankingMin');
    const rankingMax = searchParams.get('rankingMax');
    const tuitionMin = searchParams.get('tuitionMin');
    const tuitionMax = searchParams.get('tuitionMax');
    const scholarship = searchParams.get('scholarship') || '';
    const featured = searchParams.get('featured') || '';
    const isPartner = searchParams.get('isPartner') || '';
    const sort = searchParams.get('sort') || 'name';
    const page = parseBoundedInteger(searchParams.get('page'), 1, 1, 1_000_000);
    const limit = parseBoundedInteger(searchParams.get('limit'), PAGE_SIZE_DEFAULT, 1, MAX_PAGE_SIZE);
    const skip = (page - 1) * limit;

    // The canonical CrmUniversity schema has no partner-only flag; do not
    // silently pretend that a partner filter was applied.
    if (isPartner === 'true' || isPartner === '1') {
      return NextResponse.json(
        { success: false, error: 'Partner-only filtering is not represented by the current university data model' },
        { status: 400 },
      );
    }

    const andConditions: Record<string, unknown>[] = [];
    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search } },
          { city: { contains: search } },
          { country: { contains: search } },
        ],
      });
    }

    const countryList = countries.split(',').map(value => value.trim()).filter(Boolean);
    if (countryList.length) andConditions.push({ country: { in: countryList } });

    const cityList = cities.split(',').map(value => value.trim()).filter(Boolean);
    if (cityList.length) andConditions.push({ city: { in: cityList } });

    if (institutionType) andConditions.push({ type: institutionType });
    if (rankingProvider) andConditions.push({ rankingProvider });

    const minRank = rankingMin ? Number(rankingMin) : null;
    const maxRank = rankingMax ? Number(rankingMax) : null;
    if (minRank !== null && Number.isFinite(minRank)) andConditions.push({ worldRanking: { gte: minRank } });
    if (maxRank !== null && Number.isFinite(maxRank)) andConditions.push({ worldRanking: { lte: maxRank } });
    if (scholarship === 'true' || scholarship === '1') andConditions.push({ scholarships: true });
    if (featured === 'true' || featured === '1') andConditions.push({ featured: true });

    const tuitionLower = tuitionMin ? Number(tuitionMin) : null;
    const tuitionUpper = tuitionMax ? Number(tuitionMax) : null;
    if ((tuitionLower !== null && Number.isFinite(tuitionLower)) || (tuitionUpper !== null && Number.isFinite(tuitionUpper))) {
      const tuitionFilter: Record<string, number> = {};
      if (tuitionLower !== null && Number.isFinite(tuitionLower)) tuitionFilter.gte = tuitionLower;
      if (tuitionUpper !== null && Number.isFinite(tuitionUpper)) tuitionFilter.lte = tuitionUpper;
      const matchingCourses = await db.crmCourse.findMany({
        where: {
          status: 'active',
          verificationStatus: 'VERIFIED',
          publicationStatus: { in: ['published', 'PUBLISHED'] },
          tuitionFee: tuitionFilter,
        },
        select: { universityId: true },
        distinct: ['universityId'],
      });
      andConditions.push({ universityId: { in: matchingCourses.map(course => course.universityId) } });
    }

    const where = {
      status: 'active',
      verificationStatus: 'VERIFIED',
      publicationStatus: { in: ['published', 'PUBLISHED'] },
      ...(andConditions.length ? { AND: andConditions } : {}),
    };

    const orderBy = sort === 'ranking'
      ? { worldRanking: 'asc' as const }
      : sort === 'recently_verified'
        ? { lastVerifiedAt: 'desc' as const }
        : sort === 'courses_count'
          ? { courses: { _count: 'desc' as const } }
          : { name: 'asc' as const };

    const [total, universities] = await Promise.all([
      db.crmUniversity.count({ where }),
      db.crmUniversity.findMany({
        where,
        select: {
          id: true,
          universityId: true,
          universityCode: true,
          name: true,
          slug: true,
          country: true,
          city: true,
          type: true,
          founded: true,
          website: true,
          logo: true,
          worldRanking: true,
          ranking: true,
          rankingProvider: true,
          rankingYear: true,
          featured: true,
          scholarships: true,
          verificationStatus: true,
          lastVerifiedAt: true,
          _count: {
            select: {
              courses: {
                where: {
                  status: 'active',
                  verificationStatus: 'VERIFIED',
                  publicationStatus: { in: ['published', 'PUBLISHED'] },
                },
              },
            },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    return NextResponse.json({
      success: true,
      universities,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    });
  } catch (error) {
    console.error('University directory API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch universities' },
      { status: 500 },
    );
  }
}
