import { NextResponse } from "next/server";
import { getGA4Config } from "@/lib/seo/ga4";

export const dynamic = "force-dynamic";

// GET /api/seo/health — SEO + GA4 + Search Console status (Phase 9)
// Never leaks secrets — only boolean/configured
export async function GET() {
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
    timestamp: new Date().toISOString(),
    sitemap: { url: `${baseUrl}/sitemap.xml`, ok: sitemapOk, note: "Next.js metadataRoute sitemap.ts — includes 560 universities + blogs/courses" },
    robots: { url: `${baseUrl}/robots.txt`, ok: robotsOk, disallow: ["/api/", "/crm/", "/admin/"] },
    ga4: {
      configured: !!ga4.measurementId,
      enabled: ga4.enabled,
      consentMode: ga4.consentMode,
      measurementId: ga4.measurementId ? `${ga4.measurementId.slice(0,6)}****` : undefined,
      note: ga4.enabled ? "Consent-aware GA4 active" : "Set GA4_MEASUREMENT_ID + NEXT_PUBLIC_GA4_ENABLED=true",
    },
    searchConsole: {
      siteUrl: gscSite,
      configured: gscConfigured,
      note: gscConfigured ? "OAuth via GOOGLE_CLIENT_ID/SECRET + verified domain" : "Add GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON or verify domain in Search Console",
    },
    businessProfile: {
      configured: !!process.env.GOOGLE_BUSINESS_ACCOUNT_ID,
      note: "Uses GOOGLE_CLIENT_ID/SECRET + Business Profile API — separate from GA4/Search Console",
    },
    canonical: { baseUrl, note: "Canonical via Next metadata, structured data via schema-helpers.ts" },
  });
}
