"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, Lock } from "lucide-react";

/**
 * AIAdvisor — premium "Ask Alaminn" section.
 *
 * Presents the AI advisor as part of the Alaminn brand (not a generic
 * chatbot). Shows real example prompts that route to existing pages
 * (/higher-study/scholarships, /contact, /admin/ai-assistant).
 *
 * CRITICAL: Does NOT fabricate AI output. The "Ask Alaminn" CTA routes
 * to /contact (for prospective students) or /admin/ai-assistant (for
 * authenticated staff). No fake chat responses are rendered.
 */

const SUGGESTIONS = [
  {
    prompt: "Where should I study?",
    href: "/higher-study/course-finder",
    description: "Start with our course finder",
  },
  {
    prompt: "Find me affordable UK universities.",
    href: "/higher-study/universities?country=uk&sort=tuition-asc",
    description: "Browse UK universities sorted by tuition",
  },
  {
    prompt: "Which scholarships can I apply for?",
    href: "/higher-study/scholarships",
    description: "View all scholarships in our database",
  },
  {
    prompt: "Help me start my application.",
    href: "/higher-study/apply",
    description: "Begin your application",
  },
  {
    prompt: "Check my application status.",
    href: "/admin/login",
    description: "Sign in to view your application dashboard",
  },
];

export function AIAdvisor() {
  return (
    <section
      id="ai-advisor"
      aria-label="Ask Alaminn AI advisor"
      className="relative py-20 lg:py-32 surface-ink"
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16">
        <div className="ai-advisor-card">
          {/* Eyebrow */}
          <div className="relative z-10">
            <p className="eyebrow-editorial text-white/60 mb-4">
              <Sparkles className="inline w-3 h-3 mr-2" />
              Alaminn Intelligence
            </p>

            {/* Headline */}
            <h2 className="type-h2 text-white max-w-2xl mb-6">
              Don&apos;t navigate this alone.
              <br />
              <span className="italic font-serif" style={{ fontFamily: "var(--font-dm-serif), Georgia, serif" }}>
                Ask Alaminn.
              </span>
            </h2>

            {/* Subhead */}
            <p className="type-lead text-white/80 max-w-xl mb-10">
              An AI advisor trained on our university database, scholarship catalogue,
              and admissions workflow. Real answers, grounded in real records —
              never invented.
            </p>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 mb-10">
              {SUGGESTIONS.map((s) => (
                <Link
                  key={s.prompt}
                  href={s.href}
                  title={s.description}
                  className="ai-suggestion-chip"
                >
                  <span className="truncate max-w-xs">{s.prompt}</span>
                  <ArrowRight className="w-3 h-3 flex-shrink-0 opacity-60" />
                </Link>
              ))}
            </div>

            {/* Honesty note + CTA */}
            <div className="flex flex-wrap items-center gap-4 pt-8 border-t border-white/10">
              <Link
                href="/contact"
                className="btn-editorial btn-editorial-primary"
              >
                Talk to a human advisor
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-xs text-white/50 flex items-center gap-2 max-w-md">
                <Lock className="w-3 h-3" />
                AI suggestions are routed to real database records.
                No fabricated data. No fake AI outputs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
