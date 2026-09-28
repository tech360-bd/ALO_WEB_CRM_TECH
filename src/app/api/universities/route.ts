import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Public GET /api/universities — proxies to approved, verified CrmUniversity (Part 46)
// Query: ?search=&country=&status=&limit=50
// Publish safety: by default only rows with status 'active' are returned
// (seeders write status:'active'; unverified rows stay 'needs_official_source').
// Pass ?status=all only from internal/admin contexts that must see everything.
export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams.get('search') || '';
    const country = req.nextUrl.searchParams.get('country') || '';
    const status = req.nextUrl.searchParams.get('status') || 'active';
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10) || 50, 100);

    const where: any = {};
    if (status !== 'all') where.status = status;
    if (search) where.OR = [{ name: { contains: search } }, { city: { contains: search } }, { country: { contains: search } }];
    if (country && country !== 'all') where.country = { contains: country };

    // No .catch(()=>[]) here: a DB failure must surface as a 500, not as an
    // empty list that renders as "no universities exist".
    const [universities, total] = await Promise.all([
      db.crmUniversity.findMany({
        where,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      db.crmUniversity.count({ where }),
    ]);

    // Never expose internal notes/source artifacts; return whitelisted fields
    const safe = universities.map((u: any) => ({
      id: u.id,
      universityId: u.universityId,
      name: u.name,
      slug: u.slug,
      country: u.country,
      city: u.city,
      campusName: u.campusName,
      website: u.website,
      officialUrl: u.officialUrl,
      ranking: u.ranking || u.worldRanking,
      status: u.status,
      verificationStatus: u.verificationStatus,
      lastVerifiedAt: u.lastVerifiedAt,
    }));

    // `total` is the real matching-row count (not the page size), so the UI
    // can show honest, DB-driven statistics instead of hardcoded claims.
    return NextResponse.json({ success: true, universities: safe, data: safe, total });
  } catch (e: any) {
    console.error('[api/universities] error', e);
    return NextResponse.json({ success: false, error: e?.message || 'Failed to load universities' }, { status: 500 });
  }
}
