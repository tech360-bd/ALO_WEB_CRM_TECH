import { NextRequest, NextResponse } from 'next/server';
import { PATCH as patchPartnerMarketing } from '@/app/api/partner-admin/marketing/route';

/**
 * Backward-compatible adapter for the retired partner marketing generator.
 * Image/video work is delegated to the canonical partner-admin workflow so it
 * uses the real provider, tenant guard, atomic quota reservation, and audit.
 * Content generation is intentionally not faked here; create a draft through
 * POST /api/partner-admin/marketing instead.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
  const generateType = typeof body?.generateType === 'string' ? body.generateType.trim().toLowerCase() : '';

  if (!requestId || !['image', 'video', 'content'].includes(generateType)) {
    return NextResponse.json(
      { success: false, error: 'requestId and generateType (image, video, or content) are required.' },
      { status: 400 },
    );
  }
  if (generateType === 'content') {
    return NextResponse.json(
      {
        success: false,
        error: 'This legacy content-generation action is retired. Create a compliant draft with POST /api/partner-admin/marketing.',
      },
      { status: 410 },
    );
  }

  const videoDuration = body?.videoDuration;
  if (generateType === 'video' && videoDuration !== undefined &&
      (typeof videoDuration !== 'number' || !Number.isInteger(videoDuration) || videoDuration < 1 || videoDuration > 30)) {
    return NextResponse.json({ success: false, error: 'videoDuration must be an integer from 1 to 30 seconds.' }, { status: 400 });
  }

  const url = new URL('/api/partner-admin/marketing', request.url);
  const delegatedRequest = new NextRequest(url, {
    method: 'PATCH',
    headers: request.headers,
    body: JSON.stringify({
      id: requestId,
      action: generateType === 'image' ? 'generate_image' : 'generate_video',
    }),
  });
  return patchPartnerMarketing(delegatedRequest);
}
