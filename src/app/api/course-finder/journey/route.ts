// GET /api/course-finder/journey — "ALO 7-Step Journey" branded visual data
// (spec: COURSE FINDER MAPPING). Public. Renders the ACTUAL configured ALO
// journey (ALO_JOURNEY_STEPS in src/lib/course-finder/journey.ts).

import { NextResponse } from 'next/server';
import { buildJourneyVisualDocument } from '@/lib/course-finder/journey';

export async function GET() {
  try {
    return NextResponse.json({ success: true, ...buildJourneyVisualDocument() });
  } catch (error: any) {
    console.error('[api/course-finder/journey] error', error);
    return NextResponse.json({ success: false, error: 'Failed to build journey visual' }, { status: 500 });
  }
}
