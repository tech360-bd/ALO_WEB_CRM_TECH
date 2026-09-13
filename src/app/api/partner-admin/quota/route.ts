import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET — quota usage for partner
export async function GET(req: NextRequest) {
  const partnerId = req.nextUrl.searchParams.get("partnerId");
  let partner: Awaited<ReturnType<typeof db.employee.findFirst>> = null;
  if (partnerId) partner = await db.employee.findFirst({ where: { id: partnerId, role: "PARTNER" } });
  if (!partner) partner = await db.employee.findFirst({ where: { role: "PARTNER" } });
  if (!partner) return NextResponse.json({ error: "No partner found" }, { status: 404 });

  const quota = await db.partnerMarketingQuota.findUnique({ where: { partnerId: partner.id } });
  const monthYear = new Date().toISOString().slice(0, 7);
  const usage = await db.partnerMarketingUsage.findFirst({ where: { partnerId: partner.id, monthYear } });

  const imageLimit = quota?.monthlyImageLimit || 15;
  const videoLimit = quota?.monthlyVideoLimit || 10;
  const imagesUsed = usage?.imagesUsed || 0;
  const videosUsed = usage?.videosUsed || 0;

  return NextResponse.json({
    quota,
    usage,
    imageQuota: { limit: imageLimit, used: imagesUsed, remaining: imageLimit - imagesUsed, percentage: Math.round((imagesUsed / imageLimit) * 100) },
    videoQuota: { limit: videoLimit, used: videosUsed, remaining: videoLimit - videosUsed, percentage: Math.round((videosUsed / videoLimit) * 100) },
    videoDurationLimit: quota?.videoDurationLimitSeconds || 30,
    autoPublishAllowed: quota?.autoPublishAllowed || false,
    requiresAloApproval: quota?.requiresAloApproval || true,
  });
}
