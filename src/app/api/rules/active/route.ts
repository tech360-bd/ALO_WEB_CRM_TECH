import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { resolveActiveRule } from '@/lib/rules/rule-versioning';

// ============================================================
// GET /api/rules/active?ruleKey=…&at=YYYY-MM-DD  (spec s106, s105)
//
// Resolves the rule version that was in force on a given date. This is what
// lets ALO answer "what did we believe when we advised this student?" rather
// than only "what is the rule now?".
//
// The response always carries `authoritative`. Unverified or disputed
// regulatory data is returned WITH that label so a caller cannot present it as
// fact (s105, s93) — an absent rule returns 404, never a fabricated default.
// ============================================================

const STAFF_TYPES = ['SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'CEO', 'COUNSELOR'];

export const GET = withAuth(async (request: Request) => {
  const url = new URL(request.url);
  const ruleKey = url.searchParams.get('ruleKey')?.trim();
  if (!ruleKey) {
    return NextResponse.json({ success: false, error: 'ruleKey is required' }, { status: 400 });
  }

  const atParam = url.searchParams.get('at')?.trim();
  let at = new Date();
  if (atParam) {
    const parsed = new Date(atParam);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { success: false, error: `INVALID_DATE: ${atParam}` },
        { status: 400 },
      );
    }
    at = parsed;
  }

  try {
    const active = await resolveActiveRule(ruleKey, at);
    if (!active) {
      // Honest absence: no rule was in force on that date.
      return NextResponse.json(
        {
          success: false,
          status: 'NOT_FOUND',
          error: `No rule version was in force for ${ruleKey} on ${at.toISOString()}.`,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      ruleKey,
      asOf: at.toISOString(),
      rule: {
        id: active.id,
        ruleType: active.ruleType,
        versionNumber: active.versionNumber,
        summary: active.summary,
        payload: active.payload,
        effectiveFrom: active.effectiveFrom,
        effectiveUntil: active.effectiveUntil,
        sourceType: active.sourceType,
        sourceUrl: active.sourceUrl,
        sourceName: active.sourceName,
        verificationStatus: active.verificationStatus,
        verifiedAt: active.verifiedAt,
      },
      authoritative: active.authoritative,
      trustWeight: active.trustWeight,
      // Never let an unverified rule be quoted to a student as fact.
      advisory: active.authoritative
        ? undefined
        : 'This rule is NOT VERIFIED against an official source. Confirm before advising a student.',
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Could not resolve rule' },
      { status: 500 },
    );
  }
}, { requireUserTypes: STAFF_TYPES });
