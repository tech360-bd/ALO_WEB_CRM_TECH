"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

/**
 * ServicesStory — editorial numbered services layout.
 *
 * Replaces generic 6-card grid with magazine-style numbered editorial layouts.
 * Each service uses asymmetric layout, large chapter number, and links to
 * a real existing route.
 */

type Service = {
  num: string;
  label: string;
  title: string;
  blurb: string;
  href: string;
};

const SERVICES: Service[] = [
  {
    num: "01",
    label: "Counselling",
    title: "Understand your options",
    blurb: "Personalised guidance that maps your academic record, ambitions, and budget to the right country, course, and university.",
    href: "/contact",
  },
  {
    num: "02",
    label: "University Application",
    title: "From shortlist to submission",
    blurb: "We handle document review, statement polishing, recommendation strategy, and the submission timeline for every target university.",
    href: "/higher-study/apply",
  },
  {
    num: "03",
    label: "Scholarship",
    title: "Find funding opportunities",
    blurb: "Chevening, Commonwealth, DAAD, Vanier, Australia Awards — we match you to real scholarships and review every application essay.",
    href: "/higher-study/scholarships",
  },
  {
    num: "04",
    label: "Visa",
    title: "Prepare with confidence",
    blurb: "Document checklists, financial evidence preparation, and mock interviews so you walk into the embassy knowing exactly what to expect.",
    href: "/higher-study/book-consultation",
  },
  {
    num: "05",
    label: "Pre-Departure",
    title: "Everything before takeoff",
    blurb: "Accommodation guidance, course registration, banking setup, and a thorough pre-departure briefing covering cultural and academic expectations.",
    href: "/higher-study/application-guide",
  },
  {
    num: "06",
    label: "Post-Arrival",
    title: "Support after you land",
    blurb: "First-week orientation, part-time work rights, residence permit processing, and ongoing check-ins during your first academic year.",
    href: "/contact",
  },
];

export function ServicesStory() {
  return (
    <section
      id="services"
      aria-label="Our services"
      className="relative surface-paper py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-6 mb-16 lg:mb-24 border-b border-border pb-12">
          <div>
            <p className="eyebrow-editorial mb-4">Services</p>
            <h2 className="type-h2 text-ink-on-paper max-w-2xl">
              Not six identical cards.
              <br />
              <span className="italic font-serif" style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                Six chapters of your journey.
              </span>
            </h2>
          </div>
          <Link
            href="/work-with-me"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-on-paper hover:text-primary transition-colors focus-ring-premium"
          >
            See how we work together
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Services editorial list */}
        <div className="space-y-0">
          {SERVICES.map((s, idx) => (
            <ServiceRow key={s.num} service={s} reverse={idx % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceRow({ service, reverse }: { service: Service; reverse: boolean }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 py-10 lg:py-14 border-t border-border first:border-t-0 hover:bg-surface-mist/60 transition-colors"
    >
      {/* Chapter number */}
      <div className={`md:col-span-2 ${reverse ? "md:order-3" : ""}`}>
        <span className="chapter-number">{service.num}</span>
      </div>

      {/* Label */}
      <div className={`md:col-span-3 ${reverse ? "md:order-1" : ""}`}>
        <p className="eyebrow-editorial">{service.label}</p>
      </div>

      {/* Content */}
      <div className={`md:col-span-7 ${reverse ? "md:order-2" : ""}`}>
        <h3 className="type-h3 text-ink-on-paper mb-3">
          {service.title}
        </h3>
        <p className="type-body text-muted-on-paper max-w-lg mb-5">
          {service.blurb}
        </p>
        <Link
          href={service.href}
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-on-paper group-hover:text-primary transition-colors focus-ring-premium"
        >
          {service.label === "Counselling" ? "Book a session" : `Explore ${service.label.toLowerCase()}`}
          <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>
    </motion.article>
  );
}
