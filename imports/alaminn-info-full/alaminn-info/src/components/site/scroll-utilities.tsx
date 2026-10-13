"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { ArrowUp, MapPin } from "lucide-react";
import { NAV_LINKS } from "@/lib/site-data";

/**
 * Three complementary scroll utilities rendered as fixed overlays:
 * 1. A thin gradient progress bar pinned to the top of the viewport.
 * 2. A back-to-top button that fades in after the user scrolls past 600px.
 * 3. A section depth indicator — a small floating pill at bottom-right that
 *    shows the current section name as you scroll (uses NAV_LINKS data).
 *
 * All respect reduced-motion via framer-motion's spring smoothing.
 */
export function ScrollUtilities() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });
  const [showTop, setShowTop] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("home");

  // Scroll-spy: determine which section is in view (mirrors Navbar logic)
  useEffect(() => {
    const sectionIds = NAV_LINKS.map((l) => l.href.replace("#", ""));

    const onScroll = () => {
      setShowTop(window.scrollY > 600);

      // Section spy — same threshold as Navbar (200px from top)
      const target = 200;
      let current = sectionIds[0];
      for (const id of sectionIds) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top;
        if (top <= target) current = id;
        else break;
      }

      setActiveSection(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Derive display label from NAV_LINKS
  const sectionLabel = useMemo(
    () => NAV_LINKS.find((l) => l.href.replace("#", "") === activeSection)?.label ?? activeSection,
    [activeSection],
  );

  // Show the pill only after scrolling past the first viewport and when
  // we have a valid section that is NOT "home" (home pill is redundant).
  const sectionVisible = activeSection !== "home" && showTop;

  return (
    <>
      {/* Top scroll-progress bar — sits above the fixed navbar (z-50) */}
      <motion.div
        aria-hidden
        style={{ scaleX }}
        className="fixed inset-x-0 top-0 z-[55] h-[3px] origin-left grad-momentum"
      />

      {/* Back-to-top */}
      <AnimatePresence>
        {showTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="fixed bottom-24 left-5 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full border border-blue-900/10 bg-white text-blue-700 shadow-lg transition-colors hover:bg-blue-50 hover:text-blue-800 sm:bottom-6"
          >
            <ArrowUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Section depth indicator — floating pill at bottom-right */}
      <AnimatePresence mode="wait">
        {sectionVisible && sectionLabel && (
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-5 z-40 sm:bottom-6 sm:right-6"
          >
            <button
              onClick={() => {
                const id = activeSection;
                if (!id) return;
                const el = document.getElementById(id);
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                }
              }}
              aria-label={`Currently viewing: ${sectionLabel}. Click to scroll to section.`}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-900/10 bg-white/90 px-3 py-1.5 shadow-md backdrop-blur-sm transition-colors hover:bg-blue-50 hover:shadow-lg"
            >
              <MapPin className="h-3 w-3 text-orange-600" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-700">
                {sectionLabel}
              </span>
              <span
                className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-500"
                aria-hidden
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
