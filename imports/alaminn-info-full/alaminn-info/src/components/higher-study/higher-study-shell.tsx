"use client";

/**
 * HigherStudyShell — the page wrapper for every Higher Study route.
 *
 * When a visitor enters the Higher Study sub-platform, the main Alaminn.info
 * navigation DISAPPEARS. Only the Al Aminn logo (→ "/") and the Higher Study
 * navigation remain.
 *
 *  ┌──────────────────────────────────────────────────────────────────┐
 *  │ HigherStudyNavbar (the ONLY navbar — no main site nav)            │
 *  │   [Al Aminn → /] | Universities | Courses | Scholarships | PhD |  │
 *  │   Supervisors | Destinations | Resources | Compare | [Apply Now]  │
 *  ├──────────────────────────────────────────────────────────────────┤
 *  │ Main content area (children prop — page-controlled)               │
 *  ├──────────────────────────────────────────────────────────────────┤
 *  │ Footer (Alaminn.info main — mt-auto)                              │
 *  └──────────────────────────────────────────────────────────────────┘
 */
import { HigherStudyNavbar } from "@/components/higher-study/higher-study-navbar";
import { Footer } from "@/components/site/footer";

export interface HigherStudyShellProps {
  children: React.ReactNode;
  /** Optional className for the main content wrapper. */
  className?: string;
}

export function HigherStudyShell({ children, className: _className }: HigherStudyShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <HigherStudyNavbar />

      {/* Spacer so content doesn't hide behind the fixed navbar (h-16) */}
      <div className="h-16" aria-hidden="true" />

      <main id="main-content" className="flex-1">{children}</main>

      <Footer />
    </div>
  );
}

// Re-export breadcrumb for convenience.
export { HigherStudyBreadcrumb } from "./breadcrumb";
