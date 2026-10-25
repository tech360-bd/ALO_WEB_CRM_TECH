import { NextResponse } from 'next/server';
import { listPublicProgrammes } from '@/lib/phd/public-catalogue';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/research/programmes — PUBLIC research-degree discovery.
 * Visibility rules live in `src/lib/phd/public-catalogue.ts` and are shared with
 * the rendered pages, so the API and the UI can never disagree.
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  try {
    const result = await listPublicProgrammes({
      q: params.get('q') ?? undefined,
      discipline: params.get('discipline') ?? undefined,
      country: params.get('country') ?? undefined,
      award: params.get('award') ?? undefined,
      page: Number.parseInt(params.get('page') ?? '1', 10) || 1,
      pageSize: Number.parseInt(params.get('pageSize') ?? '12', 10) || 12,
    });
    return NextResponse.json(
      {
        success: true,
        ...result,
        note: 'Only programmes verified against an official university page are listed. A missing record is not evidence that a programme does not exist.',
      },
      { headers: { 'Cache-Control': 'public, max-age=300, s-maxage=300' } },
    );
  } catch {
    // A database outage must never be reported as "no programmes".
    return NextResponse.json(
      { success: false, error: 'The research catalogue is temporarily unavailable. Please try again later.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
