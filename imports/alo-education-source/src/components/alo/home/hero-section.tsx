'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image from 'next/image';
import { CheckCircle, ChevronDown, Search, MessageCircle, Radio } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.3 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.6 } },
};

/* ------------------------------------------------------------------ */
/*  Floating Particles                                                  */
/* ------------------------------------------------------------------ */

const PARTICLES = [
  { x: '10%', y: '20%', size: 120, delay: 0, duration: 8 },
  { x: '75%', y: '15%', size: 80, delay: 2, duration: 10 },
  { x: '60%', y: '70%', size: 100, delay: 1, duration: 9 },
  { x: '85%', y: '55%', size: 60, delay: 3, duration: 7 },
];

function FloatingParticle({ x, y, size, delay, duration }: {
  x: string; y: string; size: number; delay: number; duration: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: 'radial-gradient(circle, rgba(0,102,204,0.08) 0%, transparent 70%)',
      }}
      animate={{
        y: [0, -30, 0, 20, 0],
        x: [0, 15, 0, -10, 0],
        scale: [1, 1.1, 1, 0.95, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Trust Indicators                                                   */
/* ------------------------------------------------------------------ */

const TRUST_ITEMS = [
  'Free Consultation',
  '500+ Universities',
  'Visa Support',
  'Scholarship Access',
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function HeroSection({ onFinderOpen, onLeadOpen }: { onFinderOpen?: () => void; onLeadOpen?: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-100px' });

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[80vh] md:min-h-[90vh] w-full overflow-hidden"
      aria-label="Hero"
    >
      {/* ── Background Image ────────────────────────────────────── */}
      <div className="absolute inset-0">
        <Image
          src="/images/alo/hero/hero-main.webp"
          alt="Students on a university campus"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Dark gradient overlay — bottom-left to top-right */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.2) 100%)',
          }}
        />
      </div>

      {/* ── Floating Particles ──────────────────────────────────── */}
      {PARTICLES.map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto flex min-h-[80vh] md:min-h-[90vh] max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <motion.div
          className="max-w-2xl py-20 md:py-0"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Badge */}
          <motion.div variants={fadeUp} className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#0066CC]/40 bg-[#0066CC]/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
              <Search className="h-3.5 w-3.5 text-[#FFB347]" />
              AI-Powered Study Abroad Platform
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-sm">
              <span className="relative flex h-2 w-2">
                <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              Live
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            variants={fadeUp}
            className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
          >
            Your Path to{' '}
            <span className="text-gradient-orange">World-Class</span>{' '}
            Education
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-lg text-lg leading-relaxed text-white/80 md:text-xl"
          >
            Find the right university, course and scholarship for your future.
            AI-matched to your profile.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            variants={fadeUp}
            className="mt-8 flex flex-wrap gap-4"
          >
            <button
              type="button"
              onClick={onFinderOpen}
              className="inline-flex h-12 w-48 items-center justify-center rounded-xl bg-[#F37021] text-sm font-bold text-white shadow-lg shadow-[#F37021]/25 transition-all duration-200 hover:bg-[#D45A10] hover:shadow-xl hover:shadow-[#F37021]/35 focus-ring"
            >
              Find My Course
            </button>
            <button
              type="button"
              onClick={onLeadOpen}
              className="inline-flex h-12 w-48 items-center justify-center rounded-xl border border-white/30 bg-white/5 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:border-white/50 focus-ring"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Talk to Expert
            </button>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            variants={fadeIn}
            className="mt-10 flex flex-wrap gap-x-6 gap-y-3"
          >
            {TRUST_ITEMS.map((item, i) => (
              <div
                key={item}
                className="flex items-center gap-2 text-sm text-white/70"
              >
                <CheckCircle className={`h-4 w-4 shrink-0 ${i === 0 ? 'text-emerald-400' : 'text-[#FFB347]'}`} />
                <span>{item}</span>
              </div>
            ))}
          </motion.div>

          {/* Live visitors counter */}
          <motion.div
            variants={fadeIn}
            className="mt-6"
          >
            <div className="inline-flex items-center gap-2.5 rounded-full bg-white/[0.07] border border-white/10 backdrop-blur-sm px-4 py-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="pulse-dot absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              <span className="text-xs text-white/60 font-medium">
                <span className="text-white font-bold">{127 + Math.floor(Math.random() * 30)}</span> students browsing right now
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Scroll Down Indicator ────────────────────────────────── */}
      <motion.div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <ChevronDown className="h-6 w-6 text-white/40" />
      </motion.div>
    </section>
  );
}
