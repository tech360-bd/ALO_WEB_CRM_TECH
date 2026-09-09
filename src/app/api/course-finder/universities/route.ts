// @ts-nocheck
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// ============================================================
// UNIVERSITY DIRECTORY API
// Brand: ALO Education — Blue #0057B8, Orange #E8501A
// ============================================================

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const search = searchParams.get('search') || '';
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
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '12', 10) || 12));
    const skip = (page - 1) * limit;

    // Base WHERE: only verified universities
    const baseWhere = {
      verificationStatus: 'VERIFIED',
    };

    const andConditions = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search } },
          { officialName: { contains: search } },
          { city: { contains: search } },
          { country: { contains: search } },
        ],
      });
    }

    if (countries) {
      const countryList = countries.split(',').map(c => c.trim()).filter(Boolean);
      if (countryList.length > 0) {
        andConditions.push({ country: { in: countryList } });
      }
    }

    if (cities) {
      const cityList = cities.split(',').map(c => c.trim()).filter(Boolean);
      if (cityList.length > 0) {
        andConditions.push({ city: { in: cityList } });
      }
    }

    if (institutionType) {
      andConditions.push({ institutionType });
    }

    if (rankingProvider) {
      andConditions.push({ rankingProvider });
    }

    if (rankingMin !== null && rankingMin !== '') {
      andConditions.push({ rankingValue: { gte: parseInt(rankingMin, 10) } });
    }

    if (rankingMax !== null && rankingMax !== '') {
      andConditions.push({ rankingValue: { lte: parseInt(rankingMax, 10) } });
    }

    if (scholarship === 'true' || scholarship === '1') {
      andConditions.push({ scholarshipAvailable: true });
    }

    if (featured === 'true' || featured === '1') {
      andConditions.push({ featured: true });
    }

    if (isPartner === 'true' || isPartner === '1') {
      andConditions.push({ isPartner: true });
    }

    // If tuition filter, we need to filter by university IDs that have courses in the fee range
    let universityIdFilter: string[] | null = null;
    if (tuitionMin !== null && tuitionMin !== '' || tuitionMax !== null && tuitionMax !== '') {
      const courseFeeWhere: any = {
        approvalStatus: 'PUBLISHED',
        verificationStatus: 'VERIFIED',
      };
      if (tuitionMin !== null && tuitionMin !== '') {
        courseFeeWhere.tuitionFee = { ...(courseFeeWhere.tuitionFee || {}), gte: parseFloat(tuitionMin) };
      }
      if (tuitionMax !== null && tuitionMax !== '') {
        courseFeeWhere.tuitionFee = { ...(courseFeeWhere.tuitionFee || {}), lte: parseFloat(tuitionMax) };
      }
      const matchingCourses = await db.crmCourse.findMany({
        where: courseFeeWhere,
        select: { universityId: true },
        distinct: ['universityId'],
      });
      universityIdFilter = matchingCourses.map(c => c.universityId).filter(Boolean);
    }

    const where = {
      ...baseWhere,
      ...(andConditions.length > 0 ? { AND: andConditions } : {}),
      ...(universityIdFilter ? { id: { in: universityIdFilter } } : {}),
    };

    // Sort
    let orderBy = {};
    switch (sort) {
      case 'ranking':
        orderBy = { rankingValue: 'asc' };
        break;
      case 'recently_verified':
        orderBy = { lastVerifiedAt: 'desc' };
        break;
      case 'courses_count':
        // We'll sort by name as fallback; Prisma doesn't sort by relation count easily
        orderBy = { name: 'asc' };
        break;
      default:
        orderBy = { name: 'asc' };
    }

    const [total, universities] = await Promise.all([
      db.crmUniversity.count({ where }),
      db.crmUniversity.findMany({
        where,
        select: {
          id: true,
          name: true,
          slug: true,
          officialName: true,
          country: true,
          city: true,
          institutionType: true,
          establishedYear: true,
          websiteUrl: true,
          logoUrl: true,
          rankingValue: true,
          rankingProvider: true,
          rankingEdition: true,
          rankingYear: true,
          featured: true,
          isPartner: true,
          scholarshipAvailable: true,
          keyIntakes: true,
          lastVerifiedAt: true,
          _count: {
            select: { courses: { where: { approvalStatus: 'PUBLISHED', verificationStatus: 'VERIFIED' } } },
          },
        },
        skip,
        take: limit,
        orderBy,
      }),
    ]);

    // Sort by courses_count in memory if needed
    if (sort === 'courses_count') {
      universities.sort((a, b) => (b._count?.courses || 0) - (a._count?.courses || 0));
    }

    return NextResponse.json({
      universities,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('University directory API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch universities' },
      { status: 500 }
    );
  }
}
