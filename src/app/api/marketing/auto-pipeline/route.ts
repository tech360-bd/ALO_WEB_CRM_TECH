import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { AuthContext } from "@/lib/auth-middleware";
import { withMarketingAccess } from "@/lib/marketing/access";
import { getBrandKit, SIZE_MATRIX } from "@/lib/marketing/brand-kit";
import { generateBrandedImage } from "@/lib/marketing/image-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Draft-generation workflow only: it does not render images, schedule content, publish a blog, or send messages.
// Body: { idea?: string, imageUrl?: string, title?: string, category?: string, platforms?: string[], sizes?: string[], createBlogDraft?: boolean }

export const POST = withMarketingAccess(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  const idea = typeof body.idea === 'string' ? body.idea.trim().slice(0, 1500) : typeof body.keyword === 'string' ? body.keyword.trim().slice(0, 1500) : '';
  const imageUrlValue = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : typeof body.sourceImageUrl === 'string' ? body.sourceImageUrl.trim() : '';
  let imageUrl: string | undefined;
  if (imageUrlValue) {
    try {
      const parsed = new URL(imageUrlValue);
      if (parsed.protocol !== 'https:' || parsed.username || parsed.password) return NextResponse.json({ success: false, error: 'Source image URLs must use HTTPS.' }, { status: 400 });
      imageUrl = parsed.toString();
    } catch { return NextResponse.json({ success: false, error: 'Invalid source image URL.' }, { status: 400 }); }
  }
  const title = (typeof body.title === 'string' ? body.title.trim() : '').slice(0, 160) || idea.slice(0, 60) || 'ALO Campaign Draft';
  const category = (typeof body.category === 'string' ? body.category.trim() : 'CONSULTATION_OFFER').slice(0, 80);
  const supportedPlatforms = new Set(['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TIKTOK', 'WHATSAPP_STATUS', 'BLOG']);
  const supportedSizes = new Set(Object.keys(SIZE_MATRIX));
  const requestedPlatforms = Array.isArray(body.platforms) ? body.platforms : ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'BLOG'];
  const requestedSizes = Array.isArray(body.sizes) ? body.sizes : ['SQUARE', 'PORTRAIT', 'LANDSCAPE', 'STORY'];
  const platforms = [...new Set(requestedPlatforms.filter((value): value is string => typeof value === 'string').map((value) => value.trim().toUpperCase()))];
  const sizes = [...new Set(requestedSizes.filter((value): value is string => typeof value === 'string').map((value) => value.trim().toUpperCase()))];
  if (platforms.length < 1 || platforms.length > 4 || platforms.some((platform) => !supportedPlatforms.has(platform)) || sizes.length < 1 || sizes.length > 5 || sizes.some((size) => !supportedSizes.has(size))) {
    return NextResponse.json({ success: false, error: 'Use up to four supported platforms and five supported image sizes.' }, { status: 400 });
  }
  const createBlogDraft = body.createBlogDraft === true;
  const createdBy = auth.userId;
  const campaignObjective = typeof body.campaignObjective === 'string' ? body.campaignObjective.slice(0, 120) : 'LEAD_GEN';
  const country = typeof body.country === 'string' ? body.country.slice(0, 120) : '';
  const course = typeof body.course === 'string' ? body.course.slice(0, 160) : '';
  const language = typeof body.language === 'string' ? body.language.slice(0, 40) : 'english';
  const audienceType = typeof body.audienceType === 'string' ? body.audienceType.slice(0, 160) : '';
  const funnelStage = typeof body.funnelStage === 'string' ? body.funnelStage.slice(0, 80) : 'awareness';
  const caption = typeof body.caption === 'string' ? body.caption.trim().slice(0, 10000) : '';
  const rawHashtags = body.hashtags === undefined ? ['StudyAbroad', 'ALOEducation', 'Scholarship'] : body.hashtags;
  if (!Array.isArray(rawHashtags) || rawHashtags.length > 30 || rawHashtags.some((tag) => typeof tag !== 'string' || tag.length > 80)) return NextResponse.json({ success: false, error: 'hashtags must contain at most 30 short text tags.' }, { status: 400 });
  const hashtags = rawHashtags.map((tag: string) => tag.trim());
  const ctaText = typeof body.ctaText === 'string' ? body.ctaText.slice(0, 300) : 'Book Free Consultation';
  const ctaUrl = typeof body.ctaUrl === 'string' ? body.ctaUrl.trim() : '';
  if (ctaUrl) {
    try { if (new URL(ctaUrl).protocol !== 'https:') throw new Error('https required'); }
    catch { return NextResponse.json({ success: false, error: 'CTA links must use HTTPS.' }, { status: 400 }); }
  }
  const videoScript = typeof body.videoScript === 'string' ? body.videoScript.slice(0, 10000) : '';
  const reelCaption = typeof body.reelCaption === 'string' ? body.reelCaption.slice(0, 10000) : '';

  if (!idea && !imageUrl) return NextResponse.json({ success: false, error: 'Provide an idea or HTTPS source image URL.' }, { status: 400 });

  const brandKit = await getBrandKit();
  if (!brandKit.logoUrl) {
    // allow but warn — still proceeds with placeholder overlay text
  }

  const results: any = { title, category, platforms, sizes, brandKitApplied: false, imageGeneration: 'NOT_CONFIGURED — prompts only; no image file was generated' };

  // 1) Create MarketingContentIdea (for audit + SEO pipeline)
  let contentIdea: any = null;
  try {
    contentIdea = await db.marketingContentIdea.create({
      data: {
        keyword: idea || "image-campaign",
        country,
        course,
        language,
        platform: platforms[0] || "FACEBOOK",
        audienceType,
        funnelStage,
        ideaType: imageUrl ? "image" : "post",
        title,
        description: idea || `Campaign from image ${imageUrl}`,
        trending: false,
        status: "new",
        createdById: createdBy,
      }
    });
    results.contentIdea = contentIdea;
  } catch (e: any) { results.contentIdeaError = e.message; }

  // 2) Prepare image prompts only. The placeholder generator returns a public stock URL, not an ALO asset, so it is never persisted or presented as generated.
  const assets: any[] = [];
  for (const sz of sizes) {
    const gen = await generateBrandedImage({ title, ideaOrCaption: caption || idea || title, category, size: sz, platform: platforms[0] || 'FACEBOOK', brandKit });
    assets.push({ size: sz, w: gen.w, h: gen.h, assetId: null, imageUrl: null, generated: false, prompt: gen.prompt, status: 'PROMPT_ONLY' });
  }
  results.assets = assets;

  // 3) Create CampaignPost per platform x size (approval DRAFT — brand already applied)
  const posts: any[] = [];
  const masterCaption = caption || `${idea || title}${brandKit.website ? `\n\n${brandKit.website}` : ''}`;
  for (const plat of platforms) {
    for (const sz of sizes) {
      // For BLOG we only need one size (LANDSCAPE) — skip extra sizes to avoid spam
      if (plat === "BLOG" && sz !== "LANDSCAPE" && sz !== "SQUARE") continue;
      const platSize = plat === "BLOG" ? "LANDSCAPE" : sz;
      try {
        const post = await db.campaignPost.create({
          data: {
            title: `${title} — ${plat} ${platSize}`,
            category,
            platform: plat,
            caption: masterCaption,
            hashtags: JSON.stringify(hashtags),
            ctaText: ctaText || null,
            ctaUrl: ctaUrl || null,
            videoScript,
            reelCaption: reelCaption || masterCaption.slice(0, 120),
            // if model has landingLink use it, else ignore
            campaignObjective,
            platformSize: platSize,
            approvalStatus: "DRAFT",
            createdBy,
            brandAssetApplied: false,
          } as any
        });
        posts.push({ id: post.id, platform: plat, size: platSize, status: post.approvalStatus, assetUrl: null, sourceImageUrl: imageUrl || null });

        // No scheduler is configured; calendar records are intentionally not created.

        // 5) If explicitly requested, create a private blog draft. Nothing is published or indexed.
        if (plat === "BLOG" && createBlogDraft) {
          const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60)}-${Date.now().toString(36)}`;
          const blogBody = `# ${title}\n\n${idea || masterCaption}\n\n**ALO Education** — ${brandKit.address}  \nPhone: ${brandKit.phone} | WhatsApp: ${brandKit.whatsapp} | ${brandKit.website}\n\n## Why ALO?\n- Free counseling for Bangladeshi students\n- University & scholarship matching\n- Visa guidance (no false guarantees)\n\n## FAQs\n**Q: Cost to start?** A: Free initial consultation.\n**Q: IELTS required?** A: Depends on country/course — we guide.\n\n*Draft only — brand and factual claims require manager review before publication.*`;
          try {
            await db.blogPost.create({
              data: {
                title,
                slug,
                excerpt: masterCaption.slice(0, 160),
                content: blogBody,
                coverImage: null,
                status: "DRAFT",
                authorId: createdBy,
                publishedAt: null,
                metaTitle: `${title} | ALO Education`,
                metaDescription: masterCaption.slice(0, 155),
                keywords: JSON.stringify(hashtags),
                // if schema has isPublished etc handle fallback
              } as any
            }).catch(async ()=> {
              // fallback to marketingGeneratedContent if BlogPost model differs
              await db.marketingGeneratedContent.create({
                data: {
                  contentType: "blog_post",
                  topic: title,
                  keywords: JSON.stringify(hashtags),
                  language: "english",
                  platform: "website",
                  tone: "professional",
                  title,
                  body: blogBody,
                  status: "draft",
                  createdById: createdBy,
                }
              });
            });
            posts[posts.length-1].blogSlug = slug;
          } catch (e: any) { posts[posts.length-1].blogError = e.message; }
        }
      } catch (e: any) {
        posts.push({ platform: plat, size: sz, error: e.message });
      }
    }
  }
  results.posts = posts;

  // 6) Audit. The actor comes from the authenticated session, never the request body.
  await db.auditLog.create({ data: { userId: auth.userId, action: 'DATA_IMPORT', resource: 'AutoPipeline', resourceId: contentIdea?.id || title, details: JSON.stringify({ title, platforms, sizes, postCount: posts.length, assetFilesGenerated: false, scheduled: false }) } }).catch(() => {});
  await db.marketingAuditLog.create({ data: { userId: auth.userId, userName: auth.name || auth.userId, role: auth.roles[0] || auth.userType, action: 'auto-pipeline.draft-created', resource: 'CampaignPost', resourceId: posts[0]?.id || '', details: JSON.stringify({ title, platforms, sizes }) } }).catch(() => {});

  results.leadSources = { status: 'NOT_CONFIGURED', message: 'No automatic lead capture or outbound follow-up is claimed by this draft-generation action.' };
  results.scheduler = 'NOT_CONFIGURED — no calendar rows or provider jobs were created';
  results.summary = { idea: idea || 'Source image provided', imagePrompts: assets.length, posts: posts.length, blogDraftRequested: createBlogDraft && platforms.includes('BLOG') };

  return NextResponse.json({ success: true, sent: false, published: false, ...results }, { status: 201 });
}, 'manager');

export const GET = withMarketingAccess(async (_req: Request, _auth: AuthContext) => {
  const kit = await getBrandKit();
  return NextResponse.json({
    success: true,
    hint: 'POST an idea or HTTPS image URL to create internal content drafts and image prompts only. Nothing is rendered, scheduled, published, or sent.',
    brandKit: { hasLogo: !!kit.logoUrl, address: kit.address, phone: kit.phone, whatsapp: kit.whatsapp, website: kit.website },
    sizes: Object.entries(SIZE_MATRIX).map(([key, value]) => ({ key, ...value })),
    platforms: ['FACEBOOK', 'INSTAGRAM', 'LINKEDIN', 'TIKTOK', 'WHATSAPP_STATUS', 'BLOG'],
  });
}, 'workspace');
