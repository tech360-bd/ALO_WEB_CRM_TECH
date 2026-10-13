import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — campaign posts
export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const platform = req.nextUrl.searchParams.get("platform");
  const where: any = {};
  if (status) where.approvalStatus = status;
  if (platform) where.platform = platform;

  const posts = await db.campaignPost.findMany({ where, orderBy: { createdAt: "desc" } });

  // Check brand asset (logo) exists
  const logo = await db.brandAsset.findFirst({ where: { assetType: "LOGO", isActive: true } });

  return NextResponse.json({
    posts,
    logoExists: !!logo,
    logo: logo ? { fileUrl: logo.value, name: logo.name } : null,
    summary: {
      total: posts.length,
      draft: posts.filter((p) => p.approvalStatus === "DRAFT").length,
      pendingApproval: posts.filter((p) => p.approvalStatus === "PENDING_APPROVAL").length,
      approved: posts.filter((p) => p.approvalStatus === "APPROVED").length,
      published: posts.filter((p) => p.approvalStatus === "PUBLISHED").length,
      rejected: posts.filter((p) => p.approvalStatus === "REJECTED").length,
    },
  });
}

// POST — create campaign post (AI-generated or manual)
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, category, platform, caption, hashtags, ctaText, ctaUrl, videoScript, reelCaption, landingLink, campaignObjective, platformSize, createdBy } = body;

  // Check brand asset
  const logo = await db.brandAsset.findFirst({ where: { assetType: "LOGO", isActive: true } });
  if (!logo) {
    return NextResponse.json({ error: "ALO logo is missing. Please upload the logo before creating posts.", logoMissing: true }, { status: 400 });
  }

  const post = await db.campaignPost.create({
    data: {
      title, category, platform,
      caption, hashtags: JSON.stringify(hashtags || []),
      ctaText, ctaUrl,
      videoScript, reelCaption,
      landingLink, campaignObjective, platformSize,
      approvalStatus: "DRAFT",
      createdBy,
      brandAssetApplied: true,
    },
  });

  await db.auditLog.create({
    data: { action: "DATA_IMPORT", resource: "CampaignPost", resourceId: post.id, details: JSON.stringify({ title, platform, category }) },
  });

  return NextResponse.json({ post, message: "Campaign post created as draft. Submit for approval to publish." });
}

// PATCH — approve/reject/schedule/publish post
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, action, approvedBy, rejectionReason, scheduledAt, publishedUrl } = body;

  if (action === "submit_approval") {
    const post = await db.campaignPost.update({ where: { id }, data: { approvalStatus: "PENDING_APPROVAL" } });
    return NextResponse.json({ post, message: "Post submitted for Marketing Manager approval." });
  }

  if (action === "approve") {
    const post = await db.campaignPost.update({ where: { id }, data: { approvalStatus: "APPROVED", approvedBy, approvedAt: new Date() } });
    await db.auditLog.create({ data: { userId: approvedBy, action: "PUBLIC_PUBLISH", resource: "CampaignPost", resourceId: id, details: JSON.stringify({ action: "approved" }) } });
    return NextResponse.json({ post, message: "Post approved. Ready to schedule or publish." });
  }

  if (action === "reject") {
    const post = await db.campaignPost.update({ where: { id }, data: { approvalStatus: "REJECTED", rejectionReason, approvedBy } });
    await db.auditLog.create({ data: { userId: approvedBy, action: "PUBLIC_PUBLISH", resource: "CampaignPost", resourceId: id, details: JSON.stringify({ action: "rejected", reason: rejectionReason }) } });
    return NextResponse.json({ post, message: "Post rejected." });
  }

  if (action === "schedule") {
    const post = await db.campaignPost.update({ where: { id }, data: { approvalStatus: "SCHEDULED", scheduledAt } });
    return NextResponse.json({ post, message: "Post scheduled." });
  }

  if (action === "publish") {
    const post = await db.campaignPost.update({ where: { id }, data: { approvalStatus: "PUBLISHED", publishedAt: new Date(), publishedUrl: publishedUrl || `https://${body.platform || "facebook"}.com/post-${id}` } });
    await db.auditLog.create({ data: { userId: approvedBy, action: "PUBLIC_PUBLISH", resource: "CampaignPost", resourceId: id, details: JSON.stringify({ action: "published", url: post.publishedUrl }) } });
    return NextResponse.json({ post, message: "Post published to social media." });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
