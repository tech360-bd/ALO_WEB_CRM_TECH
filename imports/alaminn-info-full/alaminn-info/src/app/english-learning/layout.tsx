/**
 * English Learning section layout — wraps every English Learning page
 * in the shared EnglishLearningShell (Navbar + Footer).
 *
 * Each page renders its own breadcrumb via the EnglishLearningBreadcrumb
 * component inside its content area.
 */
import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { buildEnglishLearningMetadata } from "@/lib/english-learning/seo";

export const metadata: Metadata = buildEnglishLearningMetadata({
  title: "English Learning — IELTS, TOEFL, PTE, Duolingo, GRE & GMAT Prep",
  description:
    "Prepare for IELTS, TOEFL, PTE, Duolingo English Test, GRE and GMAT with verified courses, practice tests, 1:1 tutors and study resources — with referral handoff to ALO Education for paid course packages and tutor bookings.",
  path: "/english-learning",
  keywords: [
    "english learning",
    "IELTS preparation",
    "TOEFL preparation",
    "PTE academic",
    "Duolingo English Test",
    "GRE verbal",
    "GMAT verbal",
    "english courses",
    "english tutors",
    "english practice tests",
    "ALO Education",
  ],
});

export default function EnglishLearningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ink-50/30">
      <Navbar />
      <main id="main-content" className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
