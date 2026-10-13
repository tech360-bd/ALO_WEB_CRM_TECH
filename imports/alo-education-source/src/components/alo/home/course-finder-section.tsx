'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { CheckCircle, Search, ChevronDown } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const BENEFITS = [
  'Personalized matching based on your profile',
  'Automatic scholarship detection',
  'Instant eligibility check for 50,000+ courses',
  'Side-by-side course comparison tool',
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CourseFinderSection({ onFinderOpen }: { onFinderOpen?: () => void }) {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      ref={sectionRef}
      id="course-finder"
      className="relative w-full overflow-hidden py-16 sm:py-20"
      aria-labelledby="course-finder-heading"
    >
      <div className="absolute inset-0 gradient-blue" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          {/* ── Left Content ──────────────────────────────────── */}
          <motion.div
            className="flex-1 text-center lg:text-left"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              <Search className="h-3.5 w-3.5 text-[#FFB347]" />
              AI-Powered
            </span>

            <h2
              id="course-finder-heading"
              className="mt-5 text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl"
            >
              Find Your Perfect Course{' '}
              <span className="text-[#FFB347]">in 3 Minutes</span>
            </h2>

            <p className="mt-4 max-w-lg text-base leading-relaxed text-white/80 lg:text-lg">
              Our AI engine analyses your academic background, English score, budget and preferences to recommend courses with match scores above 85%.
            </p>

            {/* Benefits list */}
            <ul className="mt-8 space-y-3">
              {BENEFITS.map((benefit, i) => (
                <motion.li
                  key={benefit}
                  className="flex items-center gap-3 text-sm font-medium text-white/90"
                  initial={{ opacity: 0, x: -10 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
                >
                  <CheckCircle className="h-5 w-5 shrink-0 text-[#FFB347]" />
                  {benefit}
                </motion.li>
              ))}
            </ul>

            {/* CTA */}
            <motion.button
              type="button"
              onClick={onFinderOpen}
              className="mt-8 inline-flex h-12 items-center justify-center rounded-xl bg-[#F37021] px-8 text-sm font-bold text-white shadow-lg shadow-[#F37021]/25 transition-all duration-200 hover:bg-[#D45A10] hover:shadow-xl focus-ring"
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              Start Course Finder
            </motion.button>
          </motion.div>

          {/* ── Right: Mockup Card ─────────────────────────────── */}
          <motion.div
            className="w-full max-w-md lg:max-w-sm shrink-0"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              className="rounded-2xl border border-white/10 bg-white p-6 shadow-2xl shadow-black/20"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              {/* Mockup header */}
              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-alo-blue">
                  <Search className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-alo-black">AI Course Finder</p>
                  <p className="text-xs text-alo-gray">Find your perfect match</p>
                </div>
              </div>

              {/* Mockup fields */}
              <div className="space-y-3">
                {/* Study Level */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-alo-black">Study Level</label>
                  <div className="flex h-10 items-center justify-between rounded-lg border border-alo-gray-medium bg-alo-gray-light/50 px-3 text-sm text-alo-gray">
                    <span>Masters / MSc</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-alo-black">Subject Area</label>
                  <div className="flex h-10 items-center rounded-lg border border-alo-gray-medium bg-alo-gray-light/50 px-3 text-sm text-alo-gray">
                    <span>Data Science &amp; AI</span>
                  </div>
                </div>

                {/* Destination */}
                <div>
                  <label className="mb-1 block text-xs font-semibold text-alo-black">Destination</label>
                  <div className="flex h-10 items-center justify-between rounded-lg border border-alo-gray-medium bg-alo-gray-light/50 px-3 text-sm text-alo-gray">
                    <span>United Kingdom 🇬🇧</span>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>

                {/* Button */}
                <button
                  type="button"
                  onClick={onFinderOpen}
                  className="w-full h-11 rounded-lg bg-alo-blue text-sm font-bold text-white transition-colors hover:bg-alo-blue-dark"
                >
                  Find Courses
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
