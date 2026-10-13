"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  X,
  ShieldCheck,
  BadgeCheck,
  Clock,
  AlertCircle,
  Sparkles,
  FileCheck2,
  ArrowRight,
  ScrollText,
  Link2,
  Calendar,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { cn } from "@/lib/utils";
import { CLAIM_REGISTRY, type ClaimStatus } from "@/lib/site-data";

// ────────────────────────────────────────────────────────────────────────────
// Status metadata — colour + icon + label per verification status.
// The colour palette intentionally reuses the site's orange/blue system plus
// emerald for hard-verified claims and amber for in-flight reviews so the
// status is legible at a glance without breaking the design language.
// ────────────────────────────────────────────────────────────────────────────
type StatusMeta = {
  label: string;
  icon: LucideIcon;
  /** dot / accent colour */
  dot: string;
  /** chip background + text */
  chip: string;
  /** card left-border accent */
  border: string;
  /** summary card tint */
  tint: string;
};

const STATUS_META: Record<ClaimStatus, StatusMeta> = {
  verified: {
    label: "Verified",
    icon: BadgeCheck,
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:ring-emerald-800/40",
    border: "before:bg-emerald-500",
    tint: "from-emerald-50/60 to-white dark:from-emerald-900/10 dark:to-ink-900/30",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-800/40",
    border: "before:bg-amber-500",
    tint: "from-amber-50/60 to-white dark:from-amber-900/10 dark:to-ink-900/30",
  },
  contextual: {
    label: "Contextual",
    icon: AlertCircle,
    dot: "bg-blue-500",
    chip: "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-800/40",
    border: "before:bg-blue-500",
    tint: "from-blue-50/60 to-white dark:from-blue-900/10 dark:to-ink-900/30",
  },
  anecdotal: {
    label: "Anecdotal",
    icon: Sparkles,
    dot: "bg-orange-500",
    chip: "bg-orange-50 text-orange-700 ring-1 ring-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:ring-orange-800/40",
    border: "before:bg-orange-500",
    tint: "from-orange-50/60 to-white dark:from-orange-900/10 dark:to-ink-900/30",
  },
};

type FilterKey = "all" | ClaimStatus;

const FILTER_ORDER: FilterKey[] = [
  "all",
  "verified",
  "contextual",
  "pending",
  "anecdotal",
];

// ────────────────────────────────────────────────────────────────────────────
// JSON-LD ItemList — emitted as a script tag so search engines can index the
// registry. Each claim becomes a ListItem with a stable URL fragment
// (`#verification-<id>`) that matches the card anchor rendered below.
// ────────────────────────────────────────────────────────────────────────────
function buildItemListSchema() {
  const BASE_URL = "https://alaminn.info";
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Al Aminn — Claim Verification Registry",
    description:
      "Public registry of every statistical or factual claim published on Alaminn.info, with the section it appears in, the evidence backing it, the reviewer and the verification status. The registry exists to ensure no fabricated metrics are published.",
    url: `${BASE_URL}#verification`,
    numberOfItems: CLAIM_REGISTRY.length,
    itemListElement: CLAIM_REGISTRY.map((claim, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: claim.claim,
      url: `${BASE_URL}#verification-${claim.id}`,
      description: claim.evidence,
      item: {
        "@type": "Thing",
        name: claim.claim,
        description: claim.evidence,
        url: `${BASE_URL}#verification-${claim.id}`,
        identifier: claim.id,
      },
    })),
  };
}

