import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth, { params }: { params: { studentId: string } }) => {
  try {
    const { studentId } = params;
    const drafts = await db.sopDraft.findMany({ where: { studentId }, orderBy: { createdAt: 'desc' } });
    const canSee = auth.roles.includes('counselor') || auth.roles.includes('super_admin') || auth.roles.includes('admin') || auth.roles.includes('application_team') || auth.userId === studentId;
    if (!canSee) {
      // Check if counselor assigned
      const student = await db.student.findUnique({ where: { id: studentId } }).catch(() => null);
      if ((student as any)?.counselorId && (student as any).counselorId !== auth.userId) {
        return NextResponse.json({ success: false, error: 'Not assigned' }, { status: 403 });
      }
    }
    return NextResponse.json({ success: true, drafts, count: drafts.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
