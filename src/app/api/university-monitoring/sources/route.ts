import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { requireMonitoringAdmin, requireMonitoringViewer } from '@/lib/university-monitoring-auth';
import {
  buildOfficialSourceFingerprint,
  isOfficialMonitoringSourceType,
  MONITORABLE_ENTITY_TYPES,
  normalizeOfficialSourceUrl,
} from '@/lib/university-monitoring-source-policy';
import { extractVisibleText, fetchSourceContent } from '@/lib/university-monitoring-engine';

const SOURCE_TYPES: Record<string, string> = {
  OFFICIAL_UNIVERSITY: 'official_university',
  UNIVERSITY_OFFICIAL: 'official_university',
  OFFICIAL_GOVERNMENT: 'official_government',
  GOVERNMENT: 'official_government',
  OFFICIAL_AUTHORITY: 'official_authority',
  AUTHORITY: 'official_authority',
  OFFICIAL_EDUCATION_AUTHORITY: 'official_authority',
  OFFICIAL_ADMISSIONS_PORTAL: 'official_admissions_portal',
  OFFICIAL_TEST_PROVIDER: 'official_test_provider',
  OFFICIAL_SCHOLARSHIP: 'official_scholarship',
  official_university: 'official_university',
  official_government: 'official_government',
  official_authority: 'official_authority',
  official_education_authority: 'official_authority',
  official_admissions_portal: 'official_admissions_portal',
  official_visa_authority: 'official_authority',
  official_test_provider: 'official_test_provider',
  official_scholarship: 'official_scholarship',
};
const SOURCE_PRIORITIES: Record<string, number> = {
  official_university: 1,
  official_government: 2,
  official_authority: 3,
  official_admissions_portal: 4,
  official_test_provider: 5,
  official_scholarship: 6,
};
const SOURCE_CATEGORIES = new Set(['CATALOGUE', 'ADMISSIONS', 'SCHOLARSHIPS', 'VISAS', 'FEES', 'INTAKES', 'REQUIREMENTS', 'POLICY']);
const ENTITY_TYPES = new Set(MONITORABLE_ENTITY_TYPES);
const SOURCE_STATUS_VALUES = new Set(['ACTIVE', 'PAUSED', 'RETIRED', 'BROKEN']);
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function jsonError(error: string, status: number) {
  return NextResponse.json({ success: false, error }, { status });
}

function parseLimit(raw: string | null, fallback: number, max: number): number {
  const parsed = Number.parseInt(raw || '', 10);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(1, parsed)) : fallback;
}

function normalizeSourceType(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const normalized = SOURCE_TYPES[input.trim()];
  return normalized && isOfficialMonitoringSourceType(normalized) ? normalized : null;
}

function normalizeSlug(input: unknown, label: string, required: boolean): string | null {
  if (input === undefined || input === null || input === '') return required ? null : '';
  if (typeof input !== 'string') throw new Error(`${label} must be a string`);
  const slug = input.trim().toLowerCase();
  if (slug.length > 80 || !slugPattern.test(slug)) throw new Error(`${label} must be a valid lowercase slug`);
  return slug;
}

function sourceIdentity(source: {
  sourceUrl: string; entityType: string; universitySlug?: string | null;
  courseSlug?: string | null; countrySlug?: string | null; category?: string | null;
}) {
  return {
    sourceUrl: source.sourceUrl,
    entityType: source.entityType,
    universitySlug: source.universitySlug,
    courseSlug: source.courseSlug,
    countrySlug: source.countrySlug,
    dataSection: source.category,
  };
}

