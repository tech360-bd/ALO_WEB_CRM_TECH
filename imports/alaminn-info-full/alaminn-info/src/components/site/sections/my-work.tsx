"use client";

/**
 * MyWork — premium "My Work" section showcasing engagement highlights.
 *
 * Renders 6 qualitative work-highlight cards (operations, education, AI,
 * CRM, growth, partnerships). No fabricated metrics — each card lists the
 * qualitative outcomes of the engagement type.
 */
import { motion } from "framer-motion";
import {
  Workflow,
  GraduationCap,
  Sparkles,
  Database,
  Rocket,
  Handshake,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { MY_WORK_HIGHLIGHTS, type WorkHighlight } from "@/lib/site-data";

const ICONS: Record<WorkHighlight["icon"], LucideIcon> = {
  Workflow,
  GraduationCap,
  Sparkles,
  Database,
  Rocket,
  Handshake,
};

const TAG_COLORS: Record<string, string> = {
  Operations: "from-blue-500/15 to-blue-600/5 text-blue-700 border-blue-200",
  Education: "from-emerald-500/15 to-emerald-600/5 text-emerald-700 border-emerald-200",
  AI: "from-purple-500/15 to-purple-600/5 text-purple-700 border-purple-200",
  CRM: "from-cyan-500/15 to-cyan-600/5 text-cyan-700 border-cyan-200",
  Growth: "from-orange-500/15 to-orange-600/5 text-orange-700 border-orange-200",
  Partnerships: "from-rose-500/15 to-rose-600/5 text-rose-700 border-rose-200",
};

export function MyWork() {
  return (
    <section
      id="my-work"
      aria-labelledby="my-work-heading"
      className="relative overflow-hidden py-20 sm:py-24 lg:py-28"
    >
      <div className="absolute inset-0 grad-ambient opacity-50" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -left-40 top-20 h-[480px] w-[480px] rounded-full opacity-40 blur-3xl"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(circle, rgba(11,99,206,0.18), transparent 60%)",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-4 sm:px-6">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700"
          >
            <Workflow className="h-3.5 w-3.5" />
            My Work
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl lg:text-5xl text-balance [text-wrap:balance]"
          >
            What I build, end to end
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-4 text-base text-ink-500 sm:text-lg"
          >
            Systems across operations, education, AI, CRM, growth and
            partnerships — each with structured outcomes, not vanity metrics.
          </motion.p>
        </div>

        {/* Cards grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MY_WORK_HIGHLIGHTS.map((item, i) => {
            const Icon = ICONS[item.icon];
            const tagColor =
              TAG_COLORS[item.tag] ?? "from-ink-500/15 to-ink-600/5 text-ink-700 border-ink-200";
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-blue-900/10 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
              >
                {/* Icon header */}
                <div
                  className={
                    "relative flex items-center gap-3 border-b border-ink-100 bg-gradient-to-br p-5 " +
                    tagColor
                  }
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                      {item.tag}
                    </div>
                    <h3 className="font-display text-base font-bold leading-snug text-ink-950">
                      {item.title}
                    </h3>
                  </div>
                </div>

                {/* Body */}
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-sm leading-relaxed text-ink-600">
                    {item.description}
                  </p>
                  <ul className="mt-4 space-y-2">
                    {item.outcomes.map((o) => (
                      <li
                        key={o}
                        className="flex items-start gap-2 text-xs text-ink-600"
                      >
                        <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />
                        {o}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#work-with-me"
                    className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-blue-700 transition-colors hover:text-orange-700"
                  >
                    Explore engagement
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
