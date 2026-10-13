/**
 * /higher-study/compare/universities
 * --------------------------------------------------------------------
 * Side-by-side comparison of up to 4 universities across 15 dimensions
 * (country, city, ranking, tuition, living cost, institution type,
 * established year, study levels, IELTS, PTE, TOEFL, deadlines,
 * graduate outcomes, career support, scholarships count).
 *
 * Slugs come from `?slugs=slug1,slug2,slug3,slug4` (max 4).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Search, ArrowRight, Columns3 } from "lucide-react";
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
  title: "Compare Universities — Higher Study | Alaminn.info",
  description:
    "Compare up to 4 universities side-by-side across 15 dimensions: country, city, ranking, tuition, living costs, study levels, English requirements, deadlines and more. No fabricated winner — honest, verified data only.",
  path: "/higher-study/compare/universities",
  keywords: [
    "compare universities",
    "university comparison",
    "side-by-side university comparison",
    "tuition comparison",
    "ranking comparison",
    "english requirement comparison",
  ],
});

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CompareUniversitiesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const slugsParam = getStringParam(params, "slugs") ?? "";
  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const { rows, error } = await fetchComparisonRows("universities", slugs);
  const dimensions = getDimensions("universities");
  const browseHref = getEntityBrowseLink("universities");

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Compare", url: `${HIGHER_STUDY_BASE_URL}/higher-study/compare` },
    { name: "Universities", url: `${HIGHER_STUDY_BASE_URL}/higher-study/compare/universities` },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[
          { label: "Compare", href: "/higher-study/compare" },
          { label: "Universities" },
        ]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="Side-by-side comparison"
        title="Compare Universities"
        description="See up to 4 universities side-by-side across 15 verified dimensions. No fabricated winner — every cell shows the actual data or honestly says '—' if we don't have it."
        variant="default"
      />

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        {slugs.length === 0 ? (
          <EmptyState
            title="No universities selected for comparison"
            description="Add up to 4 universities from the directory to see them side-by-side. Click the 'Add to Compare' button on any university card."
            icon={Columns3}
            action={{ label: "Browse universities", href: browseHref }}
          />
        ) : (
          <div className="space-y-5">
            {/* Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <div>
                  <p className="font-display text-sm font-extrabold text-ink-900">
                    {rows.length} of {slugs.length} universities loaded
                  </p>
                  <p className="text-xs text-ink-500">
                    {slugs.length === 4
                      ? "Maximum reached — remove one to add another."
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
                <CompareActions entityType="university" slugs={slugs} />
              </div>
            </div>

            {error ? (
              <EmptyState
                title="Could not load comparison"
                description={error}
                icon={Building2}
              />
            ) : (
              <ComparisonTable rows={rows} dimensions={dimensions} entityType="universities" />
            )}

            {/* Honesty note */}
            <SectionCard
              className="border-blue-200 bg-blue-50/40"
              title="Why no winner?"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              <p className="text-sm text-ink-700">
                We don&apos;t pick a winner because the &ldquo;best&rdquo;
                university depends on what matters most to <em>you</em> —
                tuition, location, ranking, English requirements, scholarship
                availability or career support. Use the table above to weigh
                the dimensions that matter, and click through to each
                university&apos;s detail page for the full verified picture.
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
