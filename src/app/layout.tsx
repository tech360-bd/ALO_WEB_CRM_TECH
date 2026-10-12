import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ALO Education — Study Abroad with Confidence | AI-Powered Course Matching",
  description:
    "ALO Education helps Bangladeshi students find and apply to top universities worldwide. AI-powered course matching, scholarship finder, visa support, and complete application tracking.",
  keywords: [
    "study abroad",
    "Bangladesh",
    "UK universities",
    "Canada education",
    "Australia study",
    "IELTS preparation",
    "scholarship",
    "student visa",
    "ALO Education",
    "Masters degree abroad",
    "MBA abroad",
    "course finder",
    "university application",
  ],
  authors: [{ name: "ALO Education" }],
  openGraph: {
    title: "ALO Education — Your Path to World-Class Education",
    description:
      "AI-powered course matching, scholarship discovery, and complete visa support for Bangladeshi students studying in UK, Canada, Australia, and 14+ countries.",
    siteName: "ALO Education",
    type: "website",
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "ALO Education — Study Abroad with Confidence",
    description:
      "AI-powered platform matching Bangladeshi students with world-class universities.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
