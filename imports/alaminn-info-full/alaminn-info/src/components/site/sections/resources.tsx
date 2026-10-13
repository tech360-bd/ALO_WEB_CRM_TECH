"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  ClipboardCheck,
  LayoutTemplate,
  BarChart3,
  Video,
  Download,
  ArrowUpRight,
  Clock,
  Tag,
  Mail,
  ExternalLink,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { DetailModal, ModalField } from "../detail-modal";

export type ResourceItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  type: string;
  readTime: number;
};

const TYPE_ICON: Record<string, LucideIcon> = {
  guide: FileText,
  template: LayoutTemplate,
  checklist: ClipboardCheck,
  report: BarChart3,
  video: Video,
  download: Download,
  worksheet: LayoutTemplate,
};

const CAT_COLOR: Record<string, string> = {
  operations: "#0B63CE",
  sales: "#12825C",
  "education-business": "#1677E8",
  "university-partnerships": "#1769D2",
  "ai-readiness": "#F26113",
  "crm-planning": "#0A4A9E",
  "digital-transformation": "#3B91F5",
  "bangladesh-market": "#D98A0A",
  "personal-branding": "#A53800",
  "professional-growth": "#475467",
  "study-abroad": "#FF751F",
};

/**
 * Access model per resource `type` (mirrors the Prisma `Resource.type` enum).
 *
 * IMPORTANT — TRUTH GOVERNANCE: no real downloadable files exist for any
 * resource yet (the `Resource.fileUrl` column is nullable and currently
 * unpopulated for every row). Every access model therefore routes to a
 * "Request access" path that opens the contact form. We never label a
 * button "Download now" when no download exists. When fileUrl support is
 * later added to ResourceItem + the schema, the `download`/`template`
 * branches below can be upgraded to a real download link.
 */
type AccessModel = {
  /** Short label shown as the access-model badge. */
  model: string;
  /** The CTA verb used in the body button + footer link. */
  cta: string;
  /** Lucide icon for the body CTA. */
  icon: LucideIcon;
  /** One-line explanation of how the access actually works. */
  hint: string;
  /** Tailwind text colour class for the model badge. */
  tone: "blue" | "orange" | "ink";
};

function getAccessModel(type: string): AccessModel {
  switch (type) {
    case "guide":
      return {
        model: "Read on-site",
        cta: "Read the guide",
        icon: BookOpen,
        hint: "Guides are read directly on Alaminn.info. The full version opens after a short request — no file download required.",
        tone: "blue",
      };
    case "template":
    case "worksheet":
      return {
        model: "Gated — request the file",
        cta: "Request the template",
        icon: Mail,
        hint: "Templates are shared as editable files with engaged contacts. No public download — request access to receive your copy by email.",
        tone: "orange",
      };
    case "checklist":
      return {
        model: "Gated — request the checklist",
        cta: "Request the checklist",
        icon: Mail,
        hint: "Checklists are shared as PDFs with engaged contacts. No public download — request access to receive your copy by email.",
        tone: "orange",
      };
    case "report":
      return {
        model: "Gated — request the full report",
        cta: "Request the report",
        icon: Mail,
        hint: "Full reports are shared with qualified contacts. The summary shown above is the public preview; the full report is sent after a short request.",
        tone: "ink",
      };
    case "video":
      return {
        model: "External resource — link shared on request",
        cta: "Request the video link",
        icon: ExternalLink,
        hint: "Videos are hosted externally. The access link is shared after a short request to confirm context fit.",
        tone: "blue",
      };
    case "download":
    default:
      return {
        model: "Gated — request access",
        cta: "Request access",
        icon: Mail,
        hint: "Resources are shared with engaged contacts and newsletter subscribers. No public download — request access to receive your copy.",
        tone: "orange",
      };
  }
}

const TONE_TEXT: Record<AccessModel["tone"], string> = {
  blue: "text-blue-700 dark:text-blue-300",
  orange: "text-orange-700 dark:text-orange-300",
  ink: "text-ink-700 dark:text-ink-300",
};

const TONE_BG: Record<AccessModel["tone"], string> = {
  blue: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800/40",
  orange: "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800/40",
  ink: "bg-ink-100 dark:bg-ink-800/40 border-ink-200 dark:border-blue-800/40",
};

