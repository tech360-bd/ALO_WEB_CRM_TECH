import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { AuthContext } from '@/lib/auth-middleware';
import { withMarketingAccess } from '@/lib/marketing/access';
import { mutationOriginAllowed } from '@/lib/request-origin';
import {
  publishToSocialProvider,
  SocialOAuthExchangeError,
  type SocialPublishPlatform,
} from '@/lib/social/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PublishBody = z
  .object({
    platform: z.enum(['facebook', 'instagram', 'linkedin', 'youtube']),
    text: z.string().trim().min(1).max(3000),
    mediaUrl: z.string().trim().max(2048).optional(),
    title: z.string().trim().max(200).optional(),
    contentId: z.string().trim().max(191).optional(),
    calendarId: z.string().trim().max(191).optional(),
  })
  .strict();

export const POST = withMarketingAccess(async (request: Request, auth: AuthContext) => {
  if (auth.actingAsSessionId) {
    return NextResponse.json(
      { success: false, error: 'Acting-as sessions cannot publish to official social channels.' },
      { status: 403 },
    );
  }
  if (!mutationOriginAllowed(request, auth)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  }

  const parsed = PublishBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid publish payload.' },
      { status: 400 },
    );
  }

  const { platform, text, mediaUrl, title, contentId, calendarId } = parsed.data;

  // Enforce human approval gate when publishing generated marketing content.
  if (contentId) {
    const content = await db.marketingGeneratedContent.findUnique({
      where: { id: contentId },
      select: { id: true, status: true },
    });
    if (!content) {
      return NextResponse.json({ success: false, error: 'Referenced content item was not found.' }, { status: 404 });
    }
    if (content.status !== 'approved') {
      return NextResponse.json(
        {
          success: false,
          error: `Content status is "${content.status}". Human approval ("approved") is required before social publishing.`,
        },
        { status: 409 },
      );
    }
  }

  try {
    const result = await publishToSocialProvider({
      platform: platform as SocialPublishPlatform,
      text,
      mediaUrl: mediaUrl || undefined,
      title: title || undefined,
      actorUserId: auth.userId,
      calendarId: calendarId || undefined,
    });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    if (calendarId) {
      await db.marketingCalendar
        .updateMany({
          where: { id: calendarId },
          data: {
            failedAt: new Date(),
            failReason: (error instanceof Error ? error.message : 'Social publish failed').slice(0, 500),
          },
        })
        .catch(() => null);
    }
    if (error instanceof SocialOAuthExchangeError) {
      return NextResponse.json(
        { success: false, published: false, error: error.message },
        { status: error.httpStatus },
      );
    }
    return NextResponse.json(
      { success: false, published: false, error: 'Social publish failed.' },
      { status: 502 },
    );
  }
}, 'manager');
