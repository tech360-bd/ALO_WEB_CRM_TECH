/* ═══════════════════════════════════════════════════════════════
   ALO EDUCATION — Shared Animation Utilities
   Premium scroll-triggered & staggered animation presets
   ═══════════════════════════════════════════════════════════════ */

import { Variants, Transition } from 'framer-motion';

/* ── Brand Colors ──────────────────────────────────────────── */
export const BRAND = {
  blue: '#0B5ED7',      // Education Blue
  orange: '#F97316',     // ALO Orange (primary CTA)
  sunshine: '#FFB347',   // Sunshine Accent
  text: '#0F172A',       // Neutral Dark
  textSoft: '#555555',  // Neutral Gray
  softBg: '#FFF8F0',    // Warm off-white
  lightBg: '#F0F7FF',   // Light blue tint
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  white: '#FFFFFF',
  tagline: '#F97316',   // Italic orange for tagline
};

/* ── Shared Transitions ─────────────────────────────────────── */
export const springSmooth: Transition = {
  type: 'spring',
  stiffness: 100,
  damping: 20,
};

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const easeOutExpo: Transition = {
  duration: 0.7,
  ease: [0.16, 1, 0.3, 1],
};

export const easeOutQuart: Transition = {
  duration: 0.5,
  ease: [0.25, 1, 0.5, 1],
};

/* ── Fade Up (scroll reveal) ──────────────────────────────────── */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] },
  },
};

/* ── Fade Down ───────────────────────────────────────────────── */
export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
  },
};

/* ── Fade In ────────────────────────────────────────────────── */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5 },
  },
};

/* ── Scale Up ────────────────────────────────────────────────── */
export const scaleUp: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
  },
};

/* ── Slide From Left ────────────────────────────────────────── */
export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] },
  },
};

/* ── Slide From Right ────────────────────────────────────────── */
export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] },
  },
};

/* ── Stagger Container — parent wrapper for staggered children ── */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/* ── Stagger Item — each child inside staggerContainer ──────── */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.25, 1, 0.5, 1] },
  },
};

/* ── Stagger Item with Scale ─────────────────────────────────── */
export const staggerItemScale: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
  },
};

/* ── Section Header (title + subtitle combo) ─────────────────── */
export const sectionHeader: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.25, 1, 0.5, 1],
      staggerChildren: 0.15,
    },
  },
};

export const sectionTitle: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] },
  },
};

export const sectionSubtitle: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: 0.15, ease: [0.25, 1, 0.5, 1] },
  },
};

/* ── Card Hover Effect Props ────────────────────────────────── */
export const cardHover = {
  whileHover: {
    y: -6,
    scale: 1.02,
    transition: { type: 'spring', stiffness: 300, damping: 20 },
  },
  whileTap: { scale: 0.98 },
};

/* ── Viewport settings for scroll-triggered animations ─────── */
export const viewportOnce = {
  once: true,
  margin: '-80px',
  amount: 0.2 as const,
};

export const viewportRepeat = {
  margin: '-80px',
  amount: 0.2 as const,
};

/* ── Gradient helpers ───────────────────────────────────────── */
export const gradients = {
  blue: 'linear-gradient(135deg, #0B5ED7 0%, #0EA5E9 100%)',
  orange: 'linear-gradient(135deg, #F97316 0%, #FFB347 100%)',
  blueLight: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
  softBlue: 'linear-gradient(180deg, #FFFFFF 0%, #F0F7FF 100%)',
  heroGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,102,204,0.08) 0%, transparent 70%)',
  ctaGlow: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(243,112,33,0.1) 0%, transparent 70%)',
  warmGlow: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(243,112,33,0.06) 0%, transparent 70%)',
};

/* ── Hero slide transition ─────────────────────────────────── */
export const heroSlideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
    scale: 0.95,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.25, 1, 0.5, 1] },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.4, ease: [0.42, 0, 1, 1] },
  }),
};
