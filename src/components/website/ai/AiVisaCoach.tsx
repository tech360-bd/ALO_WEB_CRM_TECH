'use client';

/**
 * AI Visa Coach — /ai/visa-coach
 *
 * Interview practice with a deterministic, explainable answer review
 * (src/lib/advisory-review.ts). Preparation material — visa steps, work rights
 * and sources — comes from the verified country dataset, never from invented
 * rules. The review never predicts a visa outcome.
 */

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, CircleAlert, Info, MessageSquareQuote, ShieldCheck, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AiToolShell } from '../ai-tool-shell';
import { DataDisclaimer, Panel, PanelHeader, StatusPill } from '../alo-public-primitives';
import {
  reviewVisaAnswer, summariseFindings, type Severity,
} from '@/lib/advisory-review';
import { COUNTRY_DESTINATIONS, getCountryDestination } from '@/lib/country-destinations-data';
import { cn } from '@/lib/utils';

/**
 * Question *categories* are generic across credibility interviews. The specific
 * questions below ask only for information the applicant already holds — they do
 * not assert any country-specific rule, so nothing here can be wrong about a
 * government's requirements.
 */
const PRACTICE_QUESTIONS = [
  { id: 'study-plan', category: 'Study plan', question: 'Why have you chosen this specific course and university?' },
  { id: 'why-country', category: 'Destination', question: 'Why did you choose this country over studying in Bangladesh or elsewhere?' },
  { id: 'funding', category: 'Funding', question: 'Who is funding your studies, and how will you cover tuition and living costs?' },
  { id: 'progression', category: 'Academic history', question: 'Explain your academic history and any gap since your last qualification.' },
  { id: 'return-plan', category: 'Intent to return', question: 'What are your plans after you complete this course?' },
  { id: 'course-knowledge', category: 'Course knowledge', question: 'Describe the modules on your course and how they relate to your career plans.' },
];

const SEVERITY_META: Record<Severity, { tone: 'success' | 'warning' | 'danger' | 'neutral'; icon: typeof Info }> = {
  error: { tone: 'danger', icon: CircleAlert },
  warning: { tone: 'warning', icon: CircleAlert },
  info: { tone: 'neutral', icon: Info },
};

