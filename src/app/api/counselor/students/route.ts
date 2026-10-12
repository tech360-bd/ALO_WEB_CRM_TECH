import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireCanonicalCounselor, counselorStudentScope, safeStudentSelect } from '@/lib/counselor/student-access';
import { canViewUccB2B } from '@/lib/ucc/document-access';

export async function GET(req: NextRequest) {
  const auth = await requireCanonicalCounselor(req);
  if (auth instanceof NextResponse) return auth;
  try {
    const requested = req.nextUrl.searchParams.get('counselorId');
    const scope = counselorStudentScope(auth);
    const rows = await db.student.findMany({
      where: { AND: [scope, requested ? { counselorId: requested } : {}] },
      select: { ...safeStudentSelect, documents:{take:10}, interviewSessions:{take:1}, payments:true },
      orderBy:{updatedAt:'desc'}, take:200,
    });
    const confidential = canViewUccB2B(auth) || !rows.length ? [] : await db.application.findMany({
      where:{studentId:{in:rows.map(row=>row.id)}, isB2bConfidential:true}, select:{studentId:true},
    });
    const hidden = new Set(confidential.map(row=>row.studentId));
    const students = await Promise.all(rows.filter(row=>!hidden.has(row.id)).map(async student => ({
      ...student, fullName:student.name, mobile:student.phone, profileCompletion:student.profileComplete, counselor:student.counselorId ? {id:student.counselorId, name:student.counselorName} : null, applications:await db.application.findMany({ where:{studentId:student.id, ...(canViewUccB2B(auth) ? {} : {isB2bConfidential:false})}, take:1, orderBy:{updatedAt:'desc'} }),
    })));
    return NextResponse.json({ students, limit:200 }, {headers:{'Cache-Control':'private, no-store'}});
  } catch { return NextResponse.json({error:'Student records unavailable.'},{status:503}); }
}
