'use client';

import React, { useEffect, useRef, useState } from 'react';

// ─── Animation Types ──────────────────────────────────────────────────────────

type AnimationType = 'fade-in' | 'slide-up' | 'slide-left' | 'slide-right' | 'scale-in';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ScrollRevealProps {
  /** Animation type */
  animation?: AnimationType;
  /** Duration in ms */
  duration?: number;
  /** Delay in ms */
  delay?: number;
  /** Stagger delay between children (ms) */
  stagger?: number;
  /** Intersection Observer threshold */
  threshold?: number;
  /** Only animate once */
  once?: boolean;
  /** Distance for slide animations (px) */
  distance?: number;
  /** Custom class */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

// ─── Animation Styles ─────────────────────────────────────────────────────────

function getAnimationStyles(
  type: AnimationType,
  isVisible: boolean,
  distance: number
): React.CSSProperties {
  if (isVisible) {
    return {
      opacity: 1,
      transform: 'translate(0, 0) scale(1)',
      transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  }

  switch (type) {
    case 'fade-in':
      return { opacity: 0, transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)' };
    case 'slide-up':
      return {
        opacity: 0,
        transform: `translateY(${distance}px)`,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    case 'slide-left':
      return {
        opacity: 0,
        transform: `translateX(-${distance}px)`,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    case 'slide-right':
      return {
        opacity: 0,
        transform: `translateX(${distance}px)`,
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      };
    case 'scale-in':
      return {
        opacity: 0,
        transform: 'scale(0.95)',
        transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
      };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ScrollReveal({
  animation = 'slide-up',
  duration = 500,
  delay = 0,
  stagger = 0,
  threshold = 0.15,
  once = true,
  distance = 30,
  className = '',
  children,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (once && hasAnimated.current) return;
            hasAnimated.current = true;
            // Apply delay
            setTimeout(() => {
              setIsVisible(true);
            }, delay);
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold, once]);

  // Handle staggered children
  if (stagger > 0 && React.Children.count(children) > 1) {
    return (
      <div ref={ref} className={className}>
        {React.Children.map(children, (child, i) => (
          <div
            style={{
              ...getAnimationStyles(animation, isVisible, distance),
              transitionDelay: `${delay + i * stagger}ms`,
              transitionDuration: `${duration}ms`,
            }}
          >
            {child}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...getAnimationStyles(animation, isVisible, distance),
        transitionDelay: `${delay}ms`,
        transitionDuration: `${duration}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Convenience: Staggered Children Reveal ───────────────────────────────────

interface StaggerRevealProps {
  stagger?: number;
  animation?: AnimationType;
  className?: string;
  children: React.ReactNode;
}

export function StaggerReveal({
  stagger = 100,
  animation = 'slide-up',
  className = '',
  children,
}: StaggerRevealProps) {
  return (
    <ScrollReveal animation={animation} stagger={stagger} className={className}>
      {children}
    </ScrollReveal>
  );
}
