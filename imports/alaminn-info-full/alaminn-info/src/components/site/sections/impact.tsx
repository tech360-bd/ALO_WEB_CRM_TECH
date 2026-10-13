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
  Users,
  LayoutTemplate,
  ShieldCheck,
  Lock,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { DetailModal, ModalField } from "../detail-modal";

const CATEGORY_ICON: Record<string, LucideIcon> = {
  "operational-transformation": Workflow,
  "sales-workflow": TrendingUp,
  "student-journey": GraduationCap,
  "partnership-development": Handshake,
  "automation-systems": Sparkles,
  "crm-implementation": Database,
  "team-accountability": Users,
  "platform-development": LayoutTemplate,
};

export type ImpactItem = {
  id: string;
  category: string;
  challenge: string;
  role: string;
  action: string;
  outcome: string;
  evidenceStatus: string;
  confidentiality: string;
};

export function Impact({ items }: { items: ImpactItem[] }) {
  const [active, setActive] = useState<ImpactItem | null>(null);

  return (
    <SectionWrap id="impact" className="bg-ink-50/60 dark:bg-ink-900/50">
      <SectionHeading
        eyebrow="Selected Impact"
        title={
          <>
            Evidence-controlled outcomes —{" "}
            <span className="text-grad-intelligence">no fabricated numbers</span>.
          </>
        }
        description="Selected outcomes from engagements with education institutions, technology teams and partnership programs. Click any card to read the context and result."
      />

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => {
          const Icon = CATEGORY_ICON[item.category] ?? ShieldCheck;
          return (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => setActive(item)}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 p-5 text-left shadow-soft dark:shadow-none transition-all hover:-translate-y-1 hover:shadow-card dark:hover:shadow-none card-hover-sweep hover-glow-blue card-bottom-reveal"
            >
              {/* Hover glow overlay */}
              <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ boxShadow: "inset 0 0 0 1px rgba(11,99,206,0.08), 0 0 20px rgba(11,99,206,0.06)" }}
              />
              <div className="flex items-start justify-between">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 icon-hover-scale">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      item.evidenceStatus === "verified"
                        ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {item.evidenceStatus.replace("-", " ")}
                  </span>
                  <span className="rounded-full bg-ink-100 dark:bg-ink-800/40 px-2 py-0.5 text-[10px] font-medium text-ink-500 dark:text-ink-400">
                    {item.confidentiality.replace("-", " ")}
                  </span>
                </div>
              </div>

              <div className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                {item.category.replace(/-/g, " ")}
              </div>

              <div className="mt-3 space-y-2.5">
                <Field label="Challenge" value={item.challenge} />
                <Field label="Role" value={item.role} />
                <Field label="Action" value={item.action} />
              </div>

              <div className="mt-4 rounded-xl border border-orange-200 dark:border-orange-800/30 bg-orange-50/50 dark:bg-orange-900/20 p-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-300">
                  Outcome
                </div>
                <div className="mt-1 text-sm font-medium leading-relaxed text-ink-800 dark:text-ink-200 line-clamp-3">
                  {item.outcome}
                </div>
              </div>

              {/* orange outcome marker */}
              <span className="absolute bottom-0 right-0 h-1 w-12 bg-gradient-to-r from-transparent to-orange-500" />
            </motion.button>
          );
        })}
      </div>

      {/* Impact detail modal */}
      <DetailModal
        open={!!active}
        onClose={() => setActive(null)}
        eyebrow="Impact Record"
        accent="intelligence"
        title={active ? active.category.replace(/-/g, " ") : ""}
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
              Start a similar engagement
            </a>
          </div>
        }
      >
        {active && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                  active.evidenceStatus === "verified"
                    ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                    : "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                }`}
              >
                <ShieldCheck className="h-3 w-3" />
                Evidence: {active.evidenceStatus.replace("-", " ")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 dark:bg-ink-800/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600 dark:text-ink-300">
                <Lock className="h-3 w-3" />
                {active.confidentiality.replace("-", " ")}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ModalField label="Challenge" value={active.challenge} accent="orange" />
              <ModalField label="Role" value={active.role} accent="blue" />
            </div>

            <ModalField label="Action taken" value={active.action} />

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
              <strong className="font-semibold text-ink-800 dark:text-ink-200">No fabricated metrics.</strong> Where
              verified quantitative data is not available, outcomes are reported as qualitative
              narratives. This is a deliberate truth-and-evidence governance choice.
            </div>
          </div>
        )}
      </DetailModal>
    </SectionWrap>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
        {label}
      </div>
      <div className="mt-0.5 text-sm leading-relaxed text-ink-700">{value}</div>
    </div>
  );
}
