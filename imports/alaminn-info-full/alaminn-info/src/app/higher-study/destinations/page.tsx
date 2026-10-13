/**
 * /higher-study/destinations
 * --------------------------------------------------------------------
 * Lists all 30 study destinations from COUNTRIES_LIST + the database
 * (HigherStudyCountry where publicationStatus=published).
 *
 * Each card shows: flag emoji, name, region, popular subjects preview,
 * top universities count, tuition range, "Explore" button → country
 * detail page.
 *
 * Filter by region (Europe / North America / Asia-Pacific / Middle East).
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  Globe2,
  Building2,
  GraduationCap,
  DollarSign,
  ArrowRight,
  MapPin,
  Sparkles,
  BookOpen,
} from "lucide-react";
import { db } from "@/lib/db";
import {
  COUNTRIES_LIST,
  COUNTRIES_MAP,
} from "@/lib/higher-study/constants";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { LoadingSkeleton } from "@/components/higher-study/loading-skeleton";
import { EmptyState } from "@/components/higher-study/empty-state";
import {
  PageHero,
  StatsStrip,
} from "@/components/higher-study/page-hero";
import { ListPageControls } from "@/components/higher-study/list-page-controls";
import {
  getStringParam,
  buildFilterValuesFromParams,
} from "@/app/higher-study/_lib/search-params";
import type {
  FilterDefinition,
  FilterValues,
} from "@/components/higher-study/filter-panel";

export const metadata: Metadata = buildHigherStudyMetadata({
  title: "Study Destinations — Higher Study | Alaminn.info",
  description:
    "Browse 30 verified study destinations across Europe, North America, Asia-Pacific and the Middle East. Compare tuition ranges, popular subjects, top universities and student visa routes — then start an application via ALO Education.",
  path: "/higher-study/destinations",
  keywords: [
    "study destinations",
    "study abroad",
    "study in UK",
    "study in USA",
    "study in Canada",
    "study in Australia",
    "study in Germany",
    "study in Ireland",
    "international universities",
    "student visa",
  ],
});

const REGION_OPTIONS = [
  { value: "Europe", label: "Europe" },
  { value: "North America", label: "North America" },
  { value: "Asia-Pacific", label: "Asia-Pacific" },
  { value: "Middle East", label: "Middle East" },
];

const FILTERS: FilterDefinition[] = [
  {
    name: "region",
    label: "Region",
    type: "select",
    options: REGION_OPTIONS,
    defaultCollapsed: false,
  },
];

// ── Data fetcher (DB) ───────────────────────────────────────────────

interface CountryWithStats {
  slug: string;
  name: string;
  region: string | null;
  flagEmoji: string | null;
  popularSubjects: string | null;
  tuitionFeeRange: string | null;
  majorStudentCities: string | null;
  status: string;
  lastVerifiedAt: Date | null;
  officialSourceUrl: string | null;
  imageUrl: string | null;
  _count?: { universities: number };
}

async function fetchCountries(regionFilter?: string): Promise<{
  countries: CountryWithStats[];
  error: string | null;
}> {
  try {
    const where: Record<string, unknown> = { status: "published" };
    if (regionFilter) where.region = regionFilter;
    const rows = await db.higherStudyCountry.findMany({
      where,
      orderBy: [{ name: "asc" }],
      include: {
        _count: { select: { universities: true } },
      },
    });
    return { countries: rows as unknown as CountryWithStats[], error: null };
  } catch (e) {
    console.error("[destinations] DB error", e);
    return { countries: [], error: "Could not load destinations from the database." };
  }
}

// ── Page ────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DestinationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const regionFilter = getStringParam(params, "region");
  const searchValue = getStringParam(params, "q") ?? "";
  const filterValues: FilterValues = buildFilterValuesFromParams(params, [
    { name: "region", type: "select" },
  ]);

  const { countries: dbCountries, error } = await fetchCountries(regionFilter);

  // Merge DB rows with the COUNTRIES_LIST constant so we always have
  // all 30 countries listed (even if the DB is empty), with DB stats
  // taking precedence when available.
  const dbBySlug = new Map(dbCountries.map((c) => [c.slug, c]));
  const allCountries = COUNTRIES_LIST.map((c) => {
    const fromDb = dbBySlug.get(c.slug);
    if (fromDb) {
      return {
        slug: c.slug,
        name: c.name,
        region: c.region,
        flagEmoji: c.flagEmoji,
        popularSubjects: fromDb.popularSubjects ?? null,
        tuitionFeeRange: fromDb.tuitionFeeRange ?? null,
        majorStudentCities: fromDb.majorStudentCities ?? null,
        status: fromDb.status,
        lastVerifiedAt: fromDb.lastVerifiedAt,
        officialSourceUrl: fromDb.officialSourceUrl,
        imageUrl: fromDb.imageUrl,
        universityCount: fromDb._count?.universities ?? 0,
        inDb: true,
      };
    }
    return {
      slug: c.slug,
      name: c.name,
      region: c.region,
      flagEmoji: c.flagEmoji,
      popularSubjects: null,
      tuitionFeeRange: null,
      majorStudentCities: null,
      status: "pending",
      lastVerifiedAt: null,
      officialSourceUrl: null,
      imageUrl: null,
      universityCount: 0,
      inDb: false,
    };
  })
    .filter((c) => !regionFilter || c.region === regionFilter)
    .filter((c) => {
      if (!searchValue) return true;
      return c.name.toLowerCase().includes(searchValue.toLowerCase());
    });

  // Stats strip counts
  const regionCounts = COUNTRIES_LIST.reduce<Record<string, number>>((acc, c) => {
    acc[c.region] = (acc[c.region] ?? 0) + 1;
    return acc;
  }, {});
  const verifiedCount = dbCountries.length;
  const totalUniversities = dbCountries.reduce(
    (acc, c) => acc + (c._count?.universities ?? 0),
    0,
  );

  // JSON-LD: ItemList of countries + BreadcrumbList
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Higher Study Destinations",
    numberOfItems: allCountries.length,
    itemListElement: allCountries.map((c, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: c.name,
      url: `${HIGHER_STUDY_BASE_URL}/higher-study/destinations/${c.slug}`,
    })),
  };
  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Destinations", url: `${HIGHER_STUDY_BASE_URL}/higher-study/destinations` },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[{ label: "Study Destinations" }]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow="Browse 30 destinations"
        title="Find your study destination"
        description="From the UK and USA to Germany, Australia and the UAE — explore verified country guides covering the education system, tuition ranges, student visa routes, scholarships, post-study work rights and major student cities."
      >
        <StatsStrip
          stats={[
            { label: "Countries", value: COUNTRIES_LIST.length },
            { label: "Regions", value: Object.keys(regionCounts).length },
            { label: "Verified guides", value: verifiedCount },
            { label: "Universities listed", value: totalUniversities },
          ]}
        />
      </PageHero>

      <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 sm:py-12">
        <ListPageControls
          searchPlaceholder="Search countries…"
          searchValue={searchValue}
          filters={FILTERS}
          filterValues={filterValues}
          sortOptions={[]}
          searchAriaLabel="Search study destinations"
        />

        <div className="mt-5">
          {error ? (
            <EmptyState
              title="Could not load destinations"
              description={error}
              icon={MapPin}
              action={{ label: "Retry", href: "/higher-study/destinations" }}
            />
          ) : allCountries.length === 0 ? (
            <EmptyState
              title="No destinations match"
              description="Try removing the region filter or clearing your search to see all 30 destinations."
              icon={Globe2}
              action={{ label: "Browse all destinations", href: "/higher-study/destinations" }}
            />
          ) : (
            <Suspense fallback={<LoadingSkeleton type="university" count={6} />}>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {allCountries.map((country) => (
                  <CountryCard key={country.slug} country={country} />
                ))}
              </div>
            </Suspense>
          )}
        </div>

        {/* Help section */}
        <section className="mt-12 rounded-2xl border border-ink-200 bg-gradient-to-br from-blue-50/60 to-orange-50/60 p-6 sm:p-8">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="eyebrow text-blue-600">Need help choosing?</div>
              <h2 className="mt-1 font-display text-xl font-extrabold text-ink-900">
                Not sure which country is right for you?
              </h2>
              <p className="mt-2 text-sm text-ink-600">
                Our eligibility checker matches your academic background, budget
                and English level against universities and scholarships across
                all 30 destinations — in under 2 minutes.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/higher-study/eligibility-check"
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-bold text-white shadow-orange transition-all hover:bg-orange-700"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Check my eligibility
              </Link>
              <Link
                href="/higher-study/book-consultation"
                className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-bold text-ink-700 transition-all hover:border-blue-200 hover:bg-blue-50"
              >
                Book a free call
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd([itemListLd, breadcrumbLd]) }}
      />
    </>
  );
}

