import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
/** SEO operational data is not available to arbitrary authenticated students. */
export async function requireSeoStaff(request: Request) {
  const auth = await authenticateRequest(request);
  if (auth instanceof NextResponse) return auth;
  if (!['ADMIN', 'SUPER_ADMIN', 'MARKETING', 'MARKETING_MANAGER'].includes(auth.userType.toUpperCase())) {
    return NextResponse.json({ error: 'SEO staff access required.' }, { status: 403 });
  }
  if (request.method !== 'GET' && !mutationOriginAllowed(request, auth)) {
    return NextResponse.json({ error: 'Same-origin request required.' }, { status: 403 });
  }
  return auth;
}
