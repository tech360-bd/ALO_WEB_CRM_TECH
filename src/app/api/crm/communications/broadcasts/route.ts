import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { createBroadcast, approveBroadcast, sendBroadcast } from '@/lib/communication/broadcast-engine';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { db } = await import('@/lib/db');
      const { searchParams } = new URL(req.url);
      const status = searchParams.get('status') || '';
      const channel = searchParams.get('channel') || '';
      const where: any = {};
      if (status) where.approvalStatus = status;
      if (channel) where.channel = channel;
      const broadcasts = await db.broadcast.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
      return NextResponse.json({ success: true, data: broadcasts });
    } catch (e:any) {
      return NextResponse.json({ success:false, error:e.message }, { status:500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const { action } = body;
      if (action === 'create') {
        const result = await createBroadcast({
          title: body.title, channel: body.channel, audienceType: body.audienceType,
          audienceFilter: body.audienceFilter, messageBody: body.messageBody,
          createdBy: auth.userId, scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined
        });
        return NextResponse.json({ success:true, ...result });
      }
      if (action === 'approve' || action === 'reject') {
        const result = await approveBroadcast({
          broadcastId: body.broadcastId, approvedBy: auth.userId, approverRole: auth.userType || auth.roles[0],
          approve: action === 'approve', note: body.note
        });
        return NextResponse.json({ success:true, ...result });
      }
      if (action === 'send') {
        const result = await sendBroadcast(body.broadcastId, auth.userId);
        return NextResponse.json({ success:true, ...result });
      }
      return NextResponse.json({ success:false, error:'Unknown action' }, { status:400 });
    } catch (e:any) {
      return NextResponse.json({ success:false, error:e.message }, { status:400 });
    }
  })(request);
}
