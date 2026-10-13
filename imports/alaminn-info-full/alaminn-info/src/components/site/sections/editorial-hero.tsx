"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, MapPin, GraduationCap, Sparkles } from "lucide-react";

/**
 * EditorialHero — immersive editorial hero with destination transition.
 *
 * Replaces the prior constellation-style hero with a premium, magazine-style
 * international education hero. Selecting a destination (UK, USA, Canada, etc.)
 * transitions the cinematic background image with a smooth crossfade.
 *
 * Respects prefers-reduced-motion (motion is disabled, image swap is instant).
 *
 * No fake data: the destinations list is curated editorial metadata (not user
 * input). The CTAs route to existing real pages (/higher-study, /contact).
 */

type Destination = {
  code: string;
  label: string;
  image: string;
  blurb: string;
  href: string;
};

const DESTINATIONS: Destination[] = [
  {
    code: "UK",
    label: "United Kingdom",
    image: "/gallery/uk-hero.jpg",
    blurb: "Oxford, Cambridge, Imperial — centuries of academic heritage.",
    href: "/higher-study/destinations/uk",
  },
  {
    code: "USA",
    label: "United States",
    image: "/gallery/usa-hero.jpg",
    blurb: "Ivy League and global research universities.",
    href: "/higher-study/destinations/us",
  },
  {
    code: "CA",
    label: "Canada",
    image: "/gallery/canada-hero.jpg",
    blurb: "Research-intensive universities with post-study work pathways.",
    href: "/higher-study/destinations/canada",
  },
  {
    code: "AU",
    label: "Australia",
    image: "/gallery/australia-hero.jpg",
    blurb: "Group of Eight — globally ranked, ocean-spanning campuses.",
    href: "/higher-study/destinations/australia",
  },
  {
    code: "DE",
    label: "Germany",
    image: "/gallery/germany-hero.jpg",
    blurb: "Public universities with low or no tuition for international students.",
    href: "/higher-study/destinations/germany",
  },
  {
    code: "EU",
    label: "Europe",
    image: "/gallery/europe-hero.jpg",
    blurb: "Netherlands, Sweden, France, Italy — English-taught Master's programmes.",
    href: "/higher-study/destinations/netherlands",
  },
];

export function EditorialHero() {
  const [activeIdx, setActiveIdx] = useState(0);
  // Read reduced-motion preference on first render to avoid setState-in-effect.
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  // Subscribe to changes (no initial setState needed — already set in initializer).
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const selectDestination = useCallback((idx: number) => {
    setActiveIdx(idx);
  }, []);

  const active = DESTINATIONS[activeIdx];

  return (
    <section
      id="home"
      aria-label="Alaminn global education hero"
      className="hero-editorial"
    >
      {/* Crossfading cinematic background */}
      <div className="hero-editorial-image">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.code}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: reducedMotion ? 0 : 0.9,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="absolute inset-0"
          >
            <Image
              src={active.image}
              alt={`${active.label} campus`}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Subtle vertical metadata rail */}
      <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 z-10 lg:block">
        <div className="text-vertical text-xs font-medium tracking-[0.22em] uppercase text-white/40">
          ALAMINN · GLOBAL EDUCATION · {active.code}
        </div>
      </div>

      {/* Main content */}
      <div className="hero-editorial-content relative z-10 flex flex-col justify-end min-h-screen px-6 pb-16 sm:px-10 sm:pb-20 lg:px-20 lg:pb-24">
        {/* Eyebrow row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reducedMotion ? 0 : 0.2 }}
          className="flex flex-wrap items-center gap-4 mb-8"
        >
          <span className="type-meta text-white/70">
            <MapPin className="inline w-3 h-3 mr-2" />
            Global Education · Admissions · Guidance
          </span>
          <span className="hidden sm:block h-px w-12 bg-white/30" />
          <span className="type-meta text-white/70 flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            {DESTINATIONS.length} destinations · {new Date().getFullYear()}
          </span>
        </motion.div>

        {/* Display headline */}
        <h1 className="type-display text-white max-w-5xl">
          <span className="block">Your next chapter</span>
          <span className="block">
            starts somewhere{" "}
            <span className="relative inline-block">
              <span className="relative z-10 italic font-serif" style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                new.
              </span>
              <span className="absolute left-0 right-0 bottom-1 h-3 bg-primary/40 -z-0" aria-hidden="true" />
            </span>
          </span>
        </h1>

        {/* Supporting text */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reducedMotion ? 0 : 0.4 }}
          className="type-lead text-white/80 mt-6 max-w-2xl"
        >
          Alaminn is a global education and admissions consultancy guiding students
          from Bangladesh to world-class universities in {DESTINATIONS.length} countries.
          Real universities. Real scholarships. Real outcomes.
        </motion.p>

        {/* Active destination blurb (changes with selection) */}
        <motion.p
          key={active.code}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.5 }}
          className="text-sm text-white/70 mt-4 max-w-xl"
        >
          <span className="type-meta text-white/60 mr-2">{active.code}</span>
          {active.blurb}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reducedMotion ? 0 : 0.6 }}
          className="flex flex-wrap items-center gap-3 mt-10"
        >
          <Link href="/higher-study" className="btn-editorial btn-editorial-primary">
            Explore Your Future
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link href="/contact" className="btn-editorial btn-editorial-ghost">
            <GraduationCap className="w-4 h-4" />
            Talk to Alaminn
          </Link>
        </motion.div>

        {/* Destination selector */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: reducedMotion ? 0 : 0.8 }}
          className="mt-12 flex flex-wrap items-center gap-2"
          role="tablist"
          aria-label="Select a destination to preview"
        >
          {DESTINATIONS.map((d, i) => (
            <button
              key={d.code}
              role="tab"
              aria-selected={i === activeIdx}
              onClick={() => selectDestination(i)}
              className="hero-destination-chip"
            >
              {d.code}
            </button>
          ))}
        </motion.div>

        {/* Scroll hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: reducedMotion ? 0 : 1.4 }}
          className="hidden lg:flex items-center gap-3 mt-12 text-white/40 text-xs uppercase tracking-[0.22em]"
        >
          <span>Scroll to explore</span>
          <span className="h-px w-12 bg-white/30" />
        </motion.div>
      </div>
    </section>
  );
}
