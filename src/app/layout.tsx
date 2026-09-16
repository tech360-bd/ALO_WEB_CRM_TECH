import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

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
  themeColor: "#0057B8",
};

export const metadata: Metadata = {
  title: {
    default: "ALO Education — Study Abroad Consultancy in Bangladesh",
    template: "%s | ALO Education",
  },
  description: "ALO Education helps Bangladeshi students study in UK, USA, Canada, Australia, Ireland, New Zealand and Dubai. Expert counseling, university admissions, visa guidance, scholarship support and AI-powered course matching. Web-based CRM with native app-like mobile experience.",
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
  openGraph: {
    type: "website",
    locale: "en_BD",
    siteName: "ALO Education",
    title: "ALO Education — Study Abroad Consultancy",
    description: "Study in UK, USA, Canada, Australia & more with expert guidance. AI-powered counseling, admissions, visa & scholarships.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ALO Education",
    description: "Study abroad consultancy — UK, USA, Canada, Australia, NZ, Dubai",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "msapplication-TileColor": "#0057B8",
    "msapplication-TileImage": "/icons/icon-144x144.png",
  },
};

import FloatingActionWidget from "@/components/website/FloatingActionWidget";
import PublicLayoutWrapper from "@/components/website/PublicLayoutWrapper";
import { PwaRegister } from "@/components/pwa/PwaRegister";

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
        <PublicLayoutWrapper>
          {children}
        </PublicLayoutWrapper>
        {/* Single global floating contact widget (replaces the old duplicate
            PublicCommunicationBar stack + fake chat). */}
        <FloatingActionWidget />
        <PwaRegister />
        <Toaster />
      </body>
    </html>
  );
}