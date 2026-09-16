import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    const entityType = req.nextUrl.searchParams.get('entityType');
    const entityId = req.nextUrl.searchParams.get('entityId');
    const sourceType = req.nextUrl.searchParams.get('sourceType');
    const verificationStatus = req.nextUrl.searchParams.get('verificationStatus');
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '50', 10), 200);
    const where: any = {};
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (sourceType) where.sourceType = sourceType;
    if (verificationStatus) where.verificationStatus = verificationStatus;
    const [sourceLogs, officialSources, countrySources, crmSourceLogs] = await Promise.all([
      db.sourceLog.findMany({ where, orderBy: { checkedAt: 'desc' }, take: limit }).catch(() => []),
      db.officialSource.findMany({ where: { ...(entityType ? { targetType: entityType } : {}), ...(entityId ? { targetId: entityId } : {}), ...(sourceType ? { sourceType } : {}), ...(verificationStatus ? { verificationStatus } : {}) }, orderBy: { lastVerifiedAt: 'desc' }, take: limit }).catch(() => []),
      db.countrySource.findMany({ take: limit, orderBy: { lastVerifiedAt: 'desc' } }).catch(() => []),
      db.crmSourceLog.findMany({ take: limit, orderBy: { createdAt: 'desc' } }).catch(() => []),
    ]);
    return NextResponse.json({
      success: true,
      sourceLogs,
      officialSources,
      countrySources,
      crmSourceLogs,
      total: sourceLogs.length + officialSources.length,
      message: 'Source logs — Official University, Government, Official Visa Authority, Official Scholarship, Other Approved Source — Prefer official university source',
    });
  } catch (err: any) {
    console.error('[source-logs] error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    const body = await req.json();
    const { entityType, entityId, sourceName = '', sourceUrl = '', sourceType = 'Official University', verificationStatus = 'pending', notes = '', checkedBy = '' } = body;
    if (!entityType || !entityId || !sourceUrl) return NextResponse.json({ success: false, error: 'entityType, entityId, sourceUrl required' }, { status: 400 });
    const log = await db.sourceLog.create({
      data: {
        entityType,
        entityId,
        sourceName,
        sourceUrl,
        sourceType,
        checkedBy: checkedBy || auth.userId || 'system',
        verificationStatus,
        notes,
        checkedAt: new Date(),
      },
    });
    await db.officialSource.create({
      data: {
        sourceUrl,
        sourceType: sourceType === 'Official University' ? 'official_university' : sourceType === 'Government' ? 'official_government' : sourceType === 'Official Scholarship' ? 'official_scholarship' : 'other',
        sourceTitle: sourceName,
        targetType: entityType,
        targetId: entityId,
        dataSection: 'general',
        verificationStatus,
        verifiedBy: checkedBy || auth.userId || 'system',
        lastVerifiedAt: verificationStatus === 'verified' ? new Date() : null,
        notes,
        entityType: String(entityType).toUpperCase(),
        sourceName: sourceName || sourceUrl,
      },
    }).catch(() => {});
    return NextResponse.json({ success: true, sourceLog: log }, { status: 201 });
  } catch (err: any) {
    console.error('[source-logs.create] error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
