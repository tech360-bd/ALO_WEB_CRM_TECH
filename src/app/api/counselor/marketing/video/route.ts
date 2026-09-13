import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';

export const POST = withAuth(async (req, auth) => {
  try {
    const body = await req.json();
    const { script, campaignId, platform } = body;
    if (!script) return NextResponse.json({ success: false, error: 'script required' }, { status: 400 });

    return NextResponse.json({
      success: true,
      data: {
        id: `vid_req_${Date.now()}`,
        script,
        campaignId,
        platform: platform || 'facebook',
        status: 'pending_approval',
        requestedBy: auth.userId,
        note: 'Video generation request queued - requires approval, brandOverlay, subtitle, thumbnailConcept per spec',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
});
