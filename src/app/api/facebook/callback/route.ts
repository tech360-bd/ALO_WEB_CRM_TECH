import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/facebook/callback — OAuth callback handler.
// Exchanges the code for a user access token, then long-lived page access token.
export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const error = req.nextUrl.searchParams.get("error");

    if (error) {
      return NextResponse.redirect(new URL("/admin/marketing?fb_error=" + encodeURIComponent(error), req.url));
    }

    if (!code) {
      return NextResponse.json({ error: "Authorization code missing" }, { status: 400 });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;

    if (!appId || !appSecret || !redirectUri) {
      return NextResponse.json(
        { error: "FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, and FACEBOOK_REDIRECT_URI must be set" },
        { status: 500 }
      );
    }

    // 1. Exchange code for short-lived user access token
    const tokenUrl =
      `https://graph.facebook.com/v18.0/oauth/access_token` +
      `?client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&code=${encodeURIComponent(code)}`;

    const tokenRes = await fetch(tokenUrl, { method: "GET" });
    const tokenJson = await tokenRes.json();

    if (!tokenRes.ok || !tokenJson.access_token) {
      return NextResponse.json(
        { error: "Failed to exchange code for token", details: tokenJson },
        { status: 502 }
      );
    }

    const userAccessToken = tokenJson.access_token;

    // 2. Exchange for long-lived token
    const longLivedUrl =
      `https://graph.facebook.com/v18.0/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${encodeURIComponent(appId)}` +
      `&client_secret=${encodeURIComponent(appSecret)}` +
      `&fb_exchange_token=${encodeURIComponent(userAccessToken)}`;

    const longLivedRes = await fetch(longLivedUrl);
    const longLivedJson = await longLivedRes.json();
    const longLivedToken = longLivedJson.access_token || userAccessToken;

    // 3. Get user's pages with page access tokens
    const pagesUrl =
      `https://graph.facebook.com/v18.0/me/accounts` +
      `?access_token=${encodeURIComponent(longLivedToken)}` +
      `&fields=id,name,access_token`;

    const pagesRes = await fetch(pagesUrl);
    const pagesJson = await pagesRes.json();
    const pages: any[] = pagesJson.data || [];

    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    // 4. Persist page integrations
    const savedPages: any[] = [];
    for (const page of pages) {
      const integration = await db.facebookIntegration.upsert({
        where: { pageId: page.id },
        update: {
          pageName: page.name,
          pageAccessToken: page.access_token,
          appId,
          appSecret,
          verifyToken: process.env.FACEBOOK_VERIFY_TOKEN || null,
          connectedBy: userId,
          connectedAt: new Date(),
          status: "ACTIVE",
        },
        create: {
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token,
          appId,
          appSecret,
          verifyToken: process.env.FACEBOOK_VERIFY_TOKEN || null,
          connectedBy: userId,
          status: "ACTIVE",
        },
      });
      savedPages.push({ id: integration.id, pageId: page.id, pageName: page.name });
    }

    // 5. Audit log
    if (userId) {
      await db.auditLog.create({
        data: {
          userId,
          action: "FACEBOOK_CONNECT",
          resource: "FacebookIntegration",
          details: JSON.stringify({
            pagesConnected: savedPages.length,
            pageIds: savedPages.map((p) => p.pageId),
          }),
        },
      }).catch(() => {});
    }

    // 6. Redirect back to UI
    let returnTo = "/admin/marketing";
    if (state) {
      try {
        const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
        if (decoded.returnTo) returnTo = decoded.returnTo;
      } catch {}
    }
    const redirectUrl = `${returnTo}?fb_connected=${savedPages.length}`;
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  } catch (err: any) {
    console.error("[facebook.callback] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
