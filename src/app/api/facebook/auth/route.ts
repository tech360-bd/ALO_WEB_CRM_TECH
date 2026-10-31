import { NextResponse } from "next/server";
import { AuthContext } from "@/lib/auth-middleware";
import { withMarketingAccess } from "@/lib/marketing/access";
import { createOAuthState, safeReturnTo } from "@/lib/social/oauth-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/facebook/auth — initiate Facebook Page OAuth flow (Marketing Manager / Super Admin only).
export const GET = withMarketingAccess(async (request: Request, auth: AuthContext) => {
  if (auth.actingAsSessionId) {
    return NextResponse.json(
      {
        success: false,
        error: "Acting-as sessions cannot initiate or modify official social OAuth connections.",
      },
      { status: 403 },
    );
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) {
    const missingEnv = [
      !appId ? "FACEBOOK_APP_ID" : null,
      !appSecret ? "FACEBOOK_APP_SECRET" : null,
      !redirectUri ? "FACEBOOK_REDIRECT_URI" : null,
    ].filter(Boolean);
    return NextResponse.json(
      {
        success: false,
        status: "NOT_CONFIGURED",
        provider: "facebook",
        missingEnv,
        error: `Configure ${missingEnv.join(", ")} in server environment settings.`,
      },
      { status: 503 },
    );
  }

  // Scopes required for Facebook Page publishing, lead retrieval, and messaging.
  const scopes = [
    "pages_manage_posts",
    "pages_manage_metadata",
    "pages_read_engagement",
    "pages_show_list",
    "leads_retrieval",
    "pages_messaging",
  ].join(",");

  const reqUrl = new URL(request.url);
  const returnTo = safeReturnTo(reqUrl.searchParams.get("returnTo"), "/admin/marketing");
  const state = createOAuthState("facebook", returnTo);

  const authUrl = new URL("https://www.facebook.com/v19.0/dialog/oauth");
  authUrl.searchParams.set("client_id", appId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("state", state);

  if (reqUrl.searchParams.get("mode") === "json") {
    return NextResponse.json({
      success: true,
      provider: "facebook",
      authorizeUrl: authUrl.toString(),
    });
  }

  return NextResponse.redirect(authUrl.toString());
}, "manager");
