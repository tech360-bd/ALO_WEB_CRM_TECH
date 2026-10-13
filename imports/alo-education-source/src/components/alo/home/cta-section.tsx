'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Search, MessageCircle } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Floating shape (decorative)                                        */
/* ------------------------------------------------------------------ */

function FloatingShape({
  size,
  className,
  delay = 0,
}: {
  size: number;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={`absolute rounded-full ${className ?? ''}`}
      style={{ width: size, height: size }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: [0.04, 0.08, 0.04],
        y: [0, -12, 0],
        x: [0, 6, 0],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      aria-hidden="true"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CtaSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden py-16 sm:py-20"
      aria-label="Call to action"
    >
      <div className="absolute inset-0 gradient-blue" aria-hidden="true" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
        aria-hidden="true"
      />

      {/* Subtle floating decorative shapes */}
      <FloatingShape size={120} className="bg-white -top-10 -left-16" delay={0} />
      <FloatingShape size={80} className="bg-white bottom-8 right-12" delay={2} />
      <FloatingShape size={60} className="bg-white top-1/3 right-[15%]" delay={4} />

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          Ready to Start Your Study Abroad Journey?
        </motion.h2>

        <motion.p
          className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg"
          initial={{ opacity: 0, y: 15 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        >
          Take the first step towards your dream university. Our expert counsellors are ready to guide you — for free.
        </motion.p>

        {/* Buttons */}
        <motion.div
          className="mt-8 flex flex-wrap justify-center gap-4"
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <a
            href="#course-finder"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#F37021] px-8 text-sm font-bold text-white shadow-lg shadow-[#F37021]/25 transition-all duration-200 hover:bg-[#D45A10] hover:shadow-xl focus-ring"
          >
            <Search className="h-4 w-4" />
            Find My Course
          </a>
          <a
            href="#contact-expert"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/5 px-8 text-sm font-bold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10 hover:border-white/50 focus-ring"
          >
            <MessageCircle className="h-4 w-4" />
            Talk to Expert
          </a>
        </motion.div>

        {/* Trust line */}
        <motion.p
          className="mt-8 text-sm text-white/50"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Join 15,000+ students who found their dream university with ALO
        </motion.p>
      </div>
    </section>
  );
}
