import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOptionalAuth } from '@/lib/auth-middleware';
export async function GET(req: NextRequest) {
  try {
    const auth = await getOptionalAuth(req);
    const userId = auth?.userId || req.nextUrl.searchParams.get('studentId') || 'demo-student';
    const comparison = await db.courseComparisonList.findFirst({ where: { studentId: userId }, orderBy: { updatedAt: 'desc' } }).catch(()=>null);
    if (comparison) {
      const courseIds = (()=>{ try{ return JSON.parse(comparison.courseIds); }catch{ return []; } })();
      const courses = await db.crmCourse.findMany({ where: { courseId: { in: courseIds } }, include: { university: { select: { name: true, country: true } }, intakeFees: { take:1 }, requirements: { take:1 } } }).catch(()=>[]);
      return NextResponse.json({ success: true, courses, total: courses.length, message: 'Compare max sensible number — columns: University, Course, Country, Study level, Duration, Tuition, Scholarship, Deposit, App fee, Intake, Deadline, English, Academic requirement, Eligibility, Match score' });
    }
    const legacy = await db.courseComparison.findFirst({ where: { studentId: userId } }).catch(()=>null);
    if (legacy) {
      const courseIds = (()=>{ try{ return JSON.parse(legacy.courseIds); }catch{ return []; } })();
      const courses = await db.crmCourse.findMany({ where: { courseId: { in: courseIds } } }).catch(()=>[]);
      return NextResponse.json({ success: true, courses, total: courses.length });
    }
    return NextResponse.json({ success: true, courses: [], total: 0, message: 'No courses to compare — add from course finder, max sensible number' });
  } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, courseIds } = body;
    if (!studentId || !Array.isArray(courseIds)) return NextResponse.json({ success:false, error:'studentId and courseIds array required' }, { status:400 });
    if (courseIds.length > 4) return NextResponse.json({ success:false, error:'Compare max sensible number is 4' }, { status:400 });
    const existing = await db.courseComparisonList.findFirst({ where: { studentId } }).catch(()=>null);
    let result;
    if (existing) {
      result = await db.courseComparisonList.update({ where: { id: existing.id }, data: { courseIds: JSON.stringify(courseIds) } });
    } else {
      result = await db.courseComparisonList.create({ data: { studentId, courseIds: JSON.stringify(courseIds) } });
    }
    return NextResponse.json({ success:true, data: result, message: 'Comparison saved — unique per student, max 4 courses' });
  } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
}
