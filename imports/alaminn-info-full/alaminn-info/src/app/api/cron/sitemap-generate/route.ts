import { NextResponse, type NextRequest } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/sitemap-generate
 *
 * The sitemap is statically generated at build time via
 * `src/app/sitemap.ts` (Next.js metadata-routes convention) and served as
 * `/sitemap.xml`. There is no runtime generation step. This endpoint is a
 * reporting hook so the cron scheduler has a consistent surface; it
 * returns a fixed summary indicating the sitemap is build-time only.
 *
 * Recommended cPanel cron schedule: not required. If you want to force a
 * sitemap refresh, rebuild & redeploy the app instead of hitting this URL.
 *
 * Auth: requires `x-cron-secret` header (or `?secret=` query) matching the
 * `CRON_SECRET` environment variable. Returns 401 on auth failure, 503 if
 * the server is misconfigured (no CRON_SECRET).
 */
export async function GET(request: NextRequest) {
  const auth = verifyCronAuth(request);
  if (!auth.ok) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized",
        data: null,
        meta: {},
        errors: [auth.error],
      },
      { status: auth.status }
    );
  }

  try {
    const now = new Date();
    console.log(
      `[cron:sitemap-generate] generated=false — sitemap is statically generated at build time`
    );

    return NextResponse.json({
      success: true,
      message: "Sitemap is build-time generated.",
      data: {
        sitemap: "/sitemap.xml",
        generated: false,
        note: "Sitemap is statically generated at build time via src/app/sitemap.ts. Rebuild & redeploy to refresh.",
      },
      meta: {
        scannedAt: now.toISOString(),
      },
      errors: [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Cron job failed",
        data: null,
        meta: {},
        errors: [String(error)],
      },
      { status: 500 }
    );
  }
}
