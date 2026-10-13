"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring, useMotionValueEvent } from "framer-motion";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import {
  Clock,
  ArrowUpRight,
  Sparkles,
  Tag,
  CheckCircle2,
  Calendar,
  User,
  FileText,
  ArrowUp,
  Code2,
} from "lucide-react";
import { SectionHeading, SectionWrap } from "./section-primitives";
import { DetailModal, ModalField } from "../detail-modal";

export type ArticleItem = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  category: string;
  tags: string | null;
  author: string;
  readingMinutes: number;
  verificationStatus: string;
  publishedAt: Date | string;
  // Optional — populated by the Prisma row (Article model has updatedAt) and
  // consumed by JSON-LD as schema.org `dateModified`. Omitted from schema when
  // absent (e.g. hand-built test items).
  updatedAt?: Date | string | null;
  featured: boolean;
};

const CATEGORY_COLOR: Record<string, string> = {
  "executive-leadership": "#0B63CE",
  "business-operations": "#1677E8",
  "sales-growth": "#12825C",
  "international-education": "#3B91F5",
  "university-partnerships": "#1769D2",
  "bangladesh-market": "#D98A0A",
  "ai-automation": "#F26113",
  "crm-technology": "#0A4A9E",
  "digital-marketing": "#FF751F",
  "personal-branding": "#A53800",
  "professional-development": "#475467",
};

