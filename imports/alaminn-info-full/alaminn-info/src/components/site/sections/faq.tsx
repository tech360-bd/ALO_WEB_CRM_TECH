"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Minus,
  HelpCircle,
  ArrowRight,
  MessageCircleQuestion,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { cn } from "@/lib/utils";

type Category =
  | "Platform"
  | "Partnerships"
  | "Governance"
  | "Inquiries"
  | "Engagements";

type CategoryFilter = Category | "All";

type Faq = {
  q: string;
  a: string;
  category: Category;
  /** Optional lucide icon to lead the trigger row. */
  icon?: LucideIcon;
};

/**
 * Eight FAQs explaining the platform's positioning, governance model and how
 * an inquiry flows through the system. Mirrors (and expands on) the FAQPage
 * JSON-LD schema exported from `src/components/site/json-ld.tsx` so the
 * visible section and the structured data stay consistent.
 *
 * Each FAQ is tagged with one of five categories so the user can filter the
 * list via the chip row above the accordion.
 */
const FAQS: Faq[] = [
  {
    q: "What exactly does Al Aminn do?",
    a: "Al Aminn operates as an executive authority across three connected domains: executive operations (designing systems, stage gates and accountability), growth (sales pipelines, market development and partnership strategy), and AI systems (controlled, approval-gated automation). The work is structural — turning ambiguous goals and disconnected workflows into measurable, scalable systems rather than ad-hoc effort.",
    category: "Platform",
  },
  {
    q: "How is this different from ALO Education?",
    a: "ALO Education is the student-services platform within the ALO ecosystem — it handles counselling, applications and direct student support. Alaminn.info is the executive authority platform: it governs strategy, partnerships, operations and AI adoption, and routes formal student-service requests securely to ALO Education when appropriate consent is given. They are complementary, not overlapping.",
    category: "Platform",
  },
  {
    q: "Do you work with universities and institutions?",
    a: "Yes. Partnership development is a core capability — university collaboration, market-entry strategy for Bangladesh, recruitment operations and curriculum partnerships (such as the ICLA Global Academy connection) are all in-scope. Engagements typically start with a discovery conversation to align on scope, governance and outcomes before any formal arrangement.",
    category: "Partnerships",
  },
  {
    q: "What is evidence-controlled publishing?",
    a: "Every impact record, case study and article on this platform is governed by a truth-and-evidence model: outcomes are described qualitatively rather than with fabricated metrics, evidence status and confidentiality levels are shown explicitly, and claims are tied to verified work where possible. The goal is signal over noise — content you can actually trust to inform a decision.",
    category: "Governance",
  },
  {
    q: "How does AI governance work?",
    a: "AI adoption runs through ALO Labs with an approval-gated workflow: every task is tagged with sensitivity (public, internal or confidential), routed through human approval gates, and logged in an immutable audit trail. Nothing ships without an explicit approver. The governance model is designed so AI can be deployed confidently without losing control or accountability.",
    category: "Governance",
  },
  {
    q: "Can I refer a student to ALO Education through this platform?",
    a: "Yes. When you select the student-referral inquiry type, the form surfaces a specific student-data transfer consent step. Once that consent is given, the referral is routed securely to ALO Education's pipeline (stage: consent-confirmed) — never shared without it. You'll receive an inquiry reference you can quote in follow-up.",
    category: "Inquiries",
  },
  {
    q: "What happens after I submit an inquiry?",
    a: "Three things, in order: (1) an acknowledgement within one business day, sent via your preferred contact method; (2) a short discovery conversation to align on scope, context and desired outcome; (3) a diagnosis pass where the situation is mapped to the relevant capability modules and a proposed next step is shared — whether that's an engagement, a referral, or a recommendation against proceeding if the fit isn't right.",
    category: "Inquiries",
  },
  {
    q: "Do you offer ongoing advisory or only project-based work?",
    a: "Both, depending on scope. Project-based engagements suit well-defined deliverables (an operating-system design, a CRM rebuild, a partnership pipeline). Ongoing advisory suits situations where you want a senior operator in the loop continuously — strategy reviews, system health checks, and steering on AI adoption. The discovery conversation helps determine which model fits before anything is committed.",
    category: "Engagements",
  },
];

/** Display order for the filter chips. */
const CATEGORY_ORDER: CategoryFilter[] = [
  "All",
  "Platform",
  "Partnerships",
  "Governance",
  "Inquiries",
  "Engagements",
];

/** Tailwind bar class for the active-category indicator above the accordion. */
const CATEGORY_BAR_CLASS: Record<Category, string> = {
  Platform: "bg-orange-500",
  Partnerships: "bg-blue-600",
  Governance: "bg-emerald-500",
  Inquiries: "bg-amber-500",
  Engagements: "bg-teal-500",
};

