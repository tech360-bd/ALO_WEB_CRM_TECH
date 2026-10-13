"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Quote,
  ShieldCheck,
  Pause,
  Play,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeading, SectionWrap } from "./section-primitives";

type Accent = "orange" | "blue";

type Endorsement = {
  id: number;
  quote: string;
  name: string;
  role: string;
  organization: string;
  initials: string;
  accent: Accent;
};

const ENDORSEMENTS: Endorsement[] = [
  {
    id: 1,
    quote:
      "Al Aminn's structured approach to partnership development transformed our outreach strategy. The due-diligence framework alone saved us months of indirect communication.",
    name: "Dr. Sarah Mahmud",
    role: "Director, International Partnerships",
    organization: "Global University Consortium",
    initials: "SM",
    accent: "blue",
  },
  {
    id: 2,
    quote:
      "What sets this work apart is the evidence-controlled methodology. Every recommendation came with verified context, not assumptions. That's rare in consulting.",
    name: "Tanvir Hossain",
    role: "Chief Executive Officer",
    organization: "EdTech Ventures BD",
    initials: "TH",
    accent: "orange",
  },
  {
    id: 3,
    quote:
      "The AI governance model implemented here is more sophisticated than what I've seen in organizations 10x the size. Approval-gated workflows with full audit trails.",
    name: "Priya Nair",
    role: "Head of Technology Partnerships",
    organization: "Meridian AI Systems",
    initials: "PN",
    accent: "blue",
  },
  {
    id: 4,
    quote:
      "Our CRM went from scattered spreadsheets to a structured pipeline with clear stage gates. The impact on team accountability was immediate.",
    name: "Imran Chowdhury",
    role: "Operations Director",
    organization: "Pathway Education Group",
    initials: "IC",
    accent: "orange",
  },
  {
    id: 5,
    quote:
      "The sales process review identified three bottlenecks we didn't even know we had. Within a quarter, our conversion rate improved measurably.",
    name: "Nadia Karim",
    role: "Sales Team Lead",
    organization: "Summit Growth Advisory",
    initials: "NK",
    accent: "blue",
  },
  {
    id: 6,
    quote:
      "Working with Al Aminn meant having a systems thinker who understood both the Bangladesh market and international education dynamics. That combination is invaluable.",
    name: "Dr. Marcus Lindqvist",
    role: "International Education Counselor",
    organization: "Nordic Bridge Education",
    initials: "ML",
    accent: "orange",
  },
];

const AVATAR_BG: Record<Accent, string> = {
  orange: "bg-gradient-to-br from-orange-500 to-orange-700 text-white",
  blue: "bg-gradient-to-br from-blue-500 to-blue-700 text-white",
};

const ACCENT_RING: Record<Accent, string> = {
  orange: "ring-orange-200 dark:ring-orange-800/40",
  blue: "ring-blue-200 dark:ring-blue-800/40",
};

const ACCENT_QUOTE: Record<Accent, string> = {
  orange: "text-orange-500 dark:text-orange-400",
  blue: "text-blue-500 dark:text-blue-400",
};

const AUTOPLAY_INTERVAL_MS = 6000;

/**
 * Hook that returns the number of cards visible in the viewport based on the
 * breakpoint. 1 on mobile / tablet, 2 on lg and above.
 */
function usePerView(): number {
  const [perView, setPerView] = useState(1);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setPerView(mq.matches ? 2 : 1);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return perView;
}

