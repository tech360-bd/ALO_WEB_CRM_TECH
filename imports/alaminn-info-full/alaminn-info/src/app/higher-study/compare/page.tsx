/**
 * /higher-study/compare
 * --------------------------------------------------------------------
 * Landing page for the comparison engine. Shows 3 tabs:
 *   1. Universities
 *   2. Courses
 *   3. Scholarships
 *
 * Each tab shows currently-compared items (from URL ?slugs=) and a CTA
 * to browse more. If no items, shows empty state.
 */
import type { Metadata } from "next";
import Link from "next/link";
import {
  Columns3,
  Building2,
  GraduationCap,
  Award,
  ArrowRight,
  Search,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import {
  PageHero,
  StatsStrip,
  SectionCard,
} from "@/components/higher-study/page-hero";
import { TabsClient } from "@/components/higher-study/tabs-client";
import { EmptyState } from "@/components/higher-study/empty-state";
import { CompareActions } from "@/components/higher-study/compare-actions";
import { getStringParam } from "@/app/higher-study/_lib/search-params";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Compare — Higher Study | Alaminn.info",
  description:
    "Compare up to 4 universities, courses or scholarships side-by-side. No fabricated winner — we show all data points honestly so you can make an informed choice. Save and share comparisons with one click.",
  path: "/higher-study/compare",
  keywords: [
    "compare universities",
    "compare courses",
    "compare scholarships",
    "university comparison",
    "course comparison",
    "side-by-side comparison",
  ],
});

const TABS = [
  { value: "universities", label: "Universities", icon: Building2 },
  { value: "courses", label: "Courses", icon: GraduationCap },
  { value: "scholarships", label: "Scholarships", icon: Award },
];

const ENTITY_BROWSE_LINKS: Record<string, string> = {
  universities: "/higher-study/global-universities",
  courses: "/higher-study/course-finder",
  scholarships: "/higher-study/scholarships",
};

const ENTITY_LABEL: Record<string, string> = {
  universities: "Universities",
  courses: "Courses",
  scholarships: "Scholarships",
};

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CompareLandingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const tab = getStringParam(params, "tab") ?? "universities";
  const slugsParam = getStringParam(params, "slugs") ?? "";
  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Compare", url: `${HIGHER_STUDY_BASE_URL}/higher-study/compare` },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "Compare" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="Side-by-side comparison"
        title="Compare universities, courses & scholarships"
        description="Add up to 4 items to a comparison and see all data points side-by-side. No fabricated winner — we show what's verified and what's missing, so you can decide what matters most to you."
      >
        <StatsStrip
          stats={[
            { label: "Max items", value: 4 },
            { label: "Categories", value: 3 },
            { label: "Dimensions", value: 15 },
          ]}
        />
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        <TabsClient
          items={TABS.map((t) => ({
            value: t.value,
            label: t.label,
            content: (
              <CompareTabContent
                entityType={t.value}
                slugs={t.value === tab ? slugs : []}
              />
            ),
          }))}
          defaultValue={tab}
          paramName="tab"
          className="mb-5"
        />

        <div className="mt-5">
          {tab === "universities" && (
            <CompareTabContent entityType="universities" slugs={slugs} />
          )}
          {tab === "courses" && (
            <CompareTabContent entityType="courses" slugs={slugs} />
          )}
          {tab === "scholarships" && (
            <CompareTabContent entityType="scholarships" slugs={slugs} />
          )}
          {!["universities", "courses", "scholarships"].includes(tab) && (
            <CompareTabContent entityType="universities" slugs={slugs} />
          )}
        </div>

        {/* Honesty note */}
        <SectionCard
          className="mt-8 border-blue-200 bg-gradient-to-br from-blue-50/60 to-white"
          title="How our comparison works"
          icon={<Sparkles className="h-4 w-4" />}
        >
          <ul className="space-y-2 text-sm text-ink-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span><strong className="font-semibold">No fabricated winner.</strong> We show every data point honestly — you decide what matters most.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span><strong className="font-semibold">Missing data is shown as &ldquo;—&rdquo;.</strong> If we don&apos;t have a verified value, we say so — never invent one.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span><strong className="font-semibold">Verification dates shown.</strong> Each cell shows when the data was last verified, with a link to the official source.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              <span><strong className="font-semibold">Save &amp; share.</strong> Comparison links are URL-based — bookmark, copy or send to a friend.</span>
            </li>
          </ul>
        </SectionCard>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }}
      />
    </>
  );
}

function CompareTabContent({
  entityType,
  slugs,
}: {
  entityType: string;
  slugs: string[];
}) {
  const browseHref = ENTITY_BROWSE_LINKS[entityType] ?? "/higher-study";
  const label = ENTITY_LABEL[entityType] ?? "Items";

  if (slugs.length === 0) {
    return (
      <EmptyState
        title={`No ${label.toLowerCase()} selected for comparison`}
        description={`Add up to 4 ${label.toLowerCase()} from the directory to see them side-by-side. Click the "Add to Compare" button on any card.`}
        icon={Columns3}
        action={{
          label: `Browse ${label.toLowerCase()}`,
          href: browseHref,
        }}
      />
    );
  }

  const compareHref = `/higher-study/compare/${entityType}?slugs=${slugs.join(",")}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <Columns3 className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <div>
            <p className="font-display text-sm font-extrabold text-ink-900">
              {slugs.length} {label.toLowerCase()} selected
            </p>
            <p className="text-xs text-ink-500">Maximum 4 per comparison.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {slugs.map((slug) => (
            <span
              key={slug}
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200"
            >
              {slug}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={browseHref}
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 transition-all hover:border-blue-200 hover:bg-blue-50"
        >
          <Search className="h-3.5 w-3.5" aria-hidden="true" />
          Add more
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <CompareActions
            entityType={entityType === "universities" ? "university" : entityType === "courses" ? "course" : "scholarship"}
            slugs={slugs}
          />
          <Link
            href={compareHref}
            className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-orange hover:bg-orange-700"
          >
            View full comparison
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Preview list */}
      <ul className="space-y-2">
        {slugs.map((slug, idx) => (
          <li
            key={slug}
            className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 bg-ink-50/40 p-3"
          >
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                {idx + 1}
              </span>
              <span className="font-mono text-sm text-ink-700">{slug}</span>
            </div>
            <Link
              href={compareHref}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800"
            >
              View
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// silence unused import
void X;
