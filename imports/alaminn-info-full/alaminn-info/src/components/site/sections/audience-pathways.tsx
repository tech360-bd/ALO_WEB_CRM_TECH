"use client";

import { motion } from "framer-motion";
import {
  Building2,
  GraduationCap,
  Rocket,
  Cpu,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { AUDIENCE_PATHWAYS } from "@/lib/site-data";

const ICONS: Record<string, LucideIcon> = {
  Building2,
  GraduationCap,
  Rocket,
  Cpu,
};

const ACCENT = [
  { ring: "ring-blue-200 dark:ring-blue-700/40", bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", dot: "#0B63CE", gradient: "from-blue-500/10 to-blue-600/5" },
  { ring: "ring-orange-200 dark:ring-orange-700/40", bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", dot: "#F26113", gradient: "from-orange-500/10 to-orange-600/5" },
  { ring: "ring-emerald-200 dark:ring-emerald-700/40", bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", dot: "#12825C", gradient: "from-emerald-500/10 to-emerald-600/5" },
  { ring: "ring-indigo-200 dark:ring-indigo-700/40", bg: "bg-indigo-50 dark:bg-indigo-900/30", text: "text-indigo-700 dark:text-indigo-300", dot: "#4F46E5", gradient: "from-indigo-500/10 to-indigo-600/5" },
];

export function AudiencePathways() {
  return (
    <SectionWrap id="audiences" className="bg-white dark:bg-ink-900/50">
      <SectionHeading
        eyebrow="Audience Pathways"
        title={
          <>
            Four pathways into the ecosystem —{" "}
            <span className="text-grad-intelligence">each with a clear next step</span>.
          </>
        }
        description="Choose the pathway that matches your goal. Each opens a focused engagement with the correct inquiry type preselected."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {AUDIENCE_PATHWAYS.map((p, i) => {
          const Icon = ICONS[p.icon] ?? Building2;
          const a = ACCENT[i % ACCENT.length];
          const isPopular = p.id === "founders";
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className={`group relative overflow-hidden rounded-3xl border border-ink-200 dark:border-blue-800/30 bg-gradient-to-br ${a.gradient} p-6 shadow-soft dark:shadow-none transition-all hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-none card-hover-sweep sm:p-7`}
            >
              {/* Gradient border on hover — blue → orange */}
              <span
                className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: "linear-gradient(135deg, rgba(11,99,206,0.12), rgba(242,97,19,0.12))",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "exclude",
                  WebkitMaskComposite: "xor",
                  padding: "2px",
                  borderRadius: "1.5rem",
                }}
                aria-hidden="true"
              />

              {/* "Most popular" badge for Businesses & Founders */}
              {isPopular && (
                <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-orange-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm animate-glow-pulse">
                  <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                  Most Popular
                </span>
              )}

              <div className="flex items-start gap-4">
                <span
                  className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${a.bg} ${a.text} ring-1 ${a.ring} transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}
                >
                  <Icon className="h-6 w-6" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
                    <span className="h-1 w-6 rounded-full" style={{ backgroundColor: a.dot }} />
                    Pathway {String(i + 1).padStart(2, "0")}
                  </div>
                  <h3 className="mt-1 font-display text-lg font-bold leading-snug text-ink-900">
                    {p.title}
                  </h3>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-ink-600 dark:text-blue-300/80">{p.desc}</p>

              <a
                href="#contact"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-ink-200 dark:border-blue-800/30 bg-white/80 dark:bg-ink-900/80 px-4 py-2.5 text-sm font-semibold text-ink-800 dark:text-ink-200 transition-all hover:border-orange-300 dark:hover:border-orange-600/40 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-700 dark:hover:text-orange-300 hover:shadow-sm dark:hover:shadow-none group-hover:gap-3"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full transition-colors"
                  style={{ backgroundColor: a.dot }}
                />
                {p.cta}
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>

              {/* corner accent with stronger hover */}
              <div
                className="absolute -right-12 -top-12 h-32 w-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-50"
                style={{ backgroundColor: a.dot }}
              />
              {/* bottom decorative bar */}
              <div
                className="absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full"
                style={{ background: `linear-gradient(90deg, ${a.dot}, transparent)` }}
              />
            </motion.div>
          );
        })}
      </div>
    </SectionWrap>
  );
}
