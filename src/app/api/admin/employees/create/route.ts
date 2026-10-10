import { NextResponse } from 'next/server';
import { withAuth, type AuthContext } from '@/lib/auth-middleware';
import { createEmployeeAccount } from '@/lib/employees/create';

async function handlePost(request: Request, auth: AuthContext) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }
  try {
    const result = await createEmployeeAccount(body as Record<string, unknown>, auth, request);
    if (!result.success) return NextResponse.json({ success: false, error: result.error }, { status: result.status });
    return NextResponse.json({
      success: true,
      message: result.emailSent
        ? 'Employee account created. Activation email was accepted by the configured SMTP provider.'
        : 'Employee account created but SMTP did not accept the activation email. Use the authenticated resend workflow after fixing SMTP.',
      emailSent: result.emailSent,
      ...(result.emailError ? { emailError: result.emailError } : {}),
      data: result.data,
    }, { status: result.status });
  } catch {
    return NextResponse.json({ success: false, error: 'Employee account creation is temporarily unavailable.' }, { status: 503 });
  }
}

export const POST = withAuth(handlePost, { requireRoles: ['super_admin', 'admin'] });
