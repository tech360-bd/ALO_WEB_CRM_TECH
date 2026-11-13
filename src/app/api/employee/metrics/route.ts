import { NextRequest, NextResponse } from 'next/server';
import { GET as getScopedEmployeeDashboard } from '@/app/api/employee/dashboard/route';

// Deprecated compatibility path. It deliberately delegates to the canonical
// authenticated, scope-filtered dashboard API instead of maintaining a second
// query set with different security rules or fabricated counters.
export async function GET(request: NextRequest) {
  const response = await getScopedEmployeeDashboard(request);
  if (!response.ok) return response;

  const payload = await response.json().catch(() => null);
  if (!payload?.success) {
    return NextResponse.json(payload || { success: false, error: 'Employee metrics are unavailable.' }, { status: response.status });
  }

  return NextResponse.json({
    ...payload,
    role: payload.userRole,
    timestamp: new Date().toISOString(),
  }, { status: response.status });
}