/** Count of FAQs in each category (used for chip superscript badges). */
const CATEGORY_COUNTS: Record<CategoryFilter, number> = {
  All: FAQS.length,
  Platform: FAQS.filter((f) => f.category === "Platform").length,
  Partnerships: FAQS.filter((f) => f.category === "Partnerships").length,
  Governance: FAQS.filter((f) => f.category === "Governance").length,
  Inquiries: FAQS.filter((f) => f.category === "Inquiries").length,
  Engagements: FAQS.filter((f) => f.category === "Engagements").length,
};

/**
 * Wrap every case-insensitive occurrence of `query` inside `text` with a
 * `<mark>` element so the user can see why each FAQ matched. Returns the
 * original string when the query is empty.
 */
function highlightMatch(text: string, query: string): React.ReactNode {
  const q = query.trim();
  if (!q) return text;

  const lowerText = text.toLowerCase();
  const lowerQ = q.toLowerCase();
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  while (cursor < text.length) {
    const idx = lowerText.indexOf(lowerQ, cursor);
    if (idx === -1) {
      parts.push(text.slice(cursor));
      break;
    }
    if (idx > cursor) {
      parts.push(text.slice(cursor, idx));
    }
    parts.push(
      <mark
        key={`m-${key++}`}
        className="rounded bg-orange-200 px-0.5 text-ink-900 dark:bg-orange-700/40 dark:text-white"
      >
        {text.slice(idx, idx + q.length)}
      </mark>
    );
    cursor = idx + q.length;
  }

  return <>{parts}</>;
}

