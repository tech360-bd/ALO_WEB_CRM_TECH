import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, AuthContext } from '@/lib/auth-middleware';

export const POST = withAuth(async (request: Request, auth: AuthContext) => {
  try {
    // Next.js dynamic route parameters are available in the request url or context if passed
    // But since withAuth replaces the signature to (request, auth) we need to extract from url
    const url = new URL(request.url);
    const id = url.pathname.split('/').slice(-2, -1)[0]; // /api/admin/import/batches/[id]/approve
    
    if (!auth.roles.includes('super_admin') && !auth.roles.includes('admin')) {
       return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const batch = await db.importBatch.findUnique({ where: { id } });
    if (!batch) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    const updatedBatch = await db.importBatch.update({
      where: { id },
      data: { status: 'approved' },
    });

    await db.crmAuditLog.create({
      data: {
        actorUserId: auth.userId,
        actorRole: auth.roles.join(','),
        action: 'STUDENT_IMPORT_APPROVED',
        batchId: id,
      }
    });

    return NextResponse.json({ success: true, batch: updatedBatch });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
