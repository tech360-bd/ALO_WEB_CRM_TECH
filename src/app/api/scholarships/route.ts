import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { PUBLIC_SCHOLARSHIP_STATUSES } from '@/lib/website/public-content';
import { hasCurrentScholarshipSourceVerification } from '@/lib/scholarships/status-engine';
import { publicCrmScholarshipWhere, publicScholarshipWhere, publicUniversityWhere } from '@/lib/public-catalog';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';

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
    // §15 filters
    const studyLevel = searchParams.get('studyLevel') || '';
    const subject = searchParams.get('subject') || '';
    const scholarshipType = searchParams.get('scholarshipType') || '';
    const intake = searchParams.get('intake') || '';
    const applicationOpen = searchParams.get('applicationOpen') === 'true';

    // Build where for new Scholarship model
    const where: any = { ...publicScholarshipWhere() };
    if (country) where.country = { contains: country };
    if (universityId) where.universityId = universityId;
    if (fundingType) where.fundingType = fundingType;
    if (studyLevel) where.studyLevel = studyLevel;
    if (subject) where.subject = { contains: subject };
    if (scholarshipType) where.scholarshipType = scholarshipType;
    if (intake) where.intake = { contains: intake };
    if (applicationOpen) where.deadlineDate = { gte: new Date() };
    if (featured === 'true') where.isFeatured = true;
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { university: { contains: search } },
        { overview: { contains: search } },
        { eligibility: { contains: search } },
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
          // §15/§16 additions
          studyLevel: true,
          subject: true,
          scholarshipType: true,
          intake: true,
          applicationMethod: true,
          fundingAmountNumber: true,
          nationalityRequirements: true,
          openingDate: true,
        },
      }).catch(() => []),
      db.crmScholarship.findMany({
        where: {
          AND: [
            publicCrmScholarshipWhere(),
            { university: { is: publicUniversityWhere() } },
            ...(country ? [{ university: { is: { country: { contains: country } } } }] : []),
            ...(universityId ? [{ universityId }] : []),
          ],
        },
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
      status: s.status,
      source: 'crm',
      universityData: s.university,
    }));

    const allScholarships = [...scholarships, ...crmMapped].filter((scholarship: any) =>
      PUBLIC_SCHOLARSHIP_STATUSES.includes(scholarship.status)
      && hasCurrentScholarshipSourceVerification({
        verificationStatus: scholarship.verificationStatus,
        lastVerifiedAt: scholarship.lastVerifiedAt,
        officialSourceUrl: scholarship.officialSourceUrl,
      }),
    );

    return NextResponse.json({
      success: true,
      scholarships: allScholarships,
      total: allScholarships.length,
      verified: allScholarships.filter((s: any) => String(s.verificationStatus || '').toLowerCase() === 'verified' || String(s.verificationStatus || '').toLowerCase() === 'verified_recent').length,
      message: allScholarships.length === 0 ? 'No verified scholarships yet. Only publish verified scholarship information per spec.' : `${allScholarships.length} scholarships found — DB-driven, verified only`,
    });
  } catch (error: any) {
    console.error('[scholarships.list] error', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch scholarships' }, { status: 500 });
  }
}

// Keep legacy creation URLs on the same authenticated, audited implementation.
export { POST } from "../admin/scholarships/route";
