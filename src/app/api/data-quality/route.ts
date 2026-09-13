import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest } from '@/lib/auth-middleware';
import { calculateDataQualityScore } from '@/lib/university-course/eligibility-engine';
export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;
    const entityType = req.nextUrl.searchParams.get('entityType') || 'course';
    const entityId = req.nextUrl.searchParams.get('entityId');
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '20', 10), 100);
    if (entityId) {
      if (entityType === 'course') {
        const course = await db.crmCourse.findFirst({ where: { OR: [{ courseId: entityId }, { id: entityId }] }, include: { intakeFees: true, requirements: true, scholarshipRecords: true, university: true } });
        if (!course) return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
        const entryReqs = await db.entryRequirement.findMany({ where: { courseId: course.courseId } }).catch(() => []);
        const englishReqs = await db.englishRequirement.findMany({ where: { courseId: course.courseId } }).catch(() => []);
        const sourceLogs = await db.sourceLog.findMany({ where: { entityType: 'course', entityId: course.courseId } }).catch(() => []);
        const { score, grade, factors } = calculateDataQualityScore(course.university, course, course.intakeFees, entryReqs, englishReqs, course.scholarshipRecords, sourceLogs);
        await db.dataQualityScore.upsert({
          where: { entityType_entityId: { entityType, entityId: course.courseId } },
          create: { entityType, entityId: course.courseId, score, grade, factors: JSON.stringify(factors) },
          update: { score, grade, factors: JSON.stringify(factors), lastCalculatedAt: new Date() },
        }).catch(() => {});
        return NextResponse.json({ success: true, entityType, entityId: course.courseId, score, grade, factors, message: 'Data quality score calculated — internal unless explicitly configured for public display' });
      } else if (entityType === 'university') {
        const uni = await db.crmUniversity.findFirst({ where: { OR: [{ universityId: entityId }, { id: entityId }] }, include: { courses: { take: 5 }, scholarshipRecords: { take: 5 } } });
        if (!uni) return NextResponse.json({ success: false, error: 'University not found' }, { status: 404 });
        const intakes = await db.crmCourseIntakeFee.findMany({ where: { universityId: uni.universityId }, take: 10 }).catch(() => []);
        const { score, grade, factors } = calculateDataQualityScore(uni, uni, intakes, [], [], uni.scholarshipRecords, []);
        await db.dataQualityScore.upsert({
          where: { entityType_entityId: { entityType, entityId: uni.universityId } },
          create: { entityType, entityId: uni.universityId, score, grade, factors: JSON.stringify(factors) },
          update: { score, grade, factors: JSON.stringify(factors), lastCalculatedAt: new Date() },
        }).catch(() => {});
        return NextResponse.json({ success: true, entityType, entityId: uni.universityId, score, grade, factors });
      }
    }
    const scores = await db.dataQualityScore.findMany({ orderBy: { score: 'asc' }, take: limit }).catch(() => []);
    return NextResponse.json({ success: true, scores, total: scores.length, message: 'Data quality scores — 90-100 Excellent, 70-89 Good, 50-69 Needs Review, Below 50 Incomplete — internal' });
  } catch (err: any) {
    console.error('[data-quality] error', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
