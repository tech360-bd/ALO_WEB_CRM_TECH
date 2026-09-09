import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const PATCH = withAuth(async (req: Request, auth: AuthContext, context?: any) => {
  try {
    const id = context?.params?.id;
    const { stage } = await req.json();

    const updated = await db.visaCase.update({
      where: { id },
      data: { currentStage: stage },
    });

    await db.timelineEvent.create({
      data: {
        studentId: updated.studentId || '',
        stage: 'VISA',
        title: 'Visa Stage Updated',
        description: `Stage changed to ${stage}`,
        actor: auth.name || 'Staff',
      },
    }).catch(() => null);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Update failed' }, { status: 500 });
  }
});
