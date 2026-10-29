import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { rateLimitMiddleware } from '@/lib/rate-limiter';
import { rankScholarships, type ScholarshipRecord } from '@/lib/scholarship-match';
import { publicScholarshipWhere } from '@/lib/public-catalog';
import { hasCurrentScholarshipSourceVerification } from '@/lib/scholarships/status-engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/scholarship-match
 *
 * Public, read-only matching over verified scholarship records. Ranking is
 * produced by src/lib/scholarship-match.ts — a deterministic scorer, not a
 * language model — so the same profile always yields the same result and no
 * award probability is ever invented.
 */

const ProfileSchema = z.object({
  studyLevel: z.string().trim().max(80).optional(),
  subject: z.string().trim().max(120).optional(),
  countries: z.array(z.string().trim().max(80)).max(8).optional(),
  fundingType: z.string().trim().max(60).optional(),
  nationality: z.string().trim().max(80).optional(),
  gpa: z.number().min(0).max(100).nullable().optional(),
  englishScore: z.number().min(0).max(100).nullable().optional(),
});

export async function POST(request: Request) {
  const limited = rateLimitMiddleware(request, 'lead_create');
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Request body must be valid JSON.' }, { status: 400 });
  }

  const parsed = ProfileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Some of the details you entered are not valid.',
        issues: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'profile'}: ${issue.message}`),
      },
      { status: 400 },
    );
  }

  const profile = parsed.data;

  try {
    const where: Record<string, unknown> = { ...publicScholarshipWhere() };
    if (profile.countries && profile.countries.length > 0) {
      where.OR = profile.countries.map((country) => ({ country: { contains: country } }));
    }
    if (profile.studyLevel) where.studyLevel = profile.studyLevel;
    if (profile.fundingType) where.fundingType = profile.fundingType;

    const rows = await db.scholarship.findMany({
      where,
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }],
      take: 120,
      select: {
        id: true,
        slug: true,
        name: true,
        country: true,
        university: true,
        fundingAmount: true,
        fundingType: true,
        studyLevel: true,
        subject: true,
        eligibility: true,
        courseEligibility: true,
        academicRequirements: true,
        englishRequirements: true,
        nationalityRequirements: true,
        deadline: true,
        deadlineDate: true,
        officialSourceUrl: true,
        officialSourceName: true,
        verificationStatus: true,
        lastVerifiedAt: true,
      },
    });

    const records: ScholarshipRecord[] = rows
      .filter((row: any) => hasCurrentScholarshipSourceVerification({
        verificationStatus: row.verificationStatus,
        lastVerifiedAt: row.lastVerifiedAt,
        officialSourceUrl: row.officialSourceUrl,
      }))
      .map((row: any) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      country: row.country ?? '',
      university: row.university ?? '',
      fundingAmount: row.fundingAmount ?? '',
      fundingType: row.fundingType ?? '',
      studyLevel: row.studyLevel ?? '',
      subject: row.subject ?? '',
      eligibility: row.eligibility ?? '',
      courseEligibility: row.courseEligibility ?? '',
      academicRequirements: row.academicRequirements ?? '',
      englishRequirements: row.englishRequirements ?? '',
      nationalityRequirements: row.nationalityRequirements ?? '',
      deadline: row.deadline ?? '',
      deadlineDate: row.deadlineDate ?? null,
      officialSourceUrl: row.officialSourceUrl ?? '',
      officialSourceName: row.officialSourceName ?? '',
      verificationStatus: row.verificationStatus ?? '',
      lastVerifiedAt: row.lastVerifiedAt ?? null,
    }));

    const matches = rankScholarships(records, profile);

    return NextResponse.json({
      success: true,
      count: matches.length,
      matches,
      disclaimer:
        'Scholarships are matched against published eligibility fields using a deterministic rule set. A high match score means your declared profile aligns with what the provider publishes — it is not a prediction that you will receive the award. Always confirm eligibility, deadlines and documents with the official source.',
    });
  } catch (error) {
    console.error('[ai/scholarship-match] error:', error);
    return NextResponse.json(
      { success: false, error: 'We could not search the scholarship database. Please try again.' },
      { status: 500 },
    );
  }
}
