import { NextRequest, NextResponse } from 'next/server';
import { POST as registerMonitoringSource } from '@/app/api/university-monitoring/sources/route';
import { requireMonitoringAdmin } from '@/lib/university-monitoring-auth';
import { mutationOriginAllowed } from '@/lib/request-origin';
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
    const parsedLimit = Number(req.nextUrl.searchParams.get('limit') || '50');
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 200) return NextResponse.json({ error: 'limit must be an integer from 1 to 200' }, { status: 400 });
    const limit = parsedLimit;

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
    return NextResponse.json({ error: 'Failed to fetch official sources' }, { status: 500 });
  }
}

// Compatibility entry point: never allow legacy callers to self-verify a source.
// Use the same Super Admin guard, URL policy, dedupe and pending-only creation
// as the monitoring registry rather than maintaining a second mutation path.
export async function POST(req: NextRequest) {
  const guard = await requireMonitoringAdmin(req);
  if (!guard.ok) return guard.response;
  if (!mutationOriginAllowed(req, guard.actor.auth)) return NextResponse.json({ error: 'Cross-origin source changes are not allowed' }, { status: 403 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return NextResponse.json({ error: 'A JSON object is required' }, { status: 400 });
  const entityType = String(body.entityType || body.targetType || '').toUpperCase();
  const mapped = {
    sourceUrl: body.sourceUrl,
    sourceName: body.sourceName || body.sourceTitle || body.sourceUrl,
    sourceType: body.sourceType || 'official_university',
    entityType,
    universitySlug: body.universitySlug || (entityType === 'UNIVERSITY' ? body.targetSlug : undefined),
    courseSlug: body.courseSlug || (entityType === 'COURSE' ? body.targetSlug : undefined),
    countrySlug: body.countrySlug || (['COUNTRY', 'GOVERNMENT', 'AUTHORITY'].includes(entityType) ? body.targetSlug : undefined),
    category: body.category || body.dataSection || undefined,
    checkFrequencyDays: body.checkFrequencyDays,
  };
  return registerMonitoringSource(new NextRequest(req.url, { method: 'POST', headers: req.headers, body: JSON.stringify(mapped) }));
}
