import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { requireCatalogAdmin } from '@/lib/course-finder/catalog-admin-auth';
import { publicCourseWhere, publicIntakeWhere, publicRequirementWhere, publicUniversityWhere } from '@/lib/public-catalog';
import { countMap, courseDuplicateGroups, intakeDuplicateGroups, universityDuplicateGroups } from '@/lib/course-finder/catalog-review-analysis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const query = z.object({
  view: z.enum(['summary', 'records', 'duplicates']).default('summary'),
  entity: z.enum(['university', 'course']).default('university'),
  verification: z.string().trim().max(64).optional(),
  q: z.string().trim().max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/** Upper bound on rows scanned for duplicate analysis; the response says when it was hit. */
const DUPLICATE_SCAN_LIMIT = 5000;

/**
 * GET /api/admin/catalog-review — admin-only, read-only.
 *  view=summary     status counts, how many records the public filter actually exposes, queue counts
 *  view=records     records with provenance fields
 *  view=duplicates  probable duplicates (same rules as import) + open DataConflict rows
 */
export async function GET(req: Request) {
  const auth = await requireCatalogAdmin(req, { level: 'admin', mutation: false });
  if (auth instanceof NextResponse) return auth;
  const parsed = query.safeParse(Object.fromEntries(new URL(req.url).searchParams));
  if (!parsed.success) return NextResponse.json({ success: false, error: 'Invalid review filters' }, { status: 400 });
  const p = parsed.data;
  try {
    if (p.view === 'summary') return NextResponse.json({ success: true, ...(await summary()) });
    if (p.view === 'records') return NextResponse.json({ success: true, ...(await records(p)) });
    return NextResponse.json({ success: true, ...(await duplicates()) });
  } catch (error) {
    console.error('[admin/catalog-review] failed', error instanceof Error ? error.name : 'unknown');
    return NextResponse.json({ success: false, error: 'Catalogue data is unavailable (database query failed). No figures are shown rather than guessed ones.' }, { status: 503 });
  }
}

async function summary() {
  const [uniV, uniP, crsV, crsP, intV, reqV, uniPublic, crsPublic, intPublic, reqPublic, queue, weekly] = await Promise.all([
    db.crmUniversity.groupBy({ by: ['verificationStatus'], _count: { _all: true } }),
    db.crmUniversity.groupBy({ by: ['publicationStatus'], _count: { _all: true } }),
    db.crmCourse.groupBy({ by: ['verificationStatus'], _count: { _all: true } }),
    db.crmCourse.groupBy({ by: ['publicationStatus'], _count: { _all: true } }),
    db.crmCourseIntakeFee.groupBy({ by: ['verificationStatus'], _count: { _all: true } }),
    db.crmCourseRequirement.groupBy({ by: ['verificationStatus'], _count: { _all: true } }),
    db.crmUniversity.count({ where: publicUniversityWhere() }),
    db.crmCourse.count({ where: publicCourseWhere() }),
    db.crmCourseIntakeFee.count({ where: { ...publicIntakeWhere(), course: { is: publicCourseWhere() } } }),
    db.crmCourseRequirement.count({ where: { ...publicRequirementWhere(), course: { is: publicCourseWhere() } } }),
    db.universityUpdateRequest.groupBy({ by: ['status'], _count: { _all: true } }),
    db.weeklyUpdateRequest.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    entities: {
      university: { verification: countMap(uniV, 'verificationStatus'), publication: countMap(uniP, 'publicationStatus'), publiclyVisible: uniPublic },
      course: { verification: countMap(crsV, 'verificationStatus'), publication: countMap(crsP, 'publicationStatus'), publiclyVisible: crsPublic },
      intake: { verification: countMap(intV, 'verificationStatus'), publiclyVisible: intPublic },
      requirement: { verification: countMap(reqV, 'verificationStatus'), publiclyVisible: reqPublic },
    },
    queues: { proposals: countMap(queue, 'status'), weekly: countMap(weekly, 'status') },
    publicRule: 'Public = status active + verificationStatus exactly VERIFIED + published + a source/official URL (+ the parent university public for courses, + the parent course public for intakes/requirements).',
  };
}

async function records(p: z.infer<typeof query>) {
  const where: Record<string, unknown> = {};
  if (p.verification) where.verificationStatus = p.verification;
  if (p.entity === 'university') {
    if (p.q) where.name = { contains: p.q };
    const rows = await db.crmUniversity.findMany({
      where, orderBy: { updatedAt: 'desc' }, take: p.limit,
      select: { universityId: true, name: true, country: true, website: true, officialUrl: true, sourceUrl: true, verificationStatus: true, publicationStatus: true, visibility: true, status: true, lastVerifiedAt: true, lastApprovedUpdateAt: true, updatedBy: true, updatedAt: true },
    });
    return { entity: p.entity, records: rows, count: rows.length };
  }
  if (p.q) where.courseTitle = { contains: p.q };
  const rows = await db.crmCourse.findMany({
    where, orderBy: { updatedAt: 'desc' }, take: p.limit,
    select: { courseId: true, universityId: true, courseTitle: true, studyLevel: true, officialUrl: true, sourceUrl: true, verificationStatus: true, publicationStatus: true, visibility: true, status: true, internationalEligibility: true, lastVerifiedAt: true, lastApprovedUpdateAt: true, updatedBy: true, updatedAt: true },
  });
  return { entity: p.entity, records: rows, count: rows.length };
}

async function duplicates() {
  const [unis, courses, intakes, conflicts] = await Promise.all([
    db.crmUniversity.findMany({ take: DUPLICATE_SCAN_LIMIT, select: { universityId: true, name: true, country: true, website: true, officialUrl: true, verificationStatus: true, publicationStatus: true } }),
    db.crmCourse.findMany({ take: DUPLICATE_SCAN_LIMIT, select: { courseId: true, universityId: true, courseTitle: true, name: true, studyLevel: true, verificationStatus: true } }),
    db.crmCourseIntakeFee.findMany({ take: DUPLICATE_SCAN_LIMIT, select: { id: true, courseId: true, intakeYear: true, intakeMonth: true, verificationStatus: true } }),
    db.dataConflict.findMany({ where: { status: { in: ['PENDING', 'ESCALATED'] } }, orderBy: { detectedAt: 'desc' }, take: 100 }),
  ]);
  return {
    scanLimit: DUPLICATE_SCAN_LIMIT,
    truncated: { universities: unis.length === DUPLICATE_SCAN_LIMIT, courses: courses.length === DUPLICATE_SCAN_LIMIT, intakes: intakes.length === DUPLICATE_SCAN_LIMIT },
    universities: universityDuplicateGroups(unis),
    courses: courseDuplicateGroups(courses),
    intakes: intakeDuplicateGroups(intakes),
    conflicts,
    mergeAvailable: false,
    mergeNote: 'Automatic merge is not available: a safe merge must move every dependent record (courses, intakes, requirements, scholarships, campuses, rankings, commissions) in one audited transaction. Resolve duplicates by correcting or archiving records through review.',
  };
}
