import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCatalogAdmin } from '@/lib/course-finder/catalog-admin-auth';
import { calculateDataQualityScore } from '@/lib/university-course/eligibility-engine';

// Internal catalogue data-quality scores.
//
// Phase 1 (2026-10-12):
//  - Previously ANY authenticated account (including STUDENT and PARTNER)
//    could call GET, and GET wrote to dataQualityScore (an upsert on read).
//  - Both methods now require a catalogue administrator (ADMIN / SUPER_ADMIN).
//  - GET is read-only: it computes and returns a score but never writes.
//  - Persisting a recalculated score is an explicit POST (same-origin only).

type Scored = { entityType: 'course' | 'university'; entityId: string; score: number; grade: string; factors: unknown };

function parseEntity(entityTypeRaw: unknown, entityIdRaw: unknown):
  | { ok: true; entityType: 'course' | 'university'; entityId: string }
  | { ok: false; response: NextResponse } {
  const entityType = entityTypeRaw ?? 'course';
  if (entityType !== 'course' && entityType !== 'university') {
    return { ok: false, response: NextResponse.json({ success: false, error: 'entityType must be course or university' }, { status: 400 }) };
  }
  if (typeof entityIdRaw !== 'string' || !entityIdRaw || entityIdRaw.length > 191) {
    return { ok: false, response: NextResponse.json({ success: false, error: 'entityId is required' }, { status: 400 }) };
  }
  return { ok: true, entityType, entityId: entityIdRaw };
}

/** Compute a score from current records. Performs reads only. */
async function computeScore(entityType: 'course' | 'university', entityId: string): Promise<Scored | null> {
  if (entityType === 'course') {
    const course = await db.crmCourse.findFirst({ where: { OR: [{ courseId: entityId }, { id: entityId }] }, include: { intakeFees: true, requirements: true, scholarshipRecords: true, university: true } });
    if (!course) return null;
    const entryReqs = await db.entryRequirement.findMany({ where: { courseId: course.courseId } }).catch(() => []);
    const englishReqs = await db.englishRequirement.findMany({ where: { courseId: course.courseId } }).catch(() => []);
    const sourceLogs = await db.sourceLog.findMany({ where: { entityType: 'course', entityId: course.courseId } }).catch(() => []);
    const { score, grade, factors } = calculateDataQualityScore(course.university, course, course.intakeFees, entryReqs, englishReqs, course.scholarshipRecords, sourceLogs);
    return { entityType, entityId: course.courseId, score, grade, factors };
  }
  const uni = await db.crmUniversity.findFirst({ where: { OR: [{ universityId: entityId }, { id: entityId }] }, include: { courses: { take: 5 }, scholarshipRecords: { take: 5 } } });
  if (!uni) return null;
  const intakes = await db.crmCourseIntakeFee.findMany({ where: { universityId: uni.universityId }, take: 10 }).catch(() => []);
  const { score, grade, factors } = calculateDataQualityScore(uni, uni, intakes, [], [], uni.scholarshipRecords, []);
  return { entityType, entityId: uni.universityId, score, grade, factors };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await requireCatalogAdmin(req, { level: 'admin', mutation: false });
    if (auth instanceof NextResponse) return auth;
    const params = req.nextUrl.searchParams;
    const parsedLimit = Number.parseInt(params.get('limit') || '20', 10);
    const limit = Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;
    if (params.get('entityId')) {
      const parsed = parseEntity(params.get('entityType') || 'course', params.get('entityId'));
      if (!parsed.ok) return parsed.response;
      const scored = await computeScore(parsed.entityType, parsed.entityId);
      if (!scored) return NextResponse.json({ success: false, error: `${parsed.entityType === 'course' ? 'Course' : 'University'} not found` }, { status: 404 });
      return NextResponse.json({ success: true, ...scored, persisted: false, message: 'Data quality score calculated (not saved). Internal only.' });
    }
    const scores = await db.dataQualityScore.findMany({ orderBy: { score: 'asc' }, take: limit }).catch(() => []);
    return NextResponse.json({ success: true, scores, total: scores.length, message: 'Data quality scores — 90-100 Excellent, 70-89 Good, 50-69 Needs Review, Below 50 Incomplete — internal' });
  } catch (err: unknown) {
    console.error('[data-quality] error', err instanceof Error ? err.name : 'unknown');
    return NextResponse.json({ success: false, error: 'Data quality scores are temporarily unavailable' }, { status: 500 });
  }
}

// Explicitly recalculate and persist one score.
export async function POST(req: NextRequest) {
  try {
    const auth = await requireCatalogAdmin(req, { level: 'admin', mutation: true });
    if (auth instanceof NextResponse) return auth;
    let body: Record<string, unknown>;
    try {
      const raw = await req.json();
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('not an object');
      body = raw as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: 'A JSON object body is required' }, { status: 400 });
    }
    const parsed = parseEntity(body.entityType, body.entityId);
    if (!parsed.ok) return parsed.response;
    const scored = await computeScore(parsed.entityType, parsed.entityId);
    if (!scored) return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });
    const factors = JSON.stringify(scored.factors);
    await db.dataQualityScore.upsert({
      where: { entityType_entityId: { entityType: scored.entityType, entityId: scored.entityId } },
      create: { entityType: scored.entityType, entityId: scored.entityId, score: scored.score, grade: scored.grade, factors },
      update: { score: scored.score, grade: scored.grade, factors, lastCalculatedAt: new Date() },
    });
    return NextResponse.json({ success: true, ...scored, persisted: true });
  } catch (err: unknown) {
    console.error('[data-quality.recalculate] error', err instanceof Error ? err.name : 'unknown');
    return NextResponse.json({ success: false, error: 'Score could not be saved' }, { status: 500 });
  }
}
