import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth, AuthContext } from "@/lib/auth-middleware";

const MARKETING_AUTH = {
  requireUserTypes: ['MARKETING', 'MARKETING_MANAGER', 'SUPER_ADMIN', 'ADMIN'],
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET — marketing calendar (scheduled posts/content across all platforms) with CRM timeline fields
export const GET = withAuth(async (req: Request, _auth: AuthContext) => {
  const platform = new URL(req.url).searchParams.get("platform");
  const status = new URL(req.url).searchParams.get("status");
  const where: any = {};
  if (platform && platform !== "ALL") where.platform = platform.toLowerCase();
  if (status && status !== "ALL") where.status = status;

  const items = await db.marketingCalendar.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    take: 100,
  }).catch(() => []);

  // Also pull CampaignPosts that are SCHEDULED/PUBLISHED to show unified calendar
  const posts = await db.campaignPost.findMany({
    where: { approvalStatus: { in: ["SCHEDULED", "PUBLISHED", "APPROVED"] } },
    orderBy: { scheduledAt: "asc" },
    take: 50,
  }).catch(() => []);

  // Merge: calendar items + posts not already in calendar
  const merged = [
    ...items.map((i: any) => ({
      id: i.id,
      title: i.title,
      platform: i.platform,
      status: i.status,
      scheduledAt: i.scheduledAt,
      publishedAt: i.publishedAt,
      type: "calendar",
      campaignId: i.campaignId,
      contentId: i.contentId,
    })),
    ...posts.map((p: any) => ({
      id: `post-${p.id}`,
      title: p.title,
      platform: p.platform,
      status: p.approvalStatus.toLowerCase(),
      scheduledAt: p.scheduledAt || p.publishedAt || p.createdAt,
      publishedAt: p.publishedAt,
      type: "campaignPost",
      campaignId: p.id,
      contentId: p.id,
    })),
  ];

  merged.sort((a, b) => new Date(a.scheduledAt as any).getTime() - new Date(b.scheduledAt as any).getTime());

  return NextResponse.json({
    items: merged,
    calendarCount: items.length,
    postsCount: posts.length,
    total: merged.length,
  } as any);
}, MARKETING_AUTH);

// POST — schedule content to calendar
export const POST = withAuth(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => ({}));
  const { title, description, platform, scheduledAt, campaignId, contentId } = body;
  if (!title || !scheduledAt) return NextResponse.json({ error: "title and scheduledAt required" }, { status: 400 });

  const item = await db.marketingCalendar.create({
    data: {
      title,
      description: description || "",
      platform: (platform || "facebook").toLowerCase(),
      campaignId: campaignId || null,
      contentId: contentId || campaignId || null,
      status: "scheduled",
      scheduledAt: new Date(scheduledAt),
      createdById: auth.userId,
    },
  });

  await db.auditLog.create({
    data: {
      userId: auth.userId,
      action: "PUBLIC_PUBLISH",
      resource: "MarketingCalendar",
      resourceId: item.id,
      details: JSON.stringify({ title, platform, scheduledAt }),
    },
  }).catch(() => {});

  return NextResponse.json({ item, message: "Calendar entry scheduled" } as any, { status: 201 });
}, MARKETING_AUTH);

// PATCH — update status (publish, cancel, reschedule)
export const PATCH = withAuth(async (req: Request, auth: AuthContext) => {
  const body = await req.json().catch(() => ({}));
  const { id, status, scheduledAt } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  if (id.startsWith("post-")) {
    // Update campaignPost
    const postId = id.replace("post-", "");
    const data: any = {};
    if (status === "published") { data.approvalStatus = "PUBLISHED"; data.publishedAt = new Date(); }
    if (status === "scheduled" && scheduledAt) { data.approvalStatus = "SCHEDULED"; data.scheduledAt = new Date(scheduledAt).toISOString(); }
    const post = await db.campaignPost.update({ where: { id: postId }, data }).catch(() => null);
    return NextResponse.json({ item: post, message: "Campaign post schedule updated" } as any);
  }
  const data: any = {};
  if (status) data.status = status;
  if (scheduledAt) data.scheduledAt = new Date(scheduledAt);
  if (status === "published") data.publishedAt = new Date();
  if (status === "failed") data.failedAt = new Date();

  const item = await db.marketingCalendar.update({ where: { id }, data }).catch(() => null);
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.auditLog.create({
    data: { userId: auth.userId, action: "PUBLIC_PUBLISH", resource: "MarketingCalendar", resourceId: id, details: JSON.stringify({ status, scheduledAt }) },
  }).catch(() => {});

  return NextResponse.json({ item, message: "Calendar updated" } as any);
}, MARKETING_AUTH);
