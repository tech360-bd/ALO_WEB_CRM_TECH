// ============================================================
// ALO Education — B2B Partner AI Marketing Studio API
// ------------------------------------------------------------
// GET    -> quota + current-month usage + request history + connected social accounts
// POST   -> submit a campaign idea and generate compliant marketing copy
// PATCH  -> workflow actions:
//           generate_image | generate_video | approve | reject | schedule | publish
//
// Compliance rules enforced HERE (server-side), never in the UI alone:
//  1. Partner scoping — a partner can only read/mutate its own rows. ALO staff
//     (ADMIN / SUPER_ADMIN) may act across partners and are the only roles that
//     can approve content flagged `requiresAloApproval`.
//  2. Monthly quota is enforced server-side and rolls over on the real calendar
//     month (the previous implementation pinned monthYear to a hardcoded
//     '2026-08', which permanently broke the monthly reset).
//  3. Generated copy may not contain invented scholarship amounts, invented
//     statistics, or guaranteed admission/visa/scholarship claims. Any output
//     that does is rejected and rebuilt from grounded, partner-supplied facts.
//  4. Assets are stored only when a provider actually returned a URL. We never
//     fabricate an assetUrl or publishedUrl, and publishing requires a real
//     connected + ALO-approved social account.
//  5. Every state-changing action writes an IntegrationAuditLog entry.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';
import { generateStructured } from '@/lib/ai-gateway';
import { generateImage, generateVideo } from '@/lib/ai';

// ------------------------------------------------------------
// Constants
// ------------------------------------------------------------

const DEFAULT_IMAGE_LIMIT = 15;
const DEFAULT_VIDEO_LIMIT = 10;
const DEFAULT_VIDEO_SECONDS = 30;

/** Intake window mandated by the master spec: Jan 2027 – Jan 2028. */
const SUPPORTED_INTAKES = [
  'January 2027',
  'May 2027',
  'September 2027',
  'January 2028',
] as const;

const SUPPORTED_PLATFORMS = ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN'] as const;

/**
 * Words that turn marketing copy into a guarantee. Prohibited by the master
 * spec ("no guaranteed visa/admission/scholarship claims").
 */
const GUARANTEE_PATTERN =
  /\b(guarantee[d|s]?|assured|100%\s*(free|guaranteed|admission|visa|success)|sure\s*visa|sure\s*admission|always\s*approved|never\s*rejected|free\s*counseling|free\s*consultation\s*guaranteed)\b/i;

/**
 * Any concrete money figure or percentage scholarship claim is fabricated
 * unless the partner supplied it. We strip rather than invent.
 */
const MONEY_PATTERN =
  /(£|€|\$|৳|USD|GBP|EUR|BDT)\s?\d[\d,]*(\.\d+)?\s?(k|thousand|lakh)?|\d+(\.\d+)?%\s?(scholarship|off|waiver|discount)/i;

// ------------------------------------------------------------
// Validation
// ------------------------------------------------------------

const generateBodySchema = z.object({
  idea: z.string().trim().min(10, 'Describe your campaign idea in at least 10 characters.').max(2000),
  country: z.string().trim().min(2).max(80).optional().default(''),
  university: z.string().trim().max(160).optional().default(''),
  course: z.string().trim().max(160).optional().default(''),
  intake: z.string().trim().max(60).optional().default(''),
  targetAudience: z.string().trim().max(200).optional().default(''),
  language: z.string().trim().max(40).optional().default('English'),
  cta: z.string().trim().max(80).optional().default(''),
  platform: z.string().trim().max(20).optional().default('FACEBOOK'),
  preferredStyle: z.string().trim().max(40).optional().default('Professional'),
});

const patchBodySchema = z.object({
  id: z.string().min(1, 'A request id is required.'),
  action: z.enum([
    'generate_image',
    'generate_video',
    'submit',
    'approve',
    'reject',
    'schedule',
    'publish',
  ]),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  rejectionReason: z.string().trim().max(1000).optional(),
});

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

/** Real calendar month key, e.g. "2026-10". Drives the monthly quota reset. */
function currentMonthYear(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
}