// ────────────────────────────────────────────────────────────────────────────
// Small presentational helpers
// ────────────────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ClaimStatus }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider",
        meta.chip
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {meta.label}
    </span>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink-100 text-ink-500 dark:bg-blue-900/30 dark:text-blue-200/70">
        <Icon className="h-3.5 w-3.5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 dark:text-blue-200/60">
          {label}
        </div>
        <div className="mt-0.5 text-sm leading-relaxed text-ink-700 dark:text-blue-100/90">
          {children}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string) {
  // Render the ISO date (YYYY-MM-DD) as e.g. "12 Jul 2026" — locale-independent.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────
export function Verification() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: CLAIM_REGISTRY.length,
      verified: 0,
      pending: 0,
      contextual: 0,
      anecdotal: 0,
    };
    for (const item of CLAIM_REGISTRY) c[item.status] += 1;
    return c;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CLAIM_REGISTRY.filter((item) => {
      if (filter !== "all" && item.status !== filter) return false;
      if (!q) return true;
      const haystack = [
        item.claim,
        item.source.label,
        item.evidence,
        item.reviewer,
        item.status,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [filter, query]);

  const isFiltered = filter !== "all" || query.trim().length > 0;
  const lastReviewed = useMemo(() => {
    return CLAIM_REGISTRY
      .map((c) => c.dateVerified)
      .sort()
      .reverse()[0];
  }, []);

  const itemListSchema = useMemo(() => buildItemListSchema(), []);

  return (
    <SectionWrap id="verification" className="bg-ink-50/60 dark:bg-ink-900/50">
      {/* JSON-LD ItemList — emitted inside the section so the structured data
          stays co-located with the rendered registry it describes. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <SectionHeading
        eyebrow="Verification & Evidence"
        title={
          <>
            Every claim on this site is{" "}
            <span className="text-grad-momentum">verifiable</span>.
          </>
        }
        description="This registry tracks every public statistic, count and statement published across Alaminn.info. Each row records what was claimed, where it appears, what evidence backs it, who reviewed it and the verification status. The registry exists so no fabricated metric ever ships to the public site."
      />

      {/* Governance note */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="card-hover-sweep mt-8 overflow-hidden rounded-2xl border border-ink-200 bg-gradient-to-br from-blue-50/70 via-white to-orange-50/60 p-5 dark:border-blue-800/30 dark:from-blue-900/20 dark:via-ink-900/40 dark:to-orange-900/10 sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h3 className="font-display text-base font-bold text-ink-900 dark:text-white sm:text-lg">
              Why this registry exists
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-600 dark:text-blue-200/80">
              Alaminn.info operates under a strict{" "}
              <span className="font-semibold text-ink-800 dark:text-blue-100">
                truth &amp; evidence governance
              </span>{" "}
              policy. No metric, count or claim is published without an entry
              here. Counts are verified against the live codebase and database;
              targets (such as response-time SLAs) are marked{" "}
              <span className="font-semibold text-blue-700 dark:text-blue-300">
                contextual
              </span>{" "}
              so readers know they are goals, not guarantees; observations
              without formal measurement are marked{" "}
              <span className="font-semibold text-orange-700 dark:text-orange-300">
                anecdotal
              </span>
              . If a claim ever becomes inaccurate, the registry is updated
              before the public copy is changed.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-ink-500 dark:text-blue-200/60">
              <span className="inline-flex items-center gap-1.5">
                <FileCheck2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                {CLAIM_REGISTRY.length} claims tracked
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                {counts.verified} verified
              </span>
              <span className="inline-flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                {counts.contextual} contextual
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                {counts.pending} pending
              </span>
              {lastReviewed && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
                  Last reviewed {formatDate(lastReviewed)}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Status summary tiles — quick at-a-glance breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        {(["verified", "contextual", "pending", "anecdotal"] as ClaimStatus[]).map(
          (status) => {
            const meta = STATUS_META[status];
            const Icon = meta.icon;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(filter === status ? "all" : status)}
                aria-pressed={filter === status}
                className={cn(
                  "group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-soft dark:hover:shadow-none",
                  meta.tint,
                  filter === status
                    ? "border-orange-400 shadow-orange/20 dark:border-orange-500/50"
                    : "border-ink-200 dark:border-blue-800/30"
                )}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-ink-600 shadow-sm dark:bg-ink-900/60 dark:text-blue-100"
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </span>
                  <span className="font-display text-2xl font-extrabold tabular-nums text-ink-900 dark:text-white">
                    {counts[status]}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-600 dark:text-blue-200/70">
                  <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                  {meta.label}
                </div>
              </button>
            );
          }
        )}
      </motion.div>

      {/* Search + filter chip row */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="mt-8 flex flex-col gap-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-blue-200/50" />
            <Input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setQuery("");
                  (e.currentTarget as HTMLInputElement).blur();
                }
              }}
              placeholder="Search claims, sources, evidence…"
              aria-label="Search the claim registry"
              className="h-11 rounded-xl border-ink-200 bg-white pl-10 pr-10 text-sm text-ink-900 placeholder:text-ink-400 focus-visible:border-orange-400 focus-visible:ring-orange-400/30 dark:border-blue-800/40 dark:bg-ink-900/60 dark:text-white dark:placeholder:text-blue-200/40 dark:focus-visible:border-orange-500/60"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:text-blue-200/60 dark:hover:bg-blue-900/40 dark:hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <span
            className="inline-flex h-7 items-center gap-1 rounded-full bg-blue-50 px-2.5 text-xs font-semibold tabular-nums text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            aria-live="polite"
          >
            {filtered.length} of {CLAIM_REGISTRY.length}
          </span>
        </div>

        {/* Status filter chips */}
        <div className="flex flex-wrap items-center gap-2">
          {FILTER_ORDER.map((key) => {
            const isActive = filter === key;
            const label =
              key === "all"
                ? "All claims"
                : STATUS_META[key as ClaimStatus].label;
            const dotClass =
              key === "all"
                ? "bg-orange-500"
                : STATUS_META[key as ClaimStatus].dot;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                aria-pressed={isActive}
                className={cn(
                  "group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                  isActive
                    ? "bg-orange-600 text-white shadow-sm shadow-orange/30"
                    : "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-sm dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    isActive ? "bg-white/90" : dotClass
                  )}
                  aria-hidden
                />
                {label}
                <sup
                  className={cn(
                    "ml-0.5 text-[10px] font-bold tabular-nums",
                    isActive ? "text-white/80" : "text-blue-500 dark:text-blue-400/80"
                  )}
                >
                  {counts[key]}
                </sup>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Claims registry grid */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-12 text-center dark:border-blue-800/40 dark:bg-ink-900/40"
        >
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-blue-900/30 dark:text-blue-200/60">
            <Search className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-sm font-bold text-ink-900 dark:text-white">
              No claims match your search
            </p>
            <p className="mt-1 text-xs text-ink-500 dark:text-blue-200/60">
              Try a different search term or clear the filters to see the full
              registry.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-600 px-4 text-xs font-semibold text-white shadow-orange transition-colors hover:bg-orange-700"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        </motion.div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((item, i) => {
            const meta = STATUS_META[item.status];
            return (
              <motion.article
                key={item.id}
                id={`verification-${item.id}`}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                className={cn(
                  "card-hover-sweep group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white p-5 shadow-soft transition-all hover:-translate-y-1 hover:shadow-card dark:border-blue-800/30 dark:bg-ink-900/60 dark:shadow-none dark:hover:shadow-none",
                  // Left accent bar — colour-coded by status
                  "before:absolute before:inset-y-0 before:left-0 before:w-1",
                  meta.border
                )}
              >
                {/* Header row: status badge + dot */}
                <div className="flex items-center justify-between gap-2">
                  <StatusBadge status={item.status} />
                  <span
                    className={cn("h-2 w-2 rounded-full", meta.dot)}
                    aria-hidden
                  />
                </div>

                {/* Claim statement */}
                <h3 className="mt-3 font-display text-lg font-bold leading-snug text-ink-900 dark:text-white">
                  <span className="bg-gradient-to-r from-orange-600 to-blue-700 bg-clip-text text-transparent dark:from-orange-400 dark:to-blue-300">
                    “{item.claim}”
                  </span>
                </h3>

                {/* Source row */}
                <a
                  href={item.source.anchor}
                  className="mt-3 inline-flex items-center gap-1.5 self-start rounded-lg bg-ink-50 px-2.5 py-1 text-[11px] font-semibold text-ink-600 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:bg-blue-900/30 dark:text-blue-200/80 dark:hover:bg-blue-900/50 dark:hover:text-blue-200"
                >
                  <Link2 className="h-3 w-3" aria-hidden />
                  Source: {item.source.label}
                  <ArrowRight className="h-3 w-3 arrow-hover-animate" aria-hidden />
                </a>

                {/* Evidence */}
                <div className="mt-4 flex-1">
                  <Field icon={ScrollText} label="Evidence">
                    {item.evidence}
                  </Field>
                </div>

                {/* Footer: reviewer + date */}
                <div className="mt-4 grid grid-cols-2 gap-2 border-t border-ink-100 pt-3 dark:border-blue-800/20">
                  <Field icon={UserCheck} label="Reviewer">
                    {item.reviewer}
                  </Field>
                  <Field icon={Calendar} label="Verified">
                    {formatDate(item.dateVerified)}
                  </Field>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Footer governance strip */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-ink-200 bg-gradient-to-br from-orange-50/50 to-blue-50/40 p-5 dark:border-blue-800/30 dark:from-orange-900/10 dark:to-blue-900/20 sm:flex-row sm:items-center"
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-sm font-bold text-ink-900 dark:text-white">
              Spotted something inaccurate?
            </h3>
            <p className="mt-0.5 text-sm text-ink-600 dark:text-blue-200/70">
              Every claim here is reviewed against the live codebase. If a
              number doesn&apos;t match, the registry is corrected before the
              public copy changes.
            </p>
          </div>
        </div>
        <a
          href="#contact"
          className="group btn-sheen inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-ink-950 px-5 text-sm font-semibold text-white transition-all hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-blue-100"
        >
          Report a discrepancy
          <ArrowRight className="h-4 w-4 arrow-hover-animate" />
        </a>
      </motion.div>

      {/* Live region announcing the active filter for screen readers */}
      <span className="sr-only" aria-live="polite">
        {isFiltered
          ? `Showing ${filtered.length} of ${CLAIM_REGISTRY.length} claims. Filter: ${filter}. ${query ? `Search: ${query}.` : ""}`
          : `Showing all ${CLAIM_REGISTRY.length} claims.`}
      </span>
    </SectionWrap>
  );
}
