import { NextRequest, NextResponse } from 'next/server';
import { handleAfterHoursMessage, getOfficeHoursStatus } from '@/lib/communication/after-hours';

export async function GET(request: NextRequest) {
  const status = await getOfficeHoursStatus();
  return NextResponse.json({ success:true, ...status });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await handleAfterHoursMessage({
      channel: body.channel || 'whatsapp',
      senderPhone: body.senderPhone, senderEmail: body.senderEmail,
      message: body.message || '', leadId: body.leadId, studentId: body.studentId
    });
    return NextResponse.json({ success:true, ...result });
  } catch (e:any) {
    return NextResponse.json({ success:false, error:e.message }, { status:500 });
  }
}
