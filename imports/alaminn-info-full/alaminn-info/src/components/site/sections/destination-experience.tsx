"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

/**
 * DestinationExperience — editorial destination storytelling section.
 *
 * Renders a magazine-style editorial layout for major study destinations.
 * Uses real DB data passed via props (no fabricated content).
 *
 * Each destination uses asymmetric grid + chapter numbering + image-frame.
 */

export type DestinationItem = {
  code: string;
  label: string;
  tagline: string;
  blurb: string;
  image: string;
  href: string;
  stats: {
    universities: number | string;
    courses: number | string;
    scholarships: number | string;
    avgTuition: string;
    visa: string;
    intakes: string;
  };
};

export function DestinationExperience({
  destinations,
}: {
  destinations: DestinationItem[];
}) {
  if (!destinations || destinations.length === 0) {
    return null;
  }

  return (
    <section
      id="destinations"
      aria-label="Study destinations"
      className="relative surface-paper py-20 lg:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Section header */}
        <div className="editorial-split mb-16 lg:mb-24">
          <div>
            <p className="eyebrow-editorial mb-4">Destinations</p>
            <h2 className="type-h2 text-ink-on-paper">
              The world&apos;s universities,
              <br />
              <span className="italic font-serif" style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                one trusted guide.
              </span>
            </h2>
          </div>
          <div>
            <p className="type-lead text-muted-on-paper max-w-md">
              We focus on the destinations that matter most to ambitious students —
              places where admission is competitive but the journey is well-trodden
              with the right guidance.
            </p>
            <Link
              href="/higher-study/destinations"
              className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-ink-on-paper hover:text-primary transition-colors focus-ring-premium"
            >
              View all destinations
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Destination stories */}
        <div className="space-y-0 border-t border-border">
          {destinations.map((d, idx) => (
            <DestinationStory key={d.code} item={d} index={idx + 1} />
          ))}
        </div>
      </div>
    </section>
  );
}

function DestinationStory({
  item,
  index,
}: {
  item: DestinationItem;
  index: number;
}) {
  const num = String(index).padStart(2, "0");

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="destination-story"
    >
      {/* Image side */}
      <div className="destination-story-image-wrap">
        <Image
          src={item.image}
          alt={`${item.label} campus`}
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="object-cover"
        />
        <div className="absolute top-4 left-4 type-meta text-white/80 bg-black/30 backdrop-blur px-2.5 py-1 rounded-full">
          {item.code}
        </div>
      </div>

      {/* Content side */}
      <div>
        <div className="flex items-baseline gap-4 mb-3">
          <span className="chapter-number">{num}</span>
          <div>
            <p className="eyebrow-editorial mb-1">{item.tagline}</p>
            <h3 className="type-h3 text-ink-on-paper">{item.label}</h3>
          </div>
        </div>

        <p className="type-body text-muted-on-paper max-w-md mb-6">
          {item.blurb}
        </p>

        <dl className="destination-meta-list">
          <div>
            <dt>Universities</dt>
            <dd>{item.stats.universities}</dd>
          </div>
          <div>
            <dt>Courses</dt>
            <dd>{item.stats.courses}</dd>
          </div>
          <div>
            <dt>Scholarships</dt>
            <dd>{item.stats.scholarships}</dd>
          </div>
          <div>
            <dt>Avg. Tuition</dt>
            <dd>{item.stats.avgTuition}</dd>
          </div>
          <div>
            <dt>Visa</dt>
            <dd>{item.stats.visa}</dd>
          </div>
          <div>
            <dt>Intakes</dt>
            <dd>{item.stats.intakes}</dd>
          </div>
        </dl>

        <Link
          href={item.href}
          className="inline-flex items-center gap-2 mt-8 text-sm font-semibold text-ink-on-paper hover:text-primary transition-colors focus-ring-premium"
        >
          Explore {item.label}
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.article>
  );
}
