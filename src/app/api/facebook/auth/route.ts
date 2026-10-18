import { NextRequest, NextResponse } from "next/server";
import { createOAuthState, safeReturnTo } from "@/lib/social/oauth-state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/facebook/auth — initiate Facebook OAuth flow.
// Redirects the user to Facebook's authorize URL.
export async function GET(req: NextRequest) {
  try {
    const appId = process.env.FACEBOOK_APP_ID;
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI;
    if (!appId || !redirectUri) {
      return NextResponse.json(
        {
          error: "FACEBOOK_APP_ID and FACEBOOK_REDIRECT_URI env vars must be set",
        },
        { status: 500 }
      );
    }

    // Scopes required for lead gen + page management
    const scopes = [
      "pages_manage_metadata",
      "pages_read_engagement",
      "pages_show_list",
      "leads_retrieval",
      "pages_messaging",
    ].join(",");

    // Signed, expiring anti-CSRF state. The callback rejects any state this
    // server did not issue, and the embedded returnTo is constrained to a
    // same-origin absolute path (see src/lib/social/oauth-state.ts).
    const returnTo = safeReturnTo(req.nextUrl.searchParams.get("returnTo"), "/admin/marketing");
    const state = createOAuthState("facebook", returnTo);

    const authUrl =
      `https://www.facebook.com/v18.0/dialog/oauth` +
      `?client_id=${encodeURIComponent(appId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(scopes)}` +
      `&response_type=code` +
      `&state=${encodeURIComponent(state)}`;

    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error("[facebook.auth] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
