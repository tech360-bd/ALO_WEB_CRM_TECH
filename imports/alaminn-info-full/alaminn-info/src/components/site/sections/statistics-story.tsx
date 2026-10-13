"use client";

import { motion } from "framer-motion";

/**
 * StatisticsStory — editorial big-number statistics section.
 *
 * CRITICAL: Only renders numbers passed in as props. NEVER fabricates
 * "2,000+ students guided" or "99% visa success" — only shows counts
 * that come from real DB queries (universities, scholarships, countries,
 * etc.) and clearly labels any number that is a partner-count vs student
 * count.
 *
 * If a prop is missing or 0, that stat is omitted rather than shown
 * with a fake number.
 */

type Stat = {
  number: string | number;
  label: string;
  context?: string;
};

export function StatisticsStory({ stats }: { stats: Stat[] }) {
  // Filter out any stat with no number or "0"
  const visibleStats = stats.filter((s) => {
    if (s.number === undefined || s.number === null) return false;
    if (typeof s.number === "number" && s.number === 0) return false;
    if (typeof s.number === "string" && (s.number === "0" || s.number === "")) return false;
    return true;
  });

  if (visibleStats.length === 0) {
    return null;
  }

  return (
    <section
      id="statistics"
      aria-label="Our scale"
      className="relative surface-paper py-20 lg:py-28 border-y border-border"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
        {/* Header */}
        <div className="mb-12 lg:mb-16 max-w-2xl">
          <p className="eyebrow-editorial mb-4">By the numbers</p>
          <h2 className="type-h2 text-ink-on-paper">
            What we work with.
          </h2>
          <p className="type-lead text-muted-on-paper mt-4 max-w-xl">
            Not vanity metrics. These are the actual universities, scholarships,
            and destinations our team and platform engage with.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-4">
          {visibleStats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="stat-editorial"
            >
              <span className="stat-editorial-number">
                {typeof stat.number === "number" ? stat.number.toLocaleString() : stat.number}
              </span>
              <span className="stat-editorial-label">{stat.label}</span>
              {stat.context && (
                <p className="stat-editorial-context">{stat.context}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
