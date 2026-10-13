'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';

const SCROLL_THRESHOLD = 600;

export function ScrollToTop() {
  const scrollRef = useRef(false);
  const [visible, setVisible] = useState(false);

  const handleScroll = useCallback(() => {
    const shouldShow = window.scrollY > SCROLL_THRESHOLD;
    if (scrollRef.current !== shouldShow) {
      scrollRef.current = shouldShow;
      setVisible(shouldShow);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, scale: 0.8 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.8 },
        transition: { duration: 0.25, ease: 'easeOut' as const },
      };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          {...motionProps}
          onClick={scrollToTop}
          aria-label="Scroll to top"
          className="fixed bottom-6 right-6 z-30 flex h-12 w-12 items-center justify-center rounded-full glass text-alo-blue shadow-lg transition-all duration-300 hover:bg-white/90 hover:shadow-xl hover:scale-105 focus-visible:ring-2 focus-visible:ring-alo-blue focus-visible:ring-offset-2 focus-visible:outline-none active:scale-95 border border-slate-200/50"
        >
          <ArrowUp className="size-5" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
