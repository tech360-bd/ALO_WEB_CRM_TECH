"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";

/**
 * useCountUp - Animates a number from 0 to `target`.
 * Optionally starts when the referenced element enters the viewport.
 */
export function useCountUp(
  target: number,
  duration: number = 2000,
  startOnView: boolean = true
): {
  value: number;
  ref: React.RefCallback<HTMLElement>;
  hasStarted: boolean;
} {
  const [value, setValue] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const rafRef = useRef<number | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    elementRef.current = node;

    if (!startOnView) {
      setHasStarted(true);
      return;
    }

    if (node) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setHasStarted(true);
              observerRef.current?.disconnect();
            }
          }
        },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    }
  }, [startOnView]);

  useEffect(() => {
    if (!hasStarted) return;

    const startTime = performance.now();

    /** Smooth deceleration ease-out cubic */
    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      setValue(Math.round(easedProgress * target));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [hasStarted, target, duration]);

  // Clean up observer on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return { value, ref, hasStarted };
}

/**
 * useInView - Detects when an element enters the viewport.
 */
export function useInView(
  threshold: number = 0.1
): {
  ref: React.RefCallback<HTMLElement>;
  isInView: boolean;
} {
  const [isInView, setIsInView] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (node) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                setIsInView(true);
              } else {
                setIsInView(false);
              }
            }
          },
          { threshold }
        );
        observerRef.current.observe(node);
      }
    },
    [threshold]
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { ref, isInView };
}

/**
 * useStaggerAnimation - Returns props for staggered fade-in-up animations on list items.
 */
export function useStaggerAnimation(
  itemCount: number,
  baseDelay: number = 0
): {
  getItemProps: (index: number) => { style: React.CSSProperties };
} {
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const containerRef = useCallback(
    (node: HTMLElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (node) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                setIsVisible(true);
                observerRef.current?.disconnect();
              }
            }
          },
          { threshold: 0.1 }
        );
        observerRef.current.observe(node);
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const getItemProps = useCallback(
    (index: number): { style: React.CSSProperties } => {
      const delay = baseDelay + index * 0.1;
      return {
        style: {
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transition: `opacity 0.5s ease ${delay}s, transform 0.5s ease ${delay}s`,
        },
      };
    },
    [isVisible, baseDelay]
  );

  return { getItemProps };
}

/**
 * useParallax - Tracks scroll position and returns a parallax offset.
 * Useful for background images that should move at a different speed.
 */
export function useParallax(speed: number = 0.5): {
  ref: React.RefCallback<HTMLElement>;
  offset: number;
} {
  const [offset, setOffset] = useState(0);
  const elementRef = useRef<HTMLElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const ref = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        const element = elementRef.current;
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = windowHeight / 2;

        setOffset((elementCenter - viewportCenter) * speed);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [speed]);

  return { ref, offset };
}
