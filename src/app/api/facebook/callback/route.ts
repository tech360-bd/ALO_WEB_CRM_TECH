import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/facebook/callback?code=...&state=...
// PUBLIC OAuth callback — exchanges the code for a long-lived access token
// and persists it as a ConnectedAccount (platform=FACEBOOK).
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const errorParam = req.nextUrl.searchParams.get("error");

  if (errorParam) {
    return NextResponse.json({ error: `OAuth error: ${errorParam}` }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL || ""}/api/facebook/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "FACEBOOK_APP_ID / FACEBOOK_APP_SECRET env vars are not configured" },
      { status: 500 }
    );
  }

  try {
    // Exchange code for short-lived user access token
    const tokenUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", clientId);
    tokenUrl.searchParams.set("client_secret", clientSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString(), { method: "GET" });
    const tokenJson: any = await tokenRes.json().catch(() => ({}));

    if (!tokenJson.access_token) {
      console.error("[facebook/callback] no access_token in response", tokenJson);
      return NextResponse.json(
        { error: tokenJson.error?.message || "Failed to exchange code for access token" },
        { status: 400 }
      );
    }

    const shortLivedToken = tokenJson.access_token as string;

    // Exchange for long-lived token
    const longLivedUrl = new URL("https://graph.facebook.com/v18.0/oauth/access_token");
    longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedUrl.searchParams.set("client_id", clientId);
    longLivedUrl.searchParams.set("client_secret", clientSecret);
    longLivedUrl.searchParams.set("fb_exchange_token", shortLivedToken);

    const longRes = await fetch(longLivedUrl.toString(), { method: "GET" });
    const longJson: any = await longRes.json().catch(() => ({}));
    const longLivedToken = (longJson.access_token as string) || shortLivedToken;
    const expiresAt = longJson.expires_in
      ? new Date(Date.now() + Number(longJson.expires_in) * 1000)
      : null;

    // Persist as a ConnectedAccount
    const existing = await db.connectedAccount.findFirst({
      where: { platform: "FACEBOOK" },
      orderBy: { updatedAt: "desc" },
    });

    if (existing) {
      await db.connectedAccount.update({
        where: { id: existing.id },
        data: {
          accessTokenEnc: longLivedToken,
          connectionStatus: "CONNECTED",
          lastSync: new Date(),
          metadata: JSON.stringify({
            tokenExpiresAt: expiresAt?.toISOString() ?? null,
            oauthState: state,
            connectedAt: new Date().toISOString(),
          }),
        },
      });
    } else {
      await db.connectedAccount.create({
        data: {
          platform: "FACEBOOK",
          accountName: "Facebook Integration",
          accountId: `fb-${Date.now()}`,
          connectionStatus: "CONNECTED",
          accessTokenEnc: longLivedToken,
          metadata: JSON.stringify({
            tokenExpiresAt: expiresAt?.toISOString() ?? null,
            oauthState: state,
            connectedAt: new Date().toISOString(),
          }),
          lastSync: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      connected: true,
      expiresAt,
      redirect: "/marketing/social-dashboard",
    });
  } catch (err: any) {
    console.error("[facebook/callback] error", err);
    return NextResponse.json({ error: err?.message || "OAuth callback failed" }, { status: 500 });
  }
}
