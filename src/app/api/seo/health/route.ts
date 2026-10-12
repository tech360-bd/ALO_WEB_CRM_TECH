import { NextResponse } from "next/server";
import { requireSeoStaff } from "@/lib/seo/request-access";
import { getGA4Config } from "@/lib/seo/ga4";

export const dynamic = "force-dynamic";

// GET /api/seo/health — SEO + GA4 + Search Console status (Phase 9)
// Never leaks secrets — only boolean/configured
export async function GET(request: Request) {
  const auth = await requireSeoStaff(request);
  if (auth instanceof NextResponse) return auth;
  const ga4 = getGA4Config();
  const gscSite = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || "https://aloeducation.com";
  const gscConfigured = !!process.env.GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON || (!!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "https://aloeducation.com";

  // Sitemap/robots are files, not env — check existence via import attempt
  let sitemapOk = true;
  let robotsOk = true;
  try { await import("@/app/sitemap"); } catch { sitemapOk = false; }
  try { await import("@/app/robots"); } catch { robotsOk = false; }

  return NextResponse.json({
    success: true,
    verification: "configuration_only_not_authenticated_or_operational",
    timestamp: new Date().toISOString(),
    sitemap: { url: `${baseUrl}/sitemap.xml`, moduleImportable: sitemapOk, operational: null, note: "Sitemap module import only; public response, coverage and record counts have not been checked." },
    robots: { url: `${baseUrl}/robots.txt`, moduleImportable: robotsOk, operational: null, note: "Module import only; public robots directives have not been fetched." },
    ga4: {
      configured: !!ga4.measurementId,
      enabled: ga4.enabled,
      consentMode: ga4.consentMode,
      operational: null,
      note: ga4.enabled ? "GA4 enabled in configuration; event collection is not verified" : "Set GA4_MEASUREMENT_ID + NEXT_PUBLIC_GA4_ENABLED=true",
    },
    searchConsole: {
      siteUrl: gscSite,
      configured: gscConfigured,
      note: gscConfigured ? "Credentials configured; OAuth grant, domain verification and API access have not been tested" : "Add GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON or verify domain in Search Console",
    },
    businessProfile: {
      configured: !!process.env.GOOGLE_BUSINESS_ACCOUNT_ID,
      note: "Uses GOOGLE_CLIENT_ID/SECRET + Business Profile API — separate from GA4/Search Console",
    },
    canonical: { baseUrl, note: "Canonical via Next metadata, structured data via schema-helpers.ts" },
  });
}
