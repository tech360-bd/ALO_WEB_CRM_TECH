"use client";

import type { Variants } from "framer-motion";

/**
 * Spring transition configuration used across multiple variants.
 */
export const springTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
  bounce: 0.2,
};

/**
 * Reusable Framer Motion animation variants.
 */
export const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.4 },
  },

  fadeInUp: {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 24 },
    transition: { duration: 0.5, ease: "easeOut" },
  },

  fadeInDown: {
    initial: { opacity: 0, y: -24 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -24 },
    transition: { duration: 0.5, ease: "easeOut" },
  },

  fadeInLeft: {
    initial: { opacity: 0, x: -24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -24 },
    transition: { duration: 0.5, ease: "easeOut" },
  },

  fadeInRight: {
    initial: { opacity: 0, x: 24 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 24 },
    transition: { duration: 0.5, ease: "easeOut" },
  },

  slideInLeft: {
    initial: { x: "-100%" },
    animate: { x: 0 },
    exit: { x: "-100%" },
    transition: { duration: 0.4, ease: "easeInOut" },
  },

  slideInRight: {
    initial: { x: "100%" },
    animate: { x: 0 },
    exit: { x: "100%" },
    transition: { duration: 0.4, ease: "easeInOut" },
  },

  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.8 },
    transition: springTransition,
  },

  liftUp: {
    initial: { y: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" },
    animate: {
      y: -4,
      boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
    },
    transition: { duration: 0.25, ease: "easeOut" },
  },

  shimmer: {
    initial: { backgroundPosition: "-200% 0" },
    animate: {
      backgroundPosition: "200% 0",
    },
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "linear",
    },
  },

  countUp: {
    initial: { opacity: 0, scale: 0.5 },
    animate: {
      opacity: 1,
      scale: 1,
    },
    exit: { opacity: 0, scale: 0.5 },
    transition: {
      ...springTransition,
      stiffness: 200,
      damping: 20,
    },
  },
} as const satisfies Record<string, Variants>;

/**
 * Container variant that staggers its children's entrance.
 */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
  exit: {},
};

/**
 * Card hover variant: lift effect with shadow on hover.
 */
export const cardHover: Variants = {
  initial: {
    y: 0,
    boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
  },
  whileHover: {
    y: -6,
    boxShadow:
      "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
    transition: { duration: 0.25, ease: "easeOut" },
  },
};