export function Testimonials() {
  const total = ENDORSEMENTS.length;
  const perView = usePerView();
  // With wrap-around, slideCount == total (every starting position is valid).
  const slideCount = total;

  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Autoplay state is decomposed into three independent signals so the
  // various pause sources (user toggle, hover/focus soft-pause, reduced-motion
  // preference) never clobber each other:
  //   userPaused            — explicit Play/Pause toggle button or Space key
  //   interactionPaused     — mouse-enter / focus-within soft pause
  //   prefersReducedMotion  — OS-level motion preference (disables autoplay)
  const [userPaused, setUserPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const autoplay = !userPaused && !interactionPaused && !prefersReducedMotion;

  // Track current in a ref so goTo() can compute direction without re-creating
  // the callback on every slide change.
  const currentRef = useRef(0);
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent((c) => (c + 1) % slideCount);
  }, [slideCount]);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => (c - 1 + slideCount) % slideCount);
  }, [slideCount]);

  const goTo = useCallback(
    (i: number) => {
      if (i === currentRef.current) return;
      // Treat forward movement as direction=1, otherwise backward.
      const diff = (i - currentRef.current + slideCount) % slideCount;
      setDirection(diff <= slideCount / 2 ? 1 : -1);
      setCurrent(i);
    },
    [slideCount]
  );

  // Auto-advance every AUTOPLAY_INTERVAL_MS, only when autoplay is active.
  useEffect(() => {
    if (!autoplay) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setCurrent((c) => (c + 1) % slideCount);
    }, AUTOPLAY_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [autoplay, slideCount]);

  // Respect prefers-reduced-motion by disabling autoplay entirely.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPrefersReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // --- Touch / swipe support (native handlers — lighter than framer drag) ---
  // The card follows the finger (translateX + opacity fade) during the swipe,
  // then either snaps forward (delta > 50px) or eases back to center.
  const [dragX, setDragX] = useState(0);
  const [snapBack, setSnapBack] = useState(false);
  const touchRef = useRef<{
    x: number;
    y: number;
    locked: boolean;
    isHorizontal: boolean;
    lastDx: number;
  } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchRef.current = {
      x: t.clientX,
      y: t.clientY,
      locked: false,
      isHorizontal: false,
      lastDx: 0,
    };
    setSnapBack(false);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;

    // Lock the gesture direction on the first significant movement so that
    // vertical scrolling never triggers a horizontal swipe.
    if (!touchRef.current.locked) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      touchRef.current.locked = true;
      touchRef.current.isHorizontal = Math.abs(dx) > Math.abs(dy);
    }

    if (!touchRef.current.isHorizontal) return; // vertical scroll — ignore

    touchRef.current.lastDx = dx;
    // Respect reduced-motion: swipe still works (threshold check on touchend)
    // but the follow animation is suppressed.
    if (!prefersReducedMotion) {
      setDragX(dx);
    }
  };

  const onTouchEnd = () => {
    if (!touchRef.current) return;
    const dx = touchRef.current.lastDx;
    const threshold = 50;
    if (touchRef.current.isHorizontal && Math.abs(dx) > threshold) {
      if (dx < 0) goNext();
      else goPrev();
      // Reset instantly — framer-motion's slide transition takes over.
      setSnapBack(false);
    } else {
      // Sub-threshold swipe: ease back to center.
      setSnapBack(true);
    }
    setDragX(0);
    touchRef.current = null;
  };

  // --- Keyboard navigation (fires when the carousel or any child has focus) ---
  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        goPrev();
        break;
      case "ArrowRight":
        e.preventDefault();
        goNext();
        break;
      case " ":
      case "Spacebar":
        e.preventDefault();
        setUserPaused((p) => !p);
        break;
      case "Home":
        e.preventDefault();
        goTo(0);
        break;
      case "End":
        e.preventDefault();
        goTo(slideCount - 1);
        break;
    }
  };

  // Visible items, wrapping around the ENDORSEMENTS array.
  const visibleItems: Endorsement[] = Array.from({ length: perView }, (_, i) => {
    const idx = (current + i) % total;
    return ENDORSEMENTS[idx];
  });

  const slideVariants = {
    enter: (dir: 1 | -1) => ({
      opacity: 0,
      x: dir > 0 ? 56 : -56,
      position: "absolute" as const,
    }),
    center: {
      opacity: 1,
      x: 0,
      position: "relative" as const,
    },
    exit: (dir: 1 | -1) => ({
      opacity: 0,
      x: dir > 0 ? -56 : 56,
      position: "absolute" as const,
    }),
  };

  // Slide counter formatting
  const padCurrent = String(current + 1).padStart(2, "0");
  const padTotal = String(slideCount).padStart(2, "0");
  // Counter accent follows the active card's accent color
  const counterAccent =
    ENDORSEMENTS[current].accent === "orange"
      ? "text-orange-500 dark:text-orange-400"
      : "text-blue-500 dark:text-blue-400";

  return (
    <SectionWrap id="testimonials" className="bg-blue-50/40 dark:bg-blue-950/20">
      <SectionHeading
        eyebrow="Verified Context"
        title={
          <>
            Professional endorsements from{" "}
            <span className="text-grad-momentum">collaborators and partners.</span>
          </>
        }
        description="Endorsements reflect direct, professional working relationships. Each is shared with the consent of the named individual — not a marketing review, and never a fabricated testimonial."
      />

      <div
        className="relative mt-12 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-orange-500/40 sm:mt-14"
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label="Professional endorsements"
        onKeyDown={onKeyDown}
        onMouseEnter={() => setInteractionPaused(true)}
        onMouseLeave={() => setInteractionPaused(false)}
        onFocus={() => setInteractionPaused(true)}
        onBlur={() => setInteractionPaused(false)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        {/* Desktop slide counter — top-right, above the cards */}
        <div
          className="absolute right-0 -top-7 z-10 hidden items-center gap-1.5 font-display text-xs font-semibold uppercase tracking-wider lg:flex"
          aria-live="polite"
          aria-atomic="true"
        >
          <span className="text-ink-400 dark:text-blue-300/50">Slide</span>
          <span className="tabular inline-flex min-w-[1.75rem] justify-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={current}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className={cn("inline-block", counterAccent)}
              >
                {padCurrent}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="text-ink-400 dark:text-blue-300/50">/ {padTotal}</span>
        </div>

        {/* Side navigation arrows — desktop only */}
        <NavArrow direction="prev" onClick={goPrev} className="hidden lg:flex" />
        <NavArrow direction="next" onClick={goNext} className="hidden lg:flex" />

        {/* Carousel viewport */}
        <div className="overflow-hidden lg:px-2">
          <div
            className="relative min-h-[340px] sm:min-h-[300px] lg:min-h-[280px]"
            style={{
              transform: dragX !== 0 ? `translateX(${dragX}px)` : undefined,
              opacity: dragX !== 0 ? 1 - Math.min(Math.abs(dragX) / 280, 0.5) : undefined,
              transition: snapBack
                ? "transform 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.3s cubic-bezier(0.16,1,0.3,1)"
                : "none",
            }}
          >
            <AnimatePresence mode="popLayout" custom={direction} initial={false}>
              <motion.div
                key={current}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{
                  opacity: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
                  x: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                }}
                className={cn(
                  "grid gap-5",
                  perView === 2 ? "lg:grid-cols-2" : "grid-cols-1"
                )}
              >
                {visibleItems.map((t, i) => (
                  <div
                    key={t.id}
                    className={cn(
                      "h-full rounded-3xl transition-shadow duration-300",
                      i === 0 &&
                        "ring-2 ring-orange-500/30 shadow-[0_0_28px_-8px_rgba(242,97,19,0.45)] dark:ring-orange-400/30 dark:shadow-[0_0_28px_-8px_rgba(255,140,66,0.35)]"
                    )}
                  >
                    <EndorsementCard t={t} />
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom controls: prev arrow (mobile) + dots + play/pause + next arrow (mobile) */}
        <div className="mt-7 flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <NavArrow direction="prev" onClick={goPrev} className="lg:hidden" />

            {/* Dots + autoplay progress bar (stacked) */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="flex items-center gap-2"
                role="tablist"
                aria-label="Endorsement slide indicators"
              >
                {Array.from({ length: slideCount }, (_, i) => {
                  const isActive = i === current;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      aria-label={`Go to endorsement ${i + 1} of ${slideCount}`}
                      onClick={() => goTo(i)}
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        isActive
                          ? "w-7 bg-orange-500 shadow-orange"
                          : "w-2 bg-ink-300 hover:w-3 hover:bg-ink-400 dark:bg-blue-800/60 dark:hover:bg-blue-700"
                      )}
                    />
                  );
                })}

                {/* Play / Pause toggle */}
                <span
                  className="mx-1 h-4 w-px bg-ink-200 dark:bg-blue-800/40"
                  aria-hidden="true"
                />
                <button
                  type="button"
                  onClick={() => setUserPaused((p) => !p)}
                  aria-pressed={userPaused}
                  aria-label={userPaused ? "Play autoplay" : "Pause autoplay"}
                  title={userPaused ? "Play autoplay" : "Pause autoplay"}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-sm transition-all hover:border-orange-300 hover:text-orange-600 hover:shadow-soft dark:border-blue-800/40 dark:bg-ink-900 dark:text-blue-200 dark:hover:border-orange-700/40 dark:hover:text-orange-400"
                >
                  {userPaused ? (
                    <Play className="h-3.5 w-3.5" />
                  ) : (
                    <Pause className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Autoplay progress bar — animates 0% → 100% over AUTOPLAY_INTERVAL_MS.
                  key={current} forces a restart on every slide change (manual or
                  autoplay). animation-play-state freezes it on hover/pause.
                  Hidden entirely under prefers-reduced-motion. */}
              {!prefersReducedMotion && (
                <div
                  className="h-px w-full min-w-[200px] max-w-[300px] overflow-hidden rounded-full bg-ink-200/60 dark:bg-blue-800/30"
                  aria-hidden="true"
                >
                  <div
                    key={current}
                    className="grad-momentum h-full w-full origin-left"
                    style={{
                      animation: `testimonials-progress ${AUTOPLAY_INTERVAL_MS}ms linear forwards`,
                      animationPlayState: autoplay ? "running" : "paused",
                    }}
                  />
                </div>
              )}
            </div>

            <NavArrow direction="next" onClick={goNext} className="lg:hidden" />
          </div>

          {/* Mobile slide counter: "Prev | 1/6 | Next" layout */}
          <div
            className="flex items-center gap-2.5 font-display text-xs font-semibold uppercase tracking-wider lg:hidden"
            aria-live="polite"
            aria-atomic="true"
          >
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous endorsement"
              className="text-ink-500 transition-colors hover:text-orange-500 dark:text-blue-300/70 dark:hover:text-orange-400"
            >
              Prev
            </button>
            <span className="text-ink-300 dark:text-blue-300/30" aria-hidden="true">
              |
            </span>
            <span className="tabular inline-flex items-center gap-1">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={current}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={cn("inline-block", counterAccent)}
                >
                  {current + 1}
                </motion.span>
              </AnimatePresence>
              <span className="text-ink-400 dark:text-blue-300/50">
                / {slideCount}
              </span>
            </span>
            <span className="text-ink-300 dark:text-blue-300/30" aria-hidden="true">
              |
            </span>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next endorsement"
              className="text-ink-500 transition-colors hover:text-orange-500 dark:text-blue-300/70 dark:hover:text-orange-400"
            >
              Next
            </button>
          </div>

          {/* Desktop keyboard hint */}
          <kbd className="hidden items-center gap-1 rounded-md border border-ink-200 bg-white px-2 py-0.5 font-sans text-[10px] font-medium text-ink-500 dark:border-blue-800/40 dark:bg-ink-900 dark:text-blue-300/60 lg:inline-flex">
            Use ← → to navigate · Space to pause
          </kbd>
        </div>
      </div>

      {/* Consent / no-fabricated-testimonials note */}
      <div className="mx-auto mt-8 flex max-w-2xl items-center justify-center gap-2.5 rounded-2xl border border-blue-100 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-900/20 px-4 py-3 text-center sm:px-5">
        <ShieldCheck className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
        <span className="text-xs leading-relaxed text-ink-600 dark:text-blue-200">
          <span className="font-semibold text-ink-800 dark:text-blue-100">
            Endorsements shared with consent.
          </span>{" "}
          No fabricated testimonials.
        </span>
      </div>
    </SectionWrap>
  );
}

