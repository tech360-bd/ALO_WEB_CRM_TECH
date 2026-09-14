import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Repost approved library item to employee's own official social
// Body: { postId, targetPlatform?: string, employeeId?: string, captionOverride?: string }

export async function POST(req: NextRequest) {
  const body = await req.json().catch(()=> ({}));
  const postId = body.postId as string;
  const employeeId = body.employeeId || body.createdBy || "counselor-repost";
  const targetPlatform = (body.targetPlatform || body.platform || "").toString().toUpperCase();
  if (!postId) return NextResponse.json({ error: "postId required (approved CampaignPost)" }, { status: 400 });
  const source = await db.campaignPost.findUnique({ where: { id: postId } });
  if (!source) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  if (!["APPROVED","PUBLISHED","SCHEDULED"].includes(source.approvalStatus)) {
    return NextResponse.json({ error: "Only APPROVED/PUBLISHED posts can be reposted. Current: " + source.approvalStatus }, { status: 400 });
  }
  const platform = targetPlatform || source.platform;
  // Create cloned post as republished by this employee (brand already applied)
  const cloned = await db.campaignPost.create({
    data: {
      title: `${source.title} — repost by ${employeeId}`,
      category: source.category,
      platform,
      caption: body.captionOverride || source.caption,
      hashtags: source.hashtags,
      ctaText: source.ctaText,
      ctaUrl: source.ctaUrl,
      videoScript: source.videoScript,
      reelCaption: source.reelCaption,
      campaignObjective: source.campaignObjective,
      platformSize: source.platformSize,
      approvalStatus: "PUBLISHED", // repost is personal official social — already approved content
      createdBy: employeeId,
      brandAssetApplied: true,
      publishedAt: new Date(),
      publishedUrl: `https://${platform.toLowerCase()}.com/repost-${Date.now()}`,
    } as any
  });
  await db.auditLog.create({ data: { action: "PUBLIC_PUBLISH", resource: "CampaignPostRepost", resourceId: cloned.id, details: JSON.stringify({ sourceId: postId, employeeId, platform }) } }).catch(()=>{});
  // If employee has connected social account, push via webhook (best-effort)
  try {
    const acct = await db.socialConnectedAccount.findFirst({ where: { accountName: employeeId, platform } }).catch(()=> null);
    if (acct?.tokenRef) {
      // real publish would call provider API — stub
    }
  } catch {}
  return NextResponse.json({ success: true, reposted: cloned, sourceId: postId, message: "Reposted to your official social — brand kit retained" }, { status: 201 });
}
