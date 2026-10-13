"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  BookOpen,
  Award,
  FlaskConical,
  UserSearch,
  Globe2,
  Library,
  Columns3,
  Menu,
  X,
  Send,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * HigherStudyNavbar — the ONLY navigation on Higher Study pages.
 *
 * When a visitor enters the Higher Study sub-platform, the main Alaminn.info
 * navigation (About, Expertise, Impact, Projects, Insights, Work With Me)
 * DISAPPEARS. Only the Al Aminn logo (clickable → "/") and the Higher Study
 * navigation remain.
 *
 *   [Al Aminn → /] | Universities | Courses | Scholarships | PhD & Research |
 *   Supervisors | Destinations | Resources | Compare | [Apply Now]
 *
 * Clicking Al Aminn returns to the main homepage.
 */
interface HsNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const HS_NAV: HsNavItem[] = [
  { label: "Universities", href: "/higher-study/global-universities", icon: Building2 },
  { label: "Courses", href: "/higher-study/course-finder", icon: BookOpen },
  { label: "Scholarships", href: "/higher-study/scholarships", icon: Award },
  { label: "PhD & Research", href: "/higher-study/phd-research", icon: FlaskConical },
  { label: "Supervisors", href: "/higher-study/supervisors", icon: UserSearch },
  { label: "Destinations", href: "/higher-study/destinations", icon: Globe2 },
  { label: "Resources", href: "/higher-study/study-resources", icon: Library },
  { label: "Compare", href: "/higher-study/compare", icon: Columns3 },
];

function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/higher-study") return pathname === "/higher-study";
  return pathname === href || pathname.startsWith(href + "/");
}

export function HigherStudyNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-3"
      )}
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        <div
          className={cn(
            "flex items-center justify-between gap-4 rounded-2xl border px-4 py-2.5 transition-all duration-300",
            scrolled
              ? "glass border-blue-900/10 shadow-soft"
              : "border-transparent bg-white/80 backdrop-blur-sm"
          )}
        >
          {/* Al Aminn logo — links to "/" (return to main site) */}
          <Link href="/" className="group flex items-center gap-2.5 shrink-0">
            <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl grad-intelligence shadow-blue">
              <span className="absolute inset-0 rounded-xl ring-1 ring-white/15" />
              <span className="h-2 w-2 rounded-full bg-orange-500 node-active" />
            </span>
            <div className="leading-tight">
              <div className="font-display text-[15px] font-extrabold tracking-tight text-ink-900">
                Al Aminn
              </div>
              <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500">
                Higher Study
              </div>
            </div>
          </Link>

          {/* Desktop nav — Higher Study links only */}
          <nav
            className="hidden items-center gap-0.5 xl:flex"
            aria-label="Higher Study navigation"
          >
            {HS_NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                    active
                      ? "text-orange-700"
                      : "text-ink-700 hover:bg-orange-50 hover:text-orange-700"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {active && (
                    <motion.span
                      layoutId="hs-nav-active"
                      className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-orange-500"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Apply Now CTA */}
          <div className="hidden items-center gap-2 xl:flex">
            <Link
              href="/higher-study/apply"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-orange-600 px-4 text-sm font-bold text-white shadow-orange transition-all hover:bg-orange-700 hover:shadow-lg"
            >
              <Send className="h-3.5 w-3.5" />
              Apply Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white/70 text-ink-800 xl:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open Higher Study menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] xl:hidden"
          >
            <div
              className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 34 }}
              className="absolute right-0 top-0 h-full w-[88%] max-w-[400px] overflow-y-auto bg-white p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg grad-intelligence">
                    <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  </span>
                  <div>
                    <div className="font-display text-sm font-extrabold text-ink-900">Al Aminn</div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-ink-500">Higher Study</div>
                  </div>
                </Link>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200"
                  aria-label="Close menu"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Back to main site */}
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="mt-4 flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors hover:bg-blue-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Alaminn.info
              </Link>

              <nav className="mt-4 space-y-1" aria-label="Higher Study navigation">
                {HS_NAV.map((item) => {
                  const active = isActive(pathname, item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-3 text-left text-[15px] font-semibold transition-colors",
                        active
                          ? "bg-orange-50 text-orange-700"
                          : "text-ink-900 hover:bg-orange-50"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6">
                <Link
                  href="/higher-study/apply"
                  onClick={() => setMobileOpen(false)}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 text-sm font-bold text-white shadow-orange transition-colors hover:bg-orange-700"
                >
                  <Send className="h-4 w-4" />
                  Apply Now
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
