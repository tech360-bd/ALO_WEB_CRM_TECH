import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireStudentResource } from '@/lib/student-resource-auth';
export async function GET(req: NextRequest) {
  try {
    const access = await requireStudentResource(req, req.nextUrl.searchParams.get('studentId'));
    if (access instanceof NextResponse) return access;
    const userId = access.studentId;
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
    const { studentId: requestedStudentId, courseIds, courseSlug } = body;
    const access = await requireStudentResource(req, requestedStudentId);
    if (access instanceof NextResponse) return access;
    const studentId = access.studentId;
    const normalizedCourseIds = Array.isArray(courseIds) ? courseIds : courseSlug ? [courseSlug] : null;
    if (!normalizedCourseIds) return NextResponse.json({ success:false, error:'courseIds array or courseSlug required' }, { status:400 });
    if (normalizedCourseIds.length > 4) return NextResponse.json({ success:false, error:'Compare max sensible number is 4' }, { status:400 });
    const existing = await db.courseComparisonList.findFirst({ where: { studentId } }).catch(()=>null);
    let result;
    if (existing) {
      result = await db.courseComparisonList.update({ where: { id: existing.id }, data: { courseIds: JSON.stringify(normalizedCourseIds) } });
    } else {
      result = await db.courseComparisonList.create({ data: { studentId, courseIds: JSON.stringify(normalizedCourseIds) } });
    }
    return NextResponse.json({ success:true, data: result, message: 'Comparison saved — unique per student, max 4 courses' });
  } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const access = await requireStudentResource(req, body.studentId);
    if (access instanceof NextResponse) return access;
    const existing = await db.courseComparisonList.findFirst({ where: { studentId: access.studentId } });
    if (!existing) return NextResponse.json({ success: true, removed: false });
    const ids = (() => { try { return JSON.parse(existing.courseIds) as string[]; } catch { return []; } })();
    const nextIds = ids.filter((id) => id !== body.courseSlug);
    await db.courseComparisonList.update({ where: { id: existing.id }, data: { courseIds: JSON.stringify(nextIds) } });
    return NextResponse.json({ success: true, removed: nextIds.length !== ids.length });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unable to update comparison' }, { status: 500 });
  }
}
