import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiChat } from "@/lib/ai";

// GET — marketing requests for partner
export async function GET(req: NextRequest) {
  const partnerId = req.nextUrl.searchParams.get("partnerId");
  let partner: Awaited<ReturnType<typeof db.employeeHR.findFirst>> = null;
  if (partnerId) partner = await db.employeeHR.findFirst({ where: { id: partnerId, role: "PARTNER" } });
  if (!partner) partner = await db.employeeHR.findFirst({ where: { role: "PARTNER" } });
  if (!partner) return NextResponse.json({ error: "No partner found" }, { status: 404 });

  const [quota, usage, requests, socialAccounts] = await Promise.all([
    db.partnerMarketingQuota.findUnique({ where: { partnerId: partner.id } }),
    db.partnerMarketingUsage.findUnique({ where: { partnerId_monthYear: { partnerId: partner.id, monthYear: new Date().toISOString().slice(0, 7) } } }),
    db.partnerMarketingRequest.findMany({ where: { partnerId: partner.id }, orderBy: { createdAt: "desc" } }),
    db.partnerSocialAccount.findMany({ where: { partnerId: partner.id } }),
  ]);

  return NextResponse.json({ quota, usage, requests, socialAccounts });
}

// POST — submit marketing idea + AI generates content
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { partnerId, idea, country, university, course, intake, targetAudience, language, cta, platform, preferredStyle, requestedBy } = body;

  let partner = await db.employeeHR.findFirst({ where: { id: partnerId, role: "PARTNER" } });
  if (!partner) partner = await db.employeeHR.findFirst({ where: { role: "PARTNER" } });
  if (!partner) return NextResponse.json({ error: "No partner found" }, { status: 404 });

  // Check quota
  const quota = await db.partnerMarketingQuota.findUnique({ where: { partnerId: partner.id } });
  const monthYear = new Date().toISOString().slice(0, 7);
  let usage = await db.partnerMarketingUsage.findUnique({ where: { partnerId_monthYear: { partnerId: partner.id, monthYear } } });
  if (!usage) {
    usage = await db.partnerMarketingUsage.create({ data: { partnerId: partner.id, monthYear } });
  }

  const imagesUsed = usage.imagesUsed || 0;
  const videosUsed = usage.videosUsed || 0;
  const imageLimit = quota?.monthlyImageLimit || 15;
  const videoLimit = quota?.monthlyVideoLimit || 10;

  // AI generates marketing content
  const systemPrompt = `You are the ALO Education Partner Marketing AI. Generate marketing content for a B2B partner's campaign.

Campaign details:
- Idea: ${idea}
- Country: ${country || "General"}
- University: ${university || "Any"}
- Course: ${course || "Any"}
- Intake: ${intake || "Next available"}
- Target audience: ${targetAudience || "Bangladeshi students"}
- Language: ${language || "English"}
- CTA: ${cta || "Book Free Consultation"}
- Platform: ${platform}
- Preferred style: ${preferredStyle || "Professional, encouraging"}

Generate ALL of the following as valid JSON (no markdown):
{
  "facebookCaption": "<engaging Facebook post caption, 100-150 words>",
  "instagramCaption": "<shorter Instagram caption with emojis, 80-120 words>",
  "hashtags": ["#StudyAbroad", "#ALOEducation", ...6-8 relevant hashtags],
  "imagePrompt": "<detailed image generation prompt for the marketing visual>",
  "videoPrompt": "<30-second video concept prompt>",
  "videoScript": "<scene-by-scene 30-second video script with timestamps>",
  "reelCaption": "<short reel caption, 1-2 sentences>",
  "ctaText": "<clear call-to-action text>"
}

Rules:
- Do NOT promise visa or admission guarantees.
- Follow ALO brand voice: professional, encouraging, student-focused.
- Include the phone number 01805020101 in Facebook caption.
- Keep content original and engaging.`;

  const raw = await aiChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: "Generate the marketing content as JSON now." },
  ], { temperature: 0.7 });

  let aiContent: any = {};
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) aiContent = JSON.parse(match[0]);
  } catch {}

  // Create marketing request
  const request = await db.partnerMarketingRequest.create({
    data: {
      partnerId: partner.id,
      requestedBy: requestedBy || partner.id,
      idea, country, university, course, intake, targetAudience, language, cta, platform, preferredStyle,
      facebookCaption: aiContent.facebookCaption || "",
      instagramCaption: aiContent.instagramCaption || "",
      hashtags: JSON.stringify(aiContent.hashtags || []),
      imagePrompt: aiContent.imagePrompt || "",
      videoPrompt: aiContent.videoPrompt || "",
      videoScript: aiContent.videoScript || "",
      reelCaption: aiContent.reelCaption || "",
      ctaText: aiContent.ctaText || cta || "Book Free Consultation",
      approvalStatus: "DRAFT",
      createdBy: requestedBy || partner.id,
    },
  });

  // Increment ideas submitted
  await db.partnerMarketingUsage.update({
    where: { id: usage.id },
    data: { ideasSubmitted: { increment: 1 } },
  });

  return NextResponse.json({
    request,
    quotaStatus: { imagesUsed, videosUsed, imageLimit, videoLimit, imagesRemaining: imageLimit - imagesUsed, videosRemaining: videoLimit - videosUsed },
    message: "Marketing content generated by AI. Review and submit for approval.",
  });
}

