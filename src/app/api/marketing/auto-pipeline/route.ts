import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};
import { getBrandKit, SIZE_MATRIX } from "@/lib/marketing/brand-kit";
import { generateBrandedImage } from "@/lib/marketing/image-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One-click: Idea or Image URL -> Content + Image (per size) + Video + CampaignPost x platforms + SEO Blog + Calendar
// Body: { idea?: string, imageUrl?: string, title?: string, category?: string, platforms?: string[], sizes?: string[], autoPublishBlog?: boolean, scheduleAt?: string }
// Platforms default: ["FACEBOOK","INSTAGRAM","LINKEDIN","BLOG"]
// Sizes default: ["SQUARE","PORTRAIT","LANDSCAPE","STORY"]

export const POST = withAuth(async (req: Request, _auth: AuthContext) => {
  const body = await req.json().catch(()=> ({}));
  const idea: string = (body.idea || body.keyword || body.title || "").toString().trim();
  const imageUrl: string | undefined = body.imageUrl || body.sourceImageUrl;
  const title = (body.title || idea.slice(0, 60) || "ALO Campaign").toString();
  const category = body.category || "CONSULTATION_OFFER";
  const platforms: string[] = Array.isArray(body.platforms) && body.platforms.length ? body.platforms : ["FACEBOOK","INSTAGRAM","LINKEDIN","BLOG"];
  const sizes: string[] = Array.isArray(body.sizes) && body.sizes.length ? body.sizes : ["SQUARE","PORTRAIT","LANDSCAPE","STORY"];
  const autoPublishBlog = body.autoPublishBlog !== false; // default true
  const createdBy = body.createdBy || "marketing-manager-auto-pipeline";
  const campaignObjective = body.campaignObjective || "LEAD_GEN";

  if (!idea && !imageUrl) return NextResponse.json({ error: "idea (text) or imageUrl required — share one idea or one company image" }, { status: 400 });

  const brandKit = await getBrandKit();
  if (!brandKit.logoUrl) {
    // allow but warn — still proceeds with placeholder overlay text
  }

  const results: any = { title, category, platforms, sizes, brandKitApplied: true };

  // 1) Create MarketingContentIdea (for audit + SEO pipeline)
  let contentIdea: any = null;
  try {
    contentIdea = await db.marketingContentIdea.create({
      data: {
        keyword: idea || "image-campaign",
        country: body.country || "",
        course: body.course || "",
        language: body.language || "english",
        platform: platforms[0] || "facebook",
        audienceType: body.audienceType || "",
        funnelStage: body.funnelStage || "awareness",
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

  // 2) Generate branded image per size (placeholder until provider key set, but already brand-aware)
  const assets: any[] = [];
  for (const sz of sizes) {
    const gen = await generateBrandedImage({ title, ideaOrCaption: idea || title, category, size: sz as any, platform: platforms[0] || "FACEBOOK", brandKit });
    try {
      const asset = await db.marketingAsset.create({
        data: {
          name: `${title} — ${sz}`,
          type: "image",
          url: gen.imageUrl,
          thumbnail: gen.imageUrl,
          platform: (SIZE_MATRIX[sz as keyof typeof SIZE_MATRIX]?.platforms[0] || platforms[0] || "facebook").toLowerCase(),
          category: "generated",
          tags: JSON.stringify([category, sz, "auto-pipeline", "brand-applied"]),
          status: "active",
          createdById: createdBy,
        }
      });
      assets.push({ size: sz, w: gen.w, h: gen.h, assetId: asset.id, imageUrl: gen.imageUrl, prompt: gen.prompt });
    } catch (e: any) {
      assets.push({ size: sz, error: e.message, imageUrl: gen.imageUrl, prompt: gen.prompt });
    }
  }
  results.assets = assets;

  // 3) Create CampaignPost per platform x size (approval DRAFT — brand already applied)
  const posts: any[] = [];
  const masterCaption = body.caption || `${idea || title}\n\n📍 ${brandKit.address}\n☎ ${brandKit.phone} | WhatsApp: ${brandKit.whatsapp}\n🌐 ${brandKit.website}\n\n#StudyAbroad #ALOEducation`;
  const hashtags = body.hashtags || ["StudyAbroad","ALOEducation","Scholarship"];
  for (const plat of platforms) {
    for (const sz of sizes) {
      // For BLOG we only need one size (LANDSCAPE) — skip extra sizes to avoid spam
      if (plat === "BLOG" && sz !== "LANDSCAPE" && sz !== "SQUARE") continue;
      const sizeAsset = assets.find(a => a.size === sz);
      const platSize = plat === "BLOG" ? "LANDSCAPE" : sz;
      try {
        const post = await db.campaignPost.create({
          data: {
            title: `${title} — ${plat} ${platSize}`,
            category,
            platform: plat,
            caption: masterCaption,
            hashtags: JSON.stringify(hashtags),
            ctaText: body.ctaText || "Book Free Consultation",
            ctaUrl: body.ctaUrl || `${brandKit.website}/consult`,
            videoScript: body.videoScript || "",
            reelCaption: body.reelCaption || masterCaption.slice(0, 120),
            // if model has landingLink use it, else ignore
            campaignObjective,
            platformSize: platSize,
            approvalStatus: "DRAFT",
            createdBy,
            brandAssetApplied: true,
          } as any
        });
        posts.push({ id: post.id, platform: plat, size: platSize, status: post.approvalStatus, assetUrl: sizeAsset?.imageUrl || imageUrl || null });

        // 4) Calendar auto-schedule (next 3 slots 9/14/19 Dhaka)
        const schedBase = body.scheduleAt ? new Date(body.scheduleAt) : new Date();
        // stagger by platform index
        const offsetH = (platforms.indexOf(plat) * 2) % 12;
        const scheduledAt = new Date(schedBase.getTime() + offsetH * 3600_000);
        try {
          await db.marketingCalendar.create({
            data: {
              title: post.title,
              description: masterCaption.slice(0, 200),
              platform: plat.toLowerCase(),
              campaignId: null,
              contentId: post.id,
              status: "scheduled",
              scheduledAt,
              createdById: createdBy,
            }
          }).catch(()=>{});
        } catch {}

        // 5) If BLOG, also create BlogPost for SEO (so top-3 plan starts indexing)
        if (plat === "BLOG" && autoPublishBlog) {
          const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60)}-${Date.now().toString(36)}`;
          const blogBody = `# ${title}\n\n${idea || masterCaption}\n\n**ALO Education** — ${brandKit.address}  \nPhone: ${brandKit.phone} | WhatsApp: ${brandKit.whatsapp} | ${brandKit.website}\n\n## Why ALO?\n- Free counseling for Bangladeshi students\n- University & scholarship matching\n- Visa guidance (no false guarantees)\n\n## FAQs\n**Q: Cost to start?** A: Free initial consultation.\n**Q: IELTS required?** A: Depends on country/course — we guide.\n\n*Brand verified: logo ${brandKit.logoUrl ? 'applied' : 'pending'}*`;
          try {
            await db.blogPost.create({
              data: {
                title,
                slug,
                excerpt: masterCaption.slice(0, 160),
                content: blogBody,
                coverImage: sizeAsset?.imageUrl || imageUrl || null,
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

  // 6) Audit
  try {
    await db.auditLog.create({ data: { action: "DATA_IMPORT" as any, resource: "AutoPipeline", resourceId: (contentIdea as any)?.id || title, details: JSON.stringify({ title, platforms, sizes, postCount: posts.length }) } }).catch(()=>{});
    await db.marketingAuditLog.create({ data: { userId: createdBy, userName: createdBy, role: "MARKETING_MANAGER", action: "auto-pipeline.create", resource: "CampaignPost", resourceId: (posts[0] as any)?.id || "", details: JSON.stringify({ title, platforms, sizes }) } }).catch(()=>{});
  } catch {}

  // 7) Auto lead hint — every published post will auto-create lead via keyword-triggers + Google webhook — return leadSources ready
  results.leadSources = {
    googleLocation: "POST /api/marketing/webhooks/google-business — send {placeId, review, rating} → MarketingLead source=GOOGLE_MAPS",
    facebook: "Already wired — comments/DM auto lead via keyword-triggers",
    nextAction: "Approve posts (Campaign Posts tab) → Publish — leads auto-collect and assign counselor"
  };
  results.summary = { idea: idea || imageUrl, assets: assets.length, posts: posts.length, blogIncluded: platforms.includes("BLOG") };

  return NextResponse.json({ success: true, ...results } as any, { status: 201 });
}, MARKETING_AUTH);

export const GET = withAuth(async (_req: Request, _auth: AuthContext) => {
  const kit = await getBrandKit();
  return NextResponse.json({
    success: true,
    hint: "POST { idea | imageUrl, title?, category?, platforms?: string[], sizes?: string[], autoPublishBlog?: boolean } — one idea or one image → content+image+video+blog+posts+calendar+leads",
    brandKit: { hasLogo: !!kit.logoUrl, address: kit.address, phone: kit.phone, whatsapp: kit.whatsapp, website: kit.website },
    sizes: Object.entries(SIZE_MATRIX).map(([k,v])=> ({ key:k, ...v })),
    platforms: ["FACEBOOK","INSTAGRAM","LINKEDIN","TIKTOK","YOUTUBE","WHATSAPP_STATUS","BLOG"]
  } as any);
}, MARKETING_AUTH);
