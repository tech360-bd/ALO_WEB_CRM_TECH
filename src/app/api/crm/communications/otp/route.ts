import { NextRequest, NextResponse } from 'next/server';
import { generateOtp, verifyOtp, isPhoneBlocked } from '@/lib/communication/otp-engine';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, phone, otp, ownerType, ownerId, purpose } = body;
    if (!phone) return NextResponse.json({ success:false, error:'phone required' }, { status:400 });

    if (action === 'send') {
      if (await isPhoneBlocked(phone)) return NextResponse.json({ success:false, error:'Phone blocked due to too many failed attempts. Try after 30 minutes.' }, { status:429 });
      const result = await generateOtp({ ownerType: ownerType || 'student', ownerId: ownerId || phone, phone, purpose: purpose || 'private_data_verification' });
      return NextResponse.json({ success:true, message:'OTP sent', expiresAt: result.expiresAt, devOtp: result.otpForDevOnly });
    }
    if (action === 'verify') {
      if (!otp) return NextResponse.json({ success:false, error:'otp required' }, { status:400 });
      const result = await verifyOtp({ phone, otp, purpose });
      return NextResponse.json(result);
    }
    return NextResponse.json({ success:false, error:'Unknown action: send | verify' }, { status:400 });
  } catch (e:any) {
    return NextResponse.json({ success:false, error:e.message }, { status:400 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ success:true, message:'OTP: send with {action:send, phone}, verify with {action:verify, phone, otp}. Blocks after 5 failures, audit logged, never expose without verification.' });
}
