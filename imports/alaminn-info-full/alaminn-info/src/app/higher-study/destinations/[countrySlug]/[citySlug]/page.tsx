/**
 * /higher-study/destinations/[countrySlug]/[citySlug]
 * --------------------------------------------------------------------
 * Shows city detail (HigherStudyCity) + list of universities in that
 * city.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  MapPin,
  Building2,
  Home,
  Bus,
  Sparkles,
  ArrowRight,
  Landmark,
} from "lucide-react";
import { db } from "@/lib/db";
import { COUNTRIES_MAP } from "@/lib/higher-study/constants";
import {
  buildHigherStudyMetadata,
  buildBreadcrumbJsonLd,
  serializeJsonLd,
  HIGHER_STUDY_BASE_URL,
} from "@/lib/higher-study/seo";
import { HigherStudyBreadcrumb } from "@/components/higher-study/breadcrumb";
import { UniversityCard } from "@/components/higher-study/university-card";
import { LoadingSkeleton } from "@/components/higher-study/loading-skeleton";
import { EmptyState } from "@/components/higher-study/empty-state";
import {
  PageHero,
  SectionCard,
  ProseSection,
} from "@/components/higher-study/page-hero";

// ── staticParams (SSG) ──────────────────────────────────────────────

export async function generateStaticParams() {
  try {
    const cities = await db.higherStudyCity.findMany({
      where: { status: "published" },
      select: { slug: true, country: { select: { slug: true } } },
      take: 100,
    });
    return cities.map((c) => ({
      countrySlug: c.country.slug,
      citySlug: c.slug,
    }));
  } catch {
    return [];
  }
}

// ── Metadata ────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ countrySlug: string; citySlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { countrySlug, citySlug } = await params;
  const country = COUNTRIES_MAP[countrySlug];
  let cityName = citySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  // Try DB
  try {
    const city = await db.higherStudyCity.findUnique({
      where: { slug: citySlug },
      select: { name: true },
    });
    if (city?.name) cityName = city.name;
  } catch {
    /* ignore */
  }
  const title = country
    ? `${cityName}, ${country.name} — Student Guide | Higher Study`
    : `${cityName} — Student Guide | Higher Study`;
  const description = `Student guide for ${cityName}, ${country?.name ?? "abroad"}: living costs, transport, accommodation, student life and the universities based in the city.`;
  return buildHigherStudyMetadata({
    title,
    description,
    path: `/higher-study/destinations/${countrySlug}/${citySlug}`,
    keywords: [
      `study in ${cityName}`,
      `${cityName} universities`,
      `${cityName} student life`,
      `${cityName} accommodation`,
      `${cityName} living costs`,
    ],
  });
}

// ── Data fetcher ────────────────────────────────────────────────────

async function fetchCity(countrySlug: string, citySlug: string) {
  try {
    const country = await db.higherStudyCountry.findUnique({
      where: { slug: countrySlug },
      select: { id: true, slug: true, name: true, flagEmoji: true, region: true },
    });
    if (!country) return null;
    const city = await db.higherStudyCity.findUnique({
      where: { slug: citySlug },
      include: {
        universities: {
          where: { publicationStatus: "published" },
          orderBy: [{ featured: "desc" }, { lastVerifiedAt: "desc" }],
          take: 12,
          include: {
            country: { select: { id: true, slug: true, name: true, flagEmoji: true } },
            city: { select: { id: true, slug: true, name: true } },
          },
        },
        _count: { select: { universities: true } },
      },
    });
    if (!city || city.countryId !== country.id) return null;
    return { country, city };
  } catch (e) {
    console.error("[city detail] DB error", e);
    return null;
  }
}

// ── Page ────────────────────────────────────────────────────────────

