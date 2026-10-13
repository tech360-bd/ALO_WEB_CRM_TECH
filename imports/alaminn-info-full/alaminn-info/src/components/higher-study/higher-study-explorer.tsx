"use client";

/**
 * HigherStudyExplorer — compact, in-page navigation for the Higher Study
 * platform.
 *
 * This REPLACES the old duplicate sticky SecondaryNav (the "second full
 * navbar"). It is intentionally:
 *   - NOT sticky
 *   - NOT full-width glass
 *   - NOT a second brand bar
 *
 * Instead it is a single compact pill row ("Higher Study Explorer") that
 * sits below the page hero, letting visitors jump between the 9 core
 * Higher Study destinations without a second chrome bar competing with
 * the global Navbar.
 *
 * Composition:
 *   ┌────────────────────────────────────────────────────────────────┐
 *   │ Higher Study Explorer   [Universities] [Courses] [Scholarships]│
 *   │   … [PhD & Research] [Supervisors] [Destinations] [Resources]  │
 *   │   … [Compare] [Saved Items]                          [Apply →] │
 *   └────────────────────────────────────────────────────────────────┘
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Building2,
  BookOpen,
  Award,
  FlaskConical,
  UserSearch,
  Globe2,
  Library,
  Columns3,
  Bookmark,
  Send,
  Compass,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExplorerItem {
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
}

/** The 9 compact explorer links (per the spec). */
const EXPLORER_ITEMS: ExplorerItem[] = [
  {
    label: "Universities",
    href: "/higher-study/global-universities",
    icon: Building2,
    description: "Browse universities across all destinations",
  },
  {
    label: "Courses",
    href: "/higher-study/course-finder",
    icon: BookOpen,
    description: "Search 33 study levels across partner universities",
  },
  {
    label: "Scholarships",
    href: "/higher-study/scholarships",
    icon: Award,
    description: "Funding types and major scholarship programmes",
  },
  {
    label: "PhD & Research",
    href: "/higher-study/phd-research",
    icon: FlaskConical,
    description: "PhD projects, postdocs and research areas",
  },
  {
    label: "Supervisors",
    href: "/higher-study/supervisors",
    icon: UserSearch,
    description: "Supervisors currently accepting research students",
  },
  {
    label: "Destinations",
    href: "/higher-study/destinations",
    icon: Globe2,
    description: "30 study destinations across 4 regions",
  },
  {
    label: "Resources",
    href: "/higher-study/study-resources",
    icon: Library,
    description: "Guides, SOPs, CV templates and checklists",
  },
  {
    label: "Compare",
    href: "/higher-study/compare",
    icon: Columns3,
    description: "Compare up to 4 entities side by side",
  },
  {
    label: "Saved Items",
    href: "/higher-study/saved",
    icon: Bookmark,
    description: "Your saved universities, courses and scholarships",
  },
];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/higher-study") return pathname === "/higher-study";
  return pathname === href || pathname.startsWith(href + "/");
}

export function HigherStudyExplorer() {
  const pathname = usePathname();

  return (
    <section
      aria-labelledby="hs-explorer-heading"
      className="relative border-b border-ink-100 bg-gradient-to-b from-white to-blue-50/40"
    >
      <div className="mx-auto max-w-[1320px] px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Label + pill row */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg grad-intelligence shadow-blue">
                <Compass className="h-4 w-4 text-white" aria-hidden="true" />
              </span>
              <h2
                id="hs-explorer-heading"
                className="font-display text-sm font-extrabold uppercase tracking-[0.14em] text-ink-900"
              >
                Higher Study Explorer
              </h2>
            </div>

            {/* Pill row — wraps on tablet, scrolls on mobile */}
            <nav
              aria-label="Higher Study sections"
              className="flex flex-wrap items-center gap-1.5"
            >
              {EXPLORER_ITEMS.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    title={item.description}
                    className={cn(
                      "group relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-1",
                      active
                        ? "border-orange-300 bg-orange-50 text-orange-700 shadow-sm"
                        : "border-ink-200 bg-white text-ink-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 transition-colors",
                        active
                          ? "text-orange-600"
                          : "text-ink-400 group-hover:text-blue-600",
                      )}
                      aria-hidden="true"
                    />
                    <span className="whitespace-nowrap">{item.label}</span>
                    {active && (
                      <motion.span
                        layoutId="hs-explorer-active"
                        className="absolute -bottom-px left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-orange-500"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Apply CTA — always visible */}
          <Link
            href="/higher-study/apply"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-orange-600 px-4 text-xs font-bold text-white shadow-orange transition-all duration-200 hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 focus-visible:ring-offset-1"
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Apply Now
          </Link>
        </div>
      </div>
    </section>
  );
}
