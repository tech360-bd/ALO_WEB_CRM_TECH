import { NextResponse } from 'next/server';
import { AuthContext } from '@/lib/auth-middleware';
import { withMarketingAccess } from '@/lib/marketing/access';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Automatic canned rules are not seeded: facts, consent language and provider behavior must be verified first.
export const POST = withMarketingAccess(async () => NextResponse.json({
  success: false,
  seeded: false,
  error: 'Default keyword automation is disabled. No trigger or message was inserted; create a reviewed draft after source and provider verification.',
}, { status: 501 }), 'manager');

export const GET = withMarketingAccess(async (_req: Request, _auth: AuthContext) => NextResponse.json({
  success: true,
  defaults: [],
  missing: [],
  automation: 'NOT_CONFIGURED — no canned production rules are seeded or active',
}), 'manager');
