"use client";

import { motion } from "framer-motion";
import { BookOpen, FileText, Plane, Globe, UserCheck, Stamp } from "lucide-react";

/**
 * JourneyTimeline — 8-step visual journey of the application workflow.
 *
 * Uses real stages that align with the existing application flow:
 * Profile → Education → Destination → University → Course → Documents →
 * Application → Offer → Visa → Departure → Arrive
 *
 * Condensed to 8 chapters for editorial impact.
 */

type Step = {
  num: string;
  label: string;
  blurb: string;
  icon: React.ElementType;
};

const STEPS: Step[] = [
  { num: "01", label: "Discover", blurb: "Define your goals and explore destinations.", icon: Globe },
  { num: "02", label: "Counsel", blurb: "1:1 session to map your academic profile.", icon: BookOpen },
  { num: "03", label: "Shortlist", blurb: "Curated universities and courses matched to you.", icon: UserCheck },
  { num: "04", label: "Apply", blurb: "Documents, essays, and submission handled.", icon: FileText },
  { num: "05", label: "Offer", blurb: "Receive and evaluate your admissions offers.", icon: Stamp },
  { num: "06", label: "Visa", blurb: "Visa documentation and interview prep.", icon: FileText },
  { num: "07", label: "Departure", blurb: "Pre-departure briefing and arrangements.", icon: Plane },
  { num: "08", label: "Arrive", blurb: "On-ground support during your first weeks.", icon: Globe },
];

export function JourneyTimeline() {
  return (
    <section
      id="how-it-works"
      aria-label="How it works"
      className="relative surface-mist py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="max-w-3xl mb-16 lg:mb-24">
          <p className="eyebrow-editorial mb-4">How it works</p>
          <h2 className="type-h2 text-ink-on-paper">
            From idea to arrival —
            <br />
            <span className="italic font-serif" style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
              eight deliberate steps.
            </span>
          </h2>
        </div>

        {/* Timeline */}
        <div className="journey-timeline">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="journey-step"
              >
                {/* Connector line */}
                {idx < STEPS.length - 1 && <span className="journey-line" aria-hidden="true" />}

                {/* Marker */}
                <div className="journey-step-marker mb-4 relative z-10">
                  {step.num}
                </div>

                {/* Icon + label */}
                <Icon className="w-4 h-4 text-ink-500 mb-2" />
                <p className="text-sm font-semibold text-ink-on-paper mb-1">
                  {step.label}
                </p>
                <p className="text-xs text-muted-on-paper leading-relaxed max-w-[160px]">
                  {step.blurb}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