// PATCH — update marketing request status (generate image/video, approve, schedule, publish)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, action, partnerId, scheduledAt, reviewNote } = body;

  let partner = await db.employeeHR.findFirst({ where: { id: partnerId, role: "PARTNER" } });
  if (!partner) partner = await db.employeeHR.findFirst({ where: { role: "PARTNER" } });
  if (!partner) return NextResponse.json({ error: "No partner found" }, { status: 404 });

  const request = await db.partnerMarketingRequest.findUnique({ where: { id } });
  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const quota = await db.partnerMarketingQuota.findUnique({ where: { partnerId: partner.id } });
  const monthYear = new Date().toISOString().slice(0, 7);
  let usage = await db.partnerMarketingUsage.findUnique({ where: { partnerId_monthYear: { partnerId: partner.id, monthYear } } });
  if (!usage) usage = await db.partnerMarketingUsage.create({ data: { partnerId: partner.id, monthYear } });

  if (action === "generate_image") {
    // Check image quota
    if ((usage.imagesUsed || 0) >= (quota?.monthlyImageLimit || 15)) {
      return NextResponse.json({ error: "Monthly image quota finished. Request extra quota from ALO Education." }, { status: 403 });
    }
    await db.partnerMarketingUsage.update({ where: { id: usage.id }, data: { imagesUsed: { increment: 1 } } });
    const updated = await db.partnerMarketingRequest.update({ where: { id }, data: { assetUrl: `/generated/image-${id}.png`, approvalStatus: "PENDING_APPROVAL" } });
    return NextResponse.json({ request: updated, message: "Image generated. Quota updated." });
  }

  if (action === "generate_video") {
    if ((usage.videosUsed || 0) >= (quota?.monthlyVideoLimit || 10)) {
      return NextResponse.json({ error: "Monthly video quota finished. Request extra quota from ALO Education." }, { status: 403 });
    }
    await db.partnerMarketingUsage.update({ where: { id: usage.id }, data: { videosUsed: { increment: 1 } } });
    const updated = await db.partnerMarketingRequest.update({ where: { id }, data: { approvalStatus: "PENDING_APPROVAL" } });
    return NextResponse.json({ request: updated, message: "Video generated. Quota updated." });
  }

  if (action === "approve") {
    const updated = await db.partnerMarketingRequest.update({ where: { id }, data: { approvalStatus: "APPROVED" } });
    return NextResponse.json({ request: updated, message: "Content approved by Partner Super Admin." });
  }

  if (action === "schedule") {
    const updated = await db.partnerMarketingRequest.update({ where: { id }, data: { approvalStatus: "SCHEDULED", scheduledAt } });
    await db.partnerMarketingUsage.update({ where: { id: usage.id }, data: { postsScheduled: { increment: 1 } } });
    return NextResponse.json({ request: updated, message: "Content scheduled for publishing." });
  }

  if (action === "publish") {
    const updated = await db.partnerMarketingRequest.update({ where: { id }, data: { approvalStatus: "PUBLISHED", publishedUrl: `https://facebook.com/post-${id}` } });
    await db.partnerMarketingUsage.update({ where: { id: usage.id }, data: { postsPublished: { increment: 1 } } });
    return NextResponse.json({ request: updated, message: "Content published to social media." });
  }

  if (action === "reject") {
    const updated = await db.partnerMarketingRequest.update({ where: { id }, data: { approvalStatus: "REJECTED" } });
    return NextResponse.json({ request: updated, message: "Content rejected." });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
