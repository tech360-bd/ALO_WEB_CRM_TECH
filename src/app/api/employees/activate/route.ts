import { NextResponse } from 'next/server';
import { getRequestIp } from '@/lib/auth/email-otp';
import { activateEmployeeAccount } from '@/lib/employees/activation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const result = await activateEmployeeAccount({
      token: body?.token,
      password: body?.password,
      email: body?.email,
      ipAddress: getRequestIp(request),
      userAgent: request.headers.get('user-agent') || '',
    });
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    return NextResponse.json({ success: true, message: result.message });
  } catch {
    return NextResponse.json({ success: false, error: 'Employee activation is temporarily unavailable.' }, { status: 503 });
  }
}

// Resending tokens is intentionally handled by the authenticated, audited
// /api/admin/employees/resend-activation route; never return bearer tokens here.
export async function PATCH() {
  return NextResponse.json({ success: false, error: 'Use the authenticated employee activation resend workflow.' }, { status: 405 });
}