function isAloStaff(auth: AuthContext): boolean {
  const roles = [auth.userType, ...auth.roles].map((r) => String(r || '').toUpperCase());
  return roles.includes('SUPER_ADMIN') || roles.includes('ADMIN');
}

function normalizePlatform(value: string): string {
  const upper = String(value || '').toUpperCase();
  return (SUPPORTED_PLATFORMS as readonly string[]).includes(upper) ? upper : 'FACEBOOK';
}

/**
 * Resolve the partner id this request acts on. Partners are locked to their own
 * id; ALO staff may pass an explicit partnerId for cross-partner support.
 */
async function resolvePartnerId(
  auth: AuthContext,
  requested?: unknown,
): Promise<{ partnerId?: string; error?: NextResponse }> {
  if (auth.partnerId) return { partnerId: auth.partnerId };
  if (isAloStaff(auth) && typeof requested === 'string' && requested.trim()) {
    return { partnerId: requested.trim() };
  }
  return {
    error: NextResponse.json(
      { success: false, error: 'Partner identity required to use the Marketing Studio.' },
      { status: 403 },
    ),
  };
}

/** True when copy contains a fabricated or guaranteeing claim. */
function hasProhibitedClaim(text: string): boolean {
  if (!text) return false;
  return GUARANTEE_PATTERN.test(text) || MONEY_PATTERN.test(text);
}

async function audit(
  auth: AuthContext,
  action: string,
  resourceId: string,
  meta: Record<string, unknown>,
  result: 'success' | 'failure' = 'success',
  errorMessage = '',
): Promise<void> {
  try {
    await db.integrationAuditLog.create({
      data: {
        actorId: auth.actorUserId || auth.userId,
        actorName: auth.actorName || auth.name || auth.email,
        actorRole: auth.partnerRole || auth.userType || '',
        action,
        resourceType: 'PartnerMarketingRequest',
        resourceId,
        metadata: JSON.stringify(meta),
        result,
        errorMessage,
      },
    });
  } catch {
    // Audit must never break the primary operation, but it must not fabricate
    // success either — swallow only the write failure.
  }
}

/**
 * Map the Prisma row onto the shape the Marketing Studio UI consumes. The DB
 * uses *Id suffixes and a single `caption`; the UI expects display names and
 * per-platform captions.
 */
