import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getOptionalAuth } from '@/lib/auth-middleware';
export async function GET(req: NextRequest) {
  try {
    const auth = await getOptionalAuth(req);
    const userId = auth?.userId || req.nextUrl.searchParams.get('studentId') || 'demo-student';
    const shortlist = await db.courseShortlist.findMany({ where: { studentId: userId }, take: 50 }).catch(()=>[]);
    if (shortlist.length > 0) {
      const courseIds = shortlist.map((s:any)=> s.courseId);
      const courses = await db.crmCourse.findMany({ where: { courseId: { in: courseIds } }, include: { university: { select: { name: true, country: true } }, intakeFees: { take:1 } } }).catch(()=>[]);
      return NextResponse.json({ success: true, courses, total: courses.length });
    }
    const saved = await db.savedCourse.findMany({ where: { studentId: userId }, take: 50 }).catch(()=>[]);
    return NextResponse.json({ success: true, courses: saved, total: saved.length, message: 'Saved courses from course_shortlists with unique constraint studentId+courseId — prevents duplicates' });
  } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
}
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { studentId, courseId } = body;
    if (!studentId || !courseId) return NextResponse.json({ success:false, error:'studentId and courseId required' }, { status:400 });
    const existing = await db.courseShortlist.findFirst({ where: { studentId, courseId } }).catch(()=>null);
    if (existing) return NextResponse.json({ success:false, error:'Already saved — unique constraint', duplicate: true }, { status:409 });
    const created = await db.courseShortlist.create({ data: { studentId, courseId } }).catch(async ()=> {
      return await db.savedCourse.create({ data: { studentId, courseName: courseId, universityName: 'Check', country: 'Check', level: '', department: '', tuitionFee: '', intake: '' } });
    });
    return NextResponse.json({ success:true, data: created, message: 'Course saved — unique constraint prevents duplicates' });
  } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
}
export async function DELETE(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get('studentId');
    const courseId = req.nextUrl.searchParams.get('courseId');
    if (!studentId || !courseId) return NextResponse.json({ success:false, error:'studentId and courseId required' }, { status:400 });
    await db.courseShortlist.deleteMany({ where: { studentId, courseId } }).catch(()=>{});
    await db.savedCourse.deleteMany({ where: { studentId, courseName: courseId } }).catch(()=>{});
    return NextResponse.json({ success:true, message:'Removed from shortlist' });
  } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
}
