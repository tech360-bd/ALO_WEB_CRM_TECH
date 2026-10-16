'use client';

/**
 * AI Course Match — /ai/course-match
 *
 * Deliberately does NOT call a language model for the match itself. Matching is
 * produced by the server-side rule engine at /api/course-finder/eligibility-engine,
 * which evaluates the profile against published, verified course records and
 * returns per-requirement evidence. Every "why matched" line is a real check
 * result from that engine, not generated prose.
 */

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, CircleAlert, Info, Loader2, Sparkles, Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AiToolShell } from '../ai-tool-shell';
import {
  AsyncBlock, Panel, PanelHeader, StatusPill, formatDate, type AsyncState,
  type StatusTone,
} from '../alo-public-primitives';
import { cn } from '@/lib/utils';

interface CountryOption {
  slug: string;
  name: string;
  flag: string;
}

interface RequirementCheck {
  name: string;
  universityRequirement: string | null;
  studentValue: string | null;
  result: 'MET' | 'NOT_MET' | 'MISSING_INFO' | 'CONDITION';
  source: string;
  lastVerifiedAt: string | null;
  action: string | null;
}

interface Improvement {
  currentGap: string;
  requiredAction: string;
  estimatedTimeline: string;
  recommendedAlternative: string | null;
}

interface MatchResult {
  courseId: string;
  courseTitle: string;
  universityName: string | null;
  country: string;
  studyLevel: string;
  qualification: string;
  tuitionFee: number | null;
  tuitionCurrency: string | null;
  eligibilityCategory: string;
  matchScore: number;
  requirements: RequirementCheck[];
  improvementPlan: Improvement[];
  alternativeRoutes: { courseTitle: string; universityName: string | null; reason: string; slug: string }[];
  slug: string;
}

interface EngineSummary {
  eligible: number;
  likelyEligible: number;
  conditionallyEligible: number;
  partiallyMatched: number;
  notCurrentlyEligible: number;
  insufficientInfo: number;
  counsellorReviewRequired: number;
}

const CATEGORY_META: Record<string, { tone: StatusTone; label: string; blurb: string }> = {
  ELIGIBLE: { tone: 'success', label: 'Eligible', blurb: 'Every published requirement you provided evidence for is met.' },
  LIKELY_ELIGIBLE: { tone: 'success', label: 'Likely eligible', blurb: 'Most requirements are met; the remainder could not be confirmed from your profile.' },
  CONDITIONALLY_ELIGIBLE: { tone: 'info', label: 'Conditionally eligible', blurb: 'Eligible subject to a condition such as an English test or a specific grade.' },
  PARTIALLY_MATCHED: { tone: 'warning', label: 'Partially matched', blurb: 'Some requirements are not met yet. See the gap plan below.' },
  NOT_CURRENTLY_ELIGIBLE: { tone: 'danger', label: 'Not currently eligible', blurb: 'A published requirement is not met. Alternative routes are listed.' },
  INSUFFICIENT_INFO: { tone: 'neutral', label: 'Needs more information', blurb: 'Add the missing details below for an accurate result.' },
  COUNSELLOR_REVIEW_REQUIRED: { tone: 'warning', label: 'Counsellor review required', blurb: 'Your profile needs a human review before we can advise.' },
};

const QUALIFICATIONS = [
  'HSC', 'A Level', 'Diploma', 'Bachelors', 'Masters', 'PhD',
];

const ENGLISH_TESTS = ['IELTS', 'PTE', 'TOEFL', 'Duolingo'];

const STUDY_LEVELS = ['Foundation', 'Undergraduate', 'Postgraduate', 'PhD'];

const INITIAL_FORM = {
  qualification: '',
  gpa: '',
  gpaScale: '4.0',
  englishTest: '',
  englishScore: '',
  studyLevel: '',
  subject: '',
  countries: [] as string[],
  careerGoal: '',
};

type FormState = typeof INITIAL_FORM;

