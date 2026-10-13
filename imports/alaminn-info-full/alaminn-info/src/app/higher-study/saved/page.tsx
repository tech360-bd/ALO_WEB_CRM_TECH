/**
 * /higher-study/saved
 * --------------------------------------------------------------------
 * Shows saved items (read from localStorage on client side). Grouped
 * by entity type with remove buttons.
 *
 * SEO: noindex (private page). Title: "Saved Items — Higher Study".
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark, ArrowRight, Info, ShieldCheck } from "lucide-react";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { PageHero, SectionCard } from "@/components/higher-study/page-hero";
import { SavedItemsClient } from "@/components/higher-study/saved-items-client";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Saved Items — Higher Study | Alaminn.info",
  description:
    "Your saved universities, courses, scholarships, research projects, supervisors and study resources. Stored privately on this device.",
  path: "/higher-study/saved",
  noindex: true,
});

export default function SavedItemsPage() {
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Saved Items", url: `${HIGHER_STUDY_BASE_URL}/higher-study/saved` },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "Saved Items" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="Your library"
        title="Saved Items"
        description="Everything you've bookmarked across the Higher Study platform — universities, courses, scholarships, research projects, supervisors and study resources."
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href="/higher-study/global-universities"
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-sm font-bold text-white shadow-orange hover:bg-orange-700"
          >
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            Browse universities
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link
            href="/higher-study/compare"
            className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-bold text-ink-700 hover:border-blue-200 hover:bg-blue-50"
          >
            Open comparison
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <SavedItemsClient />
          </div>

          <aside className="space-y-4 lg:sticky lg:top-[148px] lg:self-start">
            <SectionCard
              title="How saved items work"
              icon={<Info className="h-4 w-4" />}
            >
              <ul className="space-y-2 text-xs text-ink-700">
                <li>
                  <strong className="font-semibold text-ink-900">Private to this device.</strong>{" "}
                  Saved items are stored in your browser&apos;s localStorage —
                  they don&apos;t leave your device unless you sign in.
                </li>
                <li>
                  <strong className="font-semibold text-ink-900">No account required.</strong>{" "}
                  Bookmark freely — no email or sign-up needed.
                </li>
                <li>
                  <strong className="font-semibold text-ink-900">Clearing browser data will remove them.</strong>{" "}
                  Consider signing in for cross-device sync (coming soon).
                </li>
              </ul>
            </SectionCard>

            <SectionCard
              title="Privacy"
              icon={<ShieldCheck className="h-4 w-4" />}
            >
              <p className="text-xs text-ink-700">
                This page is set to <code className="rounded bg-ink-100 px-1 py-0.5 text-[10px] font-mono">noindex</code>{" "}
                — search engines are instructed not to crawl it. Your saved
                items never appear in search results.
              </p>
            </SectionCard>
          </aside>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }}
      />
    </>
  );
}
