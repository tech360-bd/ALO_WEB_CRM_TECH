import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Auto lead collect from Google Location / Google Maps / Business Profile
// Called by Google Business webhook, Zapier, Make, or via manual place review push
// Body: { placeId, placeName, name, phone, email, rating, review, sourceDetail?, campaignId? }
// Creates MarketingLead source=GOOGLE_MAPS + MarketingComment + audit
// Verify via ?token= or x-webhook-token against the server secret. The
// endpoint fails closed in production when the secret is not configured.

function tokenMatches(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  const expected = process.env.GOOGLE_BUSINESS_WEBHOOK_TOKEN;
  if (!expected || expected.length < 16) {
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Webhook verification is not configured" }, { status: 500 });
    }
  } else {
    const provided = req.nextUrl.searchParams.get("token") || req.headers.get("x-webhook-token") || "";
    if (!tokenMatches(provided, expected)) return NextResponse.json({ error: "Invalid webhook token" }, { status: 401 });
  }
  const body = await req.json().catch(()=> ({}));
  const placeId: string = body.placeId || body.place_id || "";
  const name: string = body.name || body.fullName || body.reviewerName || "Google Maps Lead";
  const phone: string = body.phone || body.phoneNumber || "";
  const email: string = body.email || "";
  const review: string = body.review || body.comment || body.text || "";
  const rating = Number(body.rating || 0);
  const placeName: string = body.placeName || body.locationName || "Google Location";

  if (!phone && !email && !name) return NextResponse.json({ error: "name or phone or email required" }, { status: 400 });

  const lead = await db.marketingLead.create({
    data: {
      name,
      phone: phone || "GOOGLE-" + Date.now().toString(36),
      email: email || "",
      destination: body.destination || "",
      source: "GOOGLE_MAPS",
      sourceDetail: JSON.stringify({ placeId, placeName, rating, review: review.slice(0, 300) }),
      status: "new",
      hotLead: rating >= 4 || /interested|admission|visa|scholarship/i.test(review),
      createdById: "google-business-webhook",
    }
  });

  // Also create comment for visibility in dashboard
  try {
    await db.marketingComment.create({
      data: {
        platform: "GOOGLE",
        postId: placeId || placeName,
        externalCommentId: `g-${lead.id}`,
        authorName: name,
        authorId: phone || email || placeId,
        text: review || `Rating ${rating} at ${placeName}`,
        intent: rating >= 4 ? "positive_lead" : "lead",
        isLead: true,
        leadId: lead.id,
        status: "new",
      }
    });
  } catch {}

  try {
    await db.marketingLeadScore.create({ data: { leadId: lead.id, score: rating ? rating*20 : 60, factors: JSON.stringify({ source: "google_maps", rating }) } }).catch(()=>{});
  } catch {}

  return NextResponse.json({ success: true, leadId: lead.id, source: "GOOGLE_MAPS", hotLead: lead.hotLead }, { status: 201 });
}

export async function GET() {
  return NextResponse.json({
    success: true,
    webhook: "google-business",
    verificationConfigured: Boolean(process.env.GOOGLE_BUSINESS_WEBHOOK_TOKEN && process.env.GOOGLE_BUSINESS_WEBHOOK_TOKEN.length >= 16),
  });
}
