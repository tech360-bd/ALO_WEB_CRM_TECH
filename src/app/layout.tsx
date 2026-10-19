import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getSiteSeoDefaults } from "@/lib/cms-managed-content";
import { getGoogleStackConfig } from "@/lib/google/config";
import { organizationSchema } from "@/lib/seo/schema-helpers";

// Brand typography (Montserrat/Poppins headings, Open Sans/Roboto body) is
// declared once in globals.css as self-hosted @font-face rules mapped onto the
// --font-sans / --font-heading theme tokens. No third-party font CDN is
// requested, so the production CSP (`font-src 'self' data:`) stays intact.

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0057B8",
};

// Root metadata is generated at request/build time. Site-wide SEO
// defaults (title, description, canonical, Open Graph) are editable
// through the Super Admin Virtual Editor (cms-managed 'seo-meta',
// key 'site-defaults'); the values below are the compiled-in
// fallback used when no CMS record is published or the database is
// unreachable (e.g. build-time prerender without a DB).
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoDefaults();
  const googleSiteVerification = getGoogleStackConfig().siteVerificationToken;
  const title = seo?.title ?? "ALO Education — Study Abroad Consultancy in Bangladesh";
  const description =
    seo?.description ??
    "ALO Education helps Bangladeshi students study in UK, USA, Canada, Australia, Ireland, New Zealand and Dubai. Expert counseling, university admissions, visa guidance, scholarship support and AI-powered course matching. Web-based CRM with native app-like mobile experience.";
  return {
    title: {
      default: title,
      template: "%s | ALO Education",
    },
    description,
    applicationName: "ALO Education",
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "ALO Education",
      startupImage: ["/icons/icon-512x512.png"],
    },
    formatDetection: {
      telephone: true,
      date: false,
      address: false,
      email: false,
    },
    icons: {
      icon: [
        { url: "/icons/icon-72x72.png", sizes: "72x72", type: "image/png" },
        { url: "/icons/icon-96x96.png", sizes: "96x96", type: "image/png" },
        { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
        { url: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg", type: "image/svg+xml" },
      ],
      apple: [
        { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" },
        { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      ],
      shortcut: "/icons/icon-192x192.png",
    },
    ...(seo?.canonical ? { alternates: { canonical: seo.canonical } } : {}),
    openGraph: {
      type: "website",
      locale: "en_BD",
      siteName: "ALO Education",
      title: seo?.ogTitle ?? "ALO Education — Study Abroad Consultancy",
      description: seo?.ogDescription ?? "Study in UK, USA, Canada, Australia & more with expert guidance. AI-powered counseling, admissions, visa & scholarships.",
      ...(seo?.ogImage ? { images: [{ url: seo.ogImage, alt: "ALO Education" }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: seo?.ogTitle ?? "ALO Education",
      description: "Study abroad consultancy — UK, USA, Canada, Australia, NZ, Dubai",
    },
    other: {
      // Search Console ownership verification (HTML meta method). Only emitted
      // when GOOGLE_SITE_VERIFICATION_TOKEN is set, so the tag is never
      // rendered empty. The DNS TXT method is preferred for a domain property;
      // this supports the URL-prefix property and sites that cannot edit DNS.
      ...(googleSiteVerification
        ? { "google-site-verification": googleSiteVerification }
        : {}),
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
      "msapplication-TileColor": "#0057B8",
      "msapplication-TileImage": "/icons/icon-144x144.png",
    },
  };
}

import FloatingActionWidget from "@/components/website/FloatingActionWidget";
import PublicLayoutWrapper from "@/components/website/PublicLayoutWrapper";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { I18nProvider } from "@/i18n";
import { RealtimeNotificationProvider } from "@/components/realtime/RealtimeNotificationProvider";
import GoogleTags from "@/components/analytics/GoogleTags";
import AnalyticsPageView from "@/components/analytics/AnalyticsPageView";
import ConsentBanner from "@/components/analytics/ConsentBanner";
import AnalyticsClickTracker from "@/components/analytics/AnalyticsClickTracker";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased bg-background text-foreground"
      >
        {/* Google Free Stack (docs/GOOGLE-FREE-STACK.md). Exactly one tag
            loader — GTM if a container is configured, otherwise gtag.js — and
            nothing at all outside production. These render null when
            unconfigured, so the website never depends on a Google endpoint. */}
        {/* Site-wide Organization / EducationalOrganization JSON-LD.
            src/lib/seo/schema-helpers.ts has defined organizationSchema() since
            it was written but nothing ever rendered it, so Google had no
            sitewide entity to associate with the Business Profile listing.
            Serialised with < escaped so a value can never break out of the
            script element. */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema()).replace(/</g, "\\u003c"),
          }}
        />
        <GoogleTags />
        {/* Owns every page_view, including the SPA navigations the tag loader
            cannot see. Skips the first view under GTM to avoid double counting. */}
        <AnalyticsPageView />
        {/* One delegated listener measures every WhatsApp / tel: / mailto: link
            on the site, including ones on pages that predate this work. */}
        <AnalyticsClickTracker />
        {/* Centralized English + বাংলা i18n (no per-language route forks) */}
        <I18nProvider>
          <PublicLayoutWrapper>
            {children}
          </PublicLayoutWrapper>
          {/* Single global floating contact widget — the only AI / WhatsApp / Facebook control. */}
          <FloatingActionWidget />
          {/* Live notification stream (spec s86). Renderless: it feeds the portal
              store that every shell's bell already reads, and opens no connection
              for a signed-out visitor. */}
          <RealtimeNotificationProvider />
          <PwaRegister />
          <Toaster />
          {/* Analytics consent (Consent Mode v2). Tags already load with every
              consent type denied; this is where a visitor grants or refuses. */}
          <ConsentBanner />
        </I18nProvider>
      </body>
    </html>
  );
}