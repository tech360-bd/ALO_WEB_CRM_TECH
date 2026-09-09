import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, phone } = body;

    if (!email && !phone) {
      return NextResponse.json({ success: false, error: 'Email or phone required' }, { status: 400 });
    }

    const student = await db.student.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined }
        ]
      }
    });

    if (!student) {
      return NextResponse.json({ success: false, error: 'No account found with this phone/email' }, { status: 404 });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.student.update({
      where: { id: student.id },
      data: { otpCode, otpExpiresAt }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent',
      expiresAt: otpExpiresAt.toISOString()
    });

  } catch (error) {
    console.error('OTP error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
