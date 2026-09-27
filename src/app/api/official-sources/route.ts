import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';

const SOURCE_MANAGER_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'super_admin', 'admin', 'MARKETING_MANAGER', 'marketing_manager']);

async function requireSourceManager(req: Request) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!SOURCE_MANAGER_ROLES.has(auth.userType) && !auth.roles.some((role) => SOURCE_MANAGER_ROLES.has(role))) {
    return NextResponse.json({ error: 'Official source manager access required' }, { status: 403 });
  }
  return auth;
}

// GET /api/official-sources — official source system per spec section 24
// Filters: targetType, targetId, targetSlug, sourceType, dataSection, verificationStatus
export async function GET(req: NextRequest) {
  const auth = await requireSourceManager(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const targetType = req.nextUrl.searchParams.get('targetType');
    const targetId = req.nextUrl.searchParams.get('targetId');
    const targetSlug = req.nextUrl.searchParams.get('targetSlug');
    const sourceType = req.nextUrl.searchParams.get('sourceType');
    const dataSection = req.nextUrl.searchParams.get('dataSection');
    const verificationStatus = req.nextUrl.searchParams.get('verificationStatus');
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 200);

    const where: any = {};
    if (targetType) where.targetType = targetType;
    if (targetId) where.targetId = targetId;
    if (targetSlug) where.targetSlug = targetSlug;
    if (sourceType) where.sourceType = sourceType;
    if (dataSection) where.dataSection = dataSection;
    if (verificationStatus) where.verificationStatus = verificationStatus;

    const sources = await db.officialSource.findMany({
      where,
      orderBy: { lastVerifiedAt: 'desc' },
      take: limit,
    }).catch(() => []);

    // Fallback to country sources and crm source logs
    let fallback: any[] = [];
    if (sources.length === 0 && targetSlug) {
      const country = await db.country.findFirst({ where: { slug: targetSlug } }).catch(() => null);
      if (country) {
        const countrySources = await db.countrySource.findMany({ where: { countryId: country.id }, take: limit }).catch(() => []);
        fallback = countrySources.map((s: any) => ({
          sourceUrl: s.sourceUrl,
          sourceType: 'official_government',
          sourceTitle: s.sourceName,
          targetType: 'country',
          targetId: country.id,
          dataSection: s.dataSection,
          verificationStatus: s.status,
          lastVerifiedAt: s.lastVerifiedAt,
          verifiedBy: s.verifiedBy,
        }));
      }
    }

    const allSources = sources.length > 0 ? sources : fallback;

    return NextResponse.json({
      success: true,
      sources: allSources,
      total: allSources.length,
      message: allSources.length === 0 ? 'No official sources verified yet. Use DB with source_url, last_verified_at, verification_status.' : `${allSources.length} official sources found`,
    });
  } catch (err: any) {
    console.error('[official-sources] error', err);
    return NextResponse.json({ error: 'Failed to fetch official sources', detail: err.message }, { status: 500 });
  }
}

// POST /api/official-sources — create official source (admin)
export async function POST(req: NextRequest) {
  const auth = await requireSourceManager(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const body = await req.json();
    const { sourceUrl, sourceType = 'official_university', sourceTitle = '', targetType = '', targetId = '', targetSlug = '', dataSection = '', verificationStatus = 'pending', notes = '' } = body;

    if (!sourceUrl) return NextResponse.json({ error: 'sourceUrl required' }, { status: 400 });

    const source = await db.officialSource.create({
      data: {
        sourceUrl,
        sourceType,
        sourceTitle,
        targetType,
        targetId,
        targetSlug,
        dataSection,
        verificationStatus,
        verifiedBy: auth.userId,
        lastVerifiedAt: verificationStatus === 'verified' ? new Date() : null,
        notes,
        entityType: String(targetType || 'OTHER').toUpperCase(),
        sourceName: sourceTitle || sourceUrl,
      },
    });

    return NextResponse.json({ source, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('[official-sources.create] error', err);
    return NextResponse.json({ error: 'Failed to create official source', detail: err.message }, { status: 500 });
  }
}
