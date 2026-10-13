/**
 * Higher Study section layout — wraps every Higher Study page in the
 * shared HigherStudyShell (so the secondary nav + main Navbar/Footer
 * are consistent).
 *
 * Each page renders its own breadcrumb via the HigherStudyBreadcrumb
 * component inside its content area (so it can pass page-specific
 * crumbs).
 */
import type { Metadata } from "next";
import { HigherStudyShell } from "@/components/higher-study/higher-study-shell";
import { buildHigherStudyMetadata } from "@/lib/higher-study/seo";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Higher Study — Universities, Courses, Scholarships & PhDs",
  description:
    "Verified higher-study intelligence across 30 destinations: universities, courses, scholarships, PhD opportunities, supervisors and study resources — with referral handoff to ALO Education for application processing.",
  path: "/higher-study",
  keywords: [
    "higher study",
    "study abroad",
    "international universities",
    "postgraduate scholarships",
    "PhD opportunities",
    "university application",
    "ALO Education",
    "study destinations",
    "MBA",
    "MSc",
    "MRes",
    "MPhil",
  ],
});

export default function HigherStudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <HigherStudyShell>{children}</HigherStudyShell>;
}
