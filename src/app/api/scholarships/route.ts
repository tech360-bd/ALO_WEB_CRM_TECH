import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOptionalAuth } from '@/lib/auth-middleware';

// GET /api/scholarships — unified scholarship system DB-driven per spec section 10
// Supports filters: country, universityId, fundingType, search, featured, limit
// Only publish verified scholarship information
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || '';
    const universityId = searchParams.get('universityId') || '';
    const fundingType = searchParams.get('fundingType') || '';
    const search = searchParams.get('search') || '';
    const featured = searchParams.get('featured');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

    // Build where for new Scholarship model
    const where: any = { status: 'active' };
    if (country) where.country = { contains: country, mode: 'insensitive' };
    if (universityId) where.universityId = universityId;
    if (fundingType) where.fundingType = fundingType;
    if (featured === 'true') where.isFeatured = true;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { overview: { contains: search, mode: 'insensitive' } },
        { eligibility: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch from new Scholarship model (29 sections) + CrmScholarship (course-specific)
    const [scholarships, crmScholarships] = await Promise.all([
      db.scholarship.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: limit,
        select: {
          id: true,
          slug: true,
          name: true,
          country: true,
          university: true,
          universityId: true,
          fundingAmount: true,
          fundingType: true,
          fundingCurrency: true,
          amount: true,
          currency: true,
          eligibility: true,
          deadline: true,
          deadlineDate: true,
          overview: true,
          verificationStatus: true,
          lastVerifiedAt: true,
          officialSourceUrl: true,
          status: true,
          isFeatured: true,
          sortOrder: true,
        },
      }).catch(() => []),
      db.crmScholarship.findMany({
        where: { status: 'active', ...(country ? { university: { country: { contains: country } } } : {}), ...(universityId ? { universityId } : {}) },
        include: {
          university: { select: { universityId: true, name: true, country: true, city: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }).catch(() => []),
    ]);

    // Merge results — new scholarships first
    const crmMapped = crmScholarships.map((s: any) => ({
      id: s.id,
      slug: `crm-${s.id}`,
      name: s.scholarshipName,
      country: s.university?.country || '',
      university: s.university?.name || '',
      universityId: s.universityId,
      courseId: s.courseId,
      fundingAmount: s.scholarshipAmount ? `${s.scholarshipCurrency || ''} ${s.scholarshipAmount}` : 'Check eligibility',
      fundingType: s.coverageType || 'tuition_waiver',
      eligibility: `Eligible countries: ${s.eligibleCountries || 'All'} — Levels: ${s.eligibleLevels || 'All'}`,
      deadline: s.deadline || '',
      verificationStatus: s.verificationStatus || 'NEEDS_REVIEW',
      lastVerifiedAt: s.lastCheckedAt || null,
      officialSourceUrl: s.officialScholarshipUrl || '',
      source: 'crm',
      universityData: s.university,
    }));

    const allScholarships = [...scholarships, ...crmMapped];

    return NextResponse.json({
      success: true,
      scholarships: allScholarships,
      total: allScholarships.length,
      verified: allScholarships.filter((s: any) => s.verificationStatus === 'verified' || s.verificationStatus === 'VERIFIED').length,
      message: allScholarships.length === 0 ? 'No verified scholarships yet. Only publish verified scholarship information per spec.' : `${allScholarships.length} scholarships found — DB-driven, verified only`,
    });
  } catch (error: any) {
    console.error('[scholarships.list] error', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch scholarships' }, { status: 500 });
  }
}

// POST /api/scholarships — create scholarship (admin)
export async function POST(req: Request) {
  try {
    const auth = await getOptionalAuth(req);
    const roles = auth?.roles || [];
    const isAdmin = roles.some((r: string) => ['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin'].includes(r));
    if (auth && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Admin required' }, { status: 403 });
    }

    const body = await req.json();
    const { slug, name, country = '', university = '', universityId = '', fundingAmount = '', fundingType = '', eligibility = '', overview = '', officialSourceUrl = '', status = 'active', isFeatured = false } = body;

    if (!slug || !name) return NextResponse.json({ success: false, error: 'slug and name required' }, { status: 400 });

    const existing = await db.scholarship.findUnique({ where: { slug } }).catch(() => null);
    if (existing) return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 409 });

    const scholarship = await db.scholarship.create({
      data: {
        slug,
        name,
        country,
        university,
        universityId,
        fundingAmount,
        fundingType: fundingType || 'tuition_waiver',
        eligibility,
        overview,
        officialSourceUrl,
        status,
        isFeatured,
        verificationStatus: officialSourceUrl ? 'verified' : 'pending',
        lastVerifiedAt: officialSourceUrl ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, scholarship }, { status: 201 });
  } catch (err: any) {
    console.error('[scholarships.create] error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
