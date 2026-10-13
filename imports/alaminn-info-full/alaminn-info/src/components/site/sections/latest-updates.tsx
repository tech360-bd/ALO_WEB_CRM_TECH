"use client";

/**
 * LatestUpdates — premium "professional posts" rail.
 *
 * Shows the most recent professional posts/insights. Accepts DB-sourced
 * articles at runtime (from the Article table); falls back to the static
 * LATEST_UPDATES_FALLBACK set when no articles are available.
 *
 * Truth & evidence governance: post excerpts are qualitative. No fabricated
 * metrics, dates of "clients served" or invented achievements.
 */
import { motion } from "framer-motion";
import { ArrowUpRight, Clock, Newspaper } from "lucide-react";
import { LATEST_UPDATES_FALLBACK, type LatestUpdate } from "@/lib/site-data";

interface LatestUpdatesProps {
  /** DB-sourced articles (optional). Falls back to static set. */
  articles?: LatestUpdate[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Operations: "border-blue-200 bg-blue-50 text-blue-700",
  AI: "border-purple-200 bg-purple-50 text-purple-700",
  Education: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Growth: "border-orange-200 bg-orange-50 text-orange-700",
  Partnerships: "border-rose-200 bg-rose-50 text-rose-700",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function LatestUpdates({ articles }: LatestUpdatesProps) {
  const items = (articles && articles.length > 0 ? articles : LATEST_UPDATES_FALLBACK).slice(0, 6);

  return (
    <section
      id="updates"
      aria-labelledby="updates-heading"
      className="relative py-20 sm:py-24 lg:py-28"
    >
      <div className="mx-auto max-w-[1320px] px-4 sm:px-6">
        {/* Heading row */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-orange-700"
            >
              <Newspaper className="h-3.5 w-3.5" />
              Latest Updates
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-4 font-display text-3xl font-extrabold tracking-tight text-ink-950 sm:text-4xl lg:text-5xl text-balance [text-wrap:balance]"
            >
              Professional posts & insights
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className="mt-4 text-base text-ink-500 sm:text-lg"
            >
              Thinking on operations, growth, AI, education and partnerships —
              published as the work evolves.
            </motion.p>
          </div>
          <motion.a
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            href="#insights"
            className="group inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-5 text-sm font-semibold text-ink-800 transition-all hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
          >
            All insights
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </motion.a>
        </div>

        {/* Posts grid */}
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((post, i) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-blue-900/10 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg"
            >
              {/* Top accent bar */}
              <div className="h-1 w-full grad-momentum" aria-hidden="true" />
              <div className="flex flex-1 flex-col p-6">
                {/* Meta row */}
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={
                      "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider " +
                      (CATEGORY_COLORS[post.category] ??
                        "border-ink-200 bg-ink-50 text-ink-700")
                    }
                  >
                    {post.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] text-ink-400">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </span>
                </div>

                {/* Title + excerpt */}
                <h3 className="mt-4 font-display text-lg font-bold leading-snug text-ink-950 transition-colors group-hover:text-orange-700">
                  {post.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-500">
                  {post.excerpt}
                </p>

                {/* Footer */}
                <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4">
                  <time className="text-xs font-medium text-ink-400" dateTime={post.date}>
                    {formatDate(post.date)}
                  </time>
                  <a
                    href="#insights"
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 transition-colors hover:text-orange-700"
                  >
                    Read
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
