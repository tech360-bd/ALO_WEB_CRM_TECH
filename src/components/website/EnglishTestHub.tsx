'use client';

/**
 * English Test Hub — /english-tests
 *
 * Lists every English and standardised test ALO supports. All content comes
 * from /api/language-prep/tests (real database rows, falling back to the
 * verified dataset in src/lib/language-prep/data.ts). Nothing here is
 * invented: where a provider figure is not verified, the record itself says
 * "Check current provider information" and we render it verbatim.
 */

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, CalendarClock, Clock, ExternalLink, Filter, FileText,
  Gauge, Globe2, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AsyncBlock, BreadcrumbTrail, DataDisclaimer, PageHeading, Panel,
  PublicFrame, Reveal, StatusPill, VerificationNote, formatDate,
  type AsyncState,
} from './alo-public-primitives';
import { cn } from '@/lib/utils';

interface EnglishTestRecord {
  id: string;
  name: string;
  slug: string;
  shortName: string;
  shortDescription: string;
  longDescription: string;
  testType: 'english_proficiency' | 'academic' | 'moi_guidance' | 'professional';
  provider: string;
  officialUrl: string;
  format: string;
  durationMinutes: number;
  durationDisplay: string;
  scoringSystem: string;
  resultTimeline: string;
  costSummary: string;
  validitySummary: string;
  bestFor: string;
  acceptanceSummary: string;
  difficultyLevel: string;
  isPopular: boolean;
  isFeatured: boolean;
  sourceUrl: string;
  sourceName: string;
  verificationStatus: 'verified' | 'pending' | 'needs_review';
  lastVerifiedAt?: string;
}

const TYPE_LABELS: Record<EnglishTestRecord['testType'], string> = {
  english_proficiency: 'English Proficiency',
  academic: 'Academic / Admissions',
  professional: 'Professional',
  moi_guidance: 'MOI Guidance',
};

const TYPE_TONES: Record<EnglishTestRecord['testType'], 'info' | 'success' | 'warning' | 'neutral'> = {
  english_proficiency: 'info',
  academic: 'success',
  professional: 'warning',
  moi_guidance: 'neutral',
};

const VERIFICATION_TONES = {
  verified: 'success',
  pending: 'warning',
  needs_review: 'warning',
} as const;

const VERIFICATION_LABELS = {
  verified: 'Verified',
  pending: 'Verification pending',
  needs_review: 'Needs review',
} as const;

