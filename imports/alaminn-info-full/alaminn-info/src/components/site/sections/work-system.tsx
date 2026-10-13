"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Target, FileOutput, GitBranch, UserRound, Flag } from "lucide-react";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { WORK_STAGES } from "@/lib/site-data";

export function WorkSystem() {
  const [active, setActive] = useState(0);
  const stage = WORK_STAGES[active];

  return (
    <SectionWrap id="work-system" className="bg-white dark:bg-ink-900/50">
      <SectionHeading
        eyebrow="The Work System"
        title={
          <>
            How I turn complex goals into{" "}
            <span className="text-grad-intelligence">working systems</span>.
          </>
        }
        description="An eight-stage path from understanding to scale — each stage with a clear objective, output, decision, responsible role and measurable checkpoint."
      />

      {/* Desktop horizontal path */}
      <div className="mt-10 hidden lg:block">
        <div className="relative">
          {/* track */}
          <div className="absolute left-0 right-0 top-7 h-0.5 bg-ink-100" />
          <motion.div
            className="absolute left-0 top-7 h-0.5"
            style={{
              background: "linear-gradient(90deg, #0B63CE, #F26113)",
            }}
            animate={{ width: `${(active / (WORK_STAGES.length - 1)) * 100}%` }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
          <div className="relative grid grid-cols-8 gap-1">
            {WORK_STAGES.map((s, i) => {
              const isActive = i === active;
              const isDone = i < active;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(i)}
                  className="group flex flex-col items-center"
                >
                  <span
                    className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl border-2 font-display text-base font-extrabold transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-0.5 group-hover:shadow-card dark:group-hover:shadow-none group-hover:border-orange-300 dark:group-hover:border-orange-700/40 ${
                      isActive
                        ? "border-orange-500 bg-orange-600 text-white shadow-orange scale-110 ring-2 ring-orange-500/30"
                        : isDone
                        ? "border-blue-300 bg-blue-600 text-white"
                        : "border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 text-ink-500 group-hover:border-blue-400 dark:group-hover:border-blue-600/50"
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="h-6 w-6" /> : i + 1}
                  </span>
                  <span
                    className={`mt-2 text-xs font-semibold transition-colors ${
                      isActive ? "text-orange-700 dark:text-orange-300" : "text-ink-500 dark:text-ink-400"
                    }`}
                  >
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile vertical path */}
      <div className="mt-8 lg:hidden">
        <div className="flex flex-wrap gap-2">
          {WORK_STAGES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActive(i)}
              className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-xs font-semibold transition-all ${
                i === active
                  ? "border-orange-500 bg-orange-600 text-white"
                  : "border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 text-ink-600 dark:text-ink-300"
              }`}
            >
              <span className="tabular">{i + 1}</span>
              {s.title}
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence mode="wait">
        <motion.div
          key={stage.id}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 overflow-hidden rounded-3xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 shadow-card dark:shadow-none"
        >
          <div className="grid lg:grid-cols-12">
            {/* left summary */}
            <div className="relative grad-intelligence p-7 text-white lg:col-span-4">
              <div className="eyebrow text-orange-300">
                Stage {String(active + 1).padStart(2, "0")} / 08
              </div>
              <div className="mt-2 font-display text-3xl font-extrabold">{stage.title}</div>
              <p className="mt-3 text-sm leading-relaxed text-blue-100">{stage.objective}</p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium">
                <Flag className="h-3.5 w-3.5 text-orange-300" />
                Checkpoint: {stage.checkpoint}
              </div>
            </div>

            {/* right detail grid */}
            <div className="grid gap-px bg-ink-100 dark:bg-blue-900/30 lg:col-span-8 lg:grid-cols-2">
              <DetailCard icon={Target} label="Objective" value={stage.objective} accent="blue" />
              <DetailCard icon={FileOutput} label="Output" value={stage.output} accent="blue" />
              <DetailCard icon={GitBranch} label="Decision" value={stage.decision} accent="orange" />
              <DetailCard icon={UserRound} label="Responsible role" value={stage.role} accent="orange" />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </SectionWrap>
  );
}

function DetailCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  accent: "blue" | "orange";
}) {
  return (
    <div className="bg-white dark:bg-ink-900/80 p-6">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${
            accent === "blue" ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
          {label}
        </span>
      </div>
      <div className="mt-3 font-display text-base font-bold text-ink-900 dark:text-ink-100">{value}</div>
    </div>
  );
}
