"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  NAV_LINKS,
  SOCIAL_LINKS,
  whatsappLink,
} from "@/lib/site-data";
import { BRAND_ICONS } from "@/components/site/brand-icons";

/**
 * Navbar — simplified premium executive navigation.
 *
 *   [Al Aminn → /] | About & Expertise | Impact | Projects | Insights |
 *   Higher Study | Work With Me | [Schedule a Meeting]
 *
 * No "Home" item — the logo links to "/".
 * 6 meaningful destinations + 1 primary CTA.
 */
export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
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

  const isActive = (href: string) => {
    if (href === "/about") {
      return pathname === "/about" || pathname === "/expertise";
    }
    if (href === "/insights") {
      return pathname === "/insights" || pathname === "/articles" || pathname?.startsWith("/articles/");
    }
    if (href === "/work-with-me") {
      return pathname === "/work-with-me" || pathname === "/contact";
    }
    return pathname === href;
  };

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
              : "border-transparent bg-transparent"
          )}
        >
          {/* Wordmark — links to "/" (NOT #home) */}
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
                Alaminn.info
              </div>
            </div>
            <span className="ml-1 hidden h-4 w-[3px] rounded-full bg-orange-500 sm:inline-block" />
          </Link>

          {/* Desktop nav — 6 premium links */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={cn(
                    "relative rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "text-blue-700"
                      : "text-ink-700 hover:bg-blue-50 hover:text-blue-700"
                  )}
                >
                  {link.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full grad-momentum"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right CTA — Schedule a Meeting (the ONE primary CTA) */}
          <div className="hidden items-center gap-2 lg:flex">
            <Button
              size="sm"
              className="h-10 gap-1.5 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white shadow-orange transition-all hover:bg-orange-700 hover:shadow-lg"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("alaminn:open-schedule-meeting"));
                }
              }}
            >
              <Calendar className="h-4 w-4" />
              Schedule a Meeting
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white/70 text-ink-800 lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
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
            className="fixed inset-0 z-[60] lg:hidden"
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
                  <div className="font-display text-sm font-extrabold text-ink-900">
                    Al Aminn
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

              <nav className="mt-6 space-y-1">
                {NAV_LINKS.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={cn(
                        "flex items-center justify-between rounded-lg px-3 py-3 text-left text-[15px] font-semibold transition-colors",
                        active
                          ? "bg-blue-50 text-blue-700"
                          : "text-ink-900 hover:bg-blue-50"
                      )}
                    >
                      {link.label}
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      )}
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6 space-y-3 border-t border-ink-200 pt-5">
                <p className="px-3 text-xs uppercase tracking-widest text-ink-500">
                  Connect
                </p>
                <a
                  href="mailto:hello@alaminn.info"
                  className="block rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-blue-50"
                >
                  hello@alaminn.info
                </a>
                {/* Real social icons — brand marks */}
                <div className="flex flex-wrap gap-2 px-3 pt-1">
                  {SOCIAL_LINKS.map((s) => {
                    const Icon = BRAND_ICONS[s.icon];
                    if (!Icon) return null;
                    return (
                      <a
                        key={s.label}
                        href={s.href}
                        target={s.href.startsWith("http") ? "_blank" : undefined}
                        rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        aria-label={`${s.label}${s.primary ? " (verified)" : ""}`}
                        title={s.label}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink-200 text-ink-600 transition-all hover:scale-110 hover:text-white"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = s.brandColor;
                          e.currentTarget.style.borderColor = s.brandColor;
                          e.currentTarget.style.color = "#fff";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "";
                          e.currentTarget.style.borderColor = "";
                          e.currentTarget.style.color = "";
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
                {/* WhatsApp direct CTA */}
                <a
                  href={whatsappLink("Hi Al Aminn, I'd like to explore working together.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mx-3 mt-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] text-sm font-semibold text-white transition-colors hover:bg-[#1ebe5d]"
                >
                  Chat on WhatsApp
                </a>
              </div>

              <div className="mt-6">
                <Button
                  className="h-12 w-full gap-2 rounded-xl bg-orange-600 text-white shadow-orange"
                  onClick={() => {
                    setMobileOpen(false);
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new CustomEvent("alaminn:open-schedule-meeting"));
                    }
                  }}
                >
                  <Calendar className="h-4 w-4" />
                  Schedule a Meeting
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
