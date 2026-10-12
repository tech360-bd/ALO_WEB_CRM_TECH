'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface StatItem {
  value: number;
  suffix: string;
  prefix: string;
  label: string;
}

const STATS: StatItem[] = [
  { value: 500, suffix: '+', prefix: '', label: 'Partner Universities' },
  { value: 15000, suffix: '+', prefix: '', label: 'Students Placed' },
  { value: 14, suffix: '', prefix: '', label: 'Countries' },
  { value: 98, suffix: '%', prefix: '', label: 'Visa Success Rate' },
  { value: 2.5, suffix: 'M+', prefix: '£', label: 'Scholarships Won' },
];

/* ------------------------------------------------------------------ */
/*  Counter Hook                                                       */
/* ------------------------------------------------------------------ */

function useCountUp(target: number, inView: boolean, duration = 2200) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;

    const startTime = performance.now();
    const isDecimal = target % 1 !== 0;

        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    let raf: number;
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);

      setDisplay(isDecimal ? parseFloat((eased * target).toFixed(1)) : Math.round(eased * target));

      if (progress < 1) {
        raf = requestAnimationFrame(animate);
      }
    };
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [inView, target, duration]);

  return display;
}

/* ------------------------------------------------------------------ */
/*  Single Stat Block                                                  */
/* ------------------------------------------------------------------ */

function StatBlock({ stat, inView, index }: { stat: StatItem; inView: boolean; index: number }) {
  const count = useCountUp(stat.value, inView, 2000 + index * 200);

  const formattedValue = stat.value >= 1000
    ? count.toLocaleString()
    : count.toString();

  return (
    <motion.div
      className="relative flex flex-col items-center px-4 py-6 text-center"
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Divider on desktop (except first) */}
      {index > 0 && (
        <div className="absolute left-0 top-1/2 hidden h-12 -translate-y-1/2 w-px bg-white/15 lg:block" aria-hidden="true" />
      )}
      <span className="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl leading-none">
        {stat.prefix}{formattedValue}{stat.suffix}
      </span>
      <span className="mt-2 text-sm font-medium text-white/60">
        {stat.label}
      </span>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function StatsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      ref={sectionRef}
      className="w-full gradient-blue py-10 sm:py-16"
      aria-label="ALO Education statistics"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {STATS.map((stat, i) => (
            <StatBlock key={stat.label} stat={stat} inView={isInView} index={i} />
          ))}
        </div>

        {/* Decorative line with diamond */}
        <div className="mt-8 flex items-center justify-center" aria-hidden="true">
          <div className="w-16 h-px bg-white/20" />
          <div className="mx-2 h-2 w-2 rotate-45 bg-white/30 rounded-[1px]" />
          <div className="w-16 h-px bg-white/20" />
        </div>
      </div>
    </section>
  );
}
