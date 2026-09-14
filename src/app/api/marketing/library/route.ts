import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Library for Counselor / Any Employee — approved posts they can repost to their own social
// GET ?status=APPROVED|PUBLISHED&platform=&q=
// Returns posts where approvalStatus APPROVED/PUBLISHED, brand applied, so counselor can 1-click repost

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status") || "APPROVED";
  const platform = req.nextUrl.searchParams.get("platform");
  const q = (req.nextUrl.searchParams.get("q") || "").toLowerCase();
  const where: any = {};
  if (status && status !== "ALL") where.approvalStatus = status;
  else if (status === "ALL") where.approvalStatus = { in: ["APPROVED","PUBLISHED","SCHEDULED"] };
  if (platform) where.platform = platform;
  if (q) where.title = { contains: q, mode: "insensitive" };
  // Only approved/published are library
  if (!where.approvalStatus) where.approvalStatus = { in: ["APPROVED","PUBLISHED"] };
  const posts = await db.campaignPost.findMany({ where, orderBy: { approvedAt: "desc" }, take: 50 });
  // also include marketing assets for preview
  const assets = await db.marketingAsset.findMany({ where: { status: "active" }, orderBy: { createdAt: "desc" }, take: 20 }).catch(()=> []);
  return NextResponse.json({ posts, assets, hint: "Use POST /api/marketing/repost { postId, targetPlatform, employeeId } to repost to your official social" });
}
