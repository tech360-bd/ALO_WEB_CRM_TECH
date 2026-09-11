import type { Metadata } from "next";
// Fonts loaded via CSS
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

/* ─── Font variables (using system fonts to avoid network dependency during build) ─── */
const inter = { variable: "--font-inter" };
const hindSiliguri = { variable: "--font-bangla" };
const geistMono = { variable: "--font-geist-mono" };

export const metadata: Metadata = {
  title: "ALO Education — Study Abroad Consultants in Bangladesh",
  description: "Your trusted study abroad consultant in Bangladesh. Find universities, compare courses, check eligibility, and manage your full study abroad journey with AI-powered tools. UK, USA, Canada, Australia, Ireland, Germany & more.",
  keywords: ["study abroad", "ALO Education", "study in UK", "study in Canada", "study in Australia", "study abroad consultants Bangladesh", "IELTS mock test", "university admission", "student visa", "Dhaka"],
  authors: [{ name: "ALO Education" }],
  metadataBase: new URL("https://aloeducation.com"),
  alternates: { canonical: "https://aloeducation.com" },
  openGraph: {
    title: "ALO Education — Study Abroad with Confidence",
    description: "Find universities, compare courses, check eligibility, and manage your full study abroad journey from Bangladesh.",
    url: "https://aloeducation.com",
    siteName: "ALO Education",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ALO Education — Study Abroad Consultants",
    description: "Your trusted study abroad partner in Bangladesh",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${hindSiliguri.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
