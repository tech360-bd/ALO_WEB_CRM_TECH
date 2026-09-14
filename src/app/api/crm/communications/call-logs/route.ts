import { NextRequest, NextResponse } from 'next/server';
import { withAuth, logAuditAction } from '@/lib/auth-middleware';
import { db } from '@/lib/db';
import crypto from 'crypto';

export async function GET(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const { searchParams } = new URL(req.url);
      const callType = searchParams.get('callType') || '';
      const outcome = searchParams.get('callOutcome') || '';
      const where: any = {};
      if (callType) where.callType = callType;
      if (outcome) where.callOutcome = outcome;
      const logs = await db.callLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
      return NextResponse.json({ success:true, data: logs });
    } catch (e:any) {
      return NextResponse.json({ success:false, error:e.message }, { status:500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, auth) => {
    try {
      const body = await req.json();
      const callCode = `CALL-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      const log = await db.callLog.create({
        data: {
          callCode,
          leadId: body.leadId || '',
          studentId: body.studentId || '',
          partnerId: body.partnerId || '',
          applicationId: body.applicationId || '',
          phone: body.phone || '',
          callType: body.callType || 'inbound', // inbound/outbound/missed
          callOutcome: body.callOutcome || 'connected', // connected/not_answered/busy/wrong_number/call_back_later/interested/not_interested/converted/complaint
          durationSeconds: body.durationSeconds || 0,
          recordingUrl: body.recordingUrl || '',
          nextFollowupAt: body.nextFollowupAt ? new Date(body.nextFollowupAt) : null,
          note: body.note || '',
          createdBy: auth.userId,
        }
      });
      await logAuditAction(auth, 'create_call_log', 'CallLog', log.id, body);
      // If outcome is missed or not_answered, create callback task
      if (['not_answered','missed','busy','call_back_later'].includes(body.callOutcome)) {
        await db.counselorTask.create({
          data: {
            employeeId: body.assignedTo || auth.userId,
            studentId: body.studentId || '',
            leadId: body.leadId || '',
            title: `Callback: ${body.phone}`,
            description: `Missed/not answered call — outcome: ${body.callOutcome}. Note: ${body.note||''}`,
            priority: 'high',
            type: 'call',
            status: 'pending',
            dueDate: body.nextFollowupAt || new Date(Date.now()+ 2*60*60*1000).toISOString(),
          }
        }).catch(()=>{});
      }
      return NextResponse.json({ success:true, data: log });
    } catch (e:any) {
      return NextResponse.json({ success:false, error:e.message }, { status:500 });
    }
  })(request);
}
