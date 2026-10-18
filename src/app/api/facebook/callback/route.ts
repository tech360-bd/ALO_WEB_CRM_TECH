import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptStoredToken } from "@/lib/social/token-encryption";
import { safeReturnTo, verifyOAuthState } from "@/lib/social/oauth-state";

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

    // Verify the signed state BEFORE exchanging the code. Rejecting after the
    // exchange would still complete an attacker-chosen OAuth round trip. The
    // verified payload is also the only source of `returnTo`, so a callback
    // cannot be used to redirect the user off-site.
    const verifiedState = verifyOAuthState(state, "facebook");
    if (!verifiedState.ok) {
      return NextResponse.json(
        { error: "The OAuth state was invalid or expired. Restart the connection from the integration center." },
        { status: 403 },
      );
    }
    const returnTo = safeReturnTo(verifiedState.payload.returnTo, "/admin/marketing");

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

    // 4. Persist page integrations.
    //
    // Credentials are encrypted at rest with AES-256-GCM (ENCRYPTION_KEY)
    // before they reach the database. Previously the page access token, the app
    // secret and the verify token were written in plaintext, which made a
    // single SQL-read or backup-leak enough to publish every connected page.
    // Readers must use decryptStoredToken(), which also tolerates the legacy
    // plaintext rows already stored.
    const encryptedAppSecret = encryptStoredToken(appSecret);
    const encryptedVerifyToken = encryptStoredToken(process.env.FACEBOOK_VERIFY_TOKEN || "");
    const savedPages: any[] = [];
    for (const page of pages) {
      const encryptedPageToken = encryptStoredToken(page.access_token);
      const integration = await db.facebookIntegration.upsert({
        where: { pageId: page.id },
        update: {
          pageName: page.name,
          pageAccessToken: encryptedPageToken,
          appId,
          appSecret: encryptedAppSecret,
          verifyToken: encryptedVerifyToken || null,
          connectedBy: userId,
          connectedAt: new Date(),
          status: "ACTIVE",
        },
        create: {
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: encryptedPageToken,
          appId,
          appSecret: encryptedAppSecret,
          verifyToken: encryptedVerifyToken || null,
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

    // 6. Redirect back to the verified, same-origin path.
    const redirectUrl = `${returnTo}?fb_connected=${savedPages.length}`;
    return NextResponse.redirect(new URL(redirectUrl, req.url));
  } catch (err: any) {
    console.error("[facebook.callback] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