export default function AiVisaCoach({ countrySlugs }: { countrySlugs: string[] }) {
  const [country, setCountry] = useState<string>('');
  const [questionId, setQuestionId] = useState<string>(PRACTICE_QUESTIONS[0].id);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [context, setContext] = useState({ course: '', university: '', fundingSource: '', returnPlan: '' });

  const question = PRACTICE_QUESTIONS.find((item) => item.id === questionId) ?? PRACTICE_QUESTIONS[0];
  const countryData = country ? getCountryDestination(country) : null;

  const review = useMemo(() => {
    if (submitted === null) return null;
    return reviewVisaAnswer(submitted, {
      course: context.course || undefined,
      university: context.university || undefined,
      country: countryData?.name,
      fundingSource: context.fundingSource || undefined,
      returnPlan: context.returnPlan || undefined,
    });
  }, [submitted, context, countryData]);

  const summary = review ? summariseFindings(review.findings) : null;

  const run = () => setSubmitted(answer);

  const reset = () => {
    setSubmitted(null);
    setAnswer('');
  };

  return (
    <AiToolShell
      eyebrow="AI Visa Coach"
      title="Practise your visa credibility interview"
      lede="Work through the questions a visa or credibility interview typically covers, write your answer, and get a structural review that tells you exactly what is missing before you sit the real thing."
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'AI Tools' },
        { label: 'Visa Coach' },
      ]}
      howItWorks={[
        { title: 'Choose a destination and question', description: 'Verified visa steps for that country are shown alongside.' },
        { title: 'Write your answer', description: 'Answer in your own words, as you would speak it.' },
        { title: 'Get a structural review', description: 'Each finding names the rule behind it, so you know what to change.' },
      ]}
      method="Answer review is produced by deterministic structural rules (src/lib/advisory-review.ts): length, specificity, and whether your answer covers the course, funding and post-study plan you told us about. Preparation material is taken from verified official sources with a last-verified date. No language model is used, and no visa outcome is predicted."
      disclaimer="AI guidance is preparatory only and does not replace professional or official immigration advice. Visa rules change frequently — always confirm current requirements with the official government source for your destination before you apply."
      sidebar={
        countryData ? (
          <Panel>
            <PanelHeader title={`${countryData.flag} ${countryData.name}`} description="Verified visa process" />
            <ol className="space-y-3 p-5">
              {countryData.visaSteps.map((step) => (
                <li key={step.step} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-alo-brand-light text-[11px] font-bold text-alo-brand-deep">
                    {step.step}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-alo-navy">{step.title}</span>
                    <span className="mt-0.5 block text-[12px] leading-relaxed text-alo-text-muted">{step.description}</span>
                  </span>
                </li>
              ))}
            </ol>
            <div className="border-t border-alo-border px-5 py-4">
              <p className="text-[12px] text-alo-text-muted">
                Verified: {countryData.lastVerifiedAt ?? 'date not recorded'}
              </p>
              {countryData.sources[0] && (
                <a
                  href={countryData.sources[0].sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="mt-1 inline-flex items-center gap-1 text-[12px] font-semibold text-alo-brand hover:underline"
                >
                  {countryData.sources[0].sourceName}
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </div>
          </Panel>
        ) : (
          <Panel className="p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold text-alo-navy">
              <ShieldCheck className="h-4 w-4 text-alo-brand" aria-hidden="true" />
              Select a destination
            </h2>
            <p className="mt-2 text-[13px] leading-relaxed text-alo-text-secondary">
              Choosing a destination shows the verified visa process for that country alongside your practice,
              so you can prepare against the real steps rather than a generic list.
            </p>
          </Panel>
        )
      }
    >
      {/* Setup */}
      <Panel>
        <PanelHeader title="Interview setup" description="These details are used only to check whether your answer mentions them." />
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
          <div>
            <Label htmlFor="vc-country" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Destination</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id="vc-country" className="h-12 w-full rounded-input border-alo-border">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {countrySlugs.map((slug) => {
                  const data = COUNTRY_DESTINATIONS[slug];
                  if (!data) return null;
                  return (
                    <SelectItem key={slug} value={slug}>{data.flag} {data.name}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="vc-question" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Question category</Label>
            <Select value={questionId} onValueChange={setQuestionId}>
              <SelectTrigger id="vc-question" className="h-12 w-full rounded-input border-alo-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRACTICE_QUESTIONS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="vc-course" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Course</Label>
            <Input id="vc-course" value={context.course} onChange={(event) => setContext((c) => ({ ...c, course: event.target.value }))} placeholder="MSc Data Science" className="h-12 rounded-input border-alo-border" />
          </div>

          <div>
            <Label htmlFor="vc-university" className="mb-1.5 block text-[13px] font-semibold text-alo-text">University</Label>
            <Input id="vc-university" value={context.university} onChange={(event) => setContext((c) => ({ ...c, university: event.target.value }))} placeholder="University of Leeds" className="h-12 rounded-input border-alo-border" />
          </div>

          <div>
            <Label htmlFor="vc-funding" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Funding source</Label>
            <Input id="vc-funding" value={context.fundingSource} onChange={(event) => setContext((c) => ({ ...c, fundingSource: event.target.value }))} placeholder="My father's savings" className="h-12 rounded-input border-alo-border" />
          </div>

          <div>
            <Label htmlFor="vc-return" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Post-study plan</Label>
            <Input id="vc-return" value={context.returnPlan} onChange={(event) => setContext((c) => ({ ...c, returnPlan: event.target.value }))} placeholder="Return to Dhaka and work as a data analyst" className="h-12 rounded-input border-alo-border" />
          </div>
        </div>
      </Panel>

      {/* Question + answer */}
      <Panel className="mt-6">
        <PanelHeader title={question.category} description="Practise question" />
        <div className="p-5 sm:p-6">
          <div className="flex gap-3 rounded-2xl border border-alo-brand-border bg-alo-brand-light/40 p-4">
            <MessageSquareQuote className="mt-0.5 h-5 w-5 shrink-0 text-alo-brand-deep" aria-hidden="true" />
            <p className="text-[15px] font-medium leading-relaxed text-alo-navy">{question.question}</p>
          </div>

          <div className="mt-4">
            <Label htmlFor="vc-answer" className="mb-1.5 block text-[13px] font-semibold text-alo-text">Your answer</Label>
            <Textarea
              id="vc-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              rows={7}
              placeholder="Write your answer as you would say it in the interview…"
              className="min-h-[160px] rounded-input border-alo-border text-[14px] leading-relaxed"
            />
            <p className="mt-1.5 text-[12px] text-alo-text-muted">
              {answer.trim() ? `${answer.trim().split(/\s+/).length} words` : 'No answer yet'}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={run} disabled={answer.trim().length === 0} className="h-12 rounded-button bg-alo-cta px-5 text-[14px] font-semibold text-white hover:bg-alo-cta-hover disabled:opacity-50">
              <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
              Review My Answer
            </Button>
            {submitted !== null && (
              <Button onClick={reset} variant="outline" className="h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold">
                Try Another Answer
              </Button>
            )}
          </div>
        </div>
      </Panel>

      {/* Review */}
      {review && summary && (
        <Panel className="mt-6">
          <PanelHeader
            title="Answer review"
            description="Structural completeness — not a prediction of your visa outcome."
            action={
              <span className="text-right">
                <span className={cn(
                  'block text-[26px] font-bold leading-none tracking-[-0.02em]',
                  review.completenessScore >= 80 ? 'text-alo-success' : review.completenessScore >= 50 ? 'text-alo-warning' : 'text-alo-error',
                )}>
                  {review.completenessScore}%
                </span>
                <span className="mt-1 block text-[11px] font-medium text-alo-text-muted">completeness</span>
              </span>
            }
          />
          <div className="flex flex-wrap gap-2 border-b border-alo-border px-5 py-3 sm:px-6">
            <StatusPill tone="danger" label={`${summary.errors} to fix`} />
            <StatusPill tone="warning" label={`${summary.warnings} to improve`} />
            <StatusPill tone="neutral" label={`${summary.info} suggestions`} />
            <StatusPill tone="info" label={`${review.wordCount} words`} showIcon={false} />
          </div>

          {review.findings.length === 0 ? (
            <div className="flex gap-3 p-5 sm:p-6">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-alo-success" aria-hidden="true" />
              <div>
                <h3 className="text-[15px] font-semibold text-alo-navy">No structural issues found</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-alo-text-secondary">
                  Your answer covers the areas this check looks at. Practise saying it aloud within a short time
                  limit — credibility interviews move quickly.
                </p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-alo-border">
              {review.findings.map((finding) => {
                const meta = SEVERITY_META[finding.severity];
                const Icon = meta.icon;
                return (
                  <li key={finding.id} className="flex gap-3 px-5 py-4 sm:px-6">
                    <Icon className={cn(
                      'mt-0.5 h-4 w-4 shrink-0',
                      finding.severity === 'error' ? 'text-alo-error' : finding.severity === 'warning' ? 'text-alo-warning' : 'text-alo-text-muted',
                    )} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-alo-navy">{finding.label}</p>
                      <p className="mt-1 text-[13px] leading-relaxed text-alo-text-secondary">{finding.detail}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      )}

      <Panel className="mt-6 flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="min-w-0">
          <h2 className="text-[16px] font-semibold text-alo-navy">Want a real interview rehearsal?</h2>
          <p className="mt-1 text-[14px] text-alo-text-secondary">
            Our visa team runs live mock interviews with feedback on your actual documents and funding evidence.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild className="h-12 rounded-button bg-alo-cta px-5 text-[14px] font-semibold text-white hover:bg-alo-cta-hover">
            <Link href="/book-consultation">Request Consultation</Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold">
            <Link href="/visa">Visa Support Hub</Link>
          </Button>
        </div>
      </Panel>

      <DataDisclaimer className="mt-6" />
    </AiToolShell>
  );
}