export default async function CityDetailPage({ params }: PageProps) {
  const { countrySlug, citySlug } = await params;
  const countryRef = COUNTRIES_MAP[countrySlug];
  if (!countryRef) notFound();

  const data = await fetchCity(countrySlug, citySlug);
  if (!data) {
    notFound();
  }
  const { country, city } = data;

  const breadcrumbLd = buildBreadcrumbJsonLd([
    { name: "Higher Study", url: `${HIGHER_STUDY_BASE_URL}/higher-study` },
    { name: "Destinations", url: `${HIGHER_STUDY_BASE_URL}/higher-study/destinations` },
    { name: country.name, url: `${HIGHER_STUDY_BASE_URL}/higher-study/destinations/${country.slug}` },
    { name: city.name, url: `${HIGHER_STUDY_BASE_URL}/higher-study/destinations/${country.slug}/${city.slug}` },
  ]);

  return (
    <>
      <HigherStudyBreadcrumb
        items={[
          { label: "Study Destinations", href: "/higher-study/destinations" },
          { label: country.name, href: `/higher-study/destinations/${country.slug}` },
          { label: city.name },
        ]}
        className="mx-auto max-w-[1320px] px-4 pt-6 sm:px-6"
      />

      <PageHero
        eyebrow={`${country.flagEmoji ?? ""} ${city.name}, ${country.name}`}
        title={`${city.name} — Student Guide`}
        description={city.overview ?? `Everything you need to know about studying in ${city.name}, ${country.name}.`}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard icon={<Building2 className="h-4 w-4" />} label="Universities" value={city._count.universities} />
        </div>
      </PageHero>

      <div className="mx-auto grid max-w-[1320px] gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {city.overview && (
            <SectionCard title="Overview" icon={<MapPin className="h-4 w-4" />}>
              <ProseSection content={city.overview} />
            </SectionCard>
          )}

          {city.livingCost && (
            <SectionCard title="Living cost" icon={<Home className="h-4 w-4" />}>
              <ProseSection content={city.livingCost} />
            </SectionCard>
          )}

          {city.transport && (
            <SectionCard title="Transport" icon={<Bus className="h-4 w-4" />}>
              <ProseSection content={city.transport} />
            </SectionCard>
          )}

          {city.accommodation && (
            <SectionCard title="Accommodation" icon={<Home className="h-4 w-4" />}>
              <ProseSection content={city.accommodation} />
            </SectionCard>
          )}

          {city.studentLife && (
            <SectionCard title="Student life" icon={<Sparkles className="h-4 w-4" />}>
              <ProseSection content={city.studentLife} />
            </SectionCard>
          )}

          <SectionCard
            title={`Universities in ${city.name}`}
            icon={<Building2 className="h-4 w-4" />}
            description={`${city._count.universities} institution${city._count.universities === 1 ? "" : "s"} based in this city.`}
          >
            {city.universities.length === 0 ? (
              <EmptyState
                title="No universities listed in this city yet"
                description={`Browse all universities in ${country.name} instead.`}
                size="compact"
                icon={Building2}
                action={{
                  label: `Browse ${country.name} universities`,
                  href: `/higher-study/global-universities?countrySlug=${country.slug}`,
                }}
              />
            ) : (
              <Suspense fallback={<LoadingSkeleton type="university" count={3} />}>
                <div className="grid gap-5 sm:grid-cols-2">
                  {city.universities.map((u) => (
                    <UniversityCard key={u.id} university={u as never} />
                  ))}
                </div>
              </Suspense>
            )}
          </SectionCard>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[148px] lg:self-start">
          <SectionCard title="Country" icon={<Landmark className="h-4 w-4" />}>
            <Link
              href={`/higher-study/destinations/${country.slug}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-ink-100 bg-ink-50/40 p-3 transition-colors hover:border-ink-200 hover:bg-white"
            >
              <span className="flex items-center gap-2 font-semibold text-ink-900">
                <span className="text-xl" aria-hidden="true">{country.flagEmoji}</span>
                {country.name}
              </span>
              <ArrowRight className="h-4 w-4 text-ink-400" aria-hidden="true" />
            </Link>
            <p className="mt-2 text-xs text-ink-500">
              Visit the country guide for visa, scholarships and post-study information.
            </p>
          </SectionCard>
        </aside>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumbLd) }}
      />
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white/80 p-4 shadow-soft backdrop-blur">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
        {icon}
        {label}
      </p>
      <p className="mt-1 font-display text-xl font-extrabold text-ink-900">
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
    </div>
  );
}