function fmtDate(d: Date | string) {
  try {
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

/**
 * Markdown renderers tuned to the brand: orange + blue accents, ink neutrals,
 * with full dark-mode parity. Inline `code` uses an orange-tinted pill, lists
 * carry coloured markers, and blockquotes get a left accent border + italic.
 */
const ARTICLE_MD_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h1 className="mt-6 mb-3 font-display text-xl font-bold leading-tight text-ink-900 dark:text-blue-100">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mt-5 mb-2 font-display text-lg font-bold leading-snug text-ink-900 dark:text-blue-100">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mt-4 mb-2 font-display text-base font-bold leading-snug text-ink-900 dark:text-blue-100">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-sm leading-relaxed text-ink-700 dark:text-blue-200/80">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="ml-1 list-none space-y-1.5 py-1 pl-0 text-sm leading-relaxed text-ink-700 dark:text-blue-200/80">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="ml-1 list-decimal space-y-1.5 py-1 pl-5 text-sm leading-relaxed text-ink-700 marker:font-semibold marker:text-blue-600 dark:text-blue-200/80 dark:marker:text-blue-300">
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => {
    const ordered = (props as { ordered?: boolean }).ordered === true;
    if (ordered) {
      return <li className="pl-1">{children}</li>;
    }
    return (
      <li className="relative pl-4">
        <span
          aria-hidden
          className="absolute left-0 top-[0.6em] h-1.5 w-1.5 rounded-full bg-orange-500 dark:bg-orange-400"
        />
        <span className="block">{children}</span>
      </li>
    );
  },
  blockquote: ({ children }) => (
    <blockquote className="my-3 border-l-[3px] border-blue-200 bg-blue-50/40 py-2 pl-4 pr-2 italic text-ink-700 dark:border-orange-300/70 dark:bg-blue-900/20 dark:text-blue-100/80">
      {children}
    </blockquote>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-ink-900 dark:text-blue-100">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-ink-700 dark:text-blue-200/90">{children}</em>,
  code: ({ children }) => (
    <code className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[13px] text-orange-700 dark:bg-blue-900/30 dark:text-orange-300">
      {children}
    </code>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 transition-colors hover:text-blue-800 hover:decoration-blue-600 dark:text-blue-300 dark:decoration-blue-500/50 dark:hover:text-blue-200"
    >
      {children}
    </a>
  ),
};

/** Article body rendered from markdown with brand-aligned components. */
function ArticleMarkdown({ source }: { source: string }) {
  return (
    <article className="prose-article-md prose-article space-y-3">
      <ReactMarkdown components={ARTICLE_MD_COMPONENTS}>{source}</ReactMarkdown>
    </article>
  );
}

/**
 * Sticky reading-progress UI rendered as the first child of the modal body.
 * - 3px gradient bar at the very top of the scrollable body (uses negative
 *   margins to break out of the body padding so it spans full width).
 * - Tracks scroll of the modal body (via `useScroll({ container })`).
 * - `useSpring` smooths the bar motion.
 * - Hides entirely at 0% scroll, animates in once the user scrolls.
 * - A "X% read" pill fades in after 5% scroll.
 * - A "Back to top" button fades in after 30% scroll.
 */
function ArticleReadingProgress({
  scrollRef,
  onBackToTop,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onBackToTop: () => void;
}) {
  const { scrollYProgress } = useScroll({ container: scrollRef });
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 28,
    restDelta: 0.001,
  });

  const [pct, setPct] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setPct(Math.min(100, Math.max(0, Math.round((Number(v) || 0) * 100))));
  });

  const barVisible = pct > 0;
  const pctVisible = pct >= 5;
  const topVisible = pct >= 30;

  return (
    <>
      {/* Top progress bar — sticky to the top of the modal scroll body */}
      <div className="sticky top-0 z-20 -mx-6 -mt-6 sm:-mx-8 sm:-mt-8">
        <AnimatePresence>
          {barVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative h-[3px] w-full origin-left grad-momentum"
              style={{ scaleX }}
              aria-hidden
            />
          )}
        </AnimatePresence>
        {/* "X% read" pill — appears after 5% scroll */}
        <div className="pointer-events-none absolute inset-x-0 top-[3px] flex justify-end px-3">
          <AnimatePresence>
            {pctVisible && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-blue-900/10 bg-white/95 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-ink-700 shadow-sm backdrop-blur-sm dark:border-blue-700/30 dark:bg-ink-900/95 dark:text-blue-100"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                {pct}% read
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Back-to-top — appears after 30% scroll, sits above footer of body */}
      <AnimatePresence>
        {topVisible && (
          <motion.button
            type="button"
            onClick={onBackToTop}
            initial={{ opacity: 0, scale: 0.7, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Back to top of article"
            className="fixed bottom-6 left-1/2 z-30 inline-flex h-10 -translate-x-1/2 items-center gap-1.5 rounded-full border border-blue-900/10 bg-white px-3.5 text-xs font-semibold text-blue-700 shadow-lg transition-colors hover:bg-blue-50 hover:text-blue-800 dark:border-blue-700/40 dark:bg-ink-900 dark:text-blue-200 dark:hover:bg-blue-900/60 sm:left-auto sm:right-6 sm:translate-x-0"
          >
            <ArrowUp className="h-3.5 w-3.5" />
            Back to top
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}

export function Insights({ items }: { items: ArticleItem[] }) {
  const [active, setActive] = useState<ArticleItem | null>(null);
  const featured = items.find((a) => a.featured) ?? items[0];
  const medium = items.filter((a) => a !== featured).slice(0, 2);
  const compact = items.filter((a) => a !== featured && !medium.includes(a)).slice(0, 3);

  // Scroll container ref for the modal body — drives the reading progress bar.
  const bodyRef = useRef<HTMLDivElement>(null);

  const tags = (t: string | null) =>
    t ? t.split(",").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <SectionWrap id="insights" className="bg-blue-50/40 dark:bg-blue-950/20">
      <SectionHeading
        eyebrow="Thought Leadership"
        title={
          <>
            Approved insights on{" "}
            <span className="text-grad-intelligence">operations, growth and AI</span>.
          </>
        }
        description="Approved thinking on operations, growth, education strategy and AI governance. Click any card to read the full insight."
      />

      <div className="mt-8 grid gap-5 lg:grid-cols-12">
        {/* Featured editorial article */}
        {featured && (
          <motion.button
            type="button"
            onClick={() => setActive(featured)}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45 }}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 text-left shadow-soft dark:shadow-none transition-all hover:shadow-card dark:hover:shadow-none hover:-translate-y-1 card-hover-sweep hover-glow-blue lg:col-span-7"
          >
            <div className="relative grad-intelligence p-7 text-white">
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "#FFD2B2" }}
                >
                  {featured.category.replace(/-/g, " ")}
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-100">
                  Featured
                </span>
              </div>
              <h3 className="mt-4 font-display text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                {featured.title}
              </h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-blue-100">
                {featured.summary}
              </p>
              <div className="mt-5 flex items-center gap-4 text-xs text-blue-200">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-orange-300" />
                  {featured.author}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {featured.readingMinutes} min read
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between p-5">
              <span className="text-[11px] font-medium text-ink-500">
                Verification:{" "}
                <span className="font-semibold text-emerald-600">{featured.verificationStatus}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 dark:text-blue-400">
                Read insight
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 arrow-hover-animate" />
              </span>
            </div>
          </motion.button>
        )}

        {/* Medium cards */}
        <div className="grid gap-5 lg:col-span-5">
          {medium.map((a, i) => (
            <motion.button
              key={a.id}
              type="button"
              onClick={() => setActive(a)}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group flex flex-1 flex-col rounded-3xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 p-5 text-left shadow-soft dark:shadow-none transition-all hover:-translate-y-1 hover:shadow-card dark:hover:shadow-none card-hover-sweep hover-glow-blue"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: CATEGORY_COLOR[a.category] ?? "#0B63CE" }}
                />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                  {a.category.replace(/-/g, " ")}
                </span>
              </div>
              <h4 className="mt-2 font-display text-base font-bold leading-snug text-ink-900">
                {a.title}
              </h4>
              <p className="mt-2 text-xs leading-relaxed text-ink-600 line-clamp-2">{a.summary}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-ink-400">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {a.readingMinutes} min
                </span>
                <ArrowUpRight className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 arrow-hover-animate" />
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Compact cards row */}
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {compact.map((a, i) => (
          <motion.button
            key={a.id}
            type="button"
            onClick={() => setActive(a)}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.05 }}
            className="group rounded-2xl border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-900 p-4 text-left shadow-soft dark:shadow-none transition-all hover:border-blue-300 dark:hover:border-blue-600/50 hover:-translate-y-0.5 card-hover-sweep hover-glow-blue"
          >
            <div
              className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: CATEGORY_COLOR[a.category] ?? "#0B63CE" }}
            >
              <Tag className="h-3 w-3" />
              {a.category.replace(/-/g, " ")}
            </div>
            <h5 className="mt-2 font-display text-sm font-bold leading-snug text-ink-900 line-clamp-2">
              {a.title}
            </h5>
            <div className="mt-2 text-[11px] text-ink-400">{a.readingMinutes} min read</div>
          </motion.button>
        ))}
      </div>

      {/* Article detail modal */}
      <DetailModal
        open={!!active}
        onClose={() => setActive(null)}
        eyebrow="Insight Preview"
        accent="intelligence"
        title={active?.title ?? ""}
        bodyRef={bodyRef}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Verification status:{" "}
              <span className="font-semibold text-emerald-600">
                {active?.verificationStatus ?? "—"}
              </span>
            </span>
            <a
              href="#contact"
              onClick={() => setActive(null)}
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-700"
            >
              <FileText className="h-4 w-4" />
              Request full article
            </a>
          </div>
        }
      >
        {active && (
          <div className="space-y-5">
            {/* Sticky reading progress bar — first child of scroll body */}
            <ArticleReadingProgress
              scrollRef={bodyRef}
              onBackToTop={() => {
                const el = bodyRef.current;
                if (el) el.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />

            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{
                  backgroundColor: `${CATEGORY_COLOR[active.category] ?? "#0B63CE"}15`,
                  color: CATEGORY_COLOR[active.category] ?? "#0B63CE",
                }}
              >
                <Tag className="h-3 w-3" />
                {active.category.replace(/-/g, " ")}
              </span>
              {active.featured && (
                <span className="rounded-full bg-orange-50 dark:bg-orange-900/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-orange-700 dark:text-orange-300">
                  Featured
                </span>
              )}
            </div>

            <p className="text-base leading-relaxed text-ink-700">{active.summary}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <ModalField
                label="Author"
                accent="blue"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                    {active.author}
                  </span>
                }
              />
              <ModalField
                label="Reading time"
                accent="blue"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-blue-600" />
                    {active.readingMinutes} minutes
                  </span>
                }
              />
              <ModalField
                label="Published"
                accent="ink"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-ink-400" />
                    {fmtDate(active.publishedAt)}
                  </span>
                }
              />
              <ModalField
                label="Verification"
                accent="emerald"
                value={
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    {active.verificationStatus}
                  </span>
                }
              />
            </div>

            {/* Article body — markdown rendered */}
            {active.body && active.body.trim().length > 0 && (
              <div className="rounded-xl border border-ink-100 dark:border-blue-800/20 bg-ink-50/30 dark:bg-ink-800/30 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
                    Article body
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-300"
                      title="Rendered from markdown with brand-aligned typography"
                    >
                      <Code2 className="h-3 w-3" />
                      Markdown rendered
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                      <CheckCircle2 className="h-3 w-3" />
                      Human-verified
                    </span>
                  </div>
                </div>
                <ArticleMarkdown source={active.body} />
              </div>
            )}

            {tags(active.tags).length > 0 && (
              <div>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                  Related tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tags(active.tags).map((t) => (
                    <span
                      key={t}
                      className="rounded-md border border-ink-200 dark:border-blue-800/30 bg-white dark:bg-ink-800/40 px-2.5 py-1 text-xs font-medium text-ink-600 dark:text-ink-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-blue-100 dark:border-blue-800/30 bg-blue-50/50 dark:bg-blue-900/20 p-4 text-xs leading-relaxed text-ink-600 dark:text-ink-300">
              <strong className="font-semibold text-ink-800 dark:text-ink-200">Editorial note.</strong> AI-assisted
              drafts never publish automatically — every insight passes human verification before
              release. The body shown above is the executive preview; a deeper version is available
              on request.
            </div>
          </div>
        )}
      </DetailModal>
    </SectionWrap>
  );
}
