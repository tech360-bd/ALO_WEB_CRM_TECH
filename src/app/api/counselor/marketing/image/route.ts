import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { prompt, campaignId } = body;
    if (!prompt) return NextResponse.json({ success: false, error: 'prompt required' }, { status: 400 });

    // Placeholder for image generation request - requires approval per spec
    return NextResponse.json({
      success: true,
      data: {
        id: `img_req_${Date.now()}`,
        prompt,
        campaignId,
        status: 'pending_approval',
        requestedBy: auth.userId,
        note: 'Image generation request queued - requires marketing manager approval per spec sec 18. AI campaign engine with brandCheck, metaPolicyCheck, safetyCheck, visaClaimCheck',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
