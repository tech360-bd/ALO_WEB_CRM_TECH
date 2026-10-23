import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireMonitoringAdmin } from '@/lib/university-monitoring-auth';
import { CATALOGUE_LOG_ENTITY } from '@/lib/official-crawlers/catalogue-monitoring';

export const dynamic = 'force-dynamic';

/** Candidate URLs and incomplete traversal evidence are Super Admin-only. */
export async function GET(req: Request) {
  const guard = await requireMonitoringAdmin(req);
  if (!guard.ok) return guard.response;
  const sourceId = new URL(req.url).searchParams.get('sourceId');
  if (!sourceId || sourceId.length > 191) return NextResponse.json({ success: false, error: 'A sourceId is required.' }, { status: 400 });
  try {
    const checkpoint = await db.monitoringLog.findFirst({
      where: { entityType: CATALOGUE_LOG_ENTITY, entitySlug: sourceId }, orderBy: { createdAt: 'desc' },
      select: { id: true, runId: true, createdAt: true, metadata: true },
    });
    if (!checkpoint) return NextResponse.json({ success: false, error: 'No catalogue discovery evidence exists for this source yet.' }, { status: 404 });
    const { state } = JSON.parse(checkpoint.metadata || '{}');
    if (!state || state.version !== 1) throw new Error('Invalid checkpoint');
    return NextResponse.json({ success: true, checkpointId: checkpoint.id, runId: checkpoint.runId, capturedAt: checkpoint.createdAt,
      report: { ...state, catalogueVerified: false },
      safetyNotice: 'Candidate links are not verified programmes. LINK_GRAPH_EXHAUSTED is not UNIVERSITY_CATALOGUE_VERIFIED. Review dynamic filters, PDFs and international eligibility independently.' });
  } catch {
    return NextResponse.json({ success: false, error: 'Catalogue discovery evidence is temporarily unavailable.' }, { status: 503 });
  }
}
