import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/auth-middleware";
import { db } from "@/lib/db";
import { isMarketingManager } from "@/lib/marketing/access";
import { safeReturnTo, verifyOAuthState } from "@/lib/social/oauth-state";
import { encryptStoredToken } from "@/lib/social/token-encryption";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/facebook/callback — authenticated OAuth callback handler.
// Exchanges the code for a user access token, upgrades to a long-lived token,
// encrypts page credentials at rest (AES-256-GCM), and commits atomically with AuditLog.
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (auth instanceof NextResponse) return auth;
  if (!isMarketingManager(auth)) {
    return NextResponse.json(
      { error: "Marketing Manager or Super Admin authorization is required to connect Facebook Pages." },
      { status: 403 },
    );
  }
  if (auth.actingAsSessionId) {
    return NextResponse.json(
      { error: "Acting-as sessions cannot connect or overwrite official social credentials." },
      { status: 403 },
    );
  }

  try {
    const code = req.nextUrl.searchParams.get("code");
    const state = req.nextUrl.searchParams.get("state");
    const upstreamError = req.nextUrl.searchParams.get("error");

    const verifiedState = verifyOAuthState(state, "facebook");
    if (!verifiedState.ok) {
      return NextResponse.json(
        {
          error: "The OAuth state was invalid or expired. Restart the connection from Integrations.",
          reason: verifiedState.reason,
        },
        { status: 403 },
      );
    }
    const returnTo = safeReturnTo(verifiedState.payload.returnTo, "/admin/marketing");

    if (upstreamError) {
      const errUrl = new URL(returnTo, req.url);
      errUrl.searchParams.set("fb_error", upstreamError.slice(0, 120));
      return NextResponse.redirect(errUrl);
    }

    if (!code || code.length > 4096) {
      return NextResponse.json({ error: "Authorization code missing or invalid." }, { status: 400 });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;

    if (!appId || !appSecret || !redirectUri) {
      return NextResponse.json(
        {
          status: "NOT_CONFIGURED",
          error: "FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, and FACEBOOK_REDIRECT_URI must be configured.",
        },
        { status: 503 },
      );
    }

    // 1. Exchange code for short-lived user access token
    const tokenUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    tokenUrl.searchParams.set("client_id", appId);
    tokenUrl.searchParams.set("client_secret", appSecret);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);
    tokenUrl.searchParams.set("code", code);

    const tokenRes = await fetch(tokenUrl.toString(), {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    const tokenJson = (await tokenRes.json().catch(() => ({}))) as Record<string, unknown>;
    const userAccessToken = typeof tokenJson.access_token === "string" ? tokenJson.access_token.trim() : "";

    if (!tokenRes.ok || !userAccessToken) {
      return NextResponse.json(
        { error: `Facebook OAuth code exchange failed (HTTP ${tokenRes.status}).` },
        { status: 502 },
      );
    }

    // 2. Upgrade to 60-day long-lived token
    const longLivedUrl = new URL("https://graph.facebook.com/v19.0/oauth/access_token");
    longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedUrl.searchParams.set("client_id", appId);
    longLivedUrl.searchParams.set("client_secret", appSecret);
    longLivedUrl.searchParams.set("fb_exchange_token", userAccessToken);

    const longLivedRes = await fetch(longLivedUrl.toString(), {
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    const longLivedJson = (await longLivedRes.json().catch(() => ({}))) as Record<string, unknown>;
    const longLivedToken =
      typeof longLivedJson.access_token === "string" && longLivedJson.access_token.trim()
        ? longLivedJson.access_token.trim()
        : userAccessToken;

    // 3. Fetch managed Facebook Pages
    const pagesUrl = new URL("https://graph.facebook.com/v19.0/me/accounts");
    pagesUrl.searchParams.set("fields", "id,name,access_token");

    const pagesRes = await fetch(pagesUrl.toString(), {
      headers: { Authorization: `Bearer ${longLivedToken}` },
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    });
    const pagesJson = (await pagesRes.json().catch(() => ({}))) as Record<string, unknown>;
    const pages = Array.isArray(pagesJson.data) ? pagesJson.data : [];

    if (!pagesRes.ok || pages.length === 0) {
      return NextResponse.json(
        { error: "No Facebook Pages with management permissions were returned by Meta." },
        { status: 422 },
      );
    }

    const encryptedAppSecret = encryptStoredToken(appSecret);
    const verifyRaw = process.env.FACEBOOK_VERIFY_TOKEN || "";
    const encryptedVerifyToken = verifyRaw ? encryptStoredToken(verifyRaw) : "";

    // 4. Persist encrypted page tokens and audit log inside one transaction.
    const savedPages = await db.$transaction(async (tx) => {
      const results: Array<{ id: string; pageId: string; pageName: string | null }> = [];
      for (const rawPage of pages) {
        if (!rawPage || typeof rawPage !== "object") continue;
        const page = rawPage as Record<string, unknown>;
        const pageId = typeof page.id === "string" ? page.id.trim() : "";
        const pageName = typeof page.name === "string" ? page.name.trim() : pageId;
        const pageAccessToken = typeof page.access_token === "string" ? page.access_token.trim() : "";
        if (!pageId || !pageAccessToken) continue;

        const encryptedPageToken = encryptStoredToken(pageAccessToken);
        const integration = await tx.facebookIntegration.upsert({
          where: { pageId },
          update: {
            pageName,
            pageAccessToken: encryptedPageToken,
            appId,
            appSecret: encryptedAppSecret,
            verifyToken: encryptedVerifyToken || null,
            connectedBy: auth.userId,
            connectedAt: new Date(),
            status: "ACTIVE",
          },
          create: {
            pageId,
            pageName,
            pageAccessToken: encryptedPageToken,
            appId,
            appSecret: encryptedAppSecret,
            verifyToken: encryptedVerifyToken || null,
            connectedBy: auth.userId,
            status: "ACTIVE",
          },
        });
        results.push({ id: integration.id, pageId: integration.pageId, pageName: integration.pageName });
      }

      await tx.auditLog.create({
        data: {
          userId: auth.userId,
          action: "FACEBOOK_CONNECT",
          resource: "FacebookIntegration",
          details: JSON.stringify({
            pagesConnected: results.length,
            pageIds: results.map((p) => p.pageId),
          }),
        },
      });
      return results;
    });

    const redirectUrl = new URL(returnTo, req.url);
    redirectUrl.searchParams.set("fb_connected", String(savedPages.length));
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error("[facebook.callback] error:", err instanceof Error ? err.name : "UnknownError");
    return NextResponse.json(
      { error: "Failed to complete Facebook OAuth connection." },
      { status: 502 },
    );
  }
}
