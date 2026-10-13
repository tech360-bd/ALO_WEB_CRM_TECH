/**
 * /higher-study/compare/scholarships
 * --------------------------------------------------------------------
 * Side-by-side comparison of up to 4 scholarships across 15 dimensions.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Award, Search, ArrowRight, Columns3 } from "lucide-react";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import {
  PageHero,
  SectionCard,
} from "@/components/higher-study/page-hero";
import { EmptyState } from "@/components/higher-study/empty-state";
import { ComparisonTable } from "@/components/higher-study/comparison-table";
import { CompareActions } from "@/components/higher-study/compare-actions";
import {
  fetchComparisonRows,
  getDimensions,
  getEntityBrowseLink,
} from "@/app/higher-study/compare/_lib/compare-helpers";
import { getStringParam } from "@/app/higher-study/_lib/search-params";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Compare Scholarships — Higher Study | Alaminn.info",
  description:
    "Compare up to 4 scholarships side-by-side: provider, country, funding type, funding amount, tuition/living/travel/health coverage, eligible study levels, eligible subjects, eligible nationalities, deadlines, academic and English requirements.",
  path: "/higher-study/compare/scholarships",
  keywords: [
    "compare scholarships",
    "scholarship comparison",
    "funding amount comparison",
    "deadline comparison",
    "coverage comparison",
  ],
});

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CompareScholarshipsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const slugsParam = getStringParam(params, "slugs") ?? "";
  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const { rows, error } = await fetchComparisonRows("scholarships", slugs);
  const dimensions = getDimensions("scholarships");
  const browseHref = getEntityBrowseLink("scholarships");

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Compare", url: `${HIGHER_STUDY_BASE_URL}/higher-study/compare` },
    { name: "Scholarships", url: `${HIGHER_STUDY_BASE_URL}/higher-study/compare/scholarships` },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[
          { label: "Compare", href: "/higher-study/compare" },
          { label: "Scholarships" },
        ]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="Side-by-side comparison"
        title="Compare Scholarships"
        description="See up to 4 scholarships side-by-side: funding type, funding amount, coverage (tuition, living, travel, health), eligibility, deadlines and requirements."
      />

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        {slugs.length === 0 ? (
          <EmptyState
            title="No scholarships selected for comparison"
            description="Add up to 4 scholarships from the scholarship directory to see them side-by-side. Click the 'Add to Compare' button on any scholarship card."
            icon={Columns3}
            action={{ label: "Browse scholarships", href: browseHref }}
          />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <div>
                  <p className="font-display text-sm font-extrabold text-ink-900">
                    {rows.length} of {slugs.length} scholarships loaded
                  </p>
                  <p className="text-xs text-ink-500">
                    {slugs.length === 4
                      ? "Maximum reached."
                      : `Add ${4 - slugs.length} more for full comparison.`}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {slugs.length < 4 && (
                  <Link
                    href={browseHref}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:border-blue-200 hover:bg-blue-50"
                  >
                    <Search className="h-3.5 w-3.5" aria-hidden="true" />
                    Add more
                  </Link>
                )}
                <CompareActions entityType="scholarship" slugs={slugs} />
              </div>
            </div>

            {error ? (
              <EmptyState
                title="Could not load comparison"
                description={error}
                icon={Award}
              />
            ) : (
              <ComparisonTable rows={rows} dimensions={dimensions} entityType="scholarships" />
            )}

            <SectionCard
              className="border-blue-200 bg-blue-50/40"
              title="Why no winner?"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              <p className="text-sm text-ink-700">
                The &ldquo;best&rdquo; scholarship depends on your nationality,
                study level, subject and the deadline you can meet. Use the
                table above to weigh eligibility, coverage and deadlines, then
                click through to each scholarship&apos;s detail page for full
                application instructions.
              </p>
            </SectionCard>
          </div>
        )}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }}
      />
    </>
  );
}
