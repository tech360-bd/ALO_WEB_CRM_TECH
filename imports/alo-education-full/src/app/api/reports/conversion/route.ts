import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAuth } from '@/lib/api-auth';

// Simple in-memory cache
let cache: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 60_000; // 60 seconds

// Map Application.stage to funnel stages
const STAGE_MAP: Record<string, string> = {
  COUNSELLING: 'COUNSELLING',
  DOCUMENT_CHECK: 'REGISTERED',
  SUBMITTED: 'SUBMITTED',
  OFFER_RECEIVED: 'OFFER_RECEIVED',
  OFFER_ACCEPTED: 'OFFER_ACCEPTED',
  CAS_PENDING: 'OFFER_ACCEPTED',
  CAS_RECEIVED: 'OFFER_ACCEPTED',
  VISA_PREPARATION: 'OFFER_ACCEPTED',
  VISA_SUBMITTED: 'VISA_APPROVED',
  VISA_GRANTED: 'VISA_APPROVED',
  DEPARTURE_PREP: 'VISA_APPROVED',
  ENROLLED: 'ENROLLED',
  WITHDRAWN: '',
  REJECTED: '',
};

const FUNNEL_STAGES = [
  'LEADS',
  'REGISTERED',
  'COUNSELLING',
  'APPLICATION',
  'SUBMITTED',
  'OFFER_RECEIVED',
  'OFFER_ACCEPTED',
  'VISA_APPROVED',
  'ENROLLED',
] as const;

type FunnelStage = (typeof FUNNEL_STAGES)[number];

export async function GET(req: Request) {
  try {
    const { error } = await requireAuth(req);
    if (error) return error;

    // Return cached response if still valid
    if (cache && Date.now() - cache.ts < CACHE_TTL) {
      return NextResponse.json(cache.data);
    }

    // Count leads (all non-withdrawn/rejected)
    const leadCount = await db.lead.count();

    // Get application stage counts
    const stageCountsRaw = await db.$queryRawUnsafe<Array<{ stage: string; cnt: number }>>(
      `SELECT stage, COUNT(*) as cnt FROM Application GROUP BY stage`
    );

    // Build a map of funnel stage -> count
    // An application at stage X counts towards all funnel stages up to and including its mapped stage
    const funnelCounts: Record<string, number> = {};
    for (const row of stageCountsRaw) {
      const mapped = STAGE_MAP[row.stage];
      if (!mapped) continue; // skip WITHDRAWN, REJECTED

      const stageIdx = FUNNEL_STAGES.indexOf(mapped as FunnelStage);
      if (stageIdx === -1) continue;

      // This application contributes to this funnel stage and all before it
      for (let i = 0; i <= stageIdx; i++) {
        const fs = FUNNEL_STAGES[i];
        funnelCounts[fs] = (funnelCounts[fs] ?? 0) + Number(row.cnt);
      }
    }

    // Build funnel result
    const funnel = FUNNEL_STAGES.map((stage) => ({
      stage,
      count: stage === 'LEADS' ? leadCount : (funnelCounts[stage] ?? 0),
    }));

    const data = { funnel };

    // Cache the result
    cache = { data, ts: Date.now() };

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching conversion funnel:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
