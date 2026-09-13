import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth-middleware';

export const GET = withAuth(async (req, auth) => {
  try {
    const inbox = await db.socialInbox.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
    return NextResponse.json({ success: true, inbox, count: inbox.length, note: 'Social inbox comment-to-lead system, official Meta Graph API' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
