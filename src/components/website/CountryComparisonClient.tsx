'use client';

/**
 * Country comparison UI — /compare/countries
 *
 * The matrix itself is computed server-side (see src/lib/country-comparison.ts)
 * from verified country records; this component only handles selection, URL
 * state, export and rendering. Selecting a country never invents a value:
 * anything the source does not carry renders as an explicit "Not published".
 */

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCallback, useMemo } from 'react';
import { ArrowRight, Check, Download, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  BreadcrumbTrail, DataDisclaimer, PageHeading, Panel, PanelHeader,
  PublicFrame, StatusPill, VerificationNote, formatDate,
} from './alo-public-primitives';
import type { CountryComparisonModel, ComparisonCountry } from '@/lib/country-comparison';
import { MAX_COMPARISON } from '@/lib/country-comparison';
import { cn } from '@/lib/utils';

export default function CountryComparisonClient({
  allCountries,
  model,
}: {
  allCountries: ComparisonCountry[];
  model: CountryComparisonModel;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSlugs = useMemo(
    () => (searchParams.get('countries')?.split(',').filter(Boolean) ?? []).slice(0, MAX_COMPARISON),
    [searchParams],
  );

  const countries = model.countries;
  const atLimit = selectedSlugs.length >= MAX_COMPARISON;

  const setSelection = useCallback(
    (next: string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.length > 0) params.set('countries', next.join(','));
      else params.delete('countries');
      router.replace(`/compare/countries${params.toString() ? `?${params.toString()}` : ''}`, { scroll: false });
    },
    [router, searchParams],
  );

  const toggle = useCallback(
    (slug: string) => {
      setSelection(
        selectedSlugs.includes(slug)
          ? selectedSlugs.filter((item) => item !== slug)
          : [...selectedSlugs, slug].slice(0, MAX_COMPARISON),
      );
    },
    [selectedSlugs, setSelection],
  );

  const exportCsv = useCallback(() => {
    const header = ['Comparison', ...countries.map((country) => country.name)];
    const lines = [header];
    for (const row of model.rows) {
      lines.push([
        row.label,
        ...countries.map((country) => formatValue(row.values[country.slug])),
      ]);
    }
    const csv = lines
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `alo-country-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [countries, model.rows]);

  return (
    <div className="min-h-screen bg-alo-page pb-20">
      <div className="border-b border-alo-border bg-white">
        <PublicFrame className="py-10 sm:py-14">
          <BreadcrumbTrail
            items={[
              { label: 'Home', href: '/' },
              { label: 'Destinations', href: '/destinations' },
              { label: 'Compare Countries' },
            ]}
          />
          <PageHeading
            eyebrow="Destination Intelligence"
            title="Compare study destinations side by side"
            lede={`Pick up to ${MAX_COMPARISON} countries to compare tuition, living costs, visa type, work rights, intakes and English requirements from verified sources.`}
          />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-[13px] text-alo-text-secondary">
              <span className="font-semibold text-alo-navy">{selectedSlugs.length}</span> of {MAX_COMPARISON} selected
            </span>
            {countries.length > 0 && (
              <Button
                variant="outline"
                onClick={exportCsv}
                className="h-10 rounded-button border-alo-border px-4 text-[13px] font-semibold"
              >
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Download Comparison
              </Button>
            )}
            {model.oldestVerification && (
              <VerificationNote lastVerifiedAt={model.oldestVerification} />
            )}
          </div>
        </PublicFrame>
      </div>

      <PublicFrame className="py-10">
        {/* Selector */}
        <Panel className="mb-8">
          <PanelHeader
            title="Select destinations"
            description={`Choose up to ${MAX_COMPARISON} countries. Rows without verified data are hidden rather than estimated.`}
          />
          <div className="p-4 sm:p-5">
            <ul className="flex flex-wrap gap-2">
              {allCountries.map((country) => {
                const isSelected = selectedSlugs.includes(country.slug);
                const disabled = !isSelected && atLimit;
                return (
                  <li key={country.slug}>
                    <button
                      type="button"
                      onClick={() => toggle(country.slug)}
                      disabled={disabled}
                      aria-pressed={isSelected}
                      className={cn(
                        'inline-flex h-11 items-center gap-2 rounded-button border px-3.5 text-[14px] font-medium transition-colors',
                        isSelected
                          ? 'border-alo-brand bg-alo-brand-light text-alo-brand-deep'
                          : 'border-alo-border bg-white text-alo-text hover:border-alo-brand-border hover:bg-alo-brand-light/50',
                        disabled && 'cursor-not-allowed opacity-45 hover:border-alo-border hover:bg-white',
                      )}
                    >
                      <span aria-hidden="true">{country.flag}</span>
                      {country.name}
                      {isSelected ? (
                        <Check className="h-4 w-4 text-alo-brand" aria-hidden="true" />
                      ) : (
                        <Plus className="h-4 w-4 text-alo-text-muted" aria-hidden="true" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
            {atLimit && (
              <p className="mt-3 text-[13px] text-alo-text-muted">
                You have reached the {MAX_COMPARISON}-country limit. Deselect a country to choose another.
              </p>
            )}
          </div>
        </Panel>

        {/* Matrix */}
        {countries.length === 0 ? (
          <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <h2 className="text-[18px] font-semibold text-alo-navy">No countries selected yet</h2>
            <p className="max-w-[520px] text-[14px] text-alo-text-secondary">
              Choose two or more destinations above to build a side-by-side comparison of costs, visa rules and
              entry requirements.
            </p>
            <Button
              className="mt-2 h-11 rounded-button bg-alo-cta px-5 text-[14px] font-semibold text-white hover:bg-alo-cta-hover"
              onClick={() => setSelection(allCountries.slice(0, 2).map((country) => country.slug))}
            >
              Compare the two most popular destinations
            </Button>
          </Panel>
        ) : (
          <Panel className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Side-by-side comparison of selected study destinations
                </caption>
                <thead>
                  <tr className="border-b border-alo-border bg-alo-surface-muted">
                    <th scope="col" className="sticky left-0 z-10 min-w-[180px] bg-alo-surface-muted px-5 py-4 text-[13px] font-semibold text-alo-navy">
                      Comparison
                    </th>
                    {countries.map((country) => (
                      <th key={country.slug} scope="col" className="min-w-[240px] px-5 py-4 align-top">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="flex items-center gap-2 text-[15px] font-semibold text-alo-navy">
                              <span aria-hidden="true">{country.flag}</span>
                              {country.name}
                            </span>
                            <span className="mt-0.5 block text-[12px] font-normal text-alo-text-muted">
                              {country.currency}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggle(country.slug)}
                            aria-label={`Remove ${country.name} from comparison`}
                            className="rounded-button p-1 text-alo-text-muted transition-colors hover:bg-alo-surface-muted hover:text-alo-error"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                        <Link
                          href={`/destinations/${country.slug}`}
                          className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-alo-brand hover:underline"
                        >
                          Explore {country.name}
                          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {model.rows.map((row, index) => (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-b border-alo-border last:border-b-0',
                        index % 2 === 1 && 'bg-alo-surface-muted/40',
                      )}
                    >
                      <th scope="row" className="sticky left-0 z-10 bg-inherit px-5 py-4 text-left align-top">
                        <span className="block text-[14px] font-semibold text-alo-navy">{row.label}</span>
                        {row.hint && <span className="mt-1 block text-[12px] font-normal text-alo-text-muted">{row.hint}</span>}
                      </th>
                      {countries.map((country) => (
                        <td key={country.slug} className="px-5 py-4 align-top">
                          <ComparisonCell value={row.values[country.slug]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )}

        {/* Sources */}
        {model.sources.length > 0 && (
          <Panel className="mt-8">
            <PanelHeader title="Sources" description="Every comparison row traces back to one of these published sources." />
            <ul className="divide-y divide-alo-border">
              {model.sources.map((source, index) => (
                <li key={`${source.country}-${source.sourceUrl}-${index}`} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-5 py-3.5 sm:px-6">
                  <span className="text-[14px] font-medium text-alo-navy">{source.country}</span>
                  <span className="text-[13px] text-alo-text-secondary">{source.section} —</span>
                  <a
                    href={source.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-[13px] font-medium text-alo-brand hover:underline"
                  >
                    {source.sourceName}
                  </a>
                  <span className="ml-auto text-[12px] text-alo-text-muted">
                    Verified: {formatDate(source.lastVerifiedAt) ?? '—'}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        )}

        <Panel className="mt-8 flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-alo-navy">Found a destination that fits?</h2>
            <p className="mt-1 text-[14px] text-alo-text-secondary">
              See the universities and courses available there, or let an advisor shortlist them for your profile.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-12 rounded-button bg-alo-cta px-5 text-[14px] font-semibold text-white hover:bg-alo-cta-hover">
              <Link href="/course-finder">Find My Course</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold">
              <Link href="/eligibility-check">Check Eligibility</Link>
            </Button>
          </div>
        </Panel>

        <DataDisclaimer className="mt-6" />
      </PublicFrame>
    </div>
  );
}

function ComparisonCell({ value }: { value: string | string[] | null | undefined }) {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] text-alo-text-muted">
        <StatusPill tone="neutral" label="Not published" showIcon={false} />
      </span>
    );
  }

  if (Array.isArray(value)) {
    return (
      <ul className="flex flex-wrap gap-1.5">
        {value.map((item) => (
          <li
            key={item}
            className="rounded-button border border-alo-border bg-alo-surface-muted px-2 py-0.5 text-[12px] font-medium text-alo-text-secondary"
          >
            {item}
          </li>
        ))}
      </ul>
    );
  }

  return <span className="block text-[14px] leading-relaxed text-alo-text">{value}</span>;
}

function formatValue(value: string | string[] | null | undefined): string {
  if (value === null || value === undefined) return 'Not published';
  if (Array.isArray(value)) return value.join('; ');
  return value;
}
