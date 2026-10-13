import type { Metadata, Viewport } from "next";
import { Inter, Manrope, DM_Serif_Display } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { RegisterSW } from "@/components/site/pwa/register-sw";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  // Only one font may be preloaded — Manrope (display) is the most
  // LCP-critical, so the body + serif fonts skip preload to avoid
  // competing requests.
  preload: false,
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  // Manrope is the display font used in the hero headline (the LCP
  // candidate) — preload it for the fastest first paint.
  preload: true,
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://alaminn.info"),
  title: {
    default: "Al Aminn — Executive Operations, Growth & AI Systems",
    template: "%s · Al Aminn",
  },
  description:
    "Al Aminn transforms strategy into scalable operations, growth and intelligent systems. Working across business operations, sales, international education, university partnerships, AI automation, CRM and digital transformation.",
  keywords: [
    "Al Aminn",
    "Alaminn",
    "executive operations",
    "sales strategy",
    "international education",
    "university partnerships",
    "Bangladesh market",
    "AI automation",
    "CRM systems",
    "digital transformation",
    "ALO Labs",
    "ALO Education",
  ],
  authors: [{ name: "Al Aminn" }],
  creator: "Al Aminn",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon", sizes: "192x192", type: "image/png" },
      { url: "/icon", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Alaminn",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "Al Aminn — Transforming Strategy Into Scalable Operations, Growth & Intelligent Systems",
    description:
      "Executive operations leader, sales strategist, education-business growth specialist and AI-powered systems builder. Based in Bangladesh. Working globally.",
    url: "https://alaminn.info",
    siteName: "Alaminn.info",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "https://alaminn.info/brand/portrait.jpg",
        width: 1280,
        height: 1280,
        alt: "Portrait of Al Aminn",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Al Aminn — Executive Operations, Growth & AI Systems",
    description:
      "Transforming strategy into scalable operations, growth and intelligent systems.",
    images: ["https://alaminn.info/brand/portrait.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: {
    canonical: "/",
  },
  category: "business",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://alaminn.info/#person",
      name: "Al Aminn",
      jobTitle:
        "Executive Operations Leader, Sales Strategist, Education-Business Growth Specialist & AI-Powered Systems Builder",
      url: "https://alaminn.info",
      image: "https://alaminn.info/brand/portrait.jpg",
      sameAs: [
        "https://www.facebook.com/share/1axbZeACyf/",
      ],
      knowsAbout: [
        "Operations Leadership",
        "Sales Strategy",
        "International Education",
        "University Partnerships",
        "AI Automation",
        "CRM Systems",
        "Digital Transformation",
        "Bangladesh Market Insight",
      ],
      worksFor: {
        "@type": "Organization",
        name: "Alaminn.info",
      },
      address: {
        "@type": "PostalAddress",
        addressCountry: "BD",
        addressLocality: "Dhaka",
      },
    },
    {
      "@type": "WebSite",
      "@id": "https://alaminn.info/#website",
      name: "Alaminn.info",
      url: "https://alaminn.info",
      inLanguage: "en",
      publisher: { "@id": "https://alaminn.info/#person" },
    },
    {
      "@type": "ProfilePage",
      url: "https://alaminn.info",
      mainEntity: { "@id": "https://alaminn.info/#person" },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://alaminn.info",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Al Aminn — Executive Operations, Growth & AI Systems",
          item: "https://alaminn.info",
        },
      ],
    },
  ],
};

// Viewport — required for mobile (theme color, viewport-fit for safe areas)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Preload the primary brand portrait — the LCP candidate and the
          image referenced in OG/Twitter metadata. `fetchPriority="high"`
          tells the browser to start the fetch before the profile section
          hydrates.

          next/image with `priority` on the profile section's portrait
          also emits its own preload (for the optimized /_next/image
          URL). This static-URL preload covers the OG image fetch path
          and any non-optimized consumer.
        */}
        <link
          rel="preload"
          as="image"
          href="/brand/portrait.jpg"
          fetchPriority="high"
        />
      </head>
      <body
        className={`${inter.variable} ${manrope.variable} ${dmSerif.variable} relative font-body antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          {children}
          <Toaster />
          <RegisterSW />
        </ThemeProvider>
      </body>
    </html>
  );
}
