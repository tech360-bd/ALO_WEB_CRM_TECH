'use client';

/* eslint-disable @typescript-eslint/no-require-imports */

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ArrowLeft, Search, MapPin, GraduationCap, Award, Users, Building2,
  Phone, Mail, Clock, FileText, Shield, Globe, BookOpen, Star,
  CheckCircle2, Target, Eye, Heart, SlidersHorizontal, X,
} from 'lucide-react';

import { usePortalStore } from '@/lib/stores/portal-store';
import { EmptyState, ErrorState, LoadingGrid } from '@/components/alo/ui';
import TestPreparationMiniCard from '@/components/website/TestPreparationMiniCard';
import { COUNTRY_DESTINATIONS } from '@/lib/country-destinations-data';
import { ALO_CONTACT } from '@/lib/alo-site-info';
import Image from 'next/image';
import { PublicHero } from '@/components/website/PublicHero';
import { destinationCardImage } from '@/components/website/ImageMapping';

// ============================================================
// SHARED PUBLIC SHELL
// ============================================================
const HERO_ACCENTS: Record<string, { dot: string; text: string; ring: string }> = {
  '#0057B8': { dot: 'bg-[var(--alo-brand)]', text: 'text-[var(--alo-brand)]', ring: 'ring-[var(--alo-brand-border)]' },
  '#E8501A': { dot: 'bg-[var(--alo-cta)]', text: 'text-[var(--alo-cta)]', ring: 'ring-[var(--alo-cta)]/30' },
};

/**
 * Shared inner-page shell — Master §08 Variant E.
 *
 * Every public sub-page that renders through this module (course finder,
 * destinations, universities, scholarships, services, about, team, FAQs,
 * contact, legal, resources…) shares one hero definition. The band itself
 * lives in `components/website/PublicHero.tsx` so route-level pages that have
 * their own <main> can reuse the exact same hero.
 */