export function Faq() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<CategoryFilter>("All");
  const [openItems, setOpenItems] = useState<string[]>(["0"]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>(
    Array(FAQS.length).fill(null)
  );
  // Holds the latest filtered indices so the window-level "/" keydown handler
  // can read it without re-subscribing on every keystroke.
  const filteredIndicesRef = useRef<number[]>([]);

  const isSearching = query.trim().length > 0;

  const filteredIndices = useMemo(() => {
    const q = query.trim().toLowerCase();
    const result: number[] = [];
    FAQS.forEach((faq, idx) => {
      const matchesCategory =
        activeCategory === "All" || faq.category === activeCategory;
      const matchesQuery =
        !q ||
        faq.q.toLowerCase().includes(q) ||
        faq.a.toLowerCase().includes(q);
      if (matchesCategory && matchesQuery) result.push(idx);
    });
    return result;
  }, [query, activeCategory]);

  // Keep the ref in sync for the stable window keydown handler.
  useEffect(() => {
    filteredIndicesRef.current = filteredIndices;
  }, [filteredIndices]);

  // Auto-expand all matching items while a search is active. Otherwise fall
  // back to the user's openItems (single-open behavior enforced in handler).
  const accordionValue = isSearching
    ? filteredIndices.map(String)
    : openItems;

  // Global "/" shortcut to focus the search input — standard pattern used by
  // GitHub, Notion, Linear etc. Only fires when the FAQ section is visible
  // and the user isn't already typing in an input/textarea.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      const section =
        typeof document !== "undefined"
          ? document.getElementById("faq")
          : null;
      if (!section) return;
      const rect = section.getBoundingClientRect();
      const viewportH =
        typeof window !== "undefined" ? window.innerHeight : 800;
      const isVisible =
        rect.top < viewportH * 0.85 && rect.bottom > viewportH * 0.15;
      if (!isVisible) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearchKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
      searchInputRef.current?.blur();
    }
  };

  const handleTriggerKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentFaqIdx: number
  ) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const visible = filteredIndicesRef.current;
    if (visible.length === 0) return;
    const position = visible.indexOf(currentFaqIdx);
    if (position === -1) return;
    const delta = e.key === "ArrowDown" ? 1 : -1;
    const nextPosition =
      (position + delta + visible.length) % visible.length;
    const nextIdx = visible[nextPosition];
    triggerRefs.current[nextIdx]?.focus();
  };

  const handleAccordionChange = (val: string[]) => {
    // While searching, the accordion is auto-expanded; ignore user toggles so
    // the displayed value stays locked to the filtered set.
    if (isSearching) return;
    // Enforce single-open behavior (mimics `type="single"` with `collapsible`).
    if (val.length > 1) {
      setOpenItems([val[val.length - 1]]);
    } else {
      setOpenItems(val);
    }
  };

  const handleCategoryClick = (cat: CategoryFilter) => {
    setActiveCategory(cat);
    // Clear the search query so the chip and search don't fight each other.
    setQuery("");
    // Reset open state — the first item of the new view opens by default.
    const firstVisible = FAQS.findIndex(
      (f, _i) => cat === "All" || f.category === cat
    );
    setOpenItems(firstVisible >= 0 ? [String(firstVisible)] : []);
  };

  const clearSearch = () => {
    setQuery("");
    searchInputRef.current?.focus();
  };

  const totalCount = FAQS.length;
  const filteredCount = filteredIndices.length;
  const isFiltered = activeCategory !== "All" || isSearching;

  return (
    <SectionWrap id="faq" className="bg-white dark:bg-ink-900/50">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        {/* Left column: heading + description + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5"
        >
          <SectionHeading
            eyebrow="Frequently Asked"
            title={
              <>
                Answers before you{" "}
                <span className="text-grad-momentum">ask the question</span>.
              </>
            }
            description="The most common questions about how Al Aminn operates, how the ALO ecosystem fits together, and what happens when you reach out. If your situation isn't covered here, start a conversation."
          />

          {/* Primary CTA — left column */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-7"
          >
            <a
              href="#contact"
              className="group btn-sheen inline-flex h-12 items-center gap-2 rounded-xl bg-orange-600 px-6 text-sm font-semibold text-white shadow-orange transition-all hover:bg-orange-700 hover:shadow-lg"
            >
              <MessageCircleQuestion className="h-4 w-4" />
              Ask your own question
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </motion.div>

          {/* Trust strip — filtered count when search/category is active */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-100 dark:border-blue-800/20 pt-5 text-xs text-ink-500 dark:text-blue-200/60"
          >
            <span className="inline-flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              {isFiltered
                ? `${filteredCount} of ${totalCount} answers`
                : `${totalCount} answers`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Evidence-controlled
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              24-hour acknowledgement
            </span>
          </motion.div>
        </motion.div>

        {/* Right column: search + filter chips + accordion */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-7"
        >
          {/* Search row — slides down + fades in when scrolled into view */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mb-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-blue-200/50" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search questions and answers…"
                  aria-label="Search FAQs"
                  className="h-11 rounded-xl border-ink-200 bg-white pl-10 pr-10 text-sm text-ink-900 placeholder:text-ink-400 focus-visible:border-orange-400 focus-visible:ring-orange-400/30 dark:border-blue-800/40 dark:bg-ink-900/60 dark:text-white dark:placeholder:text-blue-200/40 dark:focus-visible:border-orange-500/60"
                />
                {isSearching && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:text-blue-200/60 dark:hover:bg-blue-900/40 dark:hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Result count badge */}
              <span
                className={cn(
                  "inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-semibold tabular-nums transition-colors",
                  isSearching
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                )}
                aria-live="polite"
              >
                {filteredCount} of {totalCount}
              </span>

              {/* Keyboard hint */}
              <span className="hidden items-center gap-1.5 text-xs text-ink-500 dark:text-blue-200/60 sm:inline-flex">
                Press
                <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-ink-200 bg-ink-50 px-1.5 font-sans text-[11px] font-semibold text-ink-700 shadow-[inset_0_-1px_0_rgba(0,0,0,0.08)] dark:border-blue-800/50 dark:bg-blue-900/30 dark:text-blue-100">
                  /
                </kbd>
                to search
              </span>
            </div>

            {/* Category filter chips */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {CATEGORY_ORDER.map((cat) => {
                const isActive = activeCategory === cat;
                const count = CATEGORY_COUNTS[cat];
                const isCategory = cat !== "All";
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    aria-pressed={isActive}
                    className={cn(
                      "group inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
                      isActive
                        ? "bg-orange-600 text-white shadow-orange/30 shadow-sm"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-sm dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                    )}
                  >
                    {cat}
                    <sup
                      className={cn(
                        "ml-0.5 text-[10px] font-bold tabular-nums",
                        isActive
                          ? "text-white/80"
                          : "text-blue-500 dark:text-blue-400/80"
                      )}
                    >
                      {count}
                    </sup>
                    {isCategory && isActive && (
                      <span
                        className={cn(
                          "ml-1 h-1.5 w-1.5 rounded-full",
                          CATEGORY_BAR_CLASS[cat as Category]
                        )}
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Active-category colored bar above the accordion */}
          <div className="mb-3 flex h-1.5 items-center overflow-hidden rounded-full bg-ink-100 dark:bg-blue-900/30">
            {activeCategory !== "All" && (
              <motion.div
                layout
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "100%", opacity: 1 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "h-full rounded-full",
                  CATEGORY_BAR_CLASS[activeCategory]
                )}
              />
            )}
          </div>

          {/* Accordion OR empty state */}
          {filteredCount === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-12 text-center dark:border-blue-800/40 dark:bg-ink-900/40"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-blue-900/30 dark:text-blue-200/60">
                <Search className="h-5 w-5" />
              </span>
              <div>
                <p className="font-display text-sm font-bold text-ink-900 dark:text-white">
                  {isSearching
                    ? `No results for “${query.trim()}”`
                    : `No FAQs in ${activeCategory}`}
                </p>
                <p className="mt-1 text-xs text-ink-500 dark:text-blue-200/60">
                  Try a different search term or clear the filters to see all
                  questions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setActiveCategory("All");
                  setOpenItems(["0"]);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-orange-600 px-4 text-xs font-semibold text-white shadow-orange transition-colors hover:bg-orange-700"
              >
                <X className="h-3.5 w-3.5" />
                Clear search
              </button>
            </motion.div>
          ) : (
            <Accordion
              type="multiple"
              value={accordionValue}
              onValueChange={handleAccordionChange}
              className="flex flex-col gap-3"
            >
              {filteredIndices.map((faqIdx) => {
                const faq = FAQS[faqIdx];
                return (
                  <FaqRow
                    key={faqIdx}
                    index={faqIdx}
                    faq={faq}
                    query={query}
                    triggerRef={(el) => {
                      triggerRefs.current[faqIdx] = el;
                    }}
                    onKeyDown={(e) => handleTriggerKeyDown(e, faqIdx)}
                  />
                );
              })}
            </Accordion>
          )}

          {/* "Still have questions?" CTA — bottom */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card-hover-sweep mt-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-ink-200 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/60 to-orange-50/40 p-6 dark:from-blue-900/20 dark:to-orange-900/10 sm:flex-row sm:items-center"
          >
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
                <MessageCircleQuestion className="h-5 w-5" />
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-ink-900 dark:text-white">
                  Still have questions?
                </h3>
                <p className="mt-0.5 text-sm text-ink-600 dark:text-blue-200/70">
                  Start a strategic conversation — multi-step, validated,
                  consent-controlled.
                </p>
              </div>
            </div>
            <a
              href="#contact"
              className="group btn-sheen inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-ink-950 px-5 text-sm font-semibold text-white transition-all hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-blue-100"
            >
              Contact
              <ArrowRight className="h-4 w-4 arrow-hover-animate" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </SectionWrap>
  );
}

function FaqRow({
  index,
  faq,
  query,
  triggerRef,
  onKeyDown,
}: {
  index: number;
  faq: Faq;
  query: string;
  triggerRef?: (el: HTMLButtonElement | null) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
}) {
  const Icon = faq.icon ?? HelpCircle;
  return (
    <AccordionItem
      value={String(index)}
      className={cn(
        "card-hover-sweep group overflow-hidden rounded-2xl border border-b bg-white px-5 transition-all duration-300 dark:bg-ink-900/60",
        // Override shadcn default `last:border-b-0` — every card keeps its bottom border.
        "last:border-b",
        // Default border
        "border-ink-200 dark:border-blue-800/30",
        // Orange accent on open state
        "data-[state=open]:border-orange-300 data-[state=open]:shadow-card dark:data-[state=open]:border-orange-500/40 dark:data-[state=open]:shadow-orange/20",
        // Hover lift on closed items
        "hover:border-orange-200 dark:hover:border-orange-500/30 hover:shadow-soft dark:hover:shadow-none"
      )}
    >
      <AccordionTrigger
        ref={triggerRef}
        onKeyDown={onKeyDown}
        className={cn(
          "items-center gap-3 rounded-none py-5 text-left font-display hover:no-underline",
          "text-ink-900 dark:text-white",
          // Hide the default trailing chevron — we render our own plus/minus toggle.
          "[&>svg]:hidden"
        )}
      >
        <span
          className={cn(
            "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
            "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
            // Orange tint on open / hover
            "group-data-[state=open]:bg-orange-100 group-data-[state=open]:text-orange-700 dark:group-data-[state=open]:bg-orange-900/30 dark:group-data-[state=open]:text-orange-300"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 text-[15px] font-bold leading-snug">
          {highlightMatch(faq.q, query)}
        </span>
        {/* Plus / minus toggle — swap icon via CSS so rotation feels crisp */}
        <span
          className={cn(
            "relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-all",
            "border-ink-200 bg-white text-ink-500 dark:border-blue-800/40 dark:bg-ink-900 dark:text-blue-200",
            "group-data-[state=open]:border-orange-500 group-data-[state=open]:bg-orange-500 group-data-[state=open]:text-white"
          )}
          aria-hidden
        >
          {/* Plus visible when closed, hidden when open */}
          <Plus className="h-3.5 w-3.5 transition-opacity duration-200 group-data-[state=open]:opacity-0 group-data-[state=open]:scale-50" />
          {/* Minus hidden when closed, visible when open (stacked absolute) */}
          <Minus className="absolute h-3.5 w-3.5 transition-opacity duration-200 opacity-0 scale-50 group-data-[state=open]:opacity-100 group-data-[state=open]:scale-100" />
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-0 text-sm leading-relaxed text-ink-600 dark:text-blue-200/80">
        <div className="pl-12 pr-2 pb-5">
          <p>{highlightMatch(faq.a, query)}</p>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
