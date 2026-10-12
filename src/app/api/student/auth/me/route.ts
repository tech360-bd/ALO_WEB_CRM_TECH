import { NextResponse } from 'next/server';
import { authenticateStudentRequest } from '@/lib/student-auth';
import { safeStudentSelect } from '@/lib/student/public-profile';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const auth = await authenticateStudentRequest(req);
    if (auth instanceof NextResponse) return auth;
    const student = await db.student.findUnique({where:{id:auth.studentId}, select:safeStudentSelect});
    if (!student) return NextResponse.json({success:false,error:'Student not found'},{status:404});
    const [applicationsCount, documentsCount, unreadMessagesCount] = await Promise.all([
      db.application.count({where:{studentId:student.id}}),
      db.document.count({where:{studentId:student.id}}),
      db.communicationMessage.count({where:{studentId:student.id, isRead:false, direction:'outbound'}}),
    ]);
    // Preserve old data alias while providing the layout's actual contract.
    // Explicit select prevents password/OTP leakage in both shapes.
    return NextResponse.json({success:true,student,unreadMessages:unreadMessagesCount,
      data:{...student,applicationsCount,documentsCount,unreadMessagesCount}}, {headers:{'Cache-Control':'private, no-store'}});
  } catch {
    return NextResponse.json({success:false,error:'Student session data unavailable.'},{status:503});
  }
}
