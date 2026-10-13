"use client";

import { motion } from "framer-motion";
import { ChevronDown, Layers, Cog, Users, Database } from "lucide-react";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { GROWTH_FLOW } from "@/lib/site-data";

const PILLARS = [
  { icon: Users, label: "People", color: "#1677E8", num: "01" },
  { icon: Cog, label: "Process", color: "#0B63CE", num: "02" },
  { icon: Layers, label: "Technology", color: "#3B91F5", num: "03" },
  { icon: Database, label: "Data", color: "#FF751F", num: "04" },
];

const CONNECTORS = [
  "Accountability",
  "Communication",
  "Leadership",
];

export function ExecutiveIntro() {
  return (
    <SectionWrap id="about" className="grad-ambient">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <SectionHeading
            eyebrow="Where Strategy Meets Execution"
            title={
              <>
                Growth Requires More Than Ideas.{" "}
                <span className="text-grad-intelligence">It Requires an Operating System.</span>
              </>
            }
            description="Al Aminn connects people, process, technology, accountability, communication, data and leadership — turning ambitious goals into measurable, repeatable systems."
          />

          {/* Pillar cards with numbered badges and connecting dashed line */}
          <div className="mt-7 relative grid grid-cols-2 gap-3">
            {/* Connecting dashed line between pillars */}
            <div
              className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-full w-px border-l-2 border-dashed border-blue-200/50"
              aria-hidden="true"
            />
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: i * 0.08 }}
                className="group relative flex items-center gap-3 rounded-2xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 p-4 shadow-soft dark:shadow-none transition-all hover:shadow-card dark:hover:shadow-none hover:-translate-y-0.5 card-hover-sweep hover-glow-blue"
              >
                {/* Numbered badge */}
                <span
                  className="absolute -top-2 -left-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-extrabold text-white transition-transform group-hover:scale-110"
                  style={{ backgroundColor: p.color }}
                >
                  {p.num}
                </span>
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors"
                  style={{ backgroundColor: `${p.color}15`, color: p.color }}
                >
                  <p.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="font-display text-sm font-bold text-ink-900">{p.label}</div>
                  <div className="text-[11px] text-ink-500">Integrated</div>
                </div>
                {/* Hover glow effect */}
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ boxShadow: `0 0 24px ${p.color}15` }}
                />
              </motion.div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {CONNECTORS.map((c, i) => (
              <motion.span
                key={c}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.25, delay: 0.3 + i * 0.05 }}
                className="rounded-full border border-blue-200 dark:border-blue-700/40 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 transition-colors hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                {c}
              </motion.span>
            ))}
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: 0.5 }
              }
              className="rounded-full border border-orange-200 dark:border-orange-700/40 bg-orange-50 dark:bg-orange-900/30 px-3 py-1 text-xs font-medium text-orange-700 dark:text-orange-300"
            >
              Leadership
            </motion.span>
          </div>
        </div>

        {/* Growth flow visual */}
        <div className="lg:col-span-7">
          <div className="relative rounded-3xl border border-blue-900/10 dark:border-blue-800/30 bg-white dark:bg-ink-900 p-6 shadow-card dark:shadow-none hover:shadow-lg dark:hover:shadow-xl transition-shadow sm:p-8">
            <div className="mb-5 flex items-center justify-between">
              <div className="eyebrow text-blue-600">The Growth System</div>
              <div className="text-[11px] text-ink-400">Vision → Growth</div>
            </div>
            <div className="relative">
              {/* vertical flow on mobile, horizontal-ish on desktop */}
              <div className="space-y-3">
                {GROWTH_FLOW.map((step, i) => {
                  const isHighlight = step.label.includes("People");
                  // Calculate blue→orange ratio for left border
                  const ratio = i / (GROWTH_FLOW.length - 1);
                  const borderColor = `linear-gradient(180deg, rgba(11,99,206,${1 - ratio * 0.6}), rgba(242,97,19,${ratio * 0.8 + 0.2}))`;
                  return (
                    <motion.div
                      key={step.label}
                      initial={{ opacity: 0, x: 18 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-60px" }}
                      transition={{ duration: 0.4, delay: i * 0.06 }}
                      className="relative flex items-stretch gap-3"
                    >
                      <div className="flex flex-col items-center">
                        <span
                          className={`inline-flex h-9 w-9 items-center justify-center rounded-xl font-display text-sm font-extrabold ${
                            isHighlight
                              ? "grad-momentum text-white shadow-orange"
                              : "grad-intelligence text-white shadow-blue"
                          }`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {i < GROWTH_FLOW.length - 1 && (
                          <span className="mt-1 flex-1 w-px bg-gradient-to-b from-blue-300 to-transparent" />
                        )}
                      </div>
                      <div
                        className={`mb-1 flex-1 rounded-2xl border p-4 transition-colors relative overflow-hidden ${
                          isHighlight
                            ? "border-orange-200 dark:border-orange-700/40 bg-orange-50/60 dark:bg-orange-900/20"
                            : "border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 hover:border-blue-300 dark:hover:border-blue-600/50"
                        }`}
                      >
                        {/* Blue→orange left border gradient */}
                        <span
                          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
                          style={{ background: borderColor }}
                          aria-hidden="true"
                        />
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-display text-sm font-bold text-ink-900">
                            {step.label}
                          </div>
                          {i < GROWTH_FLOW.length - 1 && (
                            <ChevronDown className="hidden h-4 w-4 -rotate-90 text-ink-300 sm:block" />
                          )}
                        </div>
                        <div className="mt-1 text-xs text-ink-500">{step.desc}</div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionWrap>
  );
}