export default function AiCourseMatch({ countries }: { countries: CountryOption[] }) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [state, setState] = useState<AsyncState<{ results: MatchResult[]; summary: EngineSummary; disclaimer: string }>>({
    status: 'empty',
    title: 'No match run yet',
    description: 'Complete your profile and run the match to see which verified courses you qualify for.',
  });
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleCountry = (slug: string) =>
    setForm((current) => ({
      ...current,
      countries: current.countries.includes(slug)
        ? current.countries.filter((item) => item !== slug)
        : [...current.countries, slug],
    }));

  const canRun = Boolean(form.qualification);

  const runMatch = async () => {
    setState({ status: 'loading' });
    setAssessmentId(null);
    try {
      const response = await fetch('/api/course-finder/eligibility-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicProfile: form.qualification
            ? [{
                qualificationType: form.qualification,
                gpa: form.gpa ? Number(form.gpa) : null,
                gpaScale: Number(form.gpaScale) || 4.0,
              }]
            : [],
          englishTests: form.englishTest && form.englishScore
            ? [{ testType: form.englishTest, overallScore: Number(form.englishScore) }]
            : [],
          workExperience: [],
          studyGap: null,
          studyPreferences: {
            preferredCountries: form.countries,
            preferredStudyLevel: form.studyLevel || undefined,
            preferredSubject: form.subject || undefined,
            careerGoal: form.careerGoal || undefined,
          },
          profileCompleteness: [form.qualification, form.gpa, form.englishScore, form.studyLevel, form.subject]
            .filter(Boolean).length * 20,
        }),
      });

      const json = await response.json();
      if (!response.ok || json?.error) {
        throw new Error(json?.error || `The matching service responded with status ${response.status}.`);
      }

      const results: MatchResult[] = Array.isArray(json.results) ? json.results : [];
      setAssessmentId(json.assessmentId ?? null);

      if (results.length === 0) {
        setState({
          status: 'empty',
          title: 'No matching courses were found.',
          description:
            'Our verified course catalogue has no published course matching this profile and these filters yet. Widen your country or subject selection, or talk to an advisor about destinations we can source for you.',
          action: (
            <Button asChild variant="outline" className="mt-2 h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold">
              <Link href="/book-consultation">Book Free Consultation</Link>
            </Button>
          ),
        });
        return;
      }

      setState({ status: 'ready', data: { results, summary: json.summary, disclaimer: json.disclaimer } });
    } catch (error) {
      setState({
        status: 'error',
        message: error instanceof Error ? error.message : 'The request could not be completed.',
        onRetry: () => void runMatch(),
      });
    }
  };

  return (
    <AiToolShell
      eyebrow="AI Course Match"
      title="Find the courses you actually qualify for"
      lede="Enter your academic profile once and we evaluate it against every published, verified course in the ALO database — showing exactly which requirement is met, which is missing, and what to do about it."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'AI Tools' },
        { label: 'Course Match' },
      ]}
      howItWorks={[
        { title: 'You describe your profile', description: 'Qualification, grade, English score and preferences.' },
        { title: 'The rule engine evaluates it', description: 'Each course is checked requirement by requirement against published data.' },
        { title: 'You get evidence, not guesses', description: 'Every match shows which checks passed, which failed and the source date.' },
      ]}
      method="Matches are produced by ALO's server-side eligibility rule engine, which compares your profile against published and verified course records. It is deterministic: the same profile always produces the same result, and no language model is used to decide eligibility."
      disclaimer="This is an indicative evaluation and does not guarantee admission. Universities also consider your full academic history, personal statement, references and interview performance. Always verify requirements directly with the university or with an ALO advisor."
      sidebar={
        <Panel className="p-5">
          <h2 className="flex items-center gap-2 text-[14px] font-semibold text-alo-navy">
            <Target className="h-4 w-4 text-alo-ai" aria-hidden="true" />
            What you will get
          </h2>
          <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-alo-text-secondary">
            <li>Ranked course matches with a match score</li>
            <li>Requirement-by-requirement evidence</li>
            <li>A gap plan for anything not yet met</li>
            <li>Alternative routes where a course is out of reach</li>
          </ul>
          <Button asChild variant="outline" className="mt-4 h-12 w-full rounded-button border-alo-border text-[13px] font-semibold">
            <Link href="/course-finder">Browse all courses instead</Link>
          </Button>
        </Panel>
      }
    >
      {/* Profile form */}
      <Panel>
        <PanelHeader
          title="Your profile"
          description="Only the qualification is required — add more for a sharper result."
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <Field label="Highest qualification" htmlFor="qualification" required>
            <Select value={form.qualification} onValueChange={(value) => update('qualification', value)}>
              <SelectTrigger id="qualification" className="h-12 w-full rounded-input border-alo-border">
                <SelectValue placeholder="Select qualification" />
              </SelectTrigger>
              <SelectContent>
                {QUALIFICATIONS.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Grade / GPA" htmlFor="gpa">
              <Input
                id="gpa"
                inputMode="decimal"
                value={form.gpa}
                onChange={(event) => update('gpa', event.target.value)}
                placeholder="3.20"
                className="h-12 rounded-input border-alo-border"
              />
            </Field>
            <Field label="Scale" htmlFor="gpaScale">
              <Select value={form.gpaScale} onValueChange={(value) => update('gpaScale', value)}>
                <SelectTrigger id="gpaScale" className="h-12 w-full rounded-input border-alo-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4.0">out of 4.0</SelectItem>
                  <SelectItem value="5.0">out of 5.0</SelectItem>
                  <SelectItem value="100">percentage</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="English test" htmlFor="englishTest">
            <Select value={form.englishTest} onValueChange={(value) => update('englishTest', value)}>
              <SelectTrigger id="englishTest" className="h-12 w-full rounded-input border-alo-border">
                <SelectValue placeholder="No test taken yet" />
              </SelectTrigger>
              <SelectContent>
                {ENGLISH_TESTS.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Overall score" htmlFor="englishScore">
            <Input
              id="englishScore"
              inputMode="decimal"
              value={form.englishScore}
              onChange={(event) => update('englishScore', event.target.value)}
              placeholder="6.5"
              className="h-12 rounded-input border-alo-border"
            />
          </Field>

          <Field label="Study level" htmlFor="studyLevel">
            <Select value={form.studyLevel} onValueChange={(value) => update('studyLevel', value)}>
              <SelectTrigger id="studyLevel" className="h-12 w-full rounded-input border-alo-border">
                <SelectValue placeholder="Any level" />
              </SelectTrigger>
              <SelectContent>
                {STUDY_LEVELS.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Subject" htmlFor="subject">
            <Input
              id="subject"
              value={form.subject}
              onChange={(event) => update('subject', event.target.value)}
              placeholder="Computer Science"
              className="h-12 rounded-input border-alo-border"
            />
          </Field>

          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-[13px] font-semibold text-alo-text">Preferred destinations</span>
            <ul className="flex flex-wrap gap-2">
              {countries.map((country) => {
                const selected = form.countries.includes(country.slug);
                return (
                  <li key={country.slug}>
                    <button
                      type="button"
                      onClick={() => toggleCountry(country.slug)}
                      aria-pressed={selected}
                      className={cn(
                        'inline-flex h-10 items-center gap-2 rounded-button border px-3 text-[13px] font-medium transition-colors',
                        selected
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
            <p className="mt-1.5 text-[12px] text-alo-text-muted">Leave empty to match against every destination.</p>
          </div>

          <div className="sm:col-span-2">
            <Field label="Career goal" htmlFor="careerGoal" helper="Shared with your advisor — the rule engine does not score this field.">
              <Input
                id="careerGoal"
                value={form.careerGoal}
                onChange={(event) => update('careerGoal', event.target.value)}
                placeholder="Data Analyst in the UK after graduation"
                className="h-12 rounded-input border-alo-border"
              />
            </Field>
          </div>

          <div className="sm:col-span-2 flex flex-wrap items-center gap-3 border-t border-alo-border pt-5">
            <Button
              onClick={() => void runMatch()}
              disabled={!canRun}
              className="h-12 rounded-button bg-alo-cta px-6 text-[15px] font-semibold text-white hover:bg-alo-cta-hover disabled:opacity-50"
            >
              {state.status === 'loading' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />Matching…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />Find My Best Courses</>
              )}
            </Button>
            {!canRun && <span className="text-[13px] text-alo-text-muted">Select your highest qualification to continue.</span>}
          </div>
        </div>
      </Panel>

      {/* Results */}
      <div className="mt-8">
        <AsyncBlock
          state={state}
          loadingRows={5}
          errorTitle="We couldn't run the course match."
        >
          {(data) => (
            <>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-h3 font-bold tracking-[-0.02em] text-alo-navy">
                  {data.results.length} course{data.results.length === 1 ? '' : 's'} evaluated
                </h2>
                {assessmentId && (
                  <span className="font-mono text-[12px] text-alo-text-muted">Assessment {assessmentId}</span>
                )}
              </div>

              <SummaryBar summary={data.summary} />

              <ul className="mt-6 space-y-4">
                {data.results.map((result) => (
                  <li key={result.courseId}>
                    <MatchCard result={result} />
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

function SummaryBar({ summary }: { summary: EngineSummary }) {
  const items: { label: string; value: number; tone: StatusTone }[] = [
    { label: 'Eligible', value: summary.eligible, tone: 'success' },
    { label: 'Likely eligible', value: summary.likelyEligible, tone: 'success' },
    { label: 'Conditional', value: summary.conditionallyEligible, tone: 'info' },
    { label: 'Partially matched', value: summary.partiallyMatched, tone: 'warning' },
    { label: 'Not eligible yet', value: summary.notCurrentlyEligible, tone: 'danger' },
    { label: 'Needs more info', value: summary.insufficientInfo, tone: 'neutral' },
  ];
  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <li key={item.label}>
          <Panel className="p-4">
            <p className="text-[26px] font-bold leading-none text-alo-navy">{item.value}</p>
            <p className="mt-1.5 text-[12px] font-medium text-alo-text-muted">{item.label}</p>
          </Panel>
        </li>
      ))}
    </ul>
  );
}

function MatchCard({ result }: { result: MatchResult }) {
  const meta = CATEGORY_META[result.eligibilityCategory] ?? {
    tone: 'neutral' as StatusTone,
    label: result.eligibilityCategory,
    blurb: '',
  };
  const met = result.requirements.filter((requirement) => requirement.result === 'MET');
  const notMet = result.requirements.filter((requirement) => requirement.result === 'NOT_MET');
  const missing = result.requirements.filter((requirement) => requirement.result === 'MISSING_INFO');
  const latestVerified = result.requirements
    .map((requirement) => requirement.lastVerifiedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-alo-border p-5 sm:p-6">
        <div className="min-w-0">
          <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-alo-navy">
            {result.courseTitle || 'Untitled course'}
          </h3>
          <p className="mt-1 text-[14px] text-alo-text-secondary">
            {[result.universityName, result.country].filter(Boolean).join(' · ') || 'University not published'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusPill tone={meta.tone} label={meta.label} />
            {result.studyLevel && <StatusPill tone="neutral" label={result.studyLevel} showIcon={false} />}
            {result.qualification && <StatusPill tone="neutral" label={result.qualification} showIcon={false} />}
          </div>
        </div>

        <div className="flex items-center gap-5">
          {result.tuitionFee != null && result.tuitionFee > 0 && (
            <div className="text-right">
              <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-alo-text-muted">Tuition</p>
              <p className="text-[18px] font-bold text-alo-navy">
                {result.tuitionCurrency ?? ''} {result.tuitionFee.toLocaleString('en-GB')}
              </p>
            </div>
          )}
          <div className="text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-alo-text-muted">Match</p>
            <p className={cn(
              'text-[30px] font-bold leading-none tracking-[-0.02em]',
              result.matchScore >= 70 ? 'text-alo-success' : result.matchScore >= 40 ? 'text-alo-warning' : 'text-alo-error',
            )}>
              {result.matchScore}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2">
        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-alo-text-muted">Why this matched</h4>
          {met.length === 0 ? (
            <p className="mt-2 text-[13px] text-alo-text-secondary">
              No requirement could be confirmed as met from the information provided.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {met.map((requirement) => (
                <li key={requirement.name} className="flex gap-2 text-[13px] leading-relaxed text-alo-text">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-alo-success" aria-hidden="true" />
                  <span>
                    <span className="font-medium">{requirement.name}:</span> {requirement.studentValue ?? 'met'}
                    {requirement.universityRequirement && (
                      <span className="text-alo-text-muted"> (required: {requirement.universityRequirement})</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {missing.length > 0 && (
            <>
              <h4 className="mt-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-alo-text-muted">
                Missing information
              </h4>
              <ul className="mt-2 space-y-2">
                {missing.map((requirement) => (
                  <li key={requirement.name} className="flex gap-2 text-[13px] leading-relaxed text-alo-text-secondary">
                    <Info className="mt-0.5 h-4 w-4 shrink-0 text-alo-text-muted" aria-hidden="true" />
                    <span>{requirement.action ?? requirement.name}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div>
          <h4 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-alo-text-muted">Potential concerns</h4>
          {notMet.length === 0 && result.improvementPlan.length === 0 ? (
            <p className="mt-2 text-[13px] text-alo-text-secondary">
              No unmet published requirements were detected for this course.
            </p>
          ) : (
            <ul className="mt-2 space-y-3">
              {[...notMet.map((requirement) => ({
                gap: requirement.action ?? `${requirement.name} not met`,
                action: requirement.universityRequirement ? `Required: ${requirement.universityRequirement}` : '',
                timeline: '',
                alternative: null as string | null,
              })),
              ...result.improvementPlan.map((item) => ({
                gap: item.currentGap,
                action: item.requiredAction,
                timeline: item.estimatedTimeline,
                alternative: item.recommendedAlternative,
              })),
              ].map((concern, index) => (
                <li key={`${concern.gap}-${index}`} className="flex gap-2 text-[13px] leading-relaxed">
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-alo-warning" aria-hidden="true" />
                  <span className="text-alo-text">
                    <span className="block">{concern.gap}</span>
                    {concern.action && <span className="mt-0.5 block text-alo-text-secondary">{concern.action}</span>}
                    {concern.timeline && <span className="mt-0.5 block text-alo-text-muted">Timeline: {concern.timeline}</span>}
                    {concern.alternative && (
                      <span className="mt-0.5 block text-alo-text-muted">Alternative: {concern.alternative}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {result.alternativeRoutes?.length > 0 && (
            <>
              <h4 className="mt-5 text-[13px] font-semibold uppercase tracking-[0.08em] text-alo-text-muted">
                Alternative routes
              </h4>
              <ul className="mt-2 space-y-2">
                {result.alternativeRoutes.map((route, index) => (
                  <li key={`${route.courseTitle}-${index}`} className="text-[13px] leading-relaxed text-alo-text-secondary">
                    <span className="font-medium text-alo-text">{route.courseTitle}</span>
                    {route.universityName && <span> — {route.universityName}</span>}
                    <span className="block text-alo-text-muted">{route.reason}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-alo-border bg-alo-surface-muted/40 px-5 py-4 sm:px-6">
        <Button asChild className="h-12 rounded-button bg-alo-brand px-4 text-[14px] font-semibold text-white hover:bg-alo-brand-hover">
          <Link href={result.slug ? `/courses/${result.slug}` : '/course-finder'}>
            View Course <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-12 rounded-button border-alo-border px-4 text-[14px] font-semibold">
          <Link href="/eligibility-check">Full Eligibility Check</Link>
        </Button>
        {latestVerified && (
          <span className="ml-auto text-[12px] text-alo-text-muted">
            Requirement data verified: {formatDate(latestVerified)}
          </span>
        )}
      </div>
    </Panel>
  );
}

function Field({
  label,
  htmlFor,
  required,
  helper,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label htmlFor={htmlFor} className="mb-1.5 block text-[13px] font-semibold text-alo-text">
        {label}
        {required && <span className="ml-1 text-alo-error" aria-hidden="true">*</span>}
      </Label>
      {children}
      {helper && <p className="mt-1.5 text-[12px] text-alo-text-muted">{helper}</p>}
    </div>
  );
}