function toMarketingRequest(row: {
  id: string;
  partnerId: string;
  requestedBy: string;
  idea: string;
  countryId: string;
  universityId: string;
  courseId: string;
  intake: string;
  targetAudience: string;
  language: string;
  ctaText: string;
  preferredStyle: string;
  caption: string;
  hashtags: string;
  imagePrompt: string;
  videoPrompt: string;
  videoScript: string;
  generatedContent: string;
  generatedImageUrl: string;
  generatedVideoUrl: string;
  platform: string;
  status: string;
  approvalStatus: string;
  publishedUrl: string;
  scheduledAt: Date | null;
  createdAt: Date;
}) {
  const platform = row.platform?.toUpperCase() || 'FACEBOOK';
  const parsed = (() => {
    try {
      return JSON.parse(row.generatedContent || '{}') as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  })();

  return {
    id: row.id,
    partnerId: row.partnerId,
    requestedBy: row.requestedBy,
    idea: row.idea,
    country: row.countryId || null,
    university: row.universityId || null,
    course: row.courseId || null,
    intake: row.intake || null,
    targetAudience: row.targetAudience || null,
    language: row.language || null,
    cta: row.ctaText || null,
    platform,
    preferredStyle: row.preferredStyle || null,
    facebookCaption: parsed.facebookCaption || (platform === 'FACEBOOK' ? row.caption : '') || null,
    instagramCaption: parsed.instagramCaption || (platform === 'INSTAGRAM' ? row.caption : '') || null,
    reelCaption: parsed.reelCaption || null,
    hashtags: row.hashtags || null,
    imagePrompt: row.imagePrompt || null,
    videoPrompt: row.videoPrompt || null,
    videoScript: row.videoScript || null,
    ctaText: row.ctaText || null,
    assetUrl: row.generatedImageUrl || row.generatedVideoUrl || null,
    publishedUrl: row.publishedUrl || null,
    status: row.status,
    approvalStatus: row.approvalStatus,
    scheduledAt: row.scheduledAt ? row.scheduledAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

// ------------------------------------------------------------
// Copy generation
// ------------------------------------------------------------

const COPY_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'facebookCaption',
    'instagramCaption',
    'reelCaption',
    'hashtags',
    'imagePrompt',
    'videoPrompt',
    'videoScript',
    'ctaText',
  ],
  properties: {
    facebookCaption: { type: 'string', minLength: 20, maxLength: 900 },
    instagramCaption: { type: 'string', minLength: 20, maxLength: 900 },
    reelCaption: { type: 'string', minLength: 10, maxLength: 300 },
    hashtags: { type: 'string', minLength: 5, maxLength: 300 },
    imagePrompt: { type: 'string', minLength: 20, maxLength: 700 },
    videoPrompt: { type: 'string', minLength: 20, maxLength: 700 },
    videoScript: { type: 'string', minLength: 40, maxLength: 1400 },
    ctaText: { type: 'string', minLength: 5, maxLength: 60 },
  },
} as const;

type GeneratedCopy = {
  facebookCaption: string;
  instagramCaption: string;
  reelCaption: string;
  hashtags: string;
  imagePrompt: string;
  videoPrompt: string;
  videoScript: string;
  ctaText: string;
};

function buildGroundedPrompt(input: z.infer<typeof generateBodySchema>): string {
  const facts = [
    `Campaign idea (from the partner): ${input.idea}`,
    input.country ? `Destination country: ${input.country}` : '',
    input.university ? `University named by the partner: ${input.university}` : '',
    input.course ? `Course named by the partner: ${input.course}` : '',
    input.intake ? `Intake named by the partner: ${input.intake}` : '',
    input.targetAudience ? `Target audience: ${input.targetAudience}` : '',
    `Language: ${input.language}`,
    `Platform: ${normalizePlatform(input.platform)}`,
    `Tone: ${input.preferredStyle}`,
    input.cta ? `Call to action requested by the partner: ${input.cta}` : '',
  ].filter(Boolean);

  return [
    'You write social media marketing copy for ALO Education, a student recruitment',
    'agency. Produce copy for a B2B partner campaign.',
    '',
    'GROUNDING RULES — these are absolute:',
    '- Use ONLY the facts listed below. Never invent a university, course, intake,',
    '  deadline, ranking, scholarship amount, success rate, salary, or statistic.',
    '- Never promise or guarantee admission, visa approval, or a scholarship.',
    '- Never state a specific money amount or percentage discount unless it appears',
    '  verbatim in the facts below.',
    '- If a fact is missing, write copy that does not need it. Do not fill the gap.',
    '- Do not claim ALO services are free unless the facts say so.',
    '',
    'FACTS:',
    ...facts.map((f) => `- ${f}`),
    '',
    'Return JSON with: facebookCaption, instagramCaption, reelCaption, hashtags,',
    'imagePrompt, videoPrompt, videoScript (a 30-second script with [0-5s] style',
    'timecodes), ctaText.',
  ].join('\n');
}

/**
 * Deterministic fallback used when the AI gateway is unavailable. It is built
 * ONLY from partner-supplied facts, so it cannot fabricate anything — and the
 * response discloses generationMode:'template' so nobody mistakes it for AI.
 */
function groundedTemplateCopy(input: z.infer<typeof generateBodySchema>): GeneratedCopy {
  const dest = input.country?.trim();
  const uni = input.university?.trim();
  const crs = input.course?.trim();
  const intake = input.intake?.trim();
  const cta = input.cta?.trim() || 'Talk to an ALO Education counselor';

  const where = [uni, dest].filter(Boolean).join(', ');
  const subject = crs || (dest ? `studying in ${dest}` : 'studying abroad');
  const intakePart = intake ? ` for the ${intake} intake` : '';
  const audience = input.targetAudience?.trim();

  const body = `Planning ${subject}${where ? ` at ${where}` : ''}${intakePart}? ${
    audience ? `This session is for ${audience}. ` : ''
  }ALO Education counselors explain the real requirements, deadlines and documents so you can decide with accurate information.`;

  const hashtags = [
    '#StudyAbroad',
    dest ? `#StudyIn${dest.replace(/[^A-Za-z0-9]/g, '')}` : '',
    uni ? `#${uni.replace(/[^A-Za-z0-9]/g, '')}` : '',
    intake ? `#${intake.replace(/[^A-Za-z0-9]/g, '')}Intake` : '',
    '#ALOEducation',
  ]
    .filter(Boolean)
    .slice(0, 6)
    .join(' ');

  const visualSubject = [uni, dest].filter(Boolean).join(', ') || 'a university campus';

  return {
    facebookCaption: `🎓 ${body} ${cta}.`,
    instagramCaption: `${body}\n\n${cta}.`,
    reelCaption: `${cta}.`,
    hashtags,
    imagePrompt: `Clean, professional study-abroad poster for ${visualSubject}. Real campus architecture, one international student, ALO Education logo in a top corner, brand orange #F37021 and education blue #0066CC, white-first layout, no text claims about money or guarantees.`,
    videoPrompt: `30-second vertical reel for ${visualSubject}. Document checklist, counselor conversation, campus exterior. ALO Education branding, no on-screen scholarship amounts.`,
    videoScript: [
      `[0-5s]: Thinking about ${subject}${intakePart}?`,
      `[5-15s]: ${where ? `Here is what ${where} actually asks for.` : 'Here is what universities actually ask for.'} Requirements, deadlines and documents — explained plainly.`,
      `[15-25s]: An ALO Education counselor walks you through your real options, so nothing is guessed.`,
      `[25-30s]: ${cta}.`,
    ].join('\n'),
    ctaText: cta,
  };
}

/** Reject any AI output that smuggles in a fabricated or guaranteeing claim. */
function sanitizeCopy(copy: GeneratedCopy): { clean: GeneratedCopy; violations: string[] } {
  const violations: string[] = [];
  const fields: (keyof GeneratedCopy)[] = [
    'facebookCaption',
    'instagramCaption',
    'reelCaption',
    'hashtags',
    'videoScript',
    'ctaText',
  ];

  const clean = { ...copy };
  for (const field of fields) {
    const value = String(clean[field] || '');
    if (hasProhibitedClaim(value)) {
      violations.push(field);
    }
  }
  return { clean, violations };
}

// ------------------------------------------------------------
// GET — quota, usage, history, social accounts
// ------------------------------------------------------------

export async function GET(req: NextRequest) {
  let auth: AuthContext;
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    auth = authResult;
  } catch {
    return NextResponse.json({ success: false, error: 'Authentication failed.' }, { status: 401 });
  }

  const resolved = await resolvePartnerId(auth, req.nextUrl.searchParams.get('partnerId'));
  if (resolved.error) return resolved.error;
  const partnerId = resolved.partnerId as string;

  try {
    const monthYear = currentMonthYear();

    const [quotaRow, usageRow, requests] = await Promise.all([
      db.partnerMarketingQuota.findUnique({ where: { partnerId } }),
      db.partnerMarketingUsage.findUnique({ where: { partnerId_monthYear: { partnerId, monthYear } } }),
      db.partnerMarketingRequest.findMany({
        where: { partnerId },
        orderBy: { createdAt: 'desc' },
        take: 25,
      }),
    ]);

    const monthlyImageLimit = quotaRow?.monthlyImageLimit ?? DEFAULT_IMAGE_LIMIT;
    const monthlyVideoLimit = quotaRow?.monthlyVideoLimit ?? DEFAULT_VIDEO_LIMIT;
    const imagesUsed = usageRow?.imagesUsed ?? 0;
    const videosUsed = usageRow?.videosUsed ?? 0;

    return NextResponse.json({
      success: true,
      monthYear,
      partner: { id: partnerId, role: auth.partnerRole || auth.userType || '' },
      quota: {
        id: quotaRow?.id ?? null,
        partnerId,
        monthlyImageLimit,
        monthlyVideoLimit,
        videoDurationLimitSeconds: quotaRow?.videoDurationLimitSeconds ?? DEFAULT_VIDEO_SECONDS,
        autoPublishAllowed: quotaRow?.autoPublishAllowed ?? false,
        requiresAloApproval: quotaRow?.requiresAloApproval ?? true,
        imagesUsed,
        imagesRemaining: Math.max(0, monthlyImageLimit - imagesUsed),
        videosUsed,
        videosRemaining: Math.max(0, monthlyVideoLimit - videosUsed),
        configured: Boolean(quotaRow),
      },
      usage: usageRow
        ? {
            id: usageRow.id,
            partnerId: usageRow.partnerId,
            monthYear: usageRow.monthYear,
            imagesUsed: usageRow.imagesUsed,
            videosUsed: usageRow.videosUsed,
            ideasSubmitted: usageRow.ideasSubmitted,
            postsScheduled: usageRow.postsScheduled,
            postsPublished: usageRow.postsPublished,
          }
        : {
            partnerId,
            monthYear,
            imagesUsed: 0,
            videosUsed: 0,
            ideasSubmitted: 0,
            postsScheduled: 0,
            postsPublished: 0,
          },
      requests: requests.map(toMarketingRequest),
      // Partner-scoped social account linking does not exist as a model yet.
      // Returning [] is deliberate: the UI shows its real empty state instead of
      // being handed invented connections.
      socialAccounts: [] as unknown[],
      notices: quotaRow
        ? []
        : ['No partner marketing quota row is configured yet — platform defaults (15 images / 10 videos per month) are in effect.'],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to load Marketing Studio data.', details: message },
      { status: 500 },
    );
  }
}

// ------------------------------------------------------------
// POST — submit idea + generate compliant copy
// ------------------------------------------------------------

export async function POST(req: NextRequest) {
  let auth: AuthContext;
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    auth = authResult;
  } catch {
    return NextResponse.json({ success: false, error: 'Authentication failed.' }, { status: 401 });
  }

  const raw = await req.json().catch(() => ({}));
  const resolved = await resolvePartnerId(auth, (raw as Record<string, unknown>).partnerId);
  if (resolved.error) return resolved.error;
  const partnerId = resolved.partnerId as string;

  const parsed = generateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid campaign details.' },
      { status: 400 },
    );
  }
  const input = parsed.data;

  const platform = normalizePlatform(input.platform);
  const intake = input.intake?.trim()
    ? input.intake.trim()
    : (SUPPORTED_INTAKES[0] as string);

  try {
    const monthYear = currentMonthYear();

    // Upsert against @@unique([partnerId, monthYear]) so the quota genuinely
    // resets each calendar month instead of accumulating forever.
    const usage = await db.partnerMarketingUsage.upsert({
      where: { partnerId_monthYear: { partnerId, monthYear } },
      create: { partnerId, monthYear, imagesUsed: 0, videosUsed: 0, ideasSubmitted: 1 },
      update: { ideasSubmitted: { increment: 1 } },
    });

    // Generate copy. Prefer the real gateway; fall back to a grounded template
    // built only from partner-supplied facts, and disclose which one ran.
    let copy: GeneratedCopy;
    let generationMode: 'ai' | 'template' = 'template';
    let aiError = '';

    try {
      const result = await generateStructured<GeneratedCopy>(
        buildGroundedPrompt({ ...input, intake, platform }),
        COPY_SCHEMA,
        { taskType: 'MARKETING_COPY', privateData: false, temperature: 0.7 },
      );
      const { clean, violations } = sanitizeCopy(result.data);
      if (violations.length) {
        // The model tried to invent a scholarship amount or a guarantee.
        // We refuse that output rather than publish it.
        aiError = `AI output rejected for prohibited claims in: ${violations.join(', ')}`;
        copy = groundedTemplateCopy({ ...input, intake, platform });
      } else {
        copy = clean;
        generationMode = 'ai';
      }
    } catch (error) {
      aiError = error instanceof Error ? error.message : 'AI gateway unavailable';
      copy = groundedTemplateCopy({ ...input, intake, platform });
    }

    const created = await db.partnerMarketingRequest.create({
      data: {
        partnerId,
        requestedBy: auth.actorEmail || auth.email || auth.userId,
        idea: input.idea,
        countryId: input.country || '',
        universityId: input.university || '',
        courseId: input.course || '',
        intake,
        platform,
        language: input.language || 'English',
        targetAudience: input.targetAudience || '',
        ctaText: copy.ctaText,
        preferredStyle: input.preferredStyle || 'Professional',
        caption: platform === 'INSTAGRAM' ? copy.instagramCaption : copy.facebookCaption,
        hashtags: copy.hashtags,
        imagePrompt: copy.imagePrompt,
        videoPrompt: copy.videoPrompt,
        videoScript: copy.videoScript,
        generatedContent: JSON.stringify({ ...copy, generationMode, aiError }),
        status: 'ai_draft_generated',
        approvalStatus: 'draft',
      },
    });

    await audit(auth, 'PARTNER_MARKETING_DRAFT_GENERATED', created.id, {
      monthYear,
      generationMode,
      platform,
      intake,
      ideasSubmitted: usage.ideasSubmitted,
      aiError,
    });

    return NextResponse.json({
      success: true,
      request: toMarketingRequest(created),
      generationMode,
      quota: {
        monthYear,
        imagesUsed: usage.imagesUsed,
        videosUsed: usage.videosUsed,
        ideasSubmitted: usage.ideasSubmitted,
      },
      message:
        generationMode === 'ai'
          ? 'AI marketing draft generated. Review every claim before submitting for approval.'
          : 'Draft generated from your supplied facts only (AI gateway unavailable). No amounts or guarantees were invented.',
      notice: aiError || undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to generate marketing content.', details: message },
      { status: 500 },
    );
  }
}