// GET /api/university-monitoring/sources — staff-only source registry.
export async function GET(req: NextRequest) {
  const guard = await requireMonitoringViewer(req);
  if (!guard.ok) return guard.response;

  const params = req.nextUrl.searchParams;
  const entityType = params.get('entityType');
  const countrySlug = params.get('country')?.trim().toLowerCase();
  const universitySlug = params.get('university')?.trim().toLowerCase();
  const status = params.get('status');
  const sourceType = params.get('sourceType');
  const q = params.get('q')?.trim();
  const limit = parseLimit(params.get('limit'), 100, 500);
  if (entityType && !ENTITY_TYPES.has(entityType)) return jsonError('Invalid entityType filter', 400);
  if (status && !SOURCE_STATUS_VALUES.has(status)) return jsonError('Invalid status filter', 400);

  const where: Record<string, unknown> = {};
  if (entityType) where.entityType = entityType;
  if (countrySlug) where.countrySlug = countrySlug;
  if (universitySlug) where.universitySlug = universitySlug;
  if (status) where.status = status;
  if (sourceType) where.sourceType = sourceType;
  if (q) {
    where.OR = [
      { sourceName: { contains: q } },
      { sourceUrl: { contains: q } },
    ];
  }

  const [sources, total] = await Promise.all([
    db.officialSource.findMany({
      where,
      orderBy: [{ priority: 'asc' }, { sourceName: 'asc' }],
      take: limit,
      select: {
        id: true, sourceUrl: true, sourceName: true, sourceType: true, category: true, priority: true,
        entityType: true, universitySlug: true, courseSlug: true, countrySlug: true,
        monitoringEnabled: true, checkFrequencyDays: true, verificationStatus: true,
        verifiedBy: true, sourceFingerprint: true,
        lastCheckedAt: true, lastVerifiedAt: true, lastHttpStatus: true, lastContentHash: true,
        lastError: true, consecutiveFailures: true, status: true, discoveredAt: true,
        _count: { select: { snapshots: true, changes: true, documents: true } },
      },
    }),
    db.officialSource.count({ where }),
  ]);

  const canManage = guard.actor.userType === 'SUPER_ADMIN' || guard.actor.auth.roles.some((role) => ['SUPER_ADMIN', 'super_admin'].includes(role));
  return NextResponse.json({ success: true, sources, total, canManage });
}

// POST — register a source candidate. Registration is NOT verification and does
// not activate polling; an authorized Super Admin must probe and confirm it.
export async function POST(req: NextRequest) {
  const guard = await requireMonitoringAdmin(req);
  if (!guard.ok) return guard.response;
  if (!mutationOriginAllowed(req, guard.actor.auth)) return jsonError('Cross-origin source changes are not allowed', 403);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('A JSON object is required', 400);

  let sourceUrl: string;
  let universitySlug: string | null;
  let courseSlug: string | null;
  let countrySlug: string | null;
  let sourceName: string;
  let category: string | null;
  try {
    sourceUrl = normalizeOfficialSourceUrl(body.sourceUrl);
    sourceName = typeof body.sourceName === 'string' ? body.sourceName.trim() : '';
    if (!sourceName || sourceName.length > 180) return jsonError('sourceName is required and must be 180 characters or fewer', 400);
    universitySlug = normalizeSlug(body.universitySlug, 'universitySlug', body.entityType === 'UNIVERSITY' || body.entityType === 'COURSE');
    courseSlug = normalizeSlug(body.courseSlug, 'courseSlug', body.entityType === 'COURSE');
    countrySlug = normalizeSlug(body.countrySlug, 'countrySlug', ['COUNTRY', 'GOVERNMENT', 'AUTHORITY'].includes(String(body.entityType)));
    const rawCategory = typeof body.category === 'string' ? body.category.trim().toUpperCase() : '';
    if (rawCategory && !SOURCE_CATEGORIES.has(rawCategory)) throw new Error('Unsupported source category');
    category = rawCategory || null;
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Invalid source data', 400);
  }

  const entityType = typeof body.entityType === 'string' ? body.entityType.trim().toUpperCase() : '';
  if (!ENTITY_TYPES.has(entityType)) return jsonError('entityType must be UNIVERSITY, COURSE, COUNTRY, GOVERNMENT, or AUTHORITY', 400);
  if (entityType === 'COURSE' && (!universitySlug || !courseSlug)) return jsonError('COURSE sources require both universitySlug and courseSlug', 400);
  if (['GOVERNMENT', 'AUTHORITY', 'COUNTRY'].includes(entityType) && !countrySlug) return jsonError(`${entityType} sources require countrySlug`, 400);

  const sourceType = normalizeSourceType(body.sourceType);
  if (!sourceType) return jsonError('sourceType must identify an official university, government, authority, admissions, test-provider, or scholarship source', 400);
  if (entityType === 'GOVERNMENT' && sourceType !== 'official_government') return jsonError('GOVERNMENT sources must use official_government type', 400);
  if (entityType === 'AUTHORITY' && sourceType !== 'official_authority') return jsonError('AUTHORITY sources must use official_authority type', 400);

  const checkFrequencyDays = body.checkFrequencyDays === undefined ? 7 : Number(body.checkFrequencyDays);
  if (!Number.isInteger(checkFrequencyDays) || checkFrequencyDays < 1 || checkFrequencyDays > 365) {
    return jsonError('checkFrequencyDays must be an integer from 1 to 365', 400);
  }
  const priority = body.priority === undefined ? SOURCE_PRIORITIES[sourceType] : Number(body.priority);
  if (!Number.isInteger(priority) || priority < 1 || priority > 6) return jsonError('priority must be an integer from 1 to 6', 400);

  const identity = { sourceUrl, entityType, universitySlug, courseSlug, countrySlug, category };
  const sourceFingerprint = buildOfficialSourceFingerprint(sourceIdentity(identity));
  const duplicate = await db.officialSource.findUnique({ where: { sourceFingerprint }, select: { id: true } });
  if (duplicate) return jsonError('This canonical source and target are already registered', 409);

  try {
    const source = await db.$transaction(async (tx) => {
      const created = await tx.officialSource.create({
        data: {
          sourceUrl,
          sourceFingerprint,
          sourceName,
          sourceTitle: sourceName,
          sourceType,
          targetType: entityType.toLowerCase(),
          targetSlug: courseSlug || universitySlug || countrySlug || '',
          dataSection: category || '',
          category,
          entityType,
          universitySlug,
          courseSlug,
          countrySlug,
          priority,
          checkFrequencyDays,
          monitoringEnabled: false,
          status: 'PAUSED',
          verificationStatus: 'pending',
          verifiedBy: '',
        },
      });
      await tx.auditLog.create({
        data: {
          userId: guard.actor.userId,
          action: 'OFFICIAL_SOURCE_CANDIDATE_REGISTERED',
          resource: 'OfficialSource',
          resourceId: created.id,
          details: JSON.stringify({ sourceName, sourceUrl, sourceType, entityType, universitySlug, courseSlug, countrySlug, category }),
        },
      });
      await tx.monitoringLog.create({
        data: {
          level: 'AUDIT',
          message: `Official source candidate registered by Super Admin: ${sourceName}. It remains paused until separately verified.`,
          entityType,
          entitySlug: courseSlug || universitySlug || countrySlug,
          sourceUrl,
          metadata: JSON.stringify({ sourceId: created.id, sourceType, category, status: created.status, verificationStatus: created.verificationStatus }),
        },
      });
      return created;
    });

    return NextResponse.json({ success: true, source, message: 'Source candidate registered in PAUSED state. Verify ownership before enabling monitoring.' }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return jsonError('This canonical source and target are already registered', 409);
    }
    throw error;
  }
}

