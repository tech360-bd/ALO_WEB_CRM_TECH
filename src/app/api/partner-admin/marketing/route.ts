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
import type { PartnerMarketingRequest, Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { authenticateRequest, type AuthContext } from '@/lib/auth-middleware';
import { mutationOriginAllowed } from '@/lib/request-origin';
import { generateStructured } from '@/lib/ai-gateway';
import { generateImage, generateVideo } from '@/lib/ai';
import { releaseQuota, reserveQuota } from '@/lib/access-check-engine';

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
  /\b(guarantee(?:d|s|ing)?|assured|100%\s*(free|guaranteed|admission|visa|success)|sure\s*visa|sure\s*admission|always\s*approved|never\s*rejected)\b/i;
const UNVERIFIED_FREE_CLAIM_PATTERN = /\bfree\b/i;

/** Reject concrete amounts, discounts, and scholarship values absent a verified source. */
const MONEY_PATTERN =
  /(?:£|€|\$|৳|(?:USD|GBP|EUR|BDT)\s?)\s?\d[\d,]*(?:\.\d+)?(?:\s?(?:k|thousand|lakh|million))?|\b\d[\d,]*(?:\.\d+)?\s?(?:USD|GBP|EUR|BDT|taka|pounds?)\b|\b\d[\d,]*(?:\.\d+)?\s?(?:k|thousand|lakh|million)\s?(?:scholarship|grant|off|waiver|discount)\b|\b(?:scholarship|grant|discount|waiver|tuition)\b.{0,12}\b(?:amount|worth|of)\s*(?:£|€|\$|৳|USD\s?|GBP\s?|EUR\s?|BDT\s?)?\d[\d,]*(?:\.\d+)?\b|\b(?:scholarship|grant|discount|waiver|tuition)\b.{0,8}[:=]\s*(?:£|€|\$|৳|USD\s?|GBP\s?|EUR\s?|BDT\s?)?\d[\d,]{2,}(?:\.\d+)?\b/i;
const UNVERIFIED_STATISTIC_PATTERN = /\b\d+(?:\.\d+)?\s?%|\b(?:success|acceptance|admission|visa approval)\s+(?:rate|success rate)\b|\brank(?:ed|ing)?\s*(?:number\s*)?#?\s*\d+\b/i;

// ------------------------------------------------------------
// Validation
// ------------------------------------------------------------

const generateBodySchema = z.object({
  idea: z.string().trim().min(10, 'Describe your campaign idea in at least 10 characters.').max(2000),
  country: z.string().trim().min(2).max(80).optional().default(''),
  university: z.string().trim().max(160).optional().default(''),
  course: z.string().trim().max(160).optional().default(''),
  intake: z.enum(SUPPORTED_INTAKES).optional().default(SUPPORTED_INTAKES[0]),
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
    'archive',
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

function hasPartnerRole(auth: AuthContext, expected: string): boolean {
  return [auth.partnerRole, ...auth.roles].some((role) => String(role || '').toUpperCase() === expected);
}

function canCreateMarketing(auth: AuthContext): boolean {
  return isAloStaff(auth) || hasPartnerRole(auth, 'PARTNER_SUPER_ADMIN') || hasPartnerRole(auth, 'PARTNER_MARKETING_ASSISTANT');
}

function canReviewMarketing(auth: AuthContext): boolean {
  return isAloStaff(auth) || hasPartnerRole(auth, 'PARTNER_SUPER_ADMIN');
}

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
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
  return GUARANTEE_PATTERN.test(text)
    || MONEY_PATTERN.test(text)
    || UNVERIFIED_STATISTIC_PATTERN.test(text)
    || UNVERIFIED_FREE_CLAIM_PATTERN.test(text);
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
const APPROVAL_STATUS_DISPLAY: Record<string, string> = {
  draft: 'DRAFT',
  pending: 'PENDING_APPROVAL',
  pending_approval: 'PENDING_APPROVAL',
  pending_alo_review: 'PENDING_APPROVAL',
  partner_approved: 'PENDING_APPROVAL',
  approved: 'APPROVED',
  rejected: 'REJECTED',
  scheduled: 'SCHEDULED',
  published: 'PUBLISHED',
  archived: 'ARCHIVED',
};

/** UI comparisons and badges use the uppercase vocabulary (DRAFT, APPROVED, …). */
function normalizeApprovalStatus(row: { approvalStatus?: string | null; status?: string | null }): string {
  const key = String(row.approvalStatus || '').toLowerCase();
  if (APPROVAL_STATUS_DISPLAY[key]) return APPROVAL_STATUS_DISPLAY[key];
  const statusKey = String(row.status || '').toLowerCase();
  return APPROVAL_STATUS_DISPLAY[statusKey] || String(row.approvalStatus || '').toUpperCase();
}
/** Compare-and-set every workflow/asset mutation against the reviewed snapshot.
 * Read back under the same transaction so a concurrent edit cannot supply a
 * different row to the success response after the conditional write.
 */
async function updateMarketingRequestIfUnchanged(
  existing: PartnerMarketingRequest,
  data: Prisma.PartnerMarketingRequestUpdateManyMutationInput,
): Promise<PartnerMarketingRequest | null> {
  return db.$transaction(async (tx) => {
    const transition = await tx.partnerMarketingRequest.updateMany({
      where: {
        id: existing.id,
        partnerId: existing.partnerId,
        approvalStatus: existing.approvalStatus,
        status: existing.status,
        updatedAt: existing.updatedAt,
      },
      data,
    });
    if (transition.count !== 1) return null;
    const updated = await tx.partnerMarketingRequest.findUnique({ where: { id: existing.id } });
    if (!updated) throw new Error('Campaign disappeared during its conditional update');
    return updated;
  });
}

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
  rejectionReason: string;
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
    approvalStatus: normalizeApprovalStatus(row),
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
    'imagePrompt',
    'videoPrompt',
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
  const requestedPartner = req.nextUrl.searchParams.get('partnerId');
  // ALO staff with no explicit partner id get the cross-partner review queue.
  const reviewMode = Boolean(resolved.error) && isAloStaff(auth) && !auth.partnerId && !(requestedPartner && requestedPartner.trim());

  try {
    if (reviewMode) {
      const requests = await db.partnerMarketingRequest.findMany({
        where: { approvalStatus: { in: ['pending', 'pending_approval'] }, requiresAloApproval: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
      return NextResponse.json({
        success: true,
        scope: 'alo_review',
        requests: requests.map(toMarketingRequest),
        socialAccounts: [] as unknown[],
        capabilities: { socialConnections: false, scheduling: false, publishing: false },
        notices: [],
      });
    }

    if (resolved.error) return resolved.error;
    const partnerId = resolved.partnerId as string;

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
      capabilities: { socialConnections: false, scheduling: false, publishing: false },
      notices: quotaRow
        ? []
        : ['No partner marketing quota row is configured yet — platform defaults (15 images / 10 videos per month) are in effect.'],
    });
  } catch (error) {
    console.error('[PARTNER MARKETING] GET failed:', error instanceof Error ? error.name : 'unknown error');
    return NextResponse.json(
      { success: false, error: 'Failed to load Marketing Studio data.' },
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
  if (!sameOrigin(req)) return NextResponse.json({ success: false, error: 'Cross-origin marketing mutation denied.' }, { status: 403 });
  if (!canCreateMarketing(auth)) return NextResponse.json({ success: false, error: 'Partner Super Admin or Marketing Assistant access is required.' }, { status: 403 });

  // Refuse cross-origin mutations before any parsing, provider or database work.
  if (!mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
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
  const unsupportedInputClaims = Object.entries(input)
    .filter(([, value]) => typeof value === 'string' && hasProhibitedClaim(value))
    .map(([field]) => field);
  if (unsupportedInputClaims.length) {
    return NextResponse.json(
      { success: false, error: 'Remove unverified guarantees, free-service claims, or specific financial claims before generating a draft.', fields: unsupportedInputClaims },
      { status: 400 },
    );
  }

  // Claim-heavy user input is refused before any provider call, quota
  // mutation or persistence, so guarantees and money offers never enter the
  // system in the first place.
  const claimFields = (['idea', 'cta', 'targetAudience'] as const).filter((field) =>
    hasProhibitedClaim(input[field] || ''),
  );
  if (claimFields.length) {
    return NextResponse.json(
      {
        success: false,
        error: 'Remove guaranteed admission/visa/scholarship promises and money or percentage offers. Describe verifiable facts only.',
        fields: claimFields,
      },
      { status: 400 },
    );
  }

  const platform = normalizePlatform(input.platform);
  const intake = input.intake || SUPPORTED_INTAKES[0];

  try {
    const monthYear = currentMonthYear();
    const quotaRow = await db.partnerMarketingQuota.findUnique({ where: { partnerId } });
    const requiresAloApproval = quotaRow?.requiresAloApproval ?? true;

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
      console.error('[PARTNER MARKETING] copy provider failed:', error instanceof Error ? error.name : 'unknown error');
      aiError = 'AI gateway unavailable; grounded template used.';
      copy = groundedTemplateCopy({ ...input, intake, platform });
    }

    // The monthly idea counter and the draft row are written atomically so a
    // failed insert cannot leave the counter inflated.
    const { usage, created } = await db.$transaction(async (tx) => {
      const usage = await tx.partnerMarketingUsage.upsert({
        where: { partnerId_monthYear: { partnerId, monthYear } },
        create: { partnerId, monthYear, imagesUsed: 0, videosUsed: 0, ideasSubmitted: 1 },
        update: { ideasSubmitted: { increment: 1 } },
      });
      const created = await tx.partnerMarketingRequest.create({
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
          requiresAloApproval,
          generatedContent: JSON.stringify({ ...copy, generationMode, aiError }),
          status: 'ai_draft_generated',
          approvalStatus: 'draft',
        },
      });
      return { usage, created };
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
          : 'Draft generated from your supplied facts only. No amounts or guarantees were invented.',
      // Provider error details stay in the audit log and on the row; the
      // client only sees the grounded-template disclosure.
      notice:
        generationMode === 'ai'
          ? undefined
          : 'AI gateway unavailable — this draft was generated from a grounded template using only your supplied facts.',
    });
  } catch (error) {
    console.error('[PARTNER MARKETING] POST failed:', error instanceof Error ? error.name : 'unknown error');
    return NextResponse.json(
      { success: false, error: 'Failed to generate marketing content.' },
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
  if (!sameOrigin(req)) return NextResponse.json({ success: false, error: 'Cross-origin marketing mutation denied.' }, { status: 403 });

  // Refuse cross-origin mutations before any parsing, provider or database work.
  if (!mutationOriginAllowed(req, auth)) {
    return NextResponse.json({ success: false, error: 'Same-origin request required.' }, { status: 403 });
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = patchBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message || 'Invalid action.' },
      { status: 400 },
    );
  }
  const { id, action, rejectionReason } = parsed.data;

  if (!canCreateMarketing(auth)) {
    return NextResponse.json({ success: false, error: 'Partner Super Admin or Marketing Assistant access is required.' }, { status: 403 });
  }
  if ((action === 'approve' || action === 'reject') && !canReviewMarketing(auth)) {
    return NextResponse.json({ success: false, error: 'Partner Super Admin or ALO staff review access is required.' }, { status: 403 });
  }

  try {
    const existing = await db.partnerMarketingRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Campaign request not found.' }, { status: 404 });
    }

    const resolved = await resolvePartnerId(auth, (raw as Record<string, unknown>).partnerId);
    // ALO staff may act on any campaign; when no partner is named, the row's
    // own tenant is authoritative (the review queue never sends one).
    if (resolved.error && !isAloStaff(auth)) return resolved.error;
    const partnerId = resolved.partnerId || existing.partnerId;

    // Ownership: partners may only touch their own campaigns.
    if (existing.partnerId !== partnerId && !isAloStaff(auth)) {
      await audit(auth, 'PARTNER_MARKETING_FORBIDDEN', id, { action, ownerPartnerId: existing.partnerId }, 'failure', 'cross-partner access denied');
      return NextResponse.json({ success: false, error: 'You do not have access to this campaign.' }, { status: 403 });
    }

    // Asset generation is only available while the draft is editable
    // (the UI gates the same way). A submitted campaign cannot be regenerated.
    if ((action === 'generate_image' || action === 'generate_video') &&
        !['DRAFT', 'REJECTED'].includes(normalizeApprovalStatus(existing))) {
      return NextResponse.json(
        { success: false, error: 'Submitted campaigns cannot be regenerated. Wait for the review outcome first.' },
        { status: 409 },
      );
    }

    const monthYear = currentMonthYear();
    const quota = await db.partnerMarketingQuota.findUnique({ where: { partnerId: existing.partnerId } });
    const requiresAloApproval = existing.requiresAloApproval || (quota?.requiresAloApproval ?? true);

    // ---------- generate_image ----------
    if (action === 'generate_image') {
      const approvalStatus = normalizeApprovalStatus(existing);
      if (!['DRAFT', 'REJECTED'].includes(approvalStatus)) {
        return NextResponse.json({ success: false, error: 'Assets can only be generated or replaced while a campaign is a draft or has been rejected.' }, { status: 409 });
      }
      if (!existing.imagePrompt) {
        return NextResponse.json({ success: false, error: 'Generate a draft first — there is no image prompt yet.' }, { status: 409 });
      }
      const reservation = await reserveQuota('partner', existing.partnerId, 'monthly_images');
      if (!reservation.allowed) {
        return NextResponse.json({ success: false, error: reservation.message }, { status: 403 });
      }

      let url = '';
      try {
        const result = await generateImage({ prompt: existing.imagePrompt, size: '1024x1024' });
        url = result.url || '';
      } catch (error) {
        await releaseQuota('partner', existing.partnerId, 'monthly_images');
        const message = error instanceof Error ? error.message : 'Image provider error';
        await audit(auth, 'PARTNER_MARKETING_IMAGE_FAILED', id, { action }, 'failure', message);
        return NextResponse.json(
          { success: false, error: 'Image generation is not available right now.' },
          { status: 503 },
        );
      }
      if (!url) {
        await releaseQuota('partner', existing.partnerId, 'monthly_images');
        return NextResponse.json(
          { success: false, error: 'The image provider returned no asset. No quota was consumed.' },
          { status: 502 },
        );
      }

      let updated;
      try {
        updated = await updateMarketingRequestIfUnchanged(existing, {
          generatedImageUrl: url,
          status: 'image_generated',
        });
        if (!updated) {
          await releaseQuota('partner', existing.partnerId, 'monthly_images');
          return NextResponse.json({ success: false, error: 'The campaign changed during image generation. No asset was saved; refresh and try again.' }, { status: 409 });
        }
      } catch (error) {
        await releaseQuota('partner', existing.partnerId, 'monthly_images');
        throw error;
      }
      await audit(auth, 'PARTNER_MARKETING_IMAGE_GENERATED', id, {
        imagesUsed: reservation.used,
        imageLimit: reservation.limit,
        monthYear,
      });

      return NextResponse.json({
        success: true,
        request: toMarketingRequest(updated),
        quotaUsed: `${reservation.used}/${reservation.limit} Images`,
        message: 'Image generated and stored. Submit the asset for review when ready.',
      });
    }

    // ---------- generate_video ----------
    if (action === 'generate_video') {
      const approvalStatus = normalizeApprovalStatus(existing);
      if (!['DRAFT', 'REJECTED'].includes(approvalStatus)) {
        return NextResponse.json({ success: false, error: 'Assets can only be generated or replaced while a campaign is a draft or has been rejected.' }, { status: 409 });
      }
      const prompt = existing.videoPrompt || existing.videoScript;
      if (!prompt) {
        return NextResponse.json({ success: false, error: 'Generate a draft first — there is no video prompt yet.' }, { status: 409 });
      }
      const reservation = await reserveQuota('partner', existing.partnerId, 'monthly_videos');
      if (!reservation.allowed) {
        return NextResponse.json({ success: false, error: reservation.message }, { status: 403 });
      }

      let url = '';
      try {
        const result = await generateVideo({ prompt });
        url = result.url || '';
      } catch (error) {
        await releaseQuota('partner', existing.partnerId, 'monthly_videos');
        const message = error instanceof Error ? error.message : 'Video provider error';
        await audit(auth, 'PARTNER_MARKETING_VIDEO_FAILED', id, { action }, 'failure', message);
        return NextResponse.json(
          { success: false, error: 'Video generation is not available right now.' },
          { status: 503 },
        );
      }
      if (!url) {
        await releaseQuota('partner', existing.partnerId, 'monthly_videos');
        return NextResponse.json(
          { success: false, error: 'The video provider returned no asset. No quota was consumed.' },
          { status: 502 },
        );
      }

      let updated;
      try {
        updated = await updateMarketingRequestIfUnchanged(existing, {
          generatedVideoUrl: url,
          videoDuration: quota?.videoDurationLimitSeconds ?? DEFAULT_VIDEO_SECONDS,
          status: 'video_generated',
        });
        if (!updated) {
          await releaseQuota('partner', existing.partnerId, 'monthly_videos');
          return NextResponse.json({ success: false, error: 'The campaign changed during video generation. No asset was saved; refresh and try again.' }, { status: 409 });
        }
      } catch (error) {
        await releaseQuota('partner', existing.partnerId, 'monthly_videos');
        throw error;
      }
      await audit(auth, 'PARTNER_MARKETING_VIDEO_GENERATED', id, {
        videosUsed: reservation.used,
        videoLimit: reservation.limit,
        monthYear,
      });

      return NextResponse.json({
        success: true,
        request: toMarketingRequest(updated),
        quotaUsed: `${reservation.used}/${reservation.limit} Videos`,
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
      const currentApprovalStatus = String(existing.approvalStatus || '').toLowerCase();
      if (['approved', 'published', 'scheduled', 'archived'].includes(currentApprovalStatus)) {
        return NextResponse.json(
          { success: false, error: `This campaign is already ${currentApprovalStatus}.` },
          { status: 409 },
        );
      }
      if (currentApprovalStatus === 'pending' || currentApprovalStatus === 'pending_approval') {
        return NextResponse.json({ success: false, error: 'This campaign is already awaiting review.' }, { status: 409 });
      }
      if (!['DRAFT', 'REJECTED'].includes(normalizeApprovalStatus(existing))) {
        return NextResponse.json({ success: false, error: 'Only a draft or rejected campaign can be submitted for review.' }, { status: 409 });
      }
      const updated = await updateMarketingRequestIfUnchanged(existing, { approvalStatus: 'pending', status: 'pending_approval' });
      if (!updated) return NextResponse.json({ success: false, error: 'The campaign changed before submission. Refresh and try again.' }, { status: 409 });
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
      if (!['pending', 'pending_approval'].includes(String(existing.approvalStatus || '').toLowerCase())) {
        return NextResponse.json({ success: false, error: 'Only a submitted campaign can be approved.' }, { status: 409 });
      }
      // Optimistic concurrency: transition only the exact row that was
      // reviewed. A concurrent edit rejects the transition instead of being
      // silently overwritten.
      const updated = await updateMarketingRequestIfUnchanged(existing, {
        approvalStatus: 'approved',
        status: 'approved',
        approvedById: auth.actorUserId || auth.userId,
        approvedAt: new Date(),
        rejectionReason: '',
      });
      if (!updated) {
        return NextResponse.json(
          { success: false, error: 'This campaign changed while it was being reviewed. Reload and review the latest state.' },
          { status: 409 },
        );
      }
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
      if (!['pending', 'pending_approval'].includes(String(existing.approvalStatus || '').toLowerCase())) {
        return NextResponse.json({ success: false, error: 'Only a submitted campaign can be rejected.' }, { status: 409 });
      }
      const updated = await updateMarketingRequestIfUnchanged(existing, {
        approvalStatus: 'rejected',
        status: 'rejected',
        rejectionReason: reason,
      });
      if (!updated) return NextResponse.json({ success: false, error: 'The campaign review status changed. Refresh before taking another action.' }, { status: 409 });
      await audit(auth, 'PARTNER_MARKETING_REJECTED', id, { reason });
      return NextResponse.json({ success: true, request: toMarketingRequest(updated), message: 'Campaign rejected.' });
    }

    // ---------- schedule ----------
    if (action === 'schedule') {
      // There is no scheduled publisher in this deployment (capabilities
      // report scheduling: false) — refuse rather than record a date that
      // nothing will act on or report a fabricated success.
      return NextResponse.json(
        { success: false, error: 'Scheduling is not available in this deployment — there is no scheduled publisher. Nothing was scheduled.' },
        { status: 409 },
      );
    }

    // ---------- publish ----------
    if (action === 'publish') {
      // Publishing needs a real connected social account. There is no
      // partner-scoped connection model, so we refuse rather than record a
      // fabricated publishedUrl. This check comes first: the capability is
      // absent for everyone, so nothing was published regardless of role.
      return NextResponse.json(
        {
          success: false,
          error: 'No connected partner social account or publishing integration is configured. Nothing was published.',
          details: 'No publish URL or success status was recorded.',
        },
        { status: 409 },
      );
    }

    // ---------- archive ----------
    if (action === 'archive') {
      if (String(existing.approvalStatus || '').toLowerCase() === 'published' || existing.publishedUrl) {
        return NextResponse.json({ success: false, error: 'Published campaigns cannot be archived from this workspace.' }, { status: 409 });
      }
      const updated = await updateMarketingRequestIfUnchanged(existing, { status: 'archived', approvalStatus: 'archived', scheduledAt: null });
      if (!updated) return NextResponse.json({ success: false, error: 'The campaign changed before it could be archived. Refresh and try again.' }, { status: 409 });
      await audit(auth, 'PARTNER_MARKETING_ARCHIVED', id, { previousStatus: existing.approvalStatus });
      return NextResponse.json({ success: true, request: toMarketingRequest(updated), message: 'Campaign archived.' });
    }

    return NextResponse.json({ success: false, error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error) {
    console.error('[PARTNER MARKETING] PATCH failed:', error instanceof Error ? error.name : 'unknown error');
    return NextResponse.json(
      { success: false, error: 'Failed to process the marketing action.' },
      { status: 500 },
    );
  }
}
