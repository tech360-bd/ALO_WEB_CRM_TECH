"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Calendar,
  ShieldCheck,
  Activity,
  Zap,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { OperatingConstellation } from "@/components/site/constellation";
import { PROFILE } from "@/lib/site-data";

// Key differentiators shown as a secondary line below the supporting paragraph.
const DIFFERENTIATORS = [
  "Bangladesh-based",
  "Global reach",
  "8 expertise modules",
  "AI-governed",
];

export function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden pt-28 pb-12 sm:pt-32 lg:pt-36 lg:pb-16"
    >
      {/* ===========================================================
          1. LAYERED DEPTH & TEXTURE — background stack
          =========================================================== */}
      {/* Base ambient gradient */}
      <div className="absolute inset-0 grad-ambient" />
      {/* Layered radial depth gradients (multi-position) */}
      <div className="absolute inset-0 hero-depth" />
      {/* Enhanced grid with perspective fade (top + bottom fade) */}
      <div className="absolute inset-0 grid-bg-perspective opacity-50" />
      {/* Subtle film-grain noise texture overlay (very low opacity) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.022] noise-overlay"
        aria-hidden="true"
      />

      {/* Animated floating orbs (kept from V1, refined) */}
      <motion.div
        animate={{ x: [0, 30, -20, 0], y: [0, -25, 15, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(242,97,19,0.18), transparent 60%)",
        }}
      />
      <motion.div
        animate={{ x: [0, -20, 30, 0], y: [0, 20, -15, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute -left-40 top-40 h-[520px] w-[520px] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(11,99,206,0.20), transparent 60%)",
        }}
      />

      {/* Decorative floating geometric shapes (subtle, slow drift) */}
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.04, 0.06, 0.04] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="pointer-events-none absolute left-[7%] top-[26%] hidden lg:block"
      >
        <div className="animate-float-geo-1 h-24 w-24 rounded-2xl bg-gradient-to-br from-orange-500/40 to-orange-600/10" />
      </motion.div>
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.04, 0.05, 0.04] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="pointer-events-none absolute right-[11%] top-[58%] hidden lg:block"
      >
        <div className="animate-float-geo-2 h-16 w-16 rounded-full border-2 border-blue-500/30 bg-gradient-to-tr from-blue-500/15 to-transparent" />
      </motion.div>
      <motion.div
        aria-hidden="true"
        animate={{ opacity: [0.03, 0.05, 0.03] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="pointer-events-none absolute left-[45%] bottom-[16%] hidden lg:block"
      >
        <div
          className="animate-float-geo-3 h-10 w-10 bg-gradient-to-br from-orange-500/50 to-blue-600/20"
          style={{ clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }}
        />
      </motion.div>

      {/* Particle dots background */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #0B63CE 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ===========================================================
          2. MAIN CONTENT GRID
          =========================================================== */}
      <div className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8">
        {/* Left: copy inside glassmorphism panel */}
        <div className="lg:col-span-6">
          <div className="relative rounded-3xl glass-panel p-5 sm:p-6 lg:p-7">
            {/* Premium trust badge above the headline */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-1.5 rounded-full premium-pill px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-700 dark:text-blue-200 shadow-soft"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Trusted Executive Platform
            </motion.div>

            {/* Eyebrow badge — slightly larger & more prominent */}
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.04 }}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-orange-200 dark:border-orange-700/40 bg-orange-50 dark:bg-orange-900/30 px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.18em] text-orange-700 dark:text-orange-300"
            >
              <Zap className="h-3.5 w-3.5 animate-pulse" />
              Executive Operations · Growth · AI Systems
            </motion.div>

            {/* Headline — "Intelligent" gets animated shimmer gradient + soft glow */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
              className="mt-5 font-display text-[clamp(2.25rem,5vw,4rem)] font-extrabold leading-[1.04] tracking-tight text-ink-950 text-balance [text-wrap:balance]"
            >
              <span className="block">Transforming Strategy Into</span>
              <span className="block">
                <span className="text-grad-connected drop-shadow-[0_1px_0_rgba(11,99,206,0.12)]">
                  Scalable Operations
                </span>
                , Growth and{" "}
                <span className="relative inline-block">
                  <span
                    className="text-grad-intelligent"
                    style={{ filter: "drop-shadow(0 2px 12px rgba(242,97,19,0.28))" }}
                  >
                    Intelligent
                  </span>
                  <span className="cursor-blink text-orange-500" />
                </span>{" "}
                Systems
              </span>
            </motion.h1>

            {/* Supporting paragraph — slightly lighter weight, muted color */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.12 }}
              className="mt-5 max-w-xl text-base font-normal leading-relaxed text-ink-500 text-pretty sm:text-lg"
            >
              {PROFILE.supporting}
            </motion.p>

            {/* Secondary differentiators line — dot-separated, smaller, muted */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.18 }}
              className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium uppercase tracking-[0.14em] text-ink-400 dark:text-blue-300/70"
            >
              {DIFFERENTIATORS.map((d, i) => (
                <span key={d} className="inline-flex items-center gap-2">
                  {i > 0 && (
                    <span
                      className="h-1 w-1 rounded-full bg-orange-400/70"
                      aria-hidden="true"
                    />
                  )}
                  {d}
                </span>
              ))}
            </motion.div>

            {/* CTA row */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="mt-7 flex flex-wrap items-center gap-3"
            >
              {/* Primary CTA — gradient bg, pulsing glow, slow elegant shimmer */}
              <Link
                href="#contact"
                className="group relative inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-500 px-6 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-orange-600/40 animate-cta-glow-pulse overflow-hidden lg:h-13 lg:px-7 lg:text-[15px]"
              >
                {/* Slow, elegant shimmer sweep */}
                <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
                  <span className="absolute inset-y-0 -left-1/2 w-1/2 animate-cta-shimmer-slow bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                </span>
                <Calendar className="relative h-4 w-4" />
                <span className="relative">Schedule a Strategic Conversation</span>
                <ArrowUpRight className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </Link>

              {/* Secondary CTA — inner glow, hover border shift to orange */}
              <Link
                href="#projects"
                className="group inline-flex h-12 items-center gap-2 rounded-xl border border-blue-200 dark:border-blue-700/40 bg-blue-50/60 dark:bg-blue-900/30 px-6 text-sm font-semibold text-blue-700 dark:text-blue-300 transition-all duration-300 hover:border-orange-300 dark:hover:border-orange-400/50 hover:bg-orange-50/60 dark:hover:bg-orange-900/20 hover:shadow-md hover:shadow-orange-500/10 lg:h-13 lg:px-7 lg:text-[15px]"
                style={{ boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.45)" }}
              >
                Explore the Ecosystem
                <ChevronRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </motion.div>

            {/* Trust micro-row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-500 sm:text-[13px]"
            >
              <span className="group relative inline-flex items-center gap-1.5 cursor-default">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 node-active" />
                {PROFILE.trustLine}
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  Verified operating context
                </span>
              </span>
              <span className="hidden h-3 w-px bg-ink-200 sm:inline-block" />
              <span className="group relative inline-flex items-center gap-1.5 cursor-default">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                Evidence-controlled publishing
                <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2.5 py-1 text-[10px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  No fabricated metrics
                </span>
              </span>
            </motion.div>
          </div>
        </div>

        {/* Right: constellation with soft glow halo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="lg:col-span-6"
        >
          <div className="relative">
            {/* Soft glow halo behind the constellation */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full constellation-halo blur-2xl"
            />

            {/* Operating model indicator card — enhanced hierarchy (larger title, better spacing) */}
            <div className="animate-bob absolute -left-2 top-2 z-10 hidden rounded-2xl glass border border-blue-900/10 dark:border-blue-800/20 p-4 shadow-soft dark:shadow-none sm:block">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500 dark:text-ink-400">
                <Activity className="h-4 w-4 text-orange-500" />
                Operating model
              </div>
              <div className="mt-1.5 font-display text-base font-bold text-ink-900 dark:text-ink-100">
                Complexity → Clarity
              </div>
              <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-ink-500 dark:text-ink-400">
                <span>Nodes</span>
                <span className="tabular text-right text-ink-800 dark:text-ink-300">8</span>
                <span>Signals</span>
                <span className="tabular text-right text-ink-800 dark:text-ink-300">Active</span>
                <span>AI</span>
                <span className="tabular text-right text-emerald-600">Governed</span>
              </div>
            </div>

            {/* OperatingConstellation component is unchanged per task constraints */}
            <OperatingConstellation />
          </div>
        </motion.div>
      </div>

      {/* ===========================================================
          3. SCROLL INDICATOR — at the bottom of the hero
          (The "Capability Signals" credibility bar that previously
           appeared here was removed per homepage restructure — the
           new ContactProfileSocial section now follows the Hero and
           carries the professional identity + contact + social info.)
          =========================================================== */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="pointer-events-none mt-10 flex flex-col items-center gap-1.5 sm:mt-12 lg:mt-14"
        aria-hidden="true"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-400 dark:text-blue-300/60">
          Scroll to explore
        </span>
        <ChevronDown className="h-4 w-4 animate-scroll-bounce text-orange-500" />
      </motion.div>
    </section>
  );
}
