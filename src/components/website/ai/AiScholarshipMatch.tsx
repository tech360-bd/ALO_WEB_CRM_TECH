'use client';

/**
 * AI Scholarship Match — /ai/scholarship-match
 *
 * Ranking comes from src/lib/scholarship-match.ts via
 * POST /api/ai/scholarship-match — a deterministic scorer over published
 * scholarship records. No language model, and no award probability is ever
 * estimated: a score means "your declared profile aligns with the published
 * eligibility fields", nothing more.
 */

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Award, CheckCircle2, CircleAlert, Info, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AiToolShell } from '../ai-tool-shell';
import {
  AsyncBlock, Panel, PanelHeader, StatusPill, formatDate, type AsyncState,
} from '../alo-public-primitives';
import { cn } from '@/lib/utils';

interface Criterion {
  label: string;
  state: 'matched' | 'not_matched' | 'unknown';
  published?: string;
  declared?: string;
  note?: string;
}

interface MatchedScholarship {
  scholarship: {
    id: string;
    slug: string;
    name: string;
    country: string;
    university: string;
    fundingAmount: string;
    fundingType: string;
    deadline: string;
    deadlineDate: string | null;
    officialSourceUrl: string;
    officialSourceName: string;
    verificationStatus: string;
    lastVerifiedAt: string | null;
  };
  matchScore: number;
  criteria: Criterion[];
  concerns: string[];
  openForApplications: boolean | null;
}

const STUDY_LEVELS = ['Foundation', 'Undergraduate', 'Postgraduate', 'PhD'];
const FUNDING_TYPES = [
  { value: 'full', label: 'Full funding' },
  { value: 'partial', label: 'Partial / tuition waiver' },
  { value: 'stipend', label: 'Living stipend' },
];

const INITIAL = {
  studyLevel: '',
  subject: '',
  countries: '',
  fundingType: '',
  nationality: '',
};

