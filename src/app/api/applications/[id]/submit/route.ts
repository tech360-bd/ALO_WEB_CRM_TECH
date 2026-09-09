import { db } from '@/lib/db';
import { NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth, { params }: any) => {
  const body = await req.json();
  
  const receipt = await db.applicationSubmissionReceipt.create({
    data: {
      applicationId: params.id,
      ...body
    }
  });

  await logAuditAction(auth, 'SUBMIT_APPLICATION', 'Application', params.id, body);
  return NextResponse.json({ success: true, data: receipt });
});
