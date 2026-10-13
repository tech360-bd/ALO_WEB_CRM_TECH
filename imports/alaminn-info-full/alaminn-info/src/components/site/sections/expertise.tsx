"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Workflow,
  TrendingUp,
  GraduationCap,
  Handshake,
  Sparkles,
  Database,
  Megaphone,
  Users,
  ArrowUpRight,
  Target,
  Lightbulb,
  FolderKanban,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { EXPERTISE_MODULES, type ExpertiseModule } from "@/lib/site-data";
import { DetailModal, ModalField } from "../detail-modal";

const ICONS: Record<string, LucideIcon> = {
  Workflow,
  TrendingUp,
  GraduationCap,
  Handshake,
  Sparkles,
  Database,
  Megaphone,
  Users,
};

const SYSTEMS = [
  { key: "business", label: "Business Operating System", color: "#0B63CE" },
  { key: "growth", label: "Growth System", color: "#1677E8" },
  { key: "education", label: "Education Growth System", color: "#FF751F" },
  { key: "digital", label: "Intelligent Digital System", color: "#F26113" },
];

export function Expertise() {
  const [active, setActive] = useState<ExpertiseModule | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <SectionWrap id="expertise" className="bg-blue-50/40 dark:bg-blue-950/20">
      <SectionHeading
        eyebrow="Expertise Command Grid"
        title={
          <>
            Eight systems that turn complexity into{" "}
            <span className="text-grad-momentum">controlled growth</span>.
          </>
        }
        description="Eight focused modules connect operational discipline, growth engineering, team performance, education strategy and AI governance. Click any card to explore."
      />

      {/* system legend */}
      <div className="mt-6 flex flex-wrap gap-2">
        {SYSTEMS.map((s) => (
          <span
            key={s.key}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 px-3 py-1.5 text-xs font-medium text-ink-700 dark:text-ink-300"
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {EXPERTISE_MODULES.map((m, i) => {
          const Icon = ICONS[m.icon] ?? Workflow;
          const isActive = hovered === m.id;
          return (
            <motion.button
              key={m.id}
              type="button"
              onClick={() => setActive(m)}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              onMouseEnter={() => setHovered(m.id)}
              onMouseLeave={() => setHovered(null)}
              className={`group relative overflow-hidden rounded-2xl border bg-white dark:bg-ink-900 p-5 text-left transition-all duration-300 card-hover-sweep hover-glow-blue ${
                isActive
                  ? "border-orange-300 dark:border-orange-500/40 shadow-orange dark:shadow-none -translate-y-1"
                  : "border-ink-200 dark:border-blue-800/30 shadow-soft dark:shadow-none hover:border-blue-300 dark:hover:border-blue-600/50 hover:-translate-y-1"
              }`}
            >
              {/* shimmer glow on active */}
              {isActive && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-2xl shimmer opacity-30"
                  aria-hidden="true"
                />
              )}

              {/* signal line on hover — thicker when active */}
              <div
                className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                  isActive ? "w-0.5 opacity-100" : "w-px opacity-0"
                }`}
                style={{
                  background: "linear-gradient(180deg, #0B63CE, #F26113)",
                }}
              />

              {/* node indicator */}
              <div className="flex items-start justify-between">
                <span
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-200 icon-hover-scale ${
                    isActive
                      ? "grad-momentum text-white shadow-orange"
                      : "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    isActive
                      ? "bg-orange-500 node-active"
                      : "bg-blue-200 group-hover:animate-dot-pulse group-hover:bg-orange-400"
                  }`}
                />
              </div>

              <h3 className="mt-4 font-display text-base font-bold leading-snug text-ink-900">
                {m.title}
              </h3>

              <div className="mt-3 space-y-2">
                <div className="rounded-lg bg-ink-50 dark:bg-ink-800/40 p-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 dark:text-ink-400">
                    Challenge
                  </div>
                  <div className="mt-0.5 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
                    {m.challenge}
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50/60 dark:bg-blue-900/25 p-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Solution
                  </div>
                  <div className="mt-0.5 text-xs leading-relaxed text-ink-700 dark:text-ink-300">
                    {m.solution}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {m.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-md border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-800/40 px-2 py-0.5 text-[10px] font-medium text-ink-500 dark:text-ink-400"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-ink-100 dark:border-blue-800/20 pt-3">
                <span className="text-[11px] text-ink-500 dark:text-ink-400">
                  Related:{" "}
                  <span className="font-semibold text-ink-800 dark:text-ink-300">{m.relatedProject}</span>
                </span>
                <span
                  className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors ${
                    isActive ? "text-orange-600" : "text-blue-700 dark:text-blue-400"
                  }`}
                >
                  Explore
                  <ArrowUpRight className="h-3.5 w-3.5 arrow-hover-animate" />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Expertise module detail modal */}
      <DetailModal
        open={!!active}
        onClose={() => setActive(null)}
        eyebrow="Expertise Module"
        accent="momentum"
        title={active?.title ?? ""}
        footer={
          <a
            href="#contact"
            onClick={() => setActive(null)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
          >
            <ArrowUpRight className="h-4 w-4" />
            Discuss this expertise
          </a>
        }
      >
        {active && (
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl grad-momentum text-white shadow-orange">
                {(() => {
                  const Icon = ICONS[active.icon] ?? Workflow;
                  return <Icon className="h-6 w-6" />;
                })()}
              </span>
              <p className="text-sm leading-relaxed text-ink-600">
                A structured capability within the operating system — addressing a specific
                operational challenge with a defined solution pattern and connected ecosystem
                project.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ModalField
                label="Challenge"
                accent="orange"
                value={
                  <span className="inline-flex items-start gap-2">
                    <Target className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-600" />
                    {active.challenge}
                  </span>
                }
              />
              <ModalField
                label="Solution pattern"
                accent="blue"
                value={
                  <span className="inline-flex items-start gap-2">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" />
                    {active.solution}
                  </span>
                }
              />
            </div>

            <div>
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                Capability tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {active.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-md border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-700"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <ModalField
              label="Connected ecosystem project"
              accent="blue"
              value={
                <span className="inline-flex items-center gap-2 font-semibold text-blue-700">
                  <FolderKanban className="h-4 w-4" />
                  {active.relatedProject}
                </span>
              }
            />

            <div className="rounded-xl border border-blue-100 dark:border-blue-800/30 bg-blue-50/40 dark:bg-blue-900/20 p-4 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
              <strong className="font-semibold text-ink-800 dark:text-ink-200">How engagement works.</strong> Every
              engagement begins with a discovery conversation, moves through diagnosis, structure,
              build, execution and measurement — and ends with a reviewed, evidence-led outcome.
              No work begins without a signed context brief.
            </div>
          </div>
        )}
      </DetailModal>
    </SectionWrap>
  );
}