// ── Country card ────────────────────────────────────────────────────

interface CountryCardProps {
  country: {
    slug: string;
    name: string;
    region: string;
    flagEmoji: string;
    popularSubjects: string | null;
    tuitionFeeRange: string | null;
    majorStudentCities: string | null;
    status: string;
    lastVerifiedAt: Date | null;
    officialSourceUrl: string | null;
    imageUrl: string | null;
    universityCount: number;
    inDb: boolean;
  };
}

function CountryCard({ country }: CountryCardProps) {
  const popularSubjects = (country.popularSubjects ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const majorCities = (country.majorStudentCities ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);
  const detailHref = `/higher-study/destinations/${country.slug}`;
  const lastVerified = country.lastVerifiedAt
    ? new Date(country.lastVerifiedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg">
      {/* Top: flag + region */}
      <div className="relative flex items-center justify-between gap-3 bg-gradient-to-br from-blue-50 to-orange-50 p-5">
        <div className="flex items-center gap-3">
          <span
            className="text-4xl leading-none"
            aria-hidden="true"
            role="img"
            aria-label={`${country.name} flag`}
          >
            {country.flagEmoji}
          </span>
          <div>
            <h3 className="font-display text-lg font-extrabold text-ink-900">
              <Link href={detailHref} className="hover-underline">
                {country.name}
              </Link>
            </h3>
            <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
              <MapPin className="h-3 w-3" aria-hidden="true" />
              {country.region}
            </p>
          </div>
        </div>
        {!country.inDb && (
          <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-500">
            Coming soon
          </span>
        )}
        {country.inDb && country.status === "published" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700 ring-1 ring-emerald-200">
            Verified
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        {/* Popular subjects */}
        {popularSubjects.length > 0 && (
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
              <BookOpen className="h-3 w-3" aria-hidden="true" />
              Popular subjects
            </p>
            <div className="flex flex-wrap gap-1.5">
              {popularSubjects.map((s) => (
                <span
                  key={s}
                  className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              <Building2 className="h-3 w-3" aria-hidden="true" />
              Universities
            </p>
            <p className="mt-0.5 font-display text-sm font-bold text-ink-900">
              {country.universityCount > 0
                ? country.universityCount.toLocaleString()
                : "—"}
            </p>
          </div>
          <div className="rounded-xl border border-ink-100 bg-ink-50/40 p-2.5">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              <DollarSign className="h-3 w-3" aria-hidden="true" />
              Tuition / yr
            </p>
            <p className="mt-0.5 font-display text-sm font-bold text-ink-900">
              {country.tuitionFeeRange ?? "—"}
            </p>
          </div>
        </div>

        {/* Major student cities */}
        {majorCities.length > 0 && (
          <div>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
              Top student cities
            </p>
            <p className="text-xs text-ink-700">{majorCities.join(" · ")}</p>
          </div>
        )}

        {/* Footer: explore + last verified */}
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink-100 pt-4">
          {lastVerified ? (
            <p className="text-[10px] text-ink-500">
              Verified {lastVerified}
            </p>
          ) : (
            <p className="text-[10px] text-ink-400">Awaiting verification</p>
          )}
          <Link
            href={detailHref}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-blue transition-all hover:bg-blue-700"
            aria-label={`Explore ${country.name}`}
          >
            Explore
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Decorative bottom corner */}
      <div
        className="pointer-events-none absolute -bottom-12 -right-12 h-24 w-24 rounded-full bg-orange-100/40 blur-2xl"
        aria-hidden="true"
      />
    </article>
  );
}

// Use COUNTRIES_MAP to silence unused-import warning at build time
void COUNTRIES_MAP;
void GraduationCap;
