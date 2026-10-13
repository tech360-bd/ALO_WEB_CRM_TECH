"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Animated number counter that smoothly tweens from 0 → `value` when the
 * element first scrolls into view (or immediately if `immediate` is set).
 *
 * Uses IntersectionObserver + requestAnimationFrame — no external deps.
 * Respects `prefers-reduced-motion` (jumps to final value).
 */
export function useCountUp(
  target: number,
  opts: { duration?: number; immediate?: boolean } = {}
): { ref: React.RefObject<HTMLDivElement | null>; display: number } {
  const { duration = 900, immediate = false } = opts;
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  const runTween = useCallback(() => {
    // Respect reduced motion — jump straight to the final value.
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(target);
      return;
    }
    const start = performance.now();
    const from = 0;
    const to = target;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // easeOutCubic — fast start, gentle landing.
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);

  useEffect(() => {
    if (immediate) {
      startedRef.current = true;
      // Defer to a rAF callback so setState happens outside the effect body
      // (satisfies react-hooks/set-state-in-effect rule and lets the browser
      // paint the initial 0 before the tween begins).
      const id = requestAnimationFrame(() => runTween());
      return () => cancelAnimationFrame(id);
    }
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            runTween();
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, immediate, duration, runTween]);

  return { ref, display };
}
