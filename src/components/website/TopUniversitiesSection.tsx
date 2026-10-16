'use client';

/**
 * TOP UNIVERSITIES IN UK & AUSTRALIA — homepage grid (brand brief).
 *
 * Grid cards (6–8 per country): university logo, name, region/city, ranking,
 * next intake and an ALO Orange "View University" button. Every card carries a
 * relevant country image and links to the dedicated university page
 * (/universities/[slug]).
 *
 * Data honesty: universities come from the public facets feed (published,
 * verified catalogue rows only) and the "next intake" is read from that
 * university's own published courses. Nothing is invented — a missing ranking
 * or intake is labelled as such instead of being filled in.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, CalendarDays, MapPin, Trophy } from 'lucide-react';

interface TopUniversity {
  slug: string;
  name: string;
  country: string;
  city: string;
  worldRanking: number | null;
  courseCount: number;
}

type CountryTab = 'uk' | 'australia';

const TABS: { id: CountryTab; label: string; heading: string; image: string; match: RegExp }[] = [
  {
    id: 'uk',
    label: 'United Kingdom',
    heading: 'Top Universities in UK',
    image: '/images/cards/uk.png',
    match: /united kingdom|\buk\b/i,
  },
  {
    id: 'australia',
    label: 'Australia',
    heading: 'Top Universities in Australia',
    image: '/images/cards/australia.png',
    match: /australia/i,
  },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function initials(name: string): string {
  return name
    .replace(/\b(of|the|and|for|at|in)\b/gi, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function intakeText(intakes: { intakeMonth?: string; intakeYear?: number | null }[]): string {
  for (const intake of intakes) {
    const raw = String(intake.intakeMonth || '').trim();
    if (!raw) continue;
    const num = /^\d{1,2}$/.test(raw) ? Number(raw) : MONTHS.findIndex((m) => m.toLowerCase() === raw.slice(0, 3).toLowerCase()) + 1;
    const label = num >= 1 && num <= 12 ? MONTHS[num - 1] : raw;
    return [label, intake.intakeYear].filter(Boolean).join(' ');
  }
  return '';
}

export default function TopUniversitiesSection() {
  const [tab, setTab] = useState<CountryTab>('uk');
  const [all, setAll] = useState<TopUniversity[]>([]);
  const [nextIntakes, setNextIntakes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/course-finder/facets')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json?.success || !Array.isArray(json.universities)) return;
        setAll(
          json.universities.map((u: Record<string, unknown>) => ({
            slug: String(u.slug || ''),
            name: String(u.name || ''),
            country: String(u.country || ''),
            city: String(u.city || ''),
            worldRanking: typeof u.worldRanking === 'number' ? u.worldRanking : null,
            courseCount: typeof u.courseCount === 'number' ? u.courseCount : 0,
          })),
        );
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  const universities = useMemo(() => {
    return all
      .filter((u) => u.slug && u.name && active.match.test(u.country))
      .sort((a, b) => {
        if (a.worldRanking && b.worldRanking) return a.worldRanking - b.worldRanking;
        if (a.worldRanking) return -1;
        if (b.worldRanking) return 1;
        return b.courseCount - a.courseCount;
      })
      .slice(0, 8);
  }, [all, active]);

  /* Next intake per visible university, from its own published courses. */
  useEffect(() => {
    let cancelled = false;
    const missing = universities.filter((u) => nextIntakes[u.slug] === undefined);
    if (missing.length === 0) return;
    Promise.all(
      missing.map(async (u) => {
        try {
          const res = await fetch(`/api/course-finder?university=${encodeURIComponent(u.slug)}&limit=3`);
          const json = await res.json();
          const courses: { intakes?: { intakeMonth?: string; intakeYear?: number | null }[] }[] = json?.courses ?? [];
          const label = courses.map((c) => intakeText(c.intakes ?? [])).find(Boolean) || '';
          return [u.slug, label] as const;
        } catch {
          return [u.slug, ''] as const;
        }
      }),
    ).then((entries) => {
      if (cancelled) return;
      setNextIntakes((prev) => ({ ...prev, ...Object.fromEntries(entries) }));
    });
    return () => {
      cancelled = true;
    };
    // nextIntakes intentionally omitted: only fetch for newly visible cards.
  }, [universities]);

  return (
    <section aria-labelledby="top-universities-heading" className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <span className="mb-4 inline-block rounded-full border border-[#0057B8]/20 bg-[#EAF3FF] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#0057B8]">
            Top Universities
          </span>
          <h2 id="top-universities-heading" className="font-heading text-3xl font-extrabold tracking-tight text-[#0F172A] sm:text-4xl">
            {active.heading}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base text-[#555555]">
            Published, verified universities from the ALO catalogue — ranked where a world ranking is
            recorded, with the next intake from their own live courses.
          </p>
        </div>

        {/* Country tabs — UK | Australia */}
        <div role="tablist" aria-label="Top universities by country" className="mb-8 flex justify-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-full min-h-[48px] px-5 py-2.5 font-heading text-[13px] font-bold transition-colors ${
                tab === t.id
                  ? 'bg-[#E8501A] text-white shadow-sm'
                  : 'border border-[#E2E8F0] bg-white text-[#0F172A] hover:border-[#0057B8] hover:text-[#0057B8]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4" aria-busy="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : universities.length === 0 ? (
          <p className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center text-sm text-[#555555]">
            No published universities for {active.label} are in the catalogue yet.{' '}
            <Link href="/course-finder" className="font-semibold text-[#0057B8] underline">
              Search the Course Finder
            </Link>{' '}
            or{' '}
            <Link href={`/destinations/${tab}`} className="font-semibold text-[#0057B8] underline">
              view the {active.label} guide
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {universities.map((uni) => (
              <article
                key={uni.slug}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Relevant country image */}
                <div className="relative h-36 w-full overflow-hidden">
                  <Image
                    src={active.image}
                    alt={`${active.label} study destination`}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    loading="lazy"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#003F87]/70 via-transparent to-transparent" aria-hidden="true" />
                  {/* University logo / monogram */}
                  <div className="absolute bottom-3 left-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white font-heading text-sm font-extrabold text-[#0057B8] shadow-md" aria-hidden="true">
                    {initials(uni.name)}
                  </div>
                  {uni.worldRanking ? (
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-[#0F172A]">
                      <Trophy className="h-3.5 w-3.5 text-[#FFB347]" aria-hidden="true" />
                      World #{uni.worldRanking}
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col gap-2 p-5">
                  <h3 className="font-heading text-[15px] font-bold leading-snug text-[#0F172A]">
                    <Link href={`/universities/${encodeURIComponent(uni.slug)}`} className="hover:text-[#0057B8]">
                      {uni.name}
                    </Link>
                  </h3>
                  <p className="flex items-center gap-1.5 text-xs text-[#555555]">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[#E8501A]" aria-hidden="true" />
                    {[uni.city, uni.country].filter(Boolean).join(', ') || 'Region / city not recorded'}
                  </p>
                  <p className="text-xs text-[#555555]">
                    <span className="font-semibold text-[#0F172A]">Ranking:</span>{' '}
                    {uni.worldRanking ? `World #${uni.worldRanking}` : 'Not recorded'}
                  </p>
                  <p className="flex items-center gap-1.5 text-xs text-[#555555]">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[#E8501A]" aria-hidden="true" />
                    <span>
                      <span className="font-semibold text-[#0F172A]">Next Intake:</span>{' '}
                      {nextIntakes[uni.slug] || 'See courses'}
                    </span>
                  </p>
                  {uni.courseCount > 0 && (
                    <p className="text-[11px] text-[#64748B]">{uni.courseCount} published course{uni.courseCount === 1 ? '' : 's'}</p>
                  )}

                  <div className="mt-auto pt-3">
                    <Link
                      href={`/universities/${encodeURIComponent(uni.slug)}`}
                      aria-label={`View University — ${uni.name}`}
                      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#E8501A] font-heading text-[13px] font-bold text-white transition-colors hover:bg-[#C93D13]"
                    >
                      View University
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href={`/universities/${encodeURIComponent(uni.slug)}`}
                      className="mt-2 block text-center text-xs font-semibold text-[#0057B8] hover:underline"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/universities"
            className="inline-flex h-12 items-center gap-2 rounded-full border-2 border-[#0057B8] px-8 font-heading text-sm font-bold text-[#0057B8] transition-colors hover:bg-[#EAF3FF]"
          >
            View All Universities
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
