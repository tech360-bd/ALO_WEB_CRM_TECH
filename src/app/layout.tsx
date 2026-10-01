import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getSiteSeoDefaults } from "@/lib/cms-managed-content";

const inter = {
  variable: "--font-inter",
  className: "font-sans",
};

const geistMono = {
  variable: "--font-geist-mono",
  className: "font-mono",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#0B5ED7",
};

// Root metadata is generated at request/build time. Site-wide SEO
// defaults (title, description, canonical, Open Graph) are editable
// through the Super Admin Virtual Editor (cms-managed 'seo-meta',
// key 'site-defaults'); the values below are the compiled-in
// fallback used when no CMS record is published or the database is
// unreachable (e.g. build-time prerender without a DB).
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSiteSeoDefaults();
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
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
      "msapplication-TileColor": "#0B5ED7",
      "msapplication-TileImage": "/icons/icon-144x144.png",
    },
  };
}

import FloatingActionWidget from "@/components/website/FloatingActionWidget";
import PublicLayoutWrapper from "@/components/website/PublicLayoutWrapper";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { I18nProvider } from "@/i18n";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {/* Centralized English + বাংলা i18n (no per-language route forks) */}
        <I18nProvider>
          <PublicLayoutWrapper>
            {children}
          </PublicLayoutWrapper>
          {/* Single global floating contact widget (replaces the old duplicate
              PublicCommunicationBar stack + fake chat). */}
          <FloatingActionWidget />
          <PwaRegister />
          <Toaster />
        </I18nProvider>
      </body>
    </html>
  );
}