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

export const metadata: Metadata = {
  title: "ALO Education — Study Abroad Consultancy in Bangladesh",
  description: "ALO Education helps Bangladeshi students study in UK, USA, Canada, Australia, Ireland, New Zealand and Dubai. Expert counseling, university admissions, visa guidance, scholarship support and AI-powered course matching.",
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
};

import PublicCommunicationBar from "@/components/website/PublicCommunicationBar";
import PublicLayoutWrapper from "@/components/website/PublicLayoutWrapper";

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
        <PublicCommunicationBar />
        <Toaster />
      </body>
    </html>
  );
}