import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth-middleware';
import { getCampaignDetail } from '@/lib/email-marketing/campaigns';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withAuth(async () => {
    const { id } = await context.params;
    const detail = await getCampaignDetail(id);
    if (!detail) return NextResponse.json({ success: false, error: 'NOT_FOUND' }, { status: 404 });
    return NextResponse.json({ success: true, ...detail });
  }, { requirePermissions: ['marketing.email.view'] })(request);
}
