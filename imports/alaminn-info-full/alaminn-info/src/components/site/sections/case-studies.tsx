"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Clock,
  ShieldCheck,
  ArrowUpRight,
  FileText,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { DetailModal, ModalField } from "../detail-modal";

const CATEGORY_COLOR: Record<string, { bg: string; text: string; ring: string }> = {
  "education-operations": { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300", ring: "ring-blue-200 dark:ring-blue-700/40" },
  "ai-crm": { bg: "bg-orange-50 dark:bg-orange-900/30", text: "text-orange-700 dark:text-orange-300", ring: "ring-orange-200 dark:ring-orange-700/40" },
  "sales-growth": { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", ring: "ring-emerald-200 dark:ring-emerald-700/40" },
};

export type CaseStudyItem = {
  id: string;
  slug: string;
  title: string;
  category: string;
  context: string;
  challenge: string;
  role: string;
  intervention: string;
  systemBuilt: string;
  outcome: string;
  evidenceStatus: string;
  confidentiality: string;
  readTime: number;
  featured: boolean;
};

export function CaseStudies({ items }: { items: CaseStudyItem[] }) {
  const [active, setActive] = useState<CaseStudyItem | null>(null);

  return (
    <SectionWrap id="case-studies" className="bg-blue-50/40 dark:bg-blue-950/20">
      <SectionHeading
        eyebrow="Featured Case Studies"
        title={
          <>
            Three verified stories of{" "}
            <span className="text-grad-momentum">structure replacing chaos</span>.
          </>
        }
        description="Three verified engagements where structure replaced chaos — the context, what was done, and the measurable result. Click a card to read the full story."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {items.map((c, i) => {
          const col = CATEGORY_COLOR[c.category] ?? CATEGORY_COLOR["education-operations"];
          return (
            <motion.button
              key={c.id}
              type="button"
              onClick={() => setActive(c)}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 text-left shadow-soft dark:shadow-none transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-orange-500/10 dark:hover:shadow-none hover:border-orange-200 dark:hover:border-orange-700/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 card-hover-sweep hover-glow-blue"
            >
              {/* header with large number + structured diagram */}
              <div className="relative grad-intelligence p-6 text-white overflow-hidden">
                {/* Large watermark number in background */}
                <span
                  className="pointer-events-none absolute -right-3 -bottom-3 font-display text-[7rem] font-extrabold leading-none text-white/10 transition-all duration-500 group-hover:scale-110 group-hover:text-orange-500/20 dark:group-hover:text-orange-400/20 select-none"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex items-center justify-between relative">
                  <span className="font-display text-5xl font-extrabold leading-none text-white/90 transition-transform duration-300 group-hover:scale-105 origin-left">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className={`rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider transition-transform duration-300 group-hover:scale-105 ${col.text}`}>
                    {c.category.replace("-", " & ")}
                  </span>
                </div>
                {/* mini structured diagram with animated progress fill */}
                <div className="mt-4 flex items-center gap-1.5 relative">
                  {[0, 1, 2, 3, 4].map((n) => (
                    <span
                      key={n}
                      className="h-1.5 flex-1 rounded-full overflow-hidden"
                      style={{
                        background:
                          n === 3
                            ? "#FF751F"
                            : "rgba(255,255,255,0.3)",
                      }}
                    >
                      {/* Animated progress bar fill on scroll into view */}
                      {n === 3 && (
                        <motion.span
                          className="block h-full bg-orange-300/60 rounded-full"
                          initial={{ width: "0%" }}
                          whileInView={{ width: "100%" }}
                          viewport={{ once: true }}
                          transition={{ duration: 1.2, delay: 0.3 + i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                        />
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative flex flex-1 flex-col p-6">
                {/* Gradient overlay at bottom fading from transparent to white */}
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-3xl"
                  style={{
                    background: "linear-gradient(to top, rgba(255,255,255,0.8), transparent)",
                  }}
                  aria-hidden="true"
                />
                <h3 className="font-display text-lg font-bold leading-snug text-ink-900">
                  {c.title}
                </h3>

                <div className="mt-3 space-y-2.5 text-sm">
                  <Row label="Context" value={c.context} />
                  <Row label="Challenge" value={c.challenge} />
                  <Row label="Role" value={c.role} />
                  <Row label="Intervention" value={c.intervention} />
                  <Row label="System built" value={c.systemBuilt} />
                </div>

                {/* outcome marker */}
                <div className="mt-4 rounded-xl border border-orange-200 dark:border-orange-800/30 bg-orange-50/60 dark:bg-orange-900/20 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-300">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Verified outcome
                  </div>
                  <div className="mt-1 text-sm font-medium leading-relaxed text-ink-800 dark:text-ink-200">
                    {c.outcome}
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-ink-100 dark:border-blue-800/20 pt-4">
                  <span className="inline-flex items-center gap-1.5 text-xs text-ink-500 dark:text-ink-400">
                    <Clock className="h-3.5 w-3.5" />
                    {c.readTime} min read
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                    <FileText className="h-3.5 w-3.5" />
                    {c.confidentiality.replace("-", " ")}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 transition-all duration-300 group-hover:gap-2 dark:text-orange-400 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100">
                    Read
                    <ArrowUpRight className="h-3.5 w-3.5 arrow-hover-animate" />
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Case study detail modal */}
      <DetailModal
        open={!!active}
        onClose={() => setActive(null)}
        eyebrow="Case Study"
        accent="momentum"
        title={active?.title ?? ""}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
              <Lock className="h-3.5 w-3.5" />
              Confidentiality:{" "}
              <span className="font-semibold text-ink-700">
                {active?.confidentiality.replace("-", " ") ?? "—"}
              </span>
            </span>
            <a
              href="#contact"
              onClick={() => setActive(null)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
            >
              <ArrowUpRight className="h-4 w-4" />
              Discuss a similar engagement
            </a>
          </div>
        }
      >
        {active && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${CATEGORY_COLOR[active.category]?.bg ?? "bg-blue-50"} ${CATEGORY_COLOR[active.category]?.text ?? "text-blue-700"}`}
              >
                {active.category.replace("-", " & ")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" />
                {active.evidenceStatus.replace("-", " ")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 dark:bg-ink-800/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600 dark:text-ink-300">
                <Clock className="h-3 w-3" />
                {active.readTime} min read
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ModalField label="Context" value={active.context} />
              <ModalField label="Challenge" value={active.challenge} accent="orange" />
              <ModalField label="Role" value={active.role} accent="blue" />
              <ModalField label="Intervention" value={active.intervention} />
              <ModalField label="System built" value={active.systemBuilt} accent="blue" />
            </div>

            <div className="rounded-2xl border border-orange-200 dark:border-orange-800/30 bg-orange-50/60 dark:bg-orange-900/20 p-5">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-300">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified outcome
              </div>
              <div className="mt-2 text-base font-medium leading-relaxed text-ink-800 dark:text-ink-200">
                {active.outcome}
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 dark:border-blue-800/30 bg-blue-50/40 dark:bg-blue-900/20 p-4 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
              <strong className="font-semibold text-ink-800 dark:text-ink-200">Evidence governance.</strong> This
              case study reports qualitative outcomes only. No fabricated metrics. Where client
              confidentiality applies, identifiers are redacted and outcomes are summarised.
            </div>
          </div>
        )}
      </DetailModal>
    </SectionWrap>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-24 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-ink-400 pt-0.5">
        {label}
      </div>
      <div className="flex-1 text-ink-700">{value}</div>
    </div>
  );
}
