import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/facebook/auth
// PUBLIC redirect to Facebook OAuth authorize URL.
export async function GET() {
  const clientId = process.env.FACEBOOK_APP_ID;
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI ||
    `${process.env.NEXTAUTH_URL || ""}/api/facebook/callback`;
  const scopes = ["pages_manage_posts", "pages_read_engagement", "pages_show_list", "leads_retrieval", "business_management"].join(",");

  if (!clientId) {
    return NextResponse.json(
      { error: "FACEBOOK_APP_ID env var is not configured" },
      { status: 500 }
    );
  }

  const url = new URL("https://www.facebook.com/v18.0/dialog/oauth");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("response_type", "code");
  // state — basic CSRF protection
  url.searchParams.set("state", `fb-oauth-${Date.now()}`);

  return NextResponse.redirect(url.toString());
}
