import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { buildDailyBriefing } from '@/lib/intelligence/daily-briefing';

// ============================================================
// GET /api/intelligence/daily-briefing — AI daily management briefing (spec s109)
//
// "Yesterday / Today / At risk / Opportunities / Revenue / Applications /
// Visa / Partner performance / Marketing / System issues" — every figure is a
// real database count/sum computed at request time. No language model is
// called on this path; nothing is invented (s93, s109). Sections that fail
// report status ERROR with the reason instead of showing 0 (s91).
// ============================================================

const MANAGEMENT_TYPES = ['SUPER_ADMIN', 'ADMIN', 'CEO', 'EMPLOYEE'];

export const GET = withAuth(async (request: Request, _auth) => {
  const url = new URL(request.url);
  const includeAttention = url.searchParams.get('attention') !== 'false';

  const briefing = await buildDailyBriefing({ includeAttention });

  return NextResponse.json({ success: true, briefing });
}, { requireUserTypes: MANAGEMENT_TYPES });
