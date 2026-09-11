import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { trackAttribution } from "@/lib/brains/marketing-brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/brains/marketing/attribution — record a touchpoint.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const role = (session.user as any).role;
    if (role !== "SUPER_ADMIN" && role !== "ADMIN" && role !== "MARKETING_MANAGER" && role !== "MARKETING") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    const body = await req.json();
    const {
      leadId,
      studentId,
      utmSource,
      utmMedium,
      utmCampaign,
      source,
      channel,
      touchpointType,
      contentAssetId,
      conversionValue,
    } = body;

    if (!touchpointType) {
      return NextResponse.json(
        { error: "touchpointType is required" },
        { status: 400 }
      );
    }

    const sub = await trackAttribution({
      leadId,
      studentId,
      utmSource,
      utmMedium,
      utmCampaign,
      source,
      channel,
      touchpointType,
      contentAssetId,
      conversionValue,
    });
    return NextResponse.json({ success: true, attribution: sub });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
