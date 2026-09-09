import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    const url = new URL(request.url);
    const parts = url.pathname.split('/');
    const id = parts[parts.length - 2];
    
    const body = await request.json();
    const update = await db.universityUpdateRequest.update({
      where: { id },
      data: { status: 'rejected', reviewedBy: auth.userId }
    });
    
    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles.join(','),
        action: 'REJECT_UPDATE',
        targetCollection: 'UniversityUpdateRequest',
        targetId: update.id,
        afterData: JSON.stringify({ reviewNote: body.reviewNote }),
      }
    });

    return NextResponse.json({ success: true, data: update });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