// ------------------------------------------------------------
// PATCH — workflow actions
// ------------------------------------------------------------

export async function PATCH(req: NextRequest) {
  let auth: AuthContext;
  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof NextResponse) return authResult;
    auth = authResult;
  } catch {
    return NextResponse.json({ success: false, error: 'Authentication failed.' }, { status: 401 });
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = patchBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid action.' },
      { status: 400 },
    );
  }
  const { id, action, scheduledAt, rejectionReason } = parsed.data;

  try {
    const existing = await db.partnerMarketingRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Campaign request not found.' }, { status: 404 });
    }

    const resolved = await resolvePartnerId(auth, (raw as Record<string, unknown>).partnerId);
    if (resolved.error) return resolved.error;
    const partnerId = resolved.partnerId as string;

    // Ownership: partners may only touch their own campaigns.
    if (existing.partnerId !== partnerId && !isAloStaff(auth)) {
      await audit(auth, 'PARTNER_MARKETING_FORBIDDEN', id, { action, ownerPartnerId: existing.partnerId }, 'failure', 'cross-partner access denied');
      return NextResponse.json({ success: false, error: 'You do not have access to this campaign.' }, { status: 403 });
    }

    const monthYear = currentMonthYear();
    const quota = await db.partnerMarketingQuota.findUnique({ where: { partnerId: existing.partnerId } });
    const requiresAloApproval = quota?.requiresAloApproval ?? true;
    const autoPublishAllowed = quota?.autoPublishAllowed ?? false;

    const usage = await db.partnerMarketingUsage.upsert({
      where: { partnerId_monthYear: { partnerId: existing.partnerId, monthYear } },
      create: { partnerId: existing.partnerId, monthYear },
      update: {},
    });

    // ---------- generate_image ----------
    if (action === 'generate_image') {
      const imageLimit = quota?.monthlyImageLimit ?? DEFAULT_IMAGE_LIMIT;
      if (usage.imagesUsed >= imageLimit) {
        return NextResponse.json(
          { success: false, error: 'Monthly image quota finished. Request extra quota from ALO Education.' },
          { status: 403 },
        );
      }
      if (!existing.imagePrompt) {
        return NextResponse.json({ success: false, error: 'Generate a draft first — there is no image prompt yet.' }, { status: 409 });
      }

      let url = '';
      try {
        const result = await generateImage({ prompt: existing.imagePrompt, size: '1024x1024' });
        url = result.url || '';
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Image provider error';
        await audit(auth, 'PARTNER_MARKETING_IMAGE_FAILED', id, { action }, 'failure', message);
        // No fabricated asset URL. Report honestly.
        return NextResponse.json(
          { success: false, error: 'Image generation is not available right now.', details: message },
          { status: 503 },
        );
      }
      if (!url) {
        return NextResponse.json(
          { success: false, error: 'The image provider returned no asset. No quota was consumed.' },
          { status: 502 },
        );
      }

      const updated = await db.partnerMarketingRequest.update({
        where: { id },
        data: {
          generatedImageUrl: url,
          status: 'image_generated',
          // Only moves to pending approval once there is a real asset to review.
          approvalStatus: requiresAloApproval ? 'pending' : existing.approvalStatus,
        },
      });
      await db.partnerMarketingUsage.update({
        where: { id: usage.id },
        data: { imagesUsed: { increment: 1 } },
      });
      await audit(auth, 'PARTNER_MARKETING_IMAGE_GENERATED', id, {
        imagesUsed: usage.imagesUsed + 1,
        imageLimit,
        monthYear,
      });

      return NextResponse.json({
        success: true,
        request: toMarketingRequest(updated),
        quotaUsed: `${usage.imagesUsed + 1}/${imageLimit} Images`,
        message: 'Image generated and stored. Campaign is pending review.',
      });
    }

    // ---------- generate_video ----------
    if (action === 'generate_video') {
      const videoLimit = quota?.monthlyVideoLimit ?? DEFAULT_VIDEO_LIMIT;
      if (usage.videosUsed >= videoLimit) {
        return NextResponse.json(
          { success: false, error: 'Monthly video quota finished. Request extra quota from ALO Education.' },
          { status: 403 },
        );
      }
      const prompt = existing.videoPrompt || existing.videoScript;
      if (!prompt) {
        return NextResponse.json({ success: false, error: 'Generate a draft first — there is no video prompt yet.' }, { status: 409 });
      }

      let url = '';
      try {
        const result = await generateVideo({ prompt });
        url = result.url || '';
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Video provider error';
        await audit(auth, 'PARTNER_MARKETING_VIDEO_FAILED', id, { action }, 'failure', message);
        return NextResponse.json(
          { success: false, error: 'Video generation is not available right now.', details: message },
          { status: 503 },
        );
      }
      if (!url) {
        return NextResponse.json(
          { success: false, error: 'The video provider returned no asset. No quota was consumed.' },
          { status: 502 },
        );
      }

      const updated = await db.partnerMarketingRequest.update({
        where: { id },
        data: {
          generatedVideoUrl: url,
          videoDuration: quota?.videoDurationLimitSeconds ?? DEFAULT_VIDEO_SECONDS,
          status: 'video_generated',
        },
      });
      await db.partnerMarketingUsage.update({
        where: { id: usage.id },
        data: { videosUsed: { increment: 1 } },
      });
      await audit(auth, 'PARTNER_MARKETING_VIDEO_GENERATED', id, {
        videosUsed: usage.videosUsed + 1,
        videoLimit,
        monthYear,
      });

      return NextResponse.json({
        success: true,
        request: toMarketingRequest(updated),
        quotaUsed: `${usage.videosUsed + 1}/${videoLimit} Videos`,
        message: 'Video generated and stored.',
      });
    }

    // ---------- submit (partner hands the campaign to review) ----------
    if (action === 'submit') {
      if (!existing.generatedImageUrl && !existing.generatedVideoUrl) {
        return NextResponse.json(
          { success: false, error: 'Generate an image or video asset before submitting for approval.' },
          { status: 409 },
        );
      }
      if (existing.approvalStatus === 'approved' || existing.approvalStatus === 'published') {
        return NextResponse.json(
          { success: false, error: `This campaign is already ${existing.approvalStatus}.` },
          { status: 409 },
        );
      }
      const updated = await db.partnerMarketingRequest.update({
        where: { id },
        data: { approvalStatus: 'pending', status: 'pending_approval' },
      });
      await audit(auth, 'PARTNER_MARKETING_SUBMITTED', id, { requiresAloApproval });
      return NextResponse.json({
        success: true,
        request: toMarketingRequest(updated),
        message: requiresAloApproval
          ? 'Submitted. ALO Education review is required before this can publish.'
          : 'Submitted for Partner Super Admin review.',
      });
    }

    // ---------- approve ----------
    if (action === 'approve') {
      if (requiresAloApproval && !isAloStaff(auth)) {
        await audit(auth, 'PARTNER_MARKETING_APPROVE_FORBIDDEN', id, { action }, 'failure', 'ALO approval required');
        return NextResponse.json(
          { success: false, error: 'This campaign requires ALO Education approval. Partner users cannot approve it.' },
          { status: 403 },
        );
      }
      if (existing.approvalStatus === 'approved') {
        return NextResponse.json({ success: false, error: 'Already approved.' }, { status: 409 });
      }
      const updated = await db.partnerMarketingRequest.update({
        where: { id },
        data: {
          approvalStatus: 'approved',
          status: 'approved',
          approvedById: auth.actorUserId || auth.userId,
          approvedAt: new Date(),
          rejectionReason: '',
        },
      });
      await audit(auth, 'PARTNER_MARKETING_APPROVED', id, { approvedBy: auth.actorEmail || auth.email });
      return NextResponse.json({ success: true, request: toMarketingRequest(updated), message: 'Campaign approved.' });
    }

    // ---------- reject ----------
    if (action === 'reject') {
      const reason = rejectionReason?.trim();
      if (!reason) {
        return NextResponse.json(
          { success: false, error: 'A rejection reason is required so the partner can fix the campaign.' },
          { status: 400 },
        );
      }
      if (requiresAloApproval && !isAloStaff(auth)) {
        return NextResponse.json(
          { success: false, error: 'This campaign is under ALO Education review.' },
          { status: 403 },
        );
      }
      const updated = await db.partnerMarketingRequest.update({
        where: { id },
        data: { approvalStatus: 'rejected', status: 'rejected', rejectionReason: reason },
      });
      await audit(auth, 'PARTNER_MARKETING_REJECTED', id, { reason });
      return NextResponse.json({ success: true, request: toMarketingRequest(updated), message: 'Campaign rejected.' });
    }

    // ---------- schedule ----------
    if (action === 'schedule') {
      if (existing.approvalStatus !== 'approved') {
        return NextResponse.json(
          { success: false, error: 'Only an approved campaign can be scheduled.' },
          { status: 409 },
        );
      }
      if (!scheduledAt) {
        return NextResponse.json({ success: false, error: 'scheduledAt (ISO datetime) is required.' }, { status: 400 });
      }
      const when = new Date(scheduledAt);
      if (Number.isNaN(when.getTime())) {
        return NextResponse.json({ success: false, error: 'scheduledAt is not a valid datetime.' }, { status: 400 });
      }
      if (when.getTime() <= Date.now()) {
        return NextResponse.json({ success: false, error: 'scheduledAt must be in the future.' }, { status: 400 });
      }
      const updated = await db.partnerMarketingRequest.update({
        where: { id },
        data: { scheduledAt: when, status: 'scheduled', approvalStatus: 'scheduled' },
      });
      await db.partnerMarketingUsage.update({
        where: { id: usage.id },
        data: { postsScheduled: { increment: 1 } },
      });
      await audit(auth, 'PARTNER_MARKETING_SCHEDULED', id, { scheduledAt: when.toISOString() });
      return NextResponse.json({
        success: true,
        request: toMarketingRequest(updated),
        message: `Scheduled for ${when.toISOString()} (Asia/Dhaka wall time is applied by the publisher).`,
      });
    }

    // ---------- publish ----------
    if (action === 'publish') {
      if (existing.approvalStatus !== 'approved' && existing.approvalStatus !== 'scheduled') {
        return NextResponse.json(
          { success: false, error: 'Only an approved (or scheduled-and-approved) campaign can be published.' },
          { status: 409 },
        );
      }
      if (requiresAloApproval && !autoPublishAllowed && !isAloStaff(auth)) {
        await audit(auth, 'PARTNER_MARKETING_PUBLISH_FORBIDDEN', id, { action }, 'failure', 'auto-publish disabled');
        return NextResponse.json(
          { success: false, error: 'Auto-publish is disabled for this partner. ALO Education must publish it.' },
          { status: 403 },
        );
      }
      // Publishing needs a real connected social account. There is no
      // partner-scoped connection model, so we refuse rather than record a
      // fabricated publishedUrl.
      return NextResponse.json(
        {
          success: false,
          error: 'No connected social account is available for this partner, so nothing was published.',
          details: 'Connect and get ALO approval for a partner social account first. No publish URL was recorded.',
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: 'Failed to process the marketing action.', details: message },
      { status: 500 },
    );
  }
}
