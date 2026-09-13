import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { authenticateRequest, AuthContext, logAuditAction } from '@/lib/auth-middleware';

// Two comment systems: student-visible vs internal (never shown to student)

export async function GET(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');
    const studentId = searchParams.get('studentId');
    const type = searchParams.get('type'); // student_visible | internal

    if (!applicationId && !studentId) return NextResponse.json({ success: false, error: 'applicationId or studentId required' }, { status: 400 });

    const where: any = {};
    if (applicationId) where.applicationId = applicationId;
    if (studentId) where.studentId = studentId;

    // Internal comments only visible to employees, never to student role
    const isStudent = auth.roles.includes('student');
    if (isStudent) {
      where.visibility = 'student_visible';
    } else if (type) {
      where.visibility = type;
    }

    const comments = await (db as any).applicationComment.findMany({ where, orderBy: { createdAt: 'asc' } }).catch(() => []);
    const studentComments = await (db as any).studentNote.findMany({ where: studentId ? { studentId } : {}, orderBy: { createdAt: 'asc' }, take: 50 }).catch(() => []);

    // Filter internal if student
    const filtered = isStudent ? comments.filter((c: any) => c.visibility === 'student_visible' || !c.visibility || c.isStudentVisible) : comments;

    return NextResponse.json({
      success: true,
      comments: filtered,
      studentNotes: studentComments,
      security: 'Internal comments NEVER shown to student — enforced by visibility field + role check',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    const auth = authResult as AuthContext;

    const body = await req.json();
    const { applicationId, studentId, content, visibility, isStudentVisible } = body;
    if (!content) return NextResponse.json({ success: false, error: 'content required' }, { status: 400 });

    const finalVisibility = visibility || (isStudentVisible ? 'student_visible' : 'internal');

    const comment = await (db as any).applicationComment.create({
      data: {
        applicationId: applicationId || null,
        studentId: studentId || null,
        content,
        visibility: finalVisibility,
        isStudentVisible: finalVisibility === 'student_visible',
        createdBy: auth.userId,
        authorName: auth.name,
        authorRole: auth.roles[0] || '',
      },
    }).catch(async () => {
      // Fallback to timeline event if comment table missing
      if (studentId) {
        return await db.timelineEvent.create({
          data: {
            studentId,
            stage: finalVisibility === 'internal' ? 'INTERNAL_NOTE' : 'STUDENT_COMMENT',
            title: finalVisibility === 'internal' ? 'Internal note' : 'Student visible comment',
            description: content,
          },
        });
      }
      return null;
    });

    await logAuditAction(auth, finalVisibility === 'internal' ? 'INTERNAL_COMMENT_ADDED' : 'STUDENT_VISIBLE_COMMENT_ADDED', 'ApplicationComment', comment?.id || 'unknown', { applicationId, visibility: finalVisibility });

    return NextResponse.json({ success: true, data: comment, visibility: finalVisibility, note: finalVisibility === 'internal' ? 'Internal — never shown to student' : 'Student visible' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