// PATCH — verify, pause, retire, or change cadence for one source.
export async function PATCH(req: NextRequest) {
  const guard = await requireMonitoringAdmin(req);
  if (!guard.ok) return guard.response;
  if (!mutationOriginAllowed(req, guard.actor.auth)) return jsonError('Cross-origin source changes are not allowed', 403);

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonError('A JSON object is required', 400);
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  const action = typeof body.action === 'string' ? body.action.trim().toUpperCase() : '';
  if (!id || !action) return jsonError('id and action are required', 400);

  const source = await db.officialSource.findUnique({ where: { id } });
  if (!source) return jsonError('Source not found', 404);

  if (action === 'VERIFY_SOURCE') {
    if (body.confirmedOfficialOwnership !== true) return jsonError('Explicitly confirm that this URL is an official source for the selected university, course, authority, or country', 400);
    if (source.status === 'RETIRED') return jsonError('Retired sources cannot be reactivated; register a new source candidate instead', 409);
    if (!isOfficialMonitoringSourceType(source.sourceType)) return jsonError('This source type is not allowed for automated monitoring', 409);

    const probe = await fetchSourceContent(source.sourceUrl);
    const readableText = probe.ok ? extractVisibleText(probe.text || '') : '';
    if (!probe.ok || readableText.trim().length < 20) {
      const failureReason = probe.ok ? 'Fetched page contained too little readable text to verify safely' : probe.error || 'Source probe failed';
      await db.$transaction([
        db.officialSource.update({
          where: { id },
          data: {
            monitoringEnabled: false,
            status: 'PAUSED',
            verificationStatus: 'failed',
            lastCheckedAt: new Date(),
            lastHttpStatus: probe.status || null,
            lastError: failureReason.slice(0, 500),
            consecutiveFailures: { increment: 1 },
          },
        }),
        db.auditLog.create({
          data: {
            userId: guard.actor.userId,
            action: 'OFFICIAL_SOURCE_VERIFICATION_FAILED',
            resource: 'OfficialSource',
            resourceId: id,
            details: JSON.stringify({ sourceUrl: source.sourceUrl, httpStatus: probe.status, error: failureReason }),
          },
        }),
        db.monitoringLog.create({
          data: {
            level: 'WARN',
            message: `Official source verification probe failed for ${source.sourceUrl}: ${failureReason}`,
            entityType: source.entityType,
            entitySlug: source.courseSlug || source.universitySlug || source.countrySlug,
            sourceUrl: source.sourceUrl,
            metadata: JSON.stringify({ sourceId: id, httpStatus: probe.status, actorId: guard.actor.userId }),
          },
        }),
      ]);
      return NextResponse.json({ success: false, error: failureReason, sourceId: id, httpStatus: probe.status }, { status: 422 });
    }

    const sourceFingerprint = buildOfficialSourceFingerprint(sourceIdentity(source));
    try {
      const updated = await db.$transaction(async (tx) => {
        const verified = await tx.officialSource.update({
          where: { id },
          data: {
            sourceFingerprint,
            verificationStatus: 'verified',
            verifiedBy: guard.actor.userId,
            lastVerifiedAt: new Date(),
            lastCheckedAt: new Date(),
            lastHttpStatus: probe.status,
            lastError: null,
            consecutiveFailures: 0,
            status: 'ACTIVE',
            monitoringEnabled: true,
          },
        });
        await tx.auditLog.create({
          data: {
            userId: guard.actor.userId,
            action: 'OFFICIAL_SOURCE_VERIFIED',
            resource: 'OfficialSource',
            resourceId: id,
            details: JSON.stringify({ sourceUrl: source.sourceUrl, finalUrl: probe.finalUrl, httpStatus: probe.status, sourceName: source.sourceName }),
          },
        });
        await tx.monitoringLog.create({
          data: {
            level: 'AUDIT',
            message: `Super Admin verified official source ownership and connectivity for ${source.sourceName}; factual page contents remain unverified and require snapshot/review.`,
            entityType: source.entityType,
            entitySlug: source.courseSlug || source.universitySlug || source.countrySlug,
            sourceUrl: probe.finalUrl || source.sourceUrl,
            metadata: JSON.stringify({ sourceId: id, configuredUrl: source.sourceUrl, finalUrl: probe.finalUrl, status: probe.status, actorId: guard.actor.userId }),
          },
        });
        return verified;
      });
      return NextResponse.json({
        success: true,
        source: updated,
        probe: { status: probe.status, finalUrl: probe.finalUrl, pageTitle: probe.title || null, contentType: probe.contentType, readableCharacters: readableText.length },
        message: 'Source ownership and connectivity recorded; extracted facts still require separate human review.',
      });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && (error as { code?: string }).code === 'P2002') {
        return jsonError('Another source already represents this canonical URL and target', 409);
      }
      throw error;
    }
  }

  if (action === 'PAUSE' || action === 'RETIRE' || action === 'UPDATE_CONFIG') {
    const data: Record<string, unknown> = {};
    if (action === 'PAUSE') {
      data.status = 'PAUSED';
      data.monitoringEnabled = false;
    } else if (action === 'RETIRE') {
      data.status = 'RETIRED';
      data.monitoringEnabled = false;
    } else {
      if (body.checkFrequencyDays !== undefined) {
        const value = Number(body.checkFrequencyDays);
        if (!Number.isInteger(value) || value < 1 || value > 365) return jsonError('checkFrequencyDays must be an integer from 1 to 365', 400);
        data.checkFrequencyDays = value;
      }
      if (body.priority !== undefined) {
        const value = Number(body.priority);
        if (!Number.isInteger(value) || value < 1 || value > 6) return jsonError('priority must be an integer from 1 to 6', 400);
        data.priority = value;
      }
      if (Object.keys(data).length === 0) return jsonError('UPDATE_CONFIG requires checkFrequencyDays or priority', 400);
    }

    const updated = await db.$transaction(async (tx) => {
      const saved = await tx.officialSource.update({ where: { id }, data });
      await tx.auditLog.create({
        data: {
          userId: guard.actor.userId,
          action: `OFFICIAL_SOURCE_${action}`,
          resource: 'OfficialSource',
          resourceId: id,
          details: JSON.stringify(data),
        },
      });
      await tx.monitoringLog.create({
        data: {
          level: 'AUDIT',
          message: `Official source ${source.sourceName} changed by Super Admin: ${action}.`,
          entityType: source.entityType,
          entitySlug: source.courseSlug || source.universitySlug || source.countrySlug,
          sourceUrl: source.sourceUrl,
          metadata: JSON.stringify({ sourceId: id, changes: data, actorId: guard.actor.userId }),
        },
      });
      return saved;
    });
    return NextResponse.json({ success: true, source: updated, message: `Source ${action.toLowerCase()} completed` });
  }

  return jsonError('action must be VERIFY_SOURCE, PAUSE, RETIRE, or UPDATE_CONFIG', 400);
}
