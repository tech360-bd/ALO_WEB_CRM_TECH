import { NextResponse } from 'next/server';
import { AuthContext } from '@/lib/auth-middleware';
import { withMarketingAccess } from '@/lib/marketing/access';
import { mutationOriginAllowed } from '@/lib/request-origin';
import {
  checkProviderEnv,
  inspectSocialProviderHealth,
  isSocialOAuthProvider,
  type SocialPublishPlatform,
} from '@/lib/social/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withMarketingAccess(async (
  request: Request,
  auth: AuthContext,
  context?: { params: Promise<{ provider: string }> },
) => {
  if (!mutationOriginAllowed(request, auth)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  }

  const { provider: rawProvider } = await context!.params;
  const provider = (rawProvider || '').trim().toLowerCase();
  const body = (await request.json().catch(() => ({}))) as { live?: boolean };
  const liveProbe = body.live === true;

  if (provider === 'facebook' || isSocialOAuthProvider(provider)) {
    const report = await inspectSocialProviderHealth(provider as SocialPublishPlatform, liveProbe);
    return NextResponse.json({ success: true, report });
  }

  if (provider === 'whatsapp' || provider === 'opensms') {
    const envCheck = checkProviderEnv(provider);
    return NextResponse.json({
      success: true,
      report: {
        provider,
        status: envCheck.configured ? 'STORED_READY' : 'NOT_CONFIGURED',
        envConfigured: envCheck.configured,
        missingEnv: envCheck.missingEnv,
        connectedAccount: null,
        tokenExpiresAt: null,
        lastSyncAt: null,
        liveChecked: false,
        note: envCheck.configured
          ? `${provider.toUpperCase()} environment variables are configured; live gateway dispatch is not tested by health check.`
          : `Configure ${envCheck.missingEnv.join(', ')} in server environment settings.`,
      },
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Unsupported provider. Supported: facebook, instagram, linkedin, youtube, whatsapp, opensms.',
    },
    { status: 400 },
  );
}, 'manager');