export default function EnglishTestHub() {
  const [state, setState] = useState<AsyncState<EnglishTestRecord[]>>({ status: 'loading' });
  const [query, setQuery] = useState('');
  const [type, setType] = useState<string>('all');

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const res = await fetch('/api/language-prep/tests', { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `The service responded with status ${res.status}.`);
      }
      const tests: EnglishTestRecord[] = Array.isArray(json.tests) ? json.tests : [];
      setState({ status: 'ready', data: tests });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'The request could not be completed.',
        onRetry: load,
      });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const tests = state.status === 'ready' ? state.data : [];

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tests.filter((test) => {
      if (type !== 'all' && test.testType !== type) return false;
      if (!needle) return true;
      return [test.name, test.shortName, test.shortDescription, test.provider, test.bestFor]
        .join(' ')
        .toLowerCase()
        .includes(needle);
    });
  }, [tests, query, type]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const test of tests) counts[test.testType] = (counts[test.testType] ?? 0) + 1;
    return counts;
  }, [tests]);

  // The newest verification date across the whole catalogue is the only
  // "last verified" claim we make on this page.
  const latestVerification = useMemo(() => {
    const dates = tests.map((t) => t.lastVerifiedAt).filter(Boolean) as string[];
    if (dates.length === 0) return null;
    return dates.sort().at(-1) ?? null;
  }, [tests]);

  const activeFilters = query.trim().length > 0 || type !== 'all';

  return (
    <div className="min-h-screen bg-alo-page pb-20">
      <div className="border-b border-alo-border bg-white">
        <PublicFrame className="py-10 sm:py-14">
          <BreadcrumbTrail items={[{ label: 'Home', href: '/' }, { label: 'English Tests' }]} />
          <PageHeading
            eyebrow="English Test Hub"
            title="Choose the right English test for your destination"
            lede="Compare format, scoring, duration and acceptance for IELTS, IELTS UKVI, PTE Academic, TOEFL iBT, Duolingo, OET, LanguageCert, Oxford ELLT, OIETC, GRE, GMAT, SAT and more — then see what each destination actually requires."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="h-12 rounded-button bg-alo-cta px-5 text-[14px] font-semibold text-white hover:bg-alo-cta-hover">
              <Link href="/language-prep/comparison">
                Compare Tests <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold">
              <Link href="/book-consultation">Book Free Consultation</Link>
            </Button>
          </div>
        </PublicFrame>
      </div>

      <PublicFrame className="py-10">
        {/* Filters */}
        <Panel className="mb-8 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_240px_auto]">
            <div className="space-y-1.5">
              <Label htmlFor="english-test-search" className="text-[13px] font-semibold text-alo-text">
                Search tests
              </Label>
              <Input
                id="english-test-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="IELTS, PTE, Duolingo, provider…"
                className="h-12 rounded-input border-alo-border"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="english-test-type" className="text-[13px] font-semibold text-alo-text">
                Test type
              </Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="english-test-type" className="h-12 w-full rounded-input border-alo-border">
                  <Filter className="mr-2 h-4 w-4 text-alo-text-muted" aria-hidden="true" />
                  <SelectValue placeholder="All test types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All test types ({tests.length})</SelectItem>
                  {(Object.keys(TYPE_LABELS) as EnglishTestRecord['testType'][])
                    .filter((key) => typeCounts[key])
                    .map((key) => (
                      <SelectItem key={key} value={key}>
                        {TYPE_LABELS[key]} ({typeCounts[key]})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {activeFilters && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-button border-alo-border px-5 text-[14px] font-semibold sm:w-auto"
                  onClick={() => {
                    setQuery('');
                    setType('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </Panel>

        <AsyncBlock
          state={
            state.status === 'ready' && filtered.length === 0
              ? {
                  status: 'empty',
                  title: 'No tests match your current filters.',
                  description: 'Try a different search term, or clear the filters to see every English and standardised test we support.',
                  action: (
                    <Button
                      variant="outline"
                      className="mt-2 h-11 rounded-button border-alo-border px-5 text-[14px] font-semibold"
                      onClick={() => {
                        setQuery('');
                        setType('all');
                      }}
                    >
                      Clear Filters
                    </Button>
                  ),
                }
              : state
          }
          errorTitle="We couldn't load the English test catalogue."
          loadingRows={6}
        >
          {(records) => (
            <>
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[14px] text-alo-text-secondary">
                  Showing <span className="font-semibold text-alo-navy">{filtered.length}</span> of {records.length} tests
                </p>
                <VerificationNote lastVerifiedAt={latestVerification} />
              </div>

              <ul className="grid gap-4 lg:grid-cols-2">
                {filtered.map((test, index) => (
                  <li key={test.id}>
                    <Reveal delay={Math.min(index, 6) * 40} className="h-full">
                      <TestCard test={test} />
                    </Reveal>
                  </li>
                ))}
              </ul>
            </>
          )}
        </AsyncBlock>

        {/* Next steps */}
        <Panel className="mt-10 p-6 sm:p-8">
          <h2 className="text-h3 font-bold tracking-[-0.02em] text-alo-navy">Not sure which test to take?</h2>
          <p className="mt-2 max-w-[720px] text-[15px] leading-relaxed text-alo-text-secondary">
            Acceptance depends on the country, the visa route, the university and the specific course. Tell us your
            destination and profile and we will confirm exactly which test and score you need before you book anything.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button asChild className="h-12 rounded-button bg-alo-cta px-5 text-[14px] font-semibold text-white hover:bg-alo-cta-hover">
              <Link href="/eligibility-check">Check My Eligibility</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold">
              <Link href="/compare/countries">Compare Countries</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold">
              <Link href="/language-prep">Explore Test Preparation</Link>
            </Button>
          </div>
        </Panel>

        <DataDisclaimer className="mt-6" />
      </PublicFrame>
    </div>
  );
}

function TestCard({ test }: { test: EnglishTestRecord }) {
  const verified = formatDate(test.lastVerifiedAt);
  return (
    <Panel className="flex h-full flex-col p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-alo-navy">{test.name}</h3>
          <p className="mt-1 text-[13px] text-alo-text-muted">{test.provider}</p>
        </div>
        <StatusPill tone={TYPE_TONES[test.testType]} label={TYPE_LABELS[test.testType]} showIcon={false} />
      </div>

      <p className="mt-3 text-[14px] leading-relaxed text-alo-text-secondary">{test.shortDescription}</p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-alo-border pt-4 text-[13px]">
        <Fact icon={Clock} label="Duration" value={test.durationDisplay} />
        <Fact icon={Gauge} label="Scoring" value={test.scoringSystem} />
        <Fact icon={Layers} label="Format" value={test.format} />
        <Fact icon={CalendarClock} label="Results" value={test.resultTimeline} />
        <Fact icon={Globe2} label="Best for" value={test.bestFor} className="col-span-2" />
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-alo-border pt-4">
        <StatusPill
          tone={VERIFICATION_TONES[test.verificationStatus]}
          label={VERIFICATION_LABELS[test.verificationStatus]}
        />
        {verified && <span className="text-[12px] text-alo-text-muted">Verified: {verified}</span>}
      </div>

      <div className="mt-5 flex flex-wrap gap-2 pt-1 lg:mt-auto">
        <Button asChild className="h-12 rounded-button bg-alo-brand px-4 text-[14px] font-semibold text-white hover:bg-alo-brand-hover">
          <Link href={`/english-tests/${test.slug}`}>
            View Test Guide <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 rounded-button border-alo-border px-4 text-[14px] font-semibold">
          <Link href={`/language-prep/${test.slug}`}>Preparation Plan</Link>
        </Button>
        {test.officialUrl && (
          <Button asChild variant="ghost" className="h-12 rounded-button px-3 text-[13px] font-semibold text-alo-text-secondary">
            <a href={test.officialUrl} target="_blank" rel="noopener noreferrer nofollow">
              <FileText className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Official
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </Button>
        )}
      </div>

      <p className={cn('mt-4 text-[12px] leading-relaxed text-alo-text-muted')}>
        Source: {test.sourceName} · Acceptance varies by university, course and visa route.
      </p>
    </Panel>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.06em] text-alo-text-muted">
        <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-[13px] leading-snug text-alo-text">{value}</dd>
    </div>
  );
}
