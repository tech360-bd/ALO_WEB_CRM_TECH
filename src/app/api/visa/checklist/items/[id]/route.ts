import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    const body = await req.json();
    const { status, note } = body;

    const dataToUpdate: any = {};
    if (status !== undefined) {
      dataToUpdate.status = status;
      if (status === 'approved' || status === 'completed') {
        dataToUpdate.completedAt = new Date();
      }
    }
    if (note !== undefined) dataToUpdate.note = note;

    const updated = await db.visaChecklistItem.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Failed' }, { status: 500 });
  }
});
