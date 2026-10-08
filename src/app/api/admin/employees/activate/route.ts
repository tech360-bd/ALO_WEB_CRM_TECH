import { NextResponse } from 'next/server';
import { getRequestIp } from '@/lib/auth/email-otp';
import { activateEmployeeAccount } from '@/lib/employees/activation';

// The activation token is the authority for this one-time public capability.
// The route stays available for clients already using this legacy API path.
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
