import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { db } from '@/lib/db';

// GET /api/admin/search?q=xxx&type=student|university|course|country|batch|update — unified admin search (Part 18)
export const GET = withAuth(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q')||'').trim();
  const type = (searchParams.get('type')||'all').toLowerCase();
  if (!q || q.length<2) return NextResponse.json({ success:false, error:'q must be ≥2 chars' }, { status:400 });
  const like = q;
  const res:any = {};
  try {
    if (type==='all' || type==='student') {
      const students = await db.student.findMany({ where:{ OR:[{ email:{ contains: like }},{ phone:{ contains: like }},{ name:{ contains: like }},{ studentId: like }] }, take:10 }).catch(()=>[]) as any[];
      // augment with import staging search via oldCrmId/pasport
      let staging:any[]=[]; try { staging = await db.importStagingStudent.findMany({ where:{ OR:[{ email:{ contains: like }},{ phone:{ contains: like }},{ oldCrmId: like },{ passportNumber: like }] }, take:5 }); } catch {}
      res.students = students; res.staging = staging;
    }
    if (type==='all' || type==='university') {
      try { res.universities = await db.crmUniversity.findMany({ where:{ OR:[{ name:{ contains: like }},{ universityId: like }] }, take:10 }); } catch { res.universities=[]; }
    }
    if (type==='all' || type==='course') {
      try { res.courses = await db.crmCourse.findMany({ where:{ OR:[{ courseTitle:{ contains: like }},{ courseId: like }] }, take:10 }); } catch { res.courses=[]; }
    }
    if (type==='all' || type==='country') {
      try { res.countries = await db.country.findMany({ where:{ OR:[{ name:{ contains: like }},{ slug: like }] }, take:10 }); } catch { res.countries=[]; }
    }
    if (type==='all' || type==='batch') {
      try { res.batches = await db.importBatch.findMany({ where:{ OR:[{ id: like },{ sourceCrmName:{ contains: like }},{ fileName:{ contains: like }}] }, take:10 }); } catch { res.batches=[]; }
    }
    if (type==='all' || type==='update') {
      try { res.updates = await db.weeklyUpdateRequest.findMany({ where:{ OR:[{ fieldName:{ contains: like }},{ targetName:{ contains: like }}] }, take:10 }); } catch { res.updates=[]; }
    }
    return NextResponse.json({ success:true, q, type, ...res });
  } catch(e:any){ return NextResponse.json({ success:false, error:e.message }, { status:500 }); }
});
