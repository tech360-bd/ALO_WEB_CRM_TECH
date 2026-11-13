import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { listStaleRules } from '@/lib/rules/rule-versioning';

// ============================================================
// GET /api/rules/stale?olderThanDays=180  (spec s43, s108)
//
// Regulatory facts on country pages must show "last verified" (s43). This
// returns ACTIVE rules whose verification is missing or older than the window,
// so stale guidance can be surfaced as an attention item rather than quietly
// continuing to be quoted to students.
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'];

export const GET = withAuth(async (request: Request) => {
  const url = new URL(request.url);
  const olderThanDays = Number(url.searchParams.get('olderThanDays') ?? 180);
  const limit = Number(url.searchParams.get('limit') ?? 100);

  try {
    const stale = await listStaleRules({
      olderThanDays: Number.isFinite(olderThanDays) ? olderThanDays : 180,
      limit: Number.isFinite(limit) ? limit : 100,
    });

    return NextResponse.json({
      success: true,
      olderThanDays: Number.isFinite(olderThanDays) ? olderThanDays : 180,
      count: stale.length,
      neverVerified: stale.filter((rule) => rule.verifiedAt === null).length,
      stale: stale.map((rule) => ({
        id: rule.id,
        ruleKey: rule.ruleKey,
        ruleType: rule.ruleType,
        versionNumber: rule.versionNumber,
        summary: rule.summary,
        sourceType: rule.sourceType,
        sourceUrl: rule.sourceUrl,
        verificationStatus: rule.verificationStatus,
        verifiedAt: rule.verifiedAt,
        daysSinceVerified: rule.daysSinceVerified,
        authoritative: rule.authoritative,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not list stale rules' },
      { status: 500 },
    );
  }
}, { requireUserTypes: STAFF_TYPES });
