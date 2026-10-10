import { NextRequest, NextResponse } from 'next/server';
import { GET as getPartnerMarketing, POST as createPartnerMarketing } from '@/app/api/partner-admin/marketing/route';

/** Compatibility adapter. Partner Marketing Studio's canonical tenant-safe
 * implementation lives at /api/partner-admin/marketing; keep this older URL
 * working without maintaining a second, divergent quota/workflow service.
 */
function delegatedRequest(request: Request, method: 'GET' | 'POST', body?: Record<string, unknown>) {
  const url = new URL('/api/partner-admin/marketing', request.url);
  if (method === 'GET') url.search = new URL(request.url).search;
  return new NextRequest(url, {
    method,
    headers: request.headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

export async function GET(request: Request) {
  return getPartnerMarketing(delegatedRequest(request, 'GET'));
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: 'A campaign idea is required.' }, { status: 400 });
  }
  const input = body as Record<string, unknown>;
  const canonicalBody: Record<string, unknown> = {
    ...(typeof input.partnerId === 'string' ? { partnerId: input.partnerId } : {}),
    idea: input.idea,
    country: input.country ?? input.countryId,
    university: input.university ?? input.universityId,
    course: input.course ?? input.courseId,
    intake: input.intake,
    platform: input.platform,
    language: input.language,
    targetAudience: input.targetAudience,
    cta: input.cta ?? input.ctaText,
    preferredStyle: input.preferredStyle,
  };
  return createPartnerMarketing(delegatedRequest(request, 'POST', canonicalBody));
}
