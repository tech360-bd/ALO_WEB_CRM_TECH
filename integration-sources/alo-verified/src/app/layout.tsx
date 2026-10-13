import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ALO Education - Your Gateway to Global Education",
  description: "ALO Education is a leading education consultancy helping Bangladeshi students study abroad in UK, USA, Canada, Australia, Europe, and Malaysia. Expert guidance for university admissions, visa processing, and IELTS preparation.",
  keywords: ["ALO Education", "study abroad", "UK universities", "student visa", "IELTS", "education consultancy", "Bangladesh"],
  authors: [{ name: "ALO Education" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "ALO Education - Your Gateway to Global Education",
    description: "Expert guidance for studying abroad in UK, USA, Canada, Australia, Europe, and Malaysia",
    siteName: "ALO Education",
    type: "website",
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
        className={`${inter.variable} ${poppins.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