function PublicShell({ title, subtitle, badge, children, heroColor = '#0057B8', heroSlot }: {
  title: string;
  subtitle?: string;
  badge?: string;
  children: React.ReactNode;
  heroColor?: string;
  /** Hero Variant B (finder) / C (destination tiles): rendered inside the band. */
  heroSlot?: React.ReactNode;
}) {
  const setView = usePortalStore((s) => s.setView);
  return (
    <div className="min-h-screen bg-card">
      <PublicHero
        title={title}
        subtitle={subtitle}
        badge={badge}
        accent={heroColor === '#E8501A' ? 'cta' : 'brand'}
        slot={heroSlot}
        above={
          <button
            onClick={() => setView('website')}
            className="inline-flex items-center gap-1.5 rounded-[10px] text-[13px] font-semibold text-[var(--alo-text-muted)] transition-colors hover:text-[var(--alo-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--alo-brand)] focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to home
          </button>
        }
      />
      <main className="pb-20 pt-8 lg:pt-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// PUBLIC COURSE FINDER — reads /api/course-finder
// ============================================================
export function PublicCourseFinderPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ country: '', level: '', subject: '', search: '' });

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    // /api/course-finder expects studyLevel & subjectArea — sending level/subject
    // used to be silently ignored, making those filters dead controls.
    const q = new URLSearchParams();
    if (filters.search) q.set('search', filters.search);
    if (filters.country) q.set('country', filters.country);
    if (filters.level) q.set('studyLevel', filters.level);
    if (filters.subject) q.set('subjectArea', filters.subject);
    q.set('limit', '24');
    fetch(`/api/course-finder?${q.toString()}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Course search failed (HTTP ${r.status})`);
        return r.json();
      })
      .then((d) => setCourses(d.courses || d.data || []))
      .catch((e) => {
        if (e?.name !== 'AbortError') {
          setCourses([]);
          setError(e?.message || 'Could not load courses. Please try again.');
        }
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [filters]);

  const currencySymbol = (code?: string) =>
    ({ GBP: '£', USD: '$', EUR: '€', AUD: 'A$', CAD: 'C$', NZD: 'NZ$' } as Record<string, string>)[code || ''] || (code ? `${code} ` : '');

  const hasFilters = Boolean(filters.search || filters.country || filters.level || filters.subject);
  const resetFilters = () => setFilters({ country: '', level: '', subject: '', search: '' });

  // Hero Variant B — the finder itself is the hero. Search, country and study
  // level live in the band and drive the same `filters` state as before, so
  // there is one source of truth and no duplicated query logic.
  const finderHero = (
    <div className="rounded-[16px] border border-[var(--alo-border)] bg-card p-3 shadow-[var(--alo-shadow-sm)] sm:p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_200px_190px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--alo-text-muted)]" aria-hidden="true" />
          <Input
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            placeholder="Course, subject or university"
            aria-label="Search courses"
            className="h-12 pl-11"
          />
        </div>
        <Select value={filters.country || 'all'} onValueChange={(v) => setFilters({ ...filters, country: v === 'all' ? '' : v })}>
          <SelectTrigger className="h-12" aria-label="Country"><SelectValue placeholder="All countries" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All countries</SelectItem>
            {['United Kingdom', 'United States', 'Canada', 'Australia', 'Ireland', 'New Zealand', 'Germany'].map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.level || 'all'} onValueChange={(v) => setFilters({ ...filters, level: v === 'all' ? '' : v })}>
          <SelectTrigger className="h-12" aria-label="Study level"><SelectValue placeholder="All levels" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {['Foundation', 'Bachelor', 'Master', 'PhD', 'Diploma'].map((l) => (
              <SelectItem key={l} value={l}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="button" className="h-12" onClick={() => setFilters({ ...filters })}>
          <Search className="h-4 w-4" aria-hidden="true" /> Search
        </Button>
      </div>
    </div>
  );

  return (
    <PublicShell
      title="Course Finder"
      badge="SEARCH COURSES"
      subtitle="Find the perfect course from top universities across the UK, USA, Canada, Australia, Ireland, New Zealand and Europe."
      heroSlot={finderHero}
    >
      <div className="grid lg:grid-cols-4 gap-6">
        <Card className="p-5 lg:col-span-1 h-fit">
          <h3 className="font-semibold text-[var(--alo-text)] mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-[var(--alo-brand)]" /> Refine
          </h3>
          <div className="space-y-4">
            <div>
              <Label className="text-xs font-medium text-[var(--alo-body)] mb-1.5 block">Subject area</Label>
              <Select value={filters.subject} onValueChange={(v) => setFilters({ ...filters, subject: v === 'all' ? '' : v })}>
                <SelectTrigger className="h-12"><SelectValue placeholder="All subjects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {['Business & Management', 'Computer Science & IT', 'Engineering', 'Health & Medicine', 'Law', 'Social Sciences'].map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button variant="outline" className="w-full" onClick={resetFilters}>
                <X className="h-4 w-4" aria-hidden="true" /> Clear all filters
              </Button>
            )}
            <div className="rounded-[12px] bg-[var(--alo-page)] p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--alo-text-muted)]">Not sure what fits?</p>
              <p className="mt-1.5 text-[13px] leading-5 text-[var(--alo-body)]">A counselor can shortlist courses against your grades, budget and intake.</p>
              <Button asChild variant="brand-outline" className="mt-3 w-full">
                <a href="/book-consultation">Book a free consultation</a>
              </Button>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-3">
          {loading ? (
            <LoadingGrid count={4} />
          ) : error ? (
            <ErrorState
              title="We could not load courses"
              description="The course search did not respond. Please try again."
              onRetry={() => setFilters({ ...filters })}
            />
          ) : courses.length === 0 ? (
            <EmptyState
              icon="Search"
              title="No courses match these filters"
              description="Try a broader subject, a different country, or clear the filters to see every published course."
              action={hasFilters ? <Button variant="outline" onClick={resetFilters}>Clear all filters</Button> : undefined}
            />
          ) : (
            <>
              <p className="text-sm text-[var(--alo-text-muted)] mb-4">{courses.length} courses found</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {courses.map((c: any, i) => (
                  <motion.div
                    key={c.id || i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <Card className="p-5 hover:shadow-md transition-shadow h-full">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="secondary" className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]">
                          {c.studyLevel || c.programLevel || c.level || 'Course'}
                        </Badge>
                        {(c.yearlyTuition || c.tuitionFee) > 0 && (
                          <span className="text-xs font-semibold text-[var(--alo-body)]">
                            {currencySymbol(c.tuitionCurrency || c.currency)}
                            {Math.round((c.yearlyTuition || c.tuitionFee) / 1000)}k/yr
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-[var(--alo-text)] mb-1 line-clamp-2">
                        {c.courseTitle || c.name || c.title}
                      </h3>
                      <p className="text-sm text-[var(--alo-body)] mb-3 flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" />
                        {c.universityName || c.university || 'University'}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-[var(--alo-text-muted)]">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {c.country || '—'}
                        </span>
                        {(c.durationMonths || c.duration) && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {c.duration || `${c.durationMonths} months`}
                          </span>
                        )}
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </PublicShell>
  );
}


/**
 * Destination guide.
 *
 * Rebuilt on COUNTRY_DESTINATIONS. The previous DESTINATION_DATA table carried
 * tuition ranges, living costs, work-hour limits and a "top universities"
 * ranking with no source and no verification date, and the overview copy made
 * ranking claims we cannot evidence. Every figure here now comes from the
 * verified dataset, which records a source and lastVerifiedAt per country.
 *
 * The invented per-country university ranking is gone. Where universities are
 * listed they come from the verified city records instead.
 */
export function PublicDestinationPage({ slug }: { slug: string | null }) {
  const all = Object.values(COUNTRY_DESTINATIONS).sort((a, b) => a.name.localeCompare(b.name));
  const data = slug ? COUNTRY_DESTINATIONS[slug] : null;

  if (!data) {
    // Hero Variant C — destination-led: the tiles carry the choice, so the hero
    // is visual rather than a headline block.
    const destinationStrip = (
      <ul className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2 alo-scrollbar sm:grid sm:grid-cols-3 sm:overflow-visible lg:grid-cols-4 lg:gap-4">
        {all.map((country) => (
          <li key={country.slug} className="w-[210px] shrink-0 snap-start sm:w-auto">
            <a
              href={`/destinations/${country.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-[14px] border border-[var(--alo-border)] bg-card transition-shadow hover:shadow-[var(--alo-shadow-md)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--alo-brand)] focus-visible:ring-offset-2"
            >
              <span className="relative block aspect-[16/10] overflow-hidden bg-[var(--alo-page)]">
                <Image
                  src={destinationCardImage(country.slug)}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 220px, 45vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </span>
              <span className="flex items-center justify-between gap-2 px-3 py-2.5">
                <span className="text-[13px] font-semibold text-[var(--alo-text)]">{country.name}</span>
                <ArrowLeft className="h-3.5 w-3.5 rotate-180 text-[var(--alo-brand)]" aria-hidden="true" />
              </span>
            </a>
          </li>
        ))}
      </ul>
    );

    return (
      <PublicShell
        title="Study destinations"
        badge="DESTINATIONS"
        subtitle="Choose your study destination"
        heroSlot={destinationStrip}
      >
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {all.map((country, index) => (
            <Card
              key={country.slug}
              className={`overflow-hidden transition-shadow hover:shadow-[var(--alo-shadow-md)] ${
                index === 0 ? 'sm:col-span-2 lg:col-span-1 lg:row-span-2' : ''
              }`}
            >
              <a href={`/destinations/${country.slug}`} className="group flex h-full flex-col focus-visible:outline-none">
                <span className={`relative block overflow-hidden bg-[var(--alo-page)] ${index === 0 ? 'aspect-[16/9]' : 'aspect-[16/7]'}`}>
                  <Image
                    src={destinationCardImage(country.slug)}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 400px, 100vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                </span>
                <span className="flex flex-1 flex-col p-5">
                  <h3 className="card-title mb-1">{country.name}</h3>
                  <p className="mb-3 line-clamp-3 text-[13px] leading-6 text-[var(--alo-body)]">{country.whyStudySummary}</p>
                  <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--alo-text-muted)]">
                    {country.lastVerifiedAt ? `Verified ${country.lastVerifiedAt}` : 'Verification date not recorded'}
                  </p>
                  <span className="mt-auto text-[13px] font-semibold text-[var(--alo-brand)] group-hover:underline">
                    View {country.name} guide
                  </span>
                </span>
              </a>
            </Card>
          ))}
        </div>
      </PublicShell>
    );
  }

  const cityUniversities = data.cities.flatMap((city) =>
    city.universities.map((university) => ({ university, city: city.name }))
  );

  return (
    <PublicShell
      title={`Study in ${data.name}`}
      badge="DESTINATION GUIDE"
      subtitle={data.whyStudySummary}
    >
      <p className="text-xs text-[var(--alo-text-muted)] mb-6">
        {data.lastVerifiedAt
          ? `Figures verified ${data.lastVerifiedAt} against the official sources listed below.`
          : 'Verification date not recorded for this destination.'}
      </p>

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[var(--alo-brand)] mb-2">
            <GraduationCap className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Tuition Range</span>
          </div>
          <p className="text-lg font-bold text-[var(--alo-text)]">{data.tuitionRange}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[var(--alo-brand)] mb-2">
            <Building2 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Living Cost</span>
          </div>
          <p className="text-lg font-bold text-[var(--alo-text)]">{data.livingCost}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-[var(--alo-brand)] mb-2">
            <Clock className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase">Work Rights</span>
          </div>
          <p className="text-lg font-bold text-[var(--alo-text)]">{data.workRights}</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card className="p-6">
          <h3 className="font-bold text-[var(--alo-text)] mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-[var(--alo-brand)]" /> Visa Information
          </h3>
          <p className="text-sm text-[var(--alo-body)] mb-2">Visa route:</p>
          <p className="font-semibold text-[var(--alo-text)] mb-3">{data.visaType}</p>
          <p className="text-sm text-[var(--alo-body)] mb-2">Popular intakes:</p>
          <p className="font-semibold text-[var(--alo-text)]">{data.popularIntakes.join(', ') || 'Not recorded'}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-bold text-[var(--alo-text)] mb-3 flex items-center gap-2">
            <Globe className="h-4 w-4 text-[var(--alo-brand)]" /> Country Info
          </h3>
          <p className="text-sm text-[var(--alo-body)] mb-2">Currency:</p>
          <p className="font-semibold text-[var(--alo-text)] mb-3">{data.currency}</p>
          <p className="text-sm text-[var(--alo-body)] mb-2">Capital:</p>
          <p className="font-semibold text-[var(--alo-text)]">{data.capital}</p>
        </Card>
      </div>

      <Card className="p-6 mb-10">
        <h3 className="font-bold text-[var(--alo-text)] mb-3">Overview</h3>
        <p className="text-sm text-[var(--alo-body)] leading-relaxed">{data.overview}</p>
      </Card>

      {cityUniversities.length > 0 && (
        <>
          <h3 className="text-2xl font-bold text-[var(--alo-text)] mb-4">Universities by city</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {cityUniversities.map(({ university, city }) => (
              <Card key={`${city}-${university}`} className="p-5">
                <p className="font-semibold text-[var(--alo-text)] text-sm">{university}</p>
                <p className="text-xs text-[var(--alo-text-muted)]">{city}</p>
              </Card>
            ))}
          </div>
        </>
      )}

      <Card className="p-6 mb-10">
        <h3 className="font-bold text-[var(--alo-text)] mb-3">Official sources</h3>
        <ul className="space-y-2">
          {data.sources.map((source) => (
            <li key={`${source.section}-${source.sourceUrl}`} className="text-sm">
              <span className="text-[var(--alo-text-muted)]">{source.section}: </span>
              <a
                href={source.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--alo-brand)] hover:underline"
              >
                {source.sourceName}
              </a>
              <span className="text-[var(--alo-text-muted)]"> · checked {source.lastVerifiedAt}</span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-brand-hover)] rounded-2xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-2">Ready to study in {data.name}?</h3>
        <p className="text-[var(--alo-brand-pale)] mb-5">
          Fees and visa rules change. A counselor confirms the current requirements for your case.
        </p>
        <Button asChild className="bg-[var(--alo-cta)] text-black hover:brightness-110">
          <a href="/book-consultation">Book Free Consultation</a>
        </Button>
      </div>
    </PublicShell>
  );
}

// ============================================================
// UNIVERSITIES PAGE — list from DB
// ============================================================
export function PublicUniversitiesPage() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetch(`/api/universities?limit=50&status=active${search ? `&search=${encodeURIComponent(search)}` : ''}`, { signal: ctrl.signal })
      .then(async (r) => {
        if (!r.ok) throw new Error(`Could not load universities (HTTP ${r.status})`);
        return r.json();
      })
      .then((d) => setUniversities(d.universities || d.data || []))
      .catch((e) => {
        if (e?.name !== 'AbortError') {
          setUniversities([]);
          setError(e?.message || 'Could not load universities. Please try again.');
        }
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [search, reloadKey]);

  return (
    <PublicShell
      title="Universities"
      badge="UNIVERSITY DIRECTORY"
      subtitle="Browse our partner universities worldwide. Find the right fit for your academic goals."
    >
      <Card className="p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--alo-text-muted)]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search universities by name, country, or city..."
            className="pl-10 h-11"
          />
        </div>
      </Card>

      {loading ? (
        <LoadingGrid count={6} />
      ) : error ? (
        <ErrorState
          title="We could not load universities"
          description="The university list did not respond. Please try again."
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : universities.length === 0 ? (
        <EmptyState
          icon="Building2"
          title={search ? `No universities match “${search}”` : 'No universities published yet'}
          description={
            search
              ? 'Try a different name or clear the search to see every published university.'
              : 'Verified partner universities appear here as soon as their official data is published.'
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {universities.map((u: any, i) => (
            <motion.div key={u.id || u.universityId || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
              <Card className="p-5 hover:shadow-md transition-shadow h-full">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: 'var(--alo-brand)' }}
                  >
                    {u.name?.[0] || 'U'}
                  </div>
                  {u.worldRanking && (
                    <Badge variant="secondary" className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)]">
                      Rank #{u.worldRanking}
                    </Badge>
                  )}
                </div>
                <h3 className="font-semibold text-[var(--alo-text)] mb-1 line-clamp-2">{u.name}</h3>
                <p className="text-sm text-[var(--alo-body)] mb-3 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {u.city}, {u.country}
                </p>
                <div className="flex items-center gap-3 text-xs text-[var(--alo-text-muted)] mb-3">
                  {u.founded && <span>Est. {u.founded}</span>}
                  {u.students && <span>{u.students} students</span>}
                </div>
                {u.ieltsMin && (
                  <div className="text-xs">
                    <span className="text-[var(--alo-text-muted)]">IELTS min: </span>
                    <span className="font-semibold text-[var(--alo-brand)]">{u.ieltsMin}</span>
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PublicShell>
  );
}

// ============================================================
// SCHOLARSHIPS PAGE — list from DB
// ============================================================
export function PublicScholarshipsPage() {
  const { MASTER_SCHOLARSHIPS_DATA } = require('@/lib/scholarships-data');
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scholarships?limit=30')
      .then((r) => r.json())
      .then((d) => {
        const fetched = d.scholarships || d.data || [];
        setScholarships(fetched.length > 0 ? fetched : MASTER_SCHOLARSHIPS_DATA);
      })
      .catch(() => setScholarships(MASTER_SCHOLARSHIPS_DATA))
      .finally(() => setLoading(false));
  }, []);

  const displayData = scholarships.length > 0 ? scholarships : MASTER_SCHOLARSHIPS_DATA;

  return (
    <PublicShell
      title="Scholarships & Funding Directory"
      badge="100% VERIFIED FUNDING SCHEMES"
      subtitle="Explore fully funded government scholarships, university merit grants, and tuition fee waivers across the UK, USA, Australia, Canada, Germany, Ireland, and New Zealand."
      heroColor="#E8501A"
    >
      {loading ? (
        <LoadingGrid count={6} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayData.map((s: any, i: number) => {
            const slug = s.slug || (s.title ? s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `scholarship-${i}`);
            return (
              <motion.div key={s.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className="p-6 hover:shadow-lg transition-all h-full flex flex-col justify-between border-[var(--alo-border)] hover:border-[var(--alo-brand)]">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <Badge className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] border-[var(--alo-cta)]/25 font-semibold text-[11px]">
                        {s.coverageType || 'Merit Scholarship'}
                      </Badge>
                      <span className="text-xs font-semibold text-[var(--alo-text-muted)]">
                        {s.flag} {s.country || s.countryCode || 'Global'}
                      </span>
                    </div>
                    <h3 className="font-bold text-[var(--alo-text)] text-lg mb-2 line-clamp-2">{s.title || s.name}</h3>
                    <p className="text-xs text-[var(--alo-brand)] font-semibold mb-3">{s.provider || 'University Partner'}</p>
                    <p className="text-xs text-[var(--alo-body)] mb-4 line-clamp-3 leading-relaxed">{s.description || s.eligibility}</p>
                  </div>

                  <div className="pt-4 border-t border-[var(--alo-border)] space-y-3">
                    <div className="bg-[var(--alo-page)] p-2.5 rounded-lg text-xs font-bold text-[var(--alo-text)] line-clamp-1">
                      Award: {s.awardAmount || s.amount || 'Varies by degree'}
                    </div>
                    <div className="flex gap-2">
                      <Button asChild className="w-full bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)] font-semibold py-2"><a href={`/scholarships/${slug}`} className="w-full">
                          View Full Details & Apply →
                        </a></Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </PublicShell>
  );
}

// ============================================================
// SERVICES PAGE
// ============================================================
const SERVICES = [
  { icon: GraduationCap, title: 'Personalized Counseling', desc: 'Our experienced counselors provide one-to-one guidance to help you select the course and university that best match your academic background, career goals, and personal strengths.' },
  { icon: Building2, title: 'University Selection', desc: 'We assist students in choosing from top-ranked universities across the UK, USA, Australia, Canada, New Zealand, Ireland and Europe with accurate and up-to-date information.' },
  { icon: FileText, title: 'Application Assistance', desc: 'Full support from completing forms and writing compelling personal statements to organizing necessary documents—ensuring every application stands out.' },
  { icon: Shield, title: 'Visa Guidance', desc: 'Our visa experts guide students through requirements, documentation, and interview preparation to help ensure a smooth and successful visa approval process.' },
  { icon: BookOpen, title: 'Test Preparation', desc: 'Support for IELTS, TOEFL, GRE, and GMAT preparation with coaching classes, practice materials, and expert guidance to achieve competitive scores.' },
  { icon: Award, title: 'Financial Planning', desc: 'Our advisors help explore scholarships, grants, and funding options to make international education more affordable and manageable for every student.' },
  { icon: Globe, title: 'Pre-Departure Orientation', desc: 'Orientation sessions covering cultural adaptation, travel arrangements, accommodation, and health insurance, ensuring students are confident and ready.' },
  { icon: Users, title: 'Post-Arrival Support', desc: 'Our support continues after arrival with assistance in settling in, academic guidance, and connecting with other students to feel at home.' },
  { icon: Star, title: 'Career Counseling', desc: 'Guidance on career opportunities, internships, and further studies through our professional network and alumni connections.' },
  { icon: BookOpen, title: 'Ongoing Mentorship', desc: 'Continuous support throughout your entire study abroad journey, from application to graduation and beyond.' },
];

export function PublicServicesPage() {
  const { MASTER_SERVICES_DATA } = require('@/lib/services-data');
  const setPublicPage = usePortalStore((s) => s.setPublicPage);

  return (
    <PublicShell
      title="Our 10 Comprehensive Services"
      badge="END-TO-END STUDY ABROAD ADVISORY"
      subtitle="We are committed to guiding Bangladeshi students on their journey to study abroad with confidence and success. Explore our 10 comprehensive services designed for every stage of your international education."
      heroColor="#0057B8"
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {MASTER_SERVICES_DATA.map((s: any, i: number) => (
          <motion.div key={s.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
            <Card className="bg-white hover:shadow-xl transition-all border-[var(--alo-border)] hover:border-[var(--alo-brand)] flex flex-col justify-between overflow-hidden rounded-2xl h-full">
              <div>
                <div className="h-44 w-full overflow-hidden relative">
                  <img src={s.heroImage} alt={s.title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-black/60 text-white backdrop-blur-md border-0 text-[11px] font-bold">
                      SERVICE 0{i + 1}
                    </Badge>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-[var(--alo-text)] mb-2">{s.title}</h3>
                  <p className="text-xs text-[var(--alo-body)] mb-4 line-clamp-3 leading-relaxed">{s.shortDesc}</p>
                </div>
              </div>

              <div className="p-6 pt-0">
                <Button asChild className="w-full bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)] font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5"><a href={`/services/${s.slug}`} className="block w-full">
                    Explore Full Service Details & Process →
                  </a></Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-brand-hover)] rounded-2xl p-8 text-white text-center shadow-lg">
        <h3 className="text-2xl font-bold mb-2">Get Started Today</h3>
        <p className="text-[var(--alo-brand-pale)] mb-5 text-sm">Schedule a free 1-on-1 consultation with our senior education advisors</p>
        <Button asChild className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta-hover)] font-bold px-6 py-3 rounded-xl shadow-md"><a href="/eligibility-check">
            Book Free Consultation
          </a></Button>
      </div>
    </PublicShell>
  );
}

// ============================================================
// ABOUT PAGE
// Brand brief copy, verbatim: Who We Are (founded February 2023 by
// Taslima Akter), the five study-abroad strengths, Our Purpose / Mission /
// Vision. Layout: 2-column (text + visual motif). No invented statistics —
// the previous "360+ partners / 8,800+ courses" tiles were removed because
// no verified source backs those numbers.
// ============================================================
export function PublicAboutPage() {
  const strengths = [
    'World-class universities and research excellence',
    'Industry-aligned programmes and employability',
    'International student-friendly policies',
    'Scholarships and funding opportunities',
    'Safe cities and vibrant student life',
  ];
  return (
    <PublicShell
      title="About ALO Education"
      badge="ESTABLISHED 2023"
      subtitle="Your Dream – Our Commitment. ALO Education connects ambitious Bangladeshi students with world-class education opportunities abroad."
    >
      {/* Who We Are — 2-column: text + visual motif */}
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14 mb-14">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)] mb-5">Who We Are</h2>
          <div className="space-y-4 text-base text-[var(--alo-body)] leading-relaxed">
            <p>
              In February 2023, Taslima Akter founded ALO Education with a vision to connect ambitious
              Bangladeshi students with world-class education opportunities abroad. Her personal
              experience navigating the complexities of international admissions inspired her to create
              a platform built on trust, transparency, and genuine care for every student&apos;s future.
            </p>
            <p>
              That same year, our first office opened in Dhaka, Bangladesh, with a dedicated focus on
              helping students secure admissions to leading universities and colleges across the United
              Kingdom, United States, Australia, Canada, New Zealand, Ireland, and Europe. From the very
              first day, our approach has been centered on providing personalized, honest, and
              comprehensive guidance.
            </p>
            <p>
              Guided by the founder&apos;s vision of trust, transparency, and professionalism, ALO
              Education continues to grow with the mission of offering global opportunities and becoming
              a trusted partner in international education consultancy. We are not just consultants — we
              are mentors, guides, and partners in your journey toward a brighter future.
            </p>
          </div>
          <ul className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {strengths.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm font-medium text-[var(--alo-text)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--alo-cta)]" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-3xl shadow-2xl">
            <img
              src="/images/landing/Copy of pexels-rdne-7092364.webp"
              alt="ALO Education counsellors guiding students in Dhaka"
              className="h-auto w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="absolute -bottom-4 left-4 flex items-center gap-3 rounded-2xl border border-[var(--alo-border)] bg-white p-4 shadow-xl">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--alo-cta)]">
              <Heart className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-bold text-[var(--alo-text)]">Student-First</span>
              <span className="block text-xs text-[var(--alo-text-muted)]">Since February 2023 · Dhaka, Bangladesh</span>
            </span>
          </div>
        </div>
      </div>

      {/* Our Purpose */}
      <div className="mb-6 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] mb-4">
          Our Purpose
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--alo-text)]">
          Our Commitment to Your Study-Abroad Dream
        </h2>
      </div>
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card className="p-8 bg-gradient-to-br from-blue-50 to-white border-[var(--alo-border)]">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--alo-brand)]">
            <Target className="h-6 w-6 text-white" aria-hidden="true" />
          </span>
          <h3 className="text-xl font-bold text-[var(--alo-brand)] mb-3">Our Mission</h3>
          <div className="space-y-3 text-[var(--alo-body)] leading-relaxed">
            <p>
              At ALO Education, our mission is simple yet powerful — turning student dreams into global
              opportunities. We strive to be a trusted pathway to world-class education, guiding every
              student with honesty, professionalism, and genuine care.
            </p>
            <p>
              Our commitment goes beyond admissions. We are dedicated to guiding ambitions, shaping
              brighter futures, and ensuring that students from Bangladesh to the world can access
              education without boundaries.
            </p>
          </div>
        </Card>
        <Card className="p-8 bg-gradient-to-br from-orange-50 to-white border-[var(--alo-cta)]/25">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--alo-cta)]">
            <Eye className="h-6 w-6 text-white" aria-hidden="true" />
          </span>
          <h3 className="text-xl font-bold text-[var(--alo-cta)] mb-3">Our Vision</h3>
          <div className="space-y-3 text-[var(--alo-body)] leading-relaxed">
            <p>
              The vision of ALO Education is to become a globally recognized education consultancy that
              inspires trust, integrity, and excellence in everything we do. We aspire to guide students
              toward courses and institutions that best suit their academic interests and career goals.
            </p>
            <p>
              Our focus is on nurturing holistic development by enhancing knowledge, skills, and
              confidence so students can thrive in a competitive world. With continuous innovation, we
              provide seamless, high-quality services.
            </p>
          </div>
        </Card>
      </div>
    </PublicShell>
  );
}

// ============================================================
// SUCCESS STORIES PAGE
// ============================================================
export function PublicSuccessStoriesPage() {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/website/success-stories')
      .then((r) => r.json())
      .then((d) => setStories(d.stories || []))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, []);

  const fallback = [
    {
      name: 'Tushar Imran Nahid',
      course: 'BSc Business Management',
      university: 'Ravensbourne University London',
      quote: 'I have recently received my UK student visa for my BSc in Business Management with International Year at Ravensbourne University London. Due to some technical issues, the process took a little longer than expected and both I and my family were quite stressed. However, ALO Education Consultancy gave me full support, courage, and proper guidance throughout the entire journey. I am extremely satisfied with their service and professionalism. I highly recommend everyone to apply for their visa through ALO Education. They are simply the best!',
    },
    {
      name: 'Ummaye Mayesha Mannan',
      course: 'MRes Leadership and Management',
      university: 'University of Derby',
      quote: 'I recently received my UK student visa for Master of Research in Leadership and Management at University of Derby. ALO Education Consultancy provided full support, guidance, and encouragement throughout. I\'m extremely satisfied with their professionalism and highly recommend their services.',
    },
  ];

  const data = stories.length > 0 ? stories : fallback;

  return (
    <PublicShell
      title="Success Stories"
      badge="VOICES OF OUR STUDENTS"
      subtitle="Real stories from students who achieved their dreams of studying abroad with ALO Education."
      heroColor="#E8501A"
    >
      {loading ? (
        <LoadingGrid count={4} />
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {data.map((s: any, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="p-7 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-brand-hover)] flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {s.name?.[0] || 'S'}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--alo-text)]">{s.name}</h3>
                    <p className="text-sm text-[var(--alo-brand)]">{s.course || s.program}</p>
                    <p className="text-xs text-[var(--alo-text-muted)]">Now studying at {s.university}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-[var(--alo-cta)] text-[var(--alo-cta)]" />
                  ))}
                </div>
                <p className="text-sm text-[var(--alo-body)] italic leading-relaxed">"{s.quote || s.testimonial}"</p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </PublicShell>
  );
}

// ============================================================
// TEAM PAGE
// ============================================================
export function PublicTeamPage() {
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/website/team-members')
      .then((r) => r.json())
      .then((d) => setTeam(d.members || []))
      .catch(() => setTeam([]))
      .finally(() => setLoading(false));
  }, []);

  const fallback = [
    { name: 'Taslima Akter', role: 'Founder & CEO', bio: 'Visionary leader with a passion for making international education accessible to all students.' },
    // Other team members are loaded from the database via the TeamMember table.
    // If the database has no team members, only the founder is shown.
  ];

  const data = team.length > 0 ? team : fallback;

  return (
    <PublicShell
      title="Meet Our Expert Team"
      badge="DEDICATED PROFESSIONALS"
      subtitle="Our dedicated professionals are here to guide you every step of the way."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {data.map((m: any, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <Card className="p-6 text-center hover:shadow-md transition-shadow h-full">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[var(--alo-brand)] to-[var(--alo-brand-hover)] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                {m.name?.[0] || 'A'}
              </div>
              <h3 className="font-bold text-[var(--alo-text)]">{m.name}</h3>
              <p className="text-sm text-[var(--alo-brand)] mb-3">{m.role || m.position}</p>
              <p className="text-xs text-[var(--alo-body)]">{m.bio || m.description}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </PublicShell>
  );
}

// ============================================================
// FAQS PAGE
// ============================================================
const FALLBACK_FAQS = [
  { q: 'How do I start my study abroad journey with ALO Education?', a: 'Simply book a free consultation through our website or visit our Dhaka office. Our counselors will assess your academic background, career goals, and preferences to create a personalized plan.' },
  { q: 'Is your service free for students?', a: 'Yes, our core consulting services are free for students. We are commissioned by partner universities, so students don\'t pay for university selection, application guidance, or visa counseling.' },
  { q: 'What English tests do you help with?', a: 'We provide support for IELTS, IELTS UKVI, PTE Academic, TOEFL iBT, Duolingo English Test, OIETC/ELLT, Oxford ELLT, LanguageCert, Kaplan English Test, OET, GRE, GMAT, SAT, and ACT preparation.' },
  { q: 'Which countries do you help students apply to?', a: 'We assist students applying to universities in the United Kingdom, United States, Canada, Australia, Ireland, New Zealand, Dubai/UAE, and Germany.' },
  { q: 'Do you help with visa applications?', a: 'Yes, our visa experts guide you through the entire visa process including documentation, financial requirements, and interview preparation for all major study destinations.' },
  { q: 'Can you help me find scholarships?', a: 'Absolutely. Our advisors help identify scholarship opportunities based on your academic profile, destination country, and chosen program. We also assist with scholarship application essays.' },
  { q: 'What is the typical application timeline?', a: 'We recommend starting 6-12 months before your intended intake. September intakes usually require applications by January-March, while January intakes need applications by August-October.' },
  { q: 'Do you provide post-arrival support?', a: 'Yes, our support continues after you arrive. We help with settling in, accommodation guidance, academic counseling, and connecting you with other students and alumni.' },
];

export function PublicFaqsPage() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/website/faqs')
      .then((r) => r.json())
      .then((d) => setFaqs(d.faqs || []))
      .catch(() => setFaqs([]))
      .finally(() => setLoading(false));
  }, []);

  const data = faqs.length > 0 ? faqs : FALLBACK_FAQS;

  return (
    <PublicShell
      title="Frequently Asked Questions"
      badge="HELP CENTER"
      subtitle="Find answers to common questions about studying abroad with ALO Education."
    >
      {loading ? (
        <div className="mx-auto max-w-3xl space-y-3">{Array.from({ length: 5 }).map((_, i) => (<div key={i} className="h-14 animate-pulse rounded-[12px] border border-[var(--alo-border)] bg-[var(--alo-surface-muted)]" />))}</div>
      ) : (
        <Card className="p-6 max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {data.map((f: any, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold text-[var(--alo-text)]">
                  {f.question || f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-[var(--alo-body)] leading-relaxed">
                  {f.answer || f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Card>
      )}
    </PublicShell>
  );
}

// ============================================================
// CONTACT PAGE
// ============================================================
export function PublicContactPage() {
  return (
    <PublicShell
      title="Contact Us"
      badge="GET IN TOUCH"
      subtitle="We're here to help. Reach out to us through any of these channels."
    >
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <Card className="p-8">
          <Phone className="h-8 w-8 text-[var(--alo-brand)] mb-4" />
          <h3 className="font-bold text-[var(--alo-text)] mb-2">Phone</h3>
          <a href={ALO_CONTACT.mobileHref} className="mb-1 block text-2xl font-bold text-[var(--alo-brand)]">
            {ALO_CONTACT.mobileDisplay}
          </a>
          <p className="text-sm text-[var(--alo-body)]">{ALO_CONTACT.officeHours}</p>
        </Card>
        <Card className="p-8">
          <Mail className="h-8 w-8 text-[var(--alo-cta)] mb-4" />
          <h3 className="font-bold text-[var(--alo-text)] mb-2">Email</h3>
          <a href={ALO_CONTACT.emailHref} className="mb-1 block break-all text-2xl font-bold text-[var(--alo-cta)]">
            {ALO_CONTACT.email}
          </a>
          <p className="text-sm text-[var(--alo-body)]">Email us anytime</p>
        </Card>
      </div>

      <Card className="p-8 mb-8">
        <div className="flex items-start gap-4">
          <MapPin className="h-8 w-8 text-[var(--alo-brand)] shrink-0" />
          <div>
            <h3 className="font-bold text-[var(--alo-text)] mb-2">Bangladesh Office</h3>
            <p className="text-[var(--alo-body)] leading-relaxed">{ALO_CONTACT.address}</p>
            <p className="text-sm text-[var(--alo-text-muted)] mt-3">Hours: {ALO_CONTACT.officeHours}</p>
            <a
              href={ALO_CONTACT.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-block text-sm font-semibold text-[var(--alo-brand)] underline underline-offset-2"
            >
              Open in Google Maps
            </a>
          </div>
        </div>
      </Card>

      <Card className="p-8 bg-green-50 border-green-200">
        <div className="flex items-start gap-4">
          <Phone className="h-8 w-8 text-[var(--alo-whatsapp)] shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-green-900 mb-2">WhatsApp</h3>
            <p className="text-sm text-green-800 mb-4">
              Quick response on WhatsApp: {ALO_CONTACT.whatsappDisplay}
            </p>
            <Button asChild className="bg-[var(--alo-whatsapp)] text-white hover:brightness-110"><a href={ALO_CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer">
                Chat Now
              </a></Button>
          </div>
        </div>
      </Card>
    </PublicShell>
  );
}

// ============================================================
// LEGAL PAGES — Privacy / Terms / Cookies
// ============================================================
export function PublicLegalPage({ type }: { type: 'privacy' | 'terms' | 'cookies' | 'communication' | 'lead-data' | 'user-guide' | 'accessibility' }) {
  const content = {
    privacy: {
      title: 'Privacy Policy',
      badge: 'LEGAL',
      sections: [
        { h: 'Information We Collect', p: 'We collect information you provide directly when you book consultations, register for an account, or contact us. This includes your name, email, phone number, academic background, and study preferences.' },
        { h: 'How We Use Your Information', p: 'Your information is used to provide counseling services, process applications, communicate with universities, and improve our services. We never sell your data to third parties.' },
        { h: 'Data Security', p: 'We implement industry-standard security measures including encryption, secure servers, and access controls to protect your personal information from unauthorized access.' },
        { h: 'Your Rights', p: 'You have the right to access, update, or delete your personal data. Contact us at info@aloeducation.com to exercise these rights.' },
        { h: 'Cookies', p: 'We use essential cookies to operate our website and analytical cookies to improve user experience. See our Cookie Policy for details.' },
      ],
    },
    terms: {
      title: 'Terms of Service',
      badge: 'LEGAL',
      sections: [
        { h: 'Service Description', p: 'ALO Education provides educational consulting services including university selection, application assistance, visa guidance, and test preparation support for students seeking to study abroad.' },
        { h: 'User Responsibilities', p: 'Users agree to provide accurate information, comply with application deadlines, and follow university and visa requirements. Students are responsible for their academic performance and visa decisions.' },
        { h: 'Service Availability', p: 'While we strive to provide continuous service availability, we are not liable for temporary outages, technical issues, or third-party service disruptions.' },
        { h: 'Limitation of Liability', p: 'ALO Education is not liable for university admission decisions, visa approvals/denials, or any indirect damages arising from our consulting services.' },
        { h: 'Governing Law', p: 'These terms are governed by the laws of Bangladesh. Any disputes will be resolved in Dhaka, Bangladesh.' },
      ],
    },
    cookies: {
      title: 'Cookie Policy',
      badge: 'LEGAL',
      sections: [
        { h: 'What Are Cookies', p: 'Cookies are small text files stored on your device when you visit a website. They help us remember your preferences and analyze website traffic.' },
        { h: 'Types of Cookies We Use', p: 'Essential cookies (required for website function), Analytical cookies (help us understand usage patterns), and Preference cookies (remember your settings).' },
        { h: 'Managing Cookies', p: 'You can control cookies through your browser settings. Disabling essential cookies may affect website functionality.' },
        { h: 'Third-Party Cookies', p: 'We use Google Analytics and similar tools that may set their own cookies. These are governed by their respective privacy policies.' },
        { h: 'Updates', p: 'This policy may be updated periodically. We will notify users of significant changes via email or website notification.' },
      ],
    },
    communication: {
      title: 'Communication Policy',
      badge: 'LEGAL',
      sections: [
        { h: 'Channels', p: 'We may respond through the contact channel you choose and provide, where that channel is configured and available. Use the authenticated Student Portal for account-specific information. Never share passwords, OTPs, bank/card credentials, or private documents in a public chat.' },
        { h: 'Consent & Opt-out', p: 'Choose whether to receive non-essential outreach where preference controls are provided. Use STOP on a supported messaging channel, unsubscribe from email, or contact ALO to change preferences. Do not rely on a message channel for urgent account or safety matters.' },
        { h: 'SLA & After-hours', p: 'Response targets follow the configured Asia/Dhaka business schedule (default Saturday–Thursday 09:00–18:00; Friday closed). An after-hours acknowledgement can be sent only when the persisted schedule enables it and a linked follow-up task is queued; generated replies remain drafts for human review.' },
        { h: 'Templates & AI drafts', p: 'Generated intake and staff replies are drafts for human review. The only social-channel automatic reply is a fixed after-hours acknowledgement, enabled by the persisted schedule and sent only after a linked follow-up is queued.' },
        { h: 'Private information', p: 'Keep identity, financial, and application documents in authenticated portal workflows. Access depends on the user role and organization scope; do not send sensitive files through a public chat.' },
      ],
    },
    'lead-data': {
      title: 'Lead Data Usage Policy',
      badge: 'LEGAL',
      sections: [
        { h: 'What We Collect', p: 'LeadId AE-YYYY000001 + name, phone, email, preferred country/course, budget, English test, CGPA, source, utm, notes. WhatsApp/Facebook linked to LeadOutreach + Thread.' },
        { h: 'Lawful Basis & Purpose', p: 'Consent + Legitimate interest. Used for contact attempts (3/7/14/21/25/30 day), counseling, shortlisting, visa, analytics. Never sold.' },
        { h: 'Lifecycle & Retention', p: 'New → Contact Attempted → Contacted → Consultation → Qualified → Student Created → Enrolled → Closed (25 stages). Active 24 months, closed 7 years then anonymized.' },
        { h: 'Your Rights', p: 'Access, correction, deletion, export, withdraw. Email info@aloeducation.com with Lead/Student ID. Soft-delete + audit. Response within 30 days.' },
        { h: 'B2B Attribution', p: 'TYPE1 inbound: partner provides student visibility per privacy setting. TYPE2 outbound: ALO submits with attribution. Partner sees only own records.' },
      ],
    },
    'user-guide': {
      title: 'User Guide',
      badge: 'HELP',
      sections: [
        { h: 'Student Portal', p: 'AE-YYYY000001 via OTP → complete profile → shortlist via Course Finder → upload docs privately → track Application→Offer→Deposit→CAS/I-20→Visa→Enrolled in Timeline.' },
        { h: 'Partner Portal', p: 'AEP-YYYY0000 → refer student → track applications & docs → view own commissions → message & support.' },
        { h: 'Employee / Counselor', p: 'ALO-EMP-YYYY0001 activation → dashboard SLA 30/20/10 pipeline → private notes (students never see) → attendance/leave/payroll.' },
        { h: 'Admin / Super Admin', p: 'Executive dashboard → manage users/roles/permissions (57+17) → approve universities/broadcasts → audit/health/cron/backup outside public_html.' },
        { h: 'Tips', p: 'Forgot password → OTP/email reset. Notifications Email+WhatsApp+In-App. Documents allowlist pdf/jpg/png/doc/docx 20MB random names. Health /health public.' },
      ],
    },
    accessibility: {
      title: 'Accessibility Statement',
      badge: 'ACCESSIBILITY',
      sections: [
        { h: 'Commitment', p: 'We aim for WCAG 2.1 AA across https://aloeducation.com — semantic HTML, landmarks, skip links, heading hierarchy.' },
        { h: 'Visual', p: 'Check text contrast at 4.5:1: use #0057B8 for blue text and pair #E8501A fills with black text; include alt text and support 200% zoom.' },
        { h: 'Keyboard & Screen Reader', p: 'All interactive elements via Tab/Enter/Space, visible focus ring, associated label + aria-describedby errors, NVDA/JAWS conventions.' },
        { h: 'Limitations', p: 'Third-party embeds (Maps/Facebook) may not be fully AA — we provide text address, WhatsApp 01805020100, phone fallbacks.' },
        { h: 'Feedback', p: 'Email info@aloeducation.com with URL + issue. Acknowledge within 2 working days, fix prioritized, review every 6 months.' },
      ],
    },
  }[type];

  return (
    <PublicShell title={content.title} badge={content.badge} subtitle="Last updated: 2026">
      <Card className="p-8 max-w-3xl mx-auto">
        <div className="space-y-6">
          {content.sections.map((s, i) => (
            <div key={i}>
              <h3 className="font-bold text-[var(--alo-text)] mb-2 flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {s.h}
              </h3>
              <p className="text-sm text-[var(--alo-body)] leading-relaxed pl-8">{s.p}</p>
            </div>
          ))}
        </div>
      </Card>
    </PublicShell>
  );
}

// ============================================================
// LANGUAGE PREP / ENGLISH TEST PAGE
// ============================================================
export function PublicLanguagePrepPage({ slug }: { slug: string | null }) {
  const { getTestPrepBySlug, MASTER_TEST_PREP_DATA } = require('@/lib/test-prep-data');
  const MasterTestPrepView = require('@/components/website/MasterTestPrepView').default;

  if (slug) {
    const testData = getTestPrepBySlug(slug);
    if (testData) {
      return <MasterTestPrepView test={testData} />;
    }
  }

  const tests = Object.values(MASTER_TEST_PREP_DATA);

  return (
    <PublicShell
      title="Language & Admission Test Preparation"
      badge="ALO STUDY ABROAD LANGUAGE PREPARATION CENTRE"
      subtitle="Prepare for English proficiency and admission tests with ALO Education's certified test coaches, score planners, and direct CRM integration."
      heroColor="#0057B8"
    >
      <div className="flex justify-between items-center mb-8 bg-[var(--alo-brand-pale)] p-4 rounded-2xl border border-[var(--alo-border)]">
        <div>
          <h3 className="font-bold text-[var(--alo-brand)] text-base">Comprehensive Test Preparation Directory</h3>
          <p className="text-xs text-[var(--alo-body)]">Select an exam below to explore all 28 modules, score benchmarks, fee structures, and study timelines.</p>
        </div>
        <Button asChild className="bg-[var(--alo-cta)] text-black hover:bg-[var(--alo-cta-hover)] font-bold px-5 py-2.5 rounded-xl shadow-sm"><a href="/english-test-prep">
            View All Test Prep →
          </a></Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((t: any) => (
          <Card key={t.id} className="p-6 bg-white hover:shadow-lg transition-all border-[var(--alo-border)] hover:border-[var(--alo-brand)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <Badge className="bg-[var(--alo-cta-soft)] text-[var(--alo-cta)] font-semibold text-[11px]">
                  {t.logoBadge}
                </Badge>
                <span className="text-xs font-semibold text-[var(--alo-text-muted)]">{t.quickInfo.duration}</span>
              </div>
              <h3 className="font-bold text-[var(--alo-text)] text-lg mb-1">{t.name}</h3>
              <p className="text-xs text-[var(--alo-brand)] font-semibold mb-3">{t.officialOwner}</p>
              <p className="text-xs text-[var(--alo-body)] mb-4 line-clamp-3 leading-relaxed">{t.overview.whatIsIt}</p>
            </div>

            <div className="pt-4 border-t border-[var(--alo-border)] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--alo-text-muted)] font-medium">Exam Fee in BD:</span>
                <span className="font-bold text-[var(--alo-text)]">{t.quickInfo.cost}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-[var(--alo-text-muted)] font-medium">Target Score:</span>
                <span className="font-bold text-[var(--alo-brand)]">{t.expectedScore}</span>
              </div>
              <Button asChild className="w-full bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)] font-bold py-2.5 rounded-xl"><a href={`/english-test-prep/${t.slug}`} className="block w-full">
                  Explore Full Test Prep & Modules →
                </a></Button>
            </div>
          </Card>
        ))}
      </div>
    </PublicShell>
  );
}

// ============================================================
// RESOURCES / VISA READINESS pages
// ============================================================
export function PublicResourcesPage() {
  const RESOURCES = [
    { icon: BookOpen, title: 'Blogs', desc: 'Latest insights on studying abroad, university life, and career tips.' },
    { icon: FileText, title: 'Articles', desc: 'In-depth guides on applications, visas, scholarships, and more.' },
    { icon: Award, title: 'Scholarships by Country', desc: 'Find funding opportunities for your destination.' },
    { icon: Shield, title: 'Visa Guides', desc: 'Step-by-step visa application guides for every destination.' },
    { icon: Star, title: 'Success Stories', desc: 'Read inspiring stories from students who studied abroad.' },
    { icon: FileText, title: 'Application Tips', desc: 'Expert advice on crafting winning applications.' },
    { icon: Globe, title: 'Pre-Departure Guides', desc: 'Everything you need to know before you fly.' },
    { icon: Building2, title: 'Accommodation Support', desc: 'Find safe, affordable housing abroad.' },
    { icon: Award, title: 'Financial Planning', desc: 'Budget, banking, and funding strategies.' },
    { icon: BookOpen, title: 'FAQs', desc: 'Quick answers to common questions.' },
  ];
  return (
    <PublicShell
      title="Resources"
      badge="KNOWLEDGE HUB"
      subtitle="Comprehensive resources to guide your study abroad journey."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {RESOURCES.map((r, i) => {
          const Icon = r.icon;
          return (
            <Card key={i} className="p-6 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-[var(--alo-brand-pale)] flex items-center justify-center mb-4">
                <Icon className="h-6 w-6 text-[var(--alo-brand)]" />
              </div>
              <h3 className="font-bold text-[var(--alo-text)] mb-2">{r.title}</h3>
              <p className="text-sm text-[var(--alo-body)]">{r.desc}</p>
            </Card>
          );
        })}
      </div>
    </PublicShell>
  );
}

/**
 * Visa readiness overview.
 *
 * Rebuilt on COUNTRY_DESTINATIONS: the previous version hard-coded visa fees
 * (£490, $350, CA$150, A$710) and processing windows with no source and no
 * verification date, which the data policy does not allow. Those figures are
 * gone rather than re-cited, because the verified dataset does not carry a
 * fee or processing-time field to cite.
 *
 * Only destinations that actually hold a visa record are listed; anything else
 * says so explicitly instead of being padded out.
 */
export function PublicVisaReadinessPage() {
  const destinations = Object.values(COUNTRY_DESTINATIONS)
    .filter((country) => Array.isArray(country.visaSteps) && country.visaSteps.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));

  const unverifiedCount = Object.keys(COUNTRY_DESTINATIONS).length - destinations.length;

  return (
    <PublicShell
      title="Visa Readiness"
      badge="VISA PREPARATION"
      subtitle="Verified student visa routes by destination, each with the official source it was checked against."
    >
      {destinations.length === 0 ? (
        <Card className="p-8 text-center">
          <h3 className="text-lg font-bold text-[var(--alo-text)] mb-2">Visa information is currently being verified</h3>
          <p className="text-sm text-[var(--alo-body)]">
            We only publish visa guidance once it has been checked against an official source. Talk to a counselor
            about your destination in the meantime.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {destinations.map((country) => {
            const visaSources = country.sources.filter((source) =>
              /visa|immigration|entry/i.test(source.section) || /visa|immigration|entry/i.test(source.sourceName)
            );
            return (
              <Card key={country.slug} className="p-6">
                <h3 className="text-xl font-bold mb-1 text-[var(--alo-text)]">{country.name}</h3>
                <p className="text-xs text-[var(--alo-text-muted)] mb-4">
                  {country.lastVerifiedAt
                    ? `Verified ${country.lastVerifiedAt}`
                    : 'Verification date not recorded'}
                </p>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-[var(--alo-text-muted)]">Visa route: </span>
                    <span className="font-semibold">{country.visaType}</span>
                  </div>
                  <div>
                    <span className="text-[var(--alo-text-muted)]">Steps recorded: </span>
                    <span className="font-semibold">{country.visaSteps.length}</span>
                  </div>
                  {country.workRights && (
                    <div>
                      <span className="text-[var(--alo-text-muted)]">Work rights: </span>
                      <span className="font-semibold">{country.workRights}</span>
                    </div>
                  )}
                </div>
                {visaSources.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-[var(--alo-border)]">
                    <p className="text-xs font-semibold text-[var(--alo-text-muted)] mb-1.5">Official sources</p>
                    <ul className="space-y-1">
                      {visaSources.slice(0, 3).map((source) => (
                        <li key={source.sourceUrl} className="text-xs">
                          <a
                            href={source.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[var(--alo-brand)] hover:underline"
                          >
                            {source.sourceName}
                          </a>
                          <span className="text-[var(--alo-text-muted)]"> · checked {source.lastVerifiedAt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <a
                  href={`/destinations/${country.slug}`}
                  className="mt-4 inline-block text-sm font-semibold text-[var(--alo-brand)] hover:underline"
                >
                  View full {country.name} guide
                </a>
              </Card>
            );
          })}
        </div>
      )}

      {unverifiedCount > 0 && (
        <p className="text-xs text-[var(--alo-text-muted)] mb-6">
          {unverifiedCount} other destination{unverifiedCount === 1 ? '' : 's'} we work with{' '}
          {unverifiedCount === 1 ? 'is' : 'are'} not listed here yet because the visa information has not been
          verified against an official source.
        </p>
      )}

      <Card className="p-8 bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-brand-hover)] text-white text-center">
        <h3 className="text-2xl font-bold mb-2">Need Visa Help?</h3>
        <p className="text-[var(--alo-brand-pale)] mb-5">
          Fees, processing times and document rules change and differ by nationality. A counselor checks the current
          requirements for your case against the official source.
        </p>
        <Button asChild className="bg-[var(--alo-cta)] text-black hover:brightness-110">
          <a href="/book-consultation">Book Visa Consultation</a>
        </Button>
      </Card>
    </PublicShell>
  );
}

export function PublicCourseDetail({ slug }: { slug: string | null }) {
  return (
    <PublicShell
      title={`Course Details: ${slug ? slug.replace(/-/g, ' ').toUpperCase() : 'Overview'}`}
      badge="COURSE CATALOGUE"
      subtitle="Full entry criteria, IELTS score requirements, tuition fees, and application guidance."
    >
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-bold text-[var(--alo-text)] mb-3">Program Overview</h3>
            <p className="text-[var(--alo-body)] text-sm leading-relaxed mb-4">
              Detailed entry requirements, academic prerequisites, English language waivers, deposit requirements, and post-study career opportunities for international students.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-[var(--alo-border)]">
              <div>
                <p className="text-xs text-[var(--alo-text-muted)] font-medium">Study Level</p>
                <p className="text-sm font-semibold text-[var(--alo-text)]">Undergraduate / Postgraduate Taught</p>
              </div>
              <div>
                <p className="text-xs text-[var(--alo-text-muted)] font-medium">Duration</p>
                <p className="text-sm font-semibold text-[var(--alo-text)]">1 to 3 Years (Full-Time)</p>
              </div>
              <div>
                <p className="text-xs text-[var(--alo-text-muted)] font-medium">English Language Requirement</p>
                <p className="text-sm font-semibold text-[var(--alo-brand)]">IELTS 6.5 (Min 6.0 components)</p>
              </div>
              <div>
                <p className="text-xs text-[var(--alo-text-muted)] font-medium">Application Deadline</p>
                <p className="text-sm font-semibold text-[var(--alo-cta)]">Open for Upcoming Intake</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-bold text-[var(--alo-text)] mb-3">Academic Entry Requirements</h3>
            <ul className="space-y-2 text-sm text-[var(--alo-body)] list-disc list-inside">
              <li>High School Certificate (HSC) / A-Levels or Bachelor's Degree from a recognized institution.</li>
              <li>Minimum GPA equivalent: 3.0 / 4.0 or 60% overall score.</li>
              <li>Proof of English Proficiency (IELTS Academic, PTE, Duolingo, or MOI letter where accepted).</li>
              <li>Valid Passport & Statement of Purpose (SOP).</li>
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 border-2 border-[var(--alo-brand)]/20 bg-gradient-to-br from-blue-50/30 to-white">
            <h3 className="font-bold text-[var(--alo-text)] mb-2 text-lg">Apply for this Course</h3>
            <p className="text-xs text-[var(--alo-body)] mb-4 leading-relaxed">
              Start your application with ALO Education for full application support and visa counseling.
            </p>
            <div className="space-y-2.5">
              <Button asChild className="w-full bg-[var(--alo-cta)] text-black hover:brightness-110 py-2.5"><a href="/eligibility-check" className="block w-full">
                  Check Your Eligibility
                </a></Button>
              <Button asChild variant="outline" className="w-full py-2.5 border-[var(--alo-brand)] text-[var(--alo-brand)] hover:bg-[var(--alo-brand-pale)]"><a href="/book-consultation" className="block w-full">
                  Talk to ALO Counselor
                </a></Button>
            </div>
          </Card>

          <TestPreparationMiniCard
            contextTitle="Need English Preparation for this Course?"
            recommendedTest="IELTS 6.5 / PTE 58+"
            targetScore="Minimum Band 6.0 in each skill"
          />
        </div>
      </div>
    </PublicShell>
  );
}

export function PublicComparePage() {
  return (
    <PublicShell
      title="Course & University Comparison Matrix"
      badge="SHORTLIST COMPARISON"
      subtitle="Compare up to 4 courses side-by-side on tuition, IELTS scores, duration, and post-study work rights."
    >
      <Card className="p-8 space-y-4">
        <h3 className="text-xl font-bold text-[var(--alo-text)]">Side-by-Side Comparison</h3>
        <p className="text-[var(--alo-body)] text-sm">
          Select courses from the Course Finder to evaluate entry requirements, scholarships, and deposit deadlines.
        </p>
        <div className="pt-4 flex gap-3">
          <Button asChild className="bg-[var(--alo-cta)] text-black "><a href="/course-finder">Add Courses to Compare</a></Button>
        </div>
      </Card>
    </PublicShell>
  );
}
