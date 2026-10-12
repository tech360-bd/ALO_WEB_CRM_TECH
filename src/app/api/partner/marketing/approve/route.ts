import { NextRequest, NextResponse } from 'next/server';
import { PATCH as patchPartnerMarketing } from '@/app/api/partner-admin/marketing/route';

/**
 * Compatibility adapter: the former endpoint called a partner decision
 * "approve" and sometimes marked the row scheduled without any publisher.
 * That was a false success. This endpoint now only submits a real, asset-backed
 * campaign to the canonical review workflow; it never claims external approval
 * or scheduling.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
  if (!requestId) {
    return NextResponse.json({ success: false, error: 'requestId is required.' }, { status: 400 });
  }

  const delegatedRequest = new NextRequest(new URL('/api/partner-admin/marketing', request.url), {
    method: 'PATCH',
    headers: request.headers,
    body: JSON.stringify({ id: requestId, action: 'submit' }),
  });
  return patchPartnerMarketing(delegatedRequest);
}