export default function AiScholarshipMatch({
  countries,
}: {
  countries: { slug: string; name: string; flag: string }[];
}) {
  const [form, setForm] = useState(INITIAL);
  const [selected, setSelected] = useState<string[]>([]);
  const [state, setState] = useState<AsyncState<{ matches: MatchedScholarship[]; disclaimer: string }>>({
    status: 'empty',
    title: 'No scholarship search run yet',
    description: 'Tell us your study level, subject and destination to search the verified scholarship database.',
  });

  const update = <K extends keyof typeof INITIAL>(key: K, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleCountry = (slug: string) =>
    setSelected((current) =>
      current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
    );

  const run = async () => {
    setState({ status: 'loading' });
    try {
      const response = await fetch('/api/ai/scholarship-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studyLevel: form.studyLevel || undefined,
          subject: form.subject || undefined,
          fundingType: form.fundingType || undefined,
          nationality: form.nationality || undefined,
          countries: selected.length > 0 ? selected : undefined,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json?.success) {
        throw new Error(json?.error || `The scholarship service responded with status ${response.status}.`);
      }
      const matches: MatchedScholarship[] = Array.isArray(json.matches) ? json.matches : [];
      if (matches.length === 0) {
        setState({
          status: 'empty',
          title: 'No scholarships matched this profile.',
          description:
            'Our verified scholarship database has no open award matching these filters yet. Widen your destination or study level, or ask an advisor about institution-specific funding we can request on your behalf.',
          action: (
            <Button asChild variant="outline" className="mt-2 h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold">
              <Link href="/scholarships">Browse all scholarships</Link>
            </Button>
          ),
        });
        return;
      }
      setState({ status: 'ready', data: { matches, disclaimer: json.disclaimer } });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'The request could not be completed.',
        onRetry: () => void run(),
      });
    }
  };

  return (
    <AiToolShell
      eyebrow="AI Scholarship Match"
      title="Find funding you are actually eligible for"
      lede="Search the verified scholarship database against your study level, subject, destination and nationality — then see exactly which published eligibility criterion you meet and which you do not."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'AI Tools' },
        { label: 'Scholarship Match' },
      ]}
      howItWorks={[
        { title: 'You describe your profile', description: 'Level, subject, destination, funding preference and nationality.' },
        { title: 'Published criteria are checked', description: 'Each award is compared field by field against what its provider publishes.' },
        { title: 'You see the evidence', description: 'Matched, not matched and unpublished criteria are shown separately — nothing is guessed.' },
      ]}
      method="Matches are produced by a deterministic rule set (src/lib/scholarship-match.ts) running over published scholarship records. Criteria an award does not publish are marked as unknown rather than assumed to be met."
      disclaimer="A match score reflects how closely your declared profile aligns with published eligibility fields. It is not a prediction that you will receive the award, and it is not a guarantee of funding. Always confirm eligibility, deadlines and required documents with the official source before applying."
      sidebar={
        <Panel className="p-5">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-alo-navy">
            <Award className="h-4 w-4 text-alo-ai" aria-hidden="true" />
            Open awards come first
          </h2>
          <p className="mt-2 text-[13px] leading-relaxed text-alo-text-secondary">
            Results are ordered so awards with an open application window appear above closed or
            undated ones, then by how closely your profile matches the published criteria.
          </p>
          <Button asChild variant="outline" className="mt-4 h-12 w-full rounded-button border-alo-border text-[13px] font-semibold">
            <Link href="/scholarships">Browse the full scholarship database</Link>
          </Button>
        </Panel>
      }
    >
      <Panel>
        <PanelHeader title="Your profile" description="Every field is optional — add more to narrow the results." />
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <Label htmlFor="sm-level" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Study level</Label>
            <Select value={form.studyLevel} onValueChange={(value) => update('studyLevel', value)}>
              <SelectTrigger id="sm-level" className="h-12 w-full rounded-input border-alo-border">
                <SelectValue placeholder="Any level" />
              </SelectTrigger>
              <SelectContent>
                {STUDY_LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sm-subject" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Subject</Label>
            <Input
              id="sm-subject"
              value={form.subject}
              onChange={(event) => update('subject', event.target.value)}
              placeholder="Public Health"
              className="h-12 rounded-input border-alo-border"
            />
          </div>

          <div>
            <Label htmlFor="sm-funding" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Funding preference</Label>
            <Select value={form.fundingType} onValueChange={(value) => update('fundingType', value)}>
              <SelectTrigger id="sm-funding" className="h-12 w-full rounded-input border-alo-border">
                <SelectValue placeholder="Any funding type" />
              </SelectTrigger>
              <SelectContent>
                {FUNDING_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="sm-nationality" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Nationality</Label>
            <Input
              id="sm-nationality"
              value={form.nationality}
              onChange={(event) => update('nationality', event.target.value)}
              placeholder="Bangladeshi"
              className="h-12 rounded-input border-alo-border"
            />
          </div>

          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-semibold text-alo-text">Destinations</span>
            <ul className="flex flex-wrap gap-2">
              {countries.map((country) => {
                const isSelected = selected.includes(country.slug);
                return (
                  <li key={country.slug}>
                    <button
                      type="button"
                      onClick={() => toggleCountry(country.slug)}
                      aria-pressed={isSelected}
                      className={cn(
                        'inline-flex h-10 items-center gap-2 rounded-button border px-3 text-[13px] font-medium transition-colors',
                        isSelected
                          ? 'border-alo-brand bg-alo-brand-light text-alo-brand-deep'
                          : 'border-alo-border bg-white text-alo-text hover:border-alo-brand-border',
                      )}
                    >
                      <span aria-hidden="true">{country.flag}</span>
                      {country.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="sm:col-span-2 border-t border-alo-border pt-5">
            <Button
              onClick={() => void run()}
              className="h-12 rounded-button bg-alo-cta px-6 text-[15px] font-semibold text-black hover:bg-alo-cta-hover"
            >
              {state.status === 'loading' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Searching…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />Find Scholarships</>
              )}
            </Button>
          </div>
        </div>
      </Panel>

      <div className="mt-8">
        <AsyncBlock state={state} loadingRows={4} errorTitle="We couldn't search the scholarship database.">
          {(data) => (
            <>
              <h2 className="mb-4 text-h3 font-bold tracking-[-0.02em] text-alo-navy">
                {data.matches.length} scholarship{data.matches.length === 1 ? '' : 's'} found
              </h2>
              <ul className="space-y-4">
                {data.matches.map((match) => (
                  <li key={match.scholarship.id}>
                    <ScholarshipCard match={match} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </AsyncBlock>
      </div>
    </AiToolShell>
  );
}

const STATE_META = {
  matched: { tone: 'success', label: 'Matched', icon: CheckCircle2 },
  not_matched: { tone: 'danger', label: 'Not matched', icon: CircleAlert },
  unknown: { tone: 'neutral', label: 'Not published', icon: Info },
} as const;

function ScholarshipCard({ match }: { match: MatchedScholarship }) {
  const { scholarship } = match;
  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-alo-border p-5 sm:p-6">
        <div className="min-w-0">
          <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-alo-navy">{scholarship.name}</h3>
          <p className="mt-1 text-[14px] text-alo-text-secondary">
            {[scholarship.university, scholarship.country].filter(Boolean).join(' · ') || 'Provider not published'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {scholarship.fundingAmount && <StatusPill tone="info" label={scholarship.fundingAmount} showIcon={false} />}
            {scholarship.fundingType && <StatusPill tone="neutral" label={scholarship.fundingType.replace(/_/g, ' ')} showIcon={false} />}
            {match.openForApplications === true && <StatusPill tone="success" label="Open for applications" />}
            {match.openForApplications === false && <StatusPill tone="danger" label="Deadline passed" />}
            {match.openForApplications === null && <StatusPill tone="neutral" label="Deadline not published" />}
          </div>
        </div>
        <div className="text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-alo-text-muted">Match</p>
          <p className={cn(
            'text-[30px] font-bold leading-none tracking-[-0.02em]',
            match.matchScore >= 70 ? 'text-alo-success' : match.matchScore >= 40 ? 'text-alo-warning' : 'text-alo-error',
          )}>
            {match.matchScore}%
          </p>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-alo-text-muted">Eligibility check</h4>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {match.criteria.map((criterion) => {
            const meta = STATE_META[criterion.state];
            const Icon = meta.icon;
            return (
              <li key={criterion.label} className="flex gap-2 rounded-input border border-alo-border bg-alo-surface-muted/40 p-3">
                <Icon className={cn(
                  'mt-0.5 h-4 w-4 shrink-0',
                  criterion.state === 'matched' ? 'text-alo-success' : criterion.state === 'not_matched' ? 'text-alo-error' : 'text-alo-text-muted',
                )} aria-hidden="true" />
                <span className="min-w-0 text-[13px] leading-relaxed">
                  <span className="font-semibold text-alo-navy">{criterion.label}: </span>
                  <span className="text-alo-text-secondary">{meta.label}</span>
                  {criterion.declared && <span className="block text-alo-text-muted">You: {criterion.declared}</span>}
                  {criterion.published && <span className="block text-alo-text-muted">Published: {criterion.published}</span>}
                  {criterion.note && <span className="block text-alo-text-muted">{criterion.note}</span>}
                </span>
              </li>
            );
          })}
        </ul>

        {match.concerns.length > 0 && (
          <>
            <h4 className="mt-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-alo-text-muted">Things to check</h4>
            <ul className="mt-2 space-y-1.5">
              {match.concerns.map((concern, index) => (
                <li key={index} className="flex gap-2 text-[13px] leading-relaxed text-alo-text-secondary">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-alo-warning" aria-hidden="true" />
                  {concern}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-alo-border bg-alo-surface-muted/40 px-5 py-4 sm:px-6">
        <Button asChild className="h-12 rounded-button bg-alo-brand px-4 text-[14px] font-semibold text-white hover:bg-alo-brand-hover">
          <Link href={`/scholarships/${scholarship.slug}`}>
            View Scholarship <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        {scholarship.officialSourceUrl && (
          <Button asChild variant="outline" className="h-12 rounded-button border-alo-border px-4 text-[14px] font-semibold">
            <a href={scholarship.officialSourceUrl} target="_blank" rel="noopener noreferrer nofollow">
              {scholarship.officialSourceName || 'Official source'}
            </a>
          </Button>
        )}
        {scholarship.lastVerifiedAt && (
          <span className="ml-auto text-[12px] text-alo-text-muted">
            Verified: {formatDate(scholarship.lastVerifiedAt)}
          </span>
        )}
      </div>
    </Panel>
  );
}
