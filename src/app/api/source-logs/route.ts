import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCatalogAdmin } from '@/lib/course-finder/catalog-admin-auth';
import { isAcceptableSourceUrl } from '@/lib/course-finder/content-page-guards';

// Catalogue source logs.
//
// Phase 1 (2026-10-12):
//  - Previously ANY authenticated account (including STUDENT and PARTNER)
//    could read every source log and create source records. Both methods now
//    require a catalogue administrator (ADMIN / SUPER_ADMIN by verified user
//    type); POST also requires a same-origin request.
//  - POST no longer trusts the client for verification or attribution:
//    `verificationStatus` and `checkedBy` from the body are rejected, every new
//    log starts as "pending", lastVerifiedAt is never set here, and the
//    checker is the authenticated actor. Recording a source is not verifying it.
//  - The source URL must be an https official URL (no synthetic hosts).

const MAX_TEXT = 2000;
// The entity types documented on the SourceLog model.
const ENTITY_TYPES = new Set(['university', 'course', 'scholarship', 'country']);
const SOURCE_TYPES: Record<string, string> = {
  'Official University': 'official_university',
  Government: 'official_government',
  'Official Visa Authority': 'official_government',
  'Official Scholarship': 'official_scholarship',
  'Other Approved Source': 'other',
};

function boundedParam(value: string | null, max = 200): string | null {
  if (value === null || value === '') return null;
  return value.length <= max ? value : null;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireCatalogAdmin(req, { level: 'admin', mutation: false });
    if (auth instanceof NextResponse) return auth;
    const params = req.nextUrl.searchParams;
    const entityType = boundedParam(params.get('entityType'));
    const entityId = boundedParam(params.get('entityId'));
    const sourceType = boundedParam(params.get('sourceType'));
    const verificationStatus = boundedParam(params.get('verificationStatus'));
    const parsedLimit = Number.parseInt(params.get('limit') || '50', 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 200) : 50;
    const where: Record<string, string> = {};
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
  } catch (err: unknown) {
    console.error('[source-logs] error', err instanceof Error ? err.name : 'unknown');
    return NextResponse.json({ success: false, error: 'Source logs are temporarily unavailable' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireCatalogAdmin(req, { level: 'admin', mutation: true });
    if (auth instanceof NextResponse) return auth;
    let body: Record<string, unknown>;
    try {
      const parsed = await req.json();
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('not an object');
      body = parsed as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: 'A JSON object body is required' }, { status: 400 });
    }
    const forbidden = ['verificationStatus', 'checkedBy', 'verifiedBy', 'lastVerifiedAt'].filter((f) => Object.prototype.hasOwnProperty.call(body, f));
    if (forbidden.length) {
      return NextResponse.json({ success: false, error: `These fields are set by the server, not the request: ${forbidden.join(', ')}` }, { status: 400 });
    }
    const { entityType, entityId } = body;
    const sourceName = body.sourceName ?? '';
    const sourceUrl = body.sourceUrl;
    const sourceType = body.sourceType ?? 'Official University';
    const notes = body.notes ?? '';
    if (typeof entityType !== 'string' || !ENTITY_TYPES.has(entityType)) {
      return NextResponse.json({ success: false, error: `entityType must be one of: ${[...ENTITY_TYPES].join(', ')}` }, { status: 400 });
    }
    if (typeof entityId !== 'string' || !entityId || entityId.length > 191) {
      return NextResponse.json({ success: false, error: 'entityId is required' }, { status: 400 });
    }
    if (!isAcceptableSourceUrl(sourceUrl)) {
      return NextResponse.json({ success: false, error: 'sourceUrl must be an https official source URL' }, { status: 400 });
    }
    if (typeof sourceType !== 'string' || !Object.prototype.hasOwnProperty.call(SOURCE_TYPES, sourceType)) {
      return NextResponse.json({ success: false, error: `sourceType must be one of: ${Object.keys(SOURCE_TYPES).join(', ')}` }, { status: 400 });
    }
    if (typeof sourceName !== 'string' || sourceName.length > 300 || typeof notes !== 'string' || notes.length > MAX_TEXT) {
      return NextResponse.json({ success: false, error: 'sourceName or notes is invalid' }, { status: 400 });
    }
    const actor = auth.actorUserId || auth.userId;
    const url = sourceUrl.trim();
    const log = await db.sourceLog.create({
      data: {
        entityType,
        entityId,
        sourceName,
        sourceUrl: url,
        sourceType,
        checkedBy: actor,
        verificationStatus: 'pending',
        notes,
        checkedAt: new Date(),
      },
    });
    let officialSourceRecorded = true;
    await db.officialSource.create({
      data: {
        sourceUrl: url,
        sourceType: SOURCE_TYPES[sourceType],
        sourceTitle: sourceName,
        targetType: entityType,
        targetId: entityId,
        dataSection: 'general',
        verificationStatus: 'pending',
        verifiedBy: '',
        lastVerifiedAt: null,
        notes,
        entityType: entityType.toUpperCase(),
        sourceName: sourceName || url,
      },
    }).catch(() => { officialSourceRecorded = false; });
    return NextResponse.json({ success: true, sourceLog: log, officialSourceRecorded, verified: false }, { status: 201 });
  } catch (err: unknown) {
    console.error('[source-logs.create] error', err instanceof Error ? err.name : 'unknown');
    return NextResponse.json({ success: false, error: 'Source log could not be recorded' }, { status: 500 });
  }
}