export function Resources({ items }: { items: ResourceItem[] }) {
  const [active, setActive] = useState<ResourceItem | null>(null);
  const access = active ? getAccessModel(active.type) : null;

  return (
    <SectionWrap id="resources" className="bg-white dark:bg-ink-900/50">
      <SectionHeading
        eyebrow="Resource Center"
        title={
          <>
            Practical resources —{" "}
            <span className="text-grad-momentum">checklists, templates and briefs</span>.
          </>
        }
        description="Operations, sales, education business, university partnerships, AI readiness, CRM planning and more. Student-focused resources clearly state that formal services are provided through ALO Education. Click any card to preview and request access."
      />

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((r, i) => {
          const Icon = TYPE_ICON[r.type] ?? FileText;
          const color = CAT_COLOR[r.category] ?? "#0B63CE";
          return (
            <motion.button
              key={r.id}
              type="button"
              onClick={() => setActive(r)}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.35, delay: i * 0.04 }}
              className="group relative flex flex-col rounded-2xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 p-5 text-left shadow-soft dark:shadow-none transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-orange-500/5 hover:border-orange-300 dark:hover:border-orange-700/40 dark:hover:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 card-hover-sweep hover-glow-blue card-bottom-reveal"
            >
              <div className="flex items-start justify-between">
                <span
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 group-focus-visible:scale-110"
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="rounded-full bg-ink-100 dark:bg-ink-800/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-400">
                  {r.type}
                </span>
              </div>
              <div className="mt-3 text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
                {r.category.replace(/-/g, " ")}
              </div>
              <h3 className="mt-1 font-display text-sm font-bold leading-snug text-ink-900 transition-colors group-hover:text-orange-700">
                {r.title}
              </h3>
              <p className="mt-2 flex-1 text-xs leading-relaxed text-ink-600 line-clamp-3">{r.description}</p>
              <div className="mt-4 flex items-center justify-between border-t border-ink-100 dark:border-blue-800/20 pt-3">
                <span className="inline-flex items-center gap-1 text-[11px] text-ink-400 dark:text-ink-400">
                  <Clock className="h-3 w-3" />
                  {r.readTime} min
                </span>
                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-blue-700 transition-all duration-300 group-hover:bg-orange-50 group-hover:text-orange-700 group-hover:gap-1.5 dark:text-blue-400 dark:group-hover:bg-orange-900/30 dark:group-hover:text-orange-300">
                  Access
                  <ArrowUpRight className="h-3.5 w-3.5 arrow-hover-animate" />
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Resource detail modal */}
      <DetailModal
        open={!!active}
        onClose={() => setActive(null)}
        eyebrow="Resource Preview"
        accent="intelligence"
        title={active?.title ?? ""}
        footer={
          <a
            href="#contact"
            onClick={() => setActive(null)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
          >
            {access && <access.icon className="h-4 w-4" />}
            {access?.cta ?? "Request access"}
          </a>
        }
      >
        {active && access && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: `${CAT_COLOR[active.category] ?? "#0B63CE"}15`,
                  color: CAT_COLOR[active.category] ?? "#0B63CE",
                }}
              >
                <Tag className="h-3 w-3" />
                {active.category.replace(/-/g, " ")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-100 dark:bg-ink-800/40 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink-600 dark:text-ink-300">
                {(() => {
                  const Icon = TYPE_ICON[active.type] ?? FileText;
                  return <Icon className="h-3 w-3" />;
                })()}
                {active.type}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">
                <Clock className="h-3 w-3" />
                {active.readTime} min
              </span>
            </div>

            <p className="text-base leading-relaxed text-ink-700">{active.description}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <ModalField label="Category" accent="blue" value={active.category.replace(/-/g, " ")} />
              <ModalField label="Resource type" accent="blue" value={active.type} />
              <ModalField label="Estimated read" accent="ink" value={`${active.readTime} minutes`} />
              <ModalField label="Slug" accent="ink" value={<code className="text-xs text-ink-600">{active.slug}</code>} />
            </div>

            <div className="rounded-xl border border-blue-100 dark:border-blue-800/30 bg-blue-50/40 dark:bg-blue-900/20 p-4 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
              <strong className="font-semibold text-ink-800 dark:text-ink-200">Access model.</strong> Resources are
              shared with engaged contacts and newsletter subscribers. Some resources are gated to
              ensure context fit and to maintain quality of follow-up. Student-focused resources
              clearly state that formal services are provided through{" "}
              <strong className="text-ink-800">ALO Education</strong>.
            </div>

            {/* Clear, type-driven access CTA — replaces any ambiguity about
                whether the resource is downloadable, external, or read on-site.
                Truth governance: no fake "Download now" buttons. */}
            <div className={`rounded-2xl border p-5 ${TONE_BG[access.tone]}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                    Access model
                  </div>
                  <div className={`mt-1 font-display text-sm font-bold ${TONE_TEXT[access.tone]}`}>
                    {access.model}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
                    {access.hint}
                  </p>
                </div>
                <span
                  className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white dark:bg-ink-900 ${TONE_TEXT[access.tone]}`}
                  aria-hidden="true"
                >
                  <access.icon className="h-5 w-5" />
                </span>
              </div>
              <a
                href="#contact"
                onClick={() => setActive(null)}
                className={`mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-700 sm:w-auto`}
              >
                <access.icon className="h-4 w-4" />
                {access.cta}
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <p className="mt-3 text-[11px] leading-relaxed text-ink-500 dark:text-ink-400">
                You will be taken to the contact form. Select the matching inquiry type and a copy
                of this resource will be shared after a short review of your context. No file is
                downloaded directly from this page.
              </p>
            </div>
          </div>
        )}
      </DetailModal>
    </SectionWrap>
  );
}
