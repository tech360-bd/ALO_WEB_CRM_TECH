import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { AuthContext } from '@/lib/auth-middleware';
import { isMarketingManager, withMarketingAccess } from '@/lib/marketing/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Approved content library; employees with limited access can only see publish-approved items.
export const GET = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const params = new URL(req.url).searchParams;
  const requestedStatus = params.get('status') || 'APPROVED';
  const platform = params.get('platform');
  const query = (params.get('q') || '').trim().slice(0, 120);
  const where: Record<string, unknown> = {};
  if (!isMarketingManager(auth)) {
    where.approvalStatus = { in: ['APPROVED', 'PUBLISHED'] };
  } else if (requestedStatus === 'ALL') {
    where.approvalStatus = { in: ['APPROVED', 'PUBLISHED', 'SCHEDULED'] };
  } else if (requestedStatus) {
    where.approvalStatus = requestedStatus;
  }
  if (platform) where.platform = platform;
  if (query) where.title = { contains: query };
  try {
    const [posts, assets] = await Promise.all([
      db.campaignPost.findMany({ where, orderBy: { approvedAt: 'desc' }, take: 50 }),
      db.marketingAsset.findMany({ where: { status: 'active' }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    return NextResponse.json({ success: true, posts, assets, hint: 'Create a draft only; a Marketing Manager approval and verified official provider are required before posting.' });
  } catch (error) {
    console.error('[marketing.library] load failed', { error: error instanceof Error ? error.name : 'UnknownError' });
    return NextResponse.json({ success: false, error: 'Unable to load approved marketing content.' }, { status: 503 });
  }
}, 'draft-post');
