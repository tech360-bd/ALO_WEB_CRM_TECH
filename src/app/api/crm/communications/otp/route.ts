import { NextRequest, NextResponse } from 'next/server';
import { generateOtp, verifyOtp, isPhoneBlocked, OtpError } from '@/lib/communication/otp-engine';

function errorResponse(error: unknown) {
  if (error instanceof OtpError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }
  console.error('[crm-otp] unexpected failure', error instanceof Error ? error.name : 'unknown');
  return NextResponse.json({ success: false, error: 'Verification service is temporarily unavailable.' }, { status: 500 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const { action, phone, otp, ownerType, ownerId, purpose } = body || {};
    if (!phone || typeof phone !== 'string') {
      return NextResponse.json({ success: false, error: 'phone required' }, { status: 400 });
    }

    if (action === 'send') {
      if (await isPhoneBlocked(phone)) {
        return NextResponse.json({ success: false, error: 'Phone blocked due to too many failed attempts. Try after 30 minutes.' }, { status: 429 });
      }
      // Success is reported only after the SMS provider accepted the message.
      // The code itself is never included in the response.
      const result = await generateOtp({
        ownerType: typeof ownerType === 'string' ? ownerType : 'student',
        ownerId: typeof ownerId === 'string' && ownerId ? ownerId : phone,
        phone,
        purpose: typeof purpose === 'string' && purpose ? purpose : 'private_data_verification',
      });
      return NextResponse.json({ success: true, message: 'OTP sent', expiresAt: result.expiresAt });
    }

    if (action === 'verify') {
      if (!otp || typeof otp !== 'string') {
        return NextResponse.json({ success: false, error: 'otp required' }, { status: 400 });
      }
      const result = await verifyOtp({
        phone,
        otp,
        purpose: typeof purpose === 'string' && purpose ? purpose : 'private_data_verification',
      });
      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: 'Unknown action: send | verify' }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'OTP: send with {action:"send", phone}, verify with {action:"verify", phone, otp}. Blocks after 5 failed attempts.',
  });
}