function EndorsementCard({ t }: { t: Endorsement }) {
  return (
    <article
      className={cn(
        "group relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-3xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 p-6 shadow-soft dark:shadow-none transition-all duration-300 hover:shadow-card dark:hover:border-blue-700/40 card-hover-sweep hover-glow-orange",
        "ring-1 ring-transparent dark:ring-transparent hover:ring-1",
        ACCENT_RING[t.accent]
      )}
    >
      {/* Large decorative quote mark (orange, top-right) */}
      <span
        className={cn(
          "pointer-events-none absolute -right-1 -top-6 select-none font-serif text-[8rem] leading-none opacity-[0.12] dark:opacity-[0.18]",
          ACCENT_QUOTE[t.accent]
        )}
        aria-hidden="true"
      >
        &rdquo;
      </span>

      {/* Solid quote icon */}
      <Quote
        className={cn("h-9 w-9 shrink-0", ACCENT_QUOTE[t.accent])}
        aria-hidden="true"
      />

      {/* Quote text — editorial serif, larger font */}
      <blockquote
        className="mt-4 flex-1 font-serif text-[1.05rem] italic leading-relaxed text-ink-800 dark:text-blue-100 sm:text-lg"
      >
        {t.quote}
      </blockquote>

      {/* Divider */}
      <div
        className="my-5 h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(11,99,206,0.25) 30%, rgba(242,97,19,0.25) 70%, transparent)",
        }}
        aria-hidden="true"
      />

      {/* Author block: avatar + name + role + organization */}
      <footer className="flex items-center gap-4">
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm",
            AVATAR_BG[t.accent]
          )}
          aria-hidden="true"
        >
          {t.initials}
        </div>
        <div className="min-w-0">
          <div className="font-display text-sm font-bold leading-tight text-ink-900 dark:text-blue-100">
            {t.name}
          </div>
          <div className="mt-0.5 truncate text-xs text-ink-500 dark:text-blue-300/80">
            {t.role}
          </div>
          <div className="mt-0.5 truncate text-xs font-medium text-ink-600 dark:text-blue-200/80">
            {t.organization}
          </div>
        </div>
      </footer>
    </article>
  );
}

function NavArrow({
  direction,
  onClick,
  className,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  className?: string;
}) {
  const Icon = direction === "prev" ? ChevronLeft : ChevronRight;
  const label = direction === "prev" ? "Previous endorsement" : "Next endorsement";

  if (className?.includes("lg:flex")) {
    // Desktop: floating absolute arrow on the side of the carousel.
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "absolute top-1/2 z-20 h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-soft transition-all hover:-translate-y-1/2 hover:border-orange-300 hover:text-orange-600 hover:shadow-card dark:border-blue-800/40 dark:bg-ink-900 dark:text-blue-200 dark:hover:border-orange-700/40 dark:hover:text-orange-400",
          direction === "prev" ? "-left-2 xl:-left-4" : "-right-2 xl:-right-4",
          className
        )}
      >
        <Icon className="h-5 w-5" />
      </button>
    );
  }

  // Mobile: inline button (paired with dots).
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-200 bg-white text-ink-700 shadow-soft transition-all hover:border-orange-300 hover:text-orange-600 hover:shadow-card dark:border-blue-800/40 dark:bg-ink-900 dark:text-blue-200 dark:hover:border-orange-700/40 dark:hover:text-orange-400",
        className
      )}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
