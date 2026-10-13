'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Brain, Users, FileText, Award, Shield, MessageCircle, ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  expanded: string;
  color: 'blue' | 'orange';
}

const FEATURES: Feature[] = [
  {
    icon: Brain,
    title: 'AI Course Matching',
    description: 'Our AI analyzes your profile and matches you with the best courses across 500+ universities.',
    expanded: 'Simply input your academic background, IELTS score, budget and preferred destination. Our proprietary AI engine cross-references 50,000+ courses to find your perfect match in under 3 minutes.',
    color: 'blue',
  },
  {
    icon: Users,
    title: 'Expert Counsellors',
    description: 'Dedicated counsellors guide you through every step of the application process.',
    expanded: 'Each student is paired with a British Council-certified counsellor who provides 1-on-1 guidance from course selection to post-arrival support. Our counsellors have an average of 8+ years of experience.',
    color: 'blue',
  },
  {
    icon: FileText,
    title: 'Complete Application Support',
    description: 'From documents to submission, we handle everything for a stress-free experience.',
    expanded: 'We manage your entire application pipeline — SOP review, reference letters, transcript verification, certified translations, and university submissions. Our students never miss a deadline.',
    color: 'orange',
  },
  {
    icon: Award,
    title: 'Scholarship Discovery',
    description: 'Find scholarships you are eligible for automatically with our matching engine.',
    expanded: 'Our database includes 2,000+ scholarships from universities and external organisations. We auto-match your profile and help you craft compelling scholarship applications to maximise your chances.',
    color: 'orange',
  },
  {
    icon: Shield,
    title: 'Visa Assistance',
    description: 'Expert visa guidance with a 98% success rate across all destination countries.',
    expanded: 'Our visa team stays up to date with the latest immigration policies for UK, USA, Canada, Australia and more. We prepare you for interviews, review your financial documents, and ensure your application is submission-ready.',
    color: 'blue',
  },
  {
    icon: MessageCircle,
    title: '24/7 Support',
    description: 'Reach us anytime via WhatsApp, phone or live chat for immediate assistance.',
    expanded: 'Whether you have a question at 2 AM about your CAS letter or need emergency support before your visa interview, our multilingual team is always available on WhatsApp, phone and in-app chat.',
    color: 'blue',
  },
];

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                 */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

/* ------------------------------------------------------------------ */
/*  Feature Card                                                       */
/* ------------------------------------------------------------------ */

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = feature.icon;

  const circleColor = feature.color === 'blue'
    ? 'bg-alo-blue-light text-alo-blue'
    : 'bg-alo-orange-light text-alo-orange';

  return (
    <motion.div
      variants={cardVariants}
      className={`group cursor-pointer rounded-xl border border-alo-gray-medium/60 bg-alo-white p-6 shadow-sm card-lift transition-all duration-200 ${expanded ? 'border-l-2 border-l-alo-blue' : ''}`}
      onClick={() => setExpanded(!expanded)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setExpanded(!expanded);
        }
      }}
      tabIndex={0}
      role="button"
      aria-expanded={expanded}
    >
      {/* Icon */}
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${circleColor} transition-transform duration-300 group-hover:scale-110`}>
        <Icon className="h-6 w-6" />
      </div>

      {/* Title */}
      <h3 className="mt-4 text-base font-bold text-alo-black">
        {feature.title}
      </h3>

      {/* Description */}
      <p className="mt-2 text-sm leading-relaxed text-alo-gray">
        {feature.description}
      </p>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="mt-3 text-sm leading-relaxed text-alo-gray border-t border-alo-gray-medium/40 pt-3">
              {feature.expanded}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand indicator */}
      <motion.div
        className="mt-3 flex items-center gap-1 text-xs font-semibold text-alo-blue"
        animate={{ rotate: expanded ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ChevronDown className="h-4 w-4" />
        <span>{expanded ? 'Show less' : 'Learn more'}</span>
      </motion.div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function WhyAloSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-alo-gray-light py-16 sm:py-20"
      aria-labelledby="why-alo-heading"
    >
      {/* Subtle gradient background accent */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute -top-20 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-alo-blue/[0.04] blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Header ─────────────────────────────────────────────── */}
        {/* Decorative diamond divider */}
        <div className="mb-6 flex items-center justify-center" aria-hidden="true">
          <div className="w-12 h-px bg-alo-blue/15" />
          <div className="mx-2 h-2 w-2 rotate-45 bg-alo-blue/20 rounded-[1px]" />
          <div className="w-12 h-px bg-alo-blue/15" />
        </div>

        <motion.div
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="inline-block rounded-full bg-alo-blue-light px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-alo-blue">
            Why ALO Education
          </span>
          <h2
            id="why-alo-heading"
            className="mt-4 text-2xl font-bold tracking-tight text-alo-black sm:text-3xl lg:text-4xl"
          >
            Everything You Need to Study Abroad
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-alo-gray">
            From AI-powered course matching to visa approval — we are with you at every step.
          </p>
        </motion.div>

        {/* ── Feature Grid ────────────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
