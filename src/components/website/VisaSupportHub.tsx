'use client';

/**
 * Visa Support Hub — /visa
 *
 * Every field rendered here comes from the verified country dataset
 * (src/lib/country-destinations-data.ts), which carries a source name, source
 * URL and last-verified date per section. Where a destination has no verified
 * visa record the UI says so instead of guessing — no invented processing
 * times, fees or success rates anywhere on this page.
 */

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight, Banknote, CalendarCheck, ExternalLink, FileCheck2, Plane, ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BreadcrumbTrail, DataDisclaimer, PageHeading, Panel, PanelHeader, PublicFrame,
  StatusPill, formatDate,
} from './alo-public-primitives';
import { COUNTRY_DESTINATIONS } from '@/lib/country-destinations-data';
import { cn } from '@/lib/utils';

export interface VisaCountryOption {
  slug: string;
  name: string;
  flag: string;
  visaType: string;
  lastVerifiedAt: string | null;
  hasVisaRecord: boolean;
}

export default function VisaSupportHub({ countries }: { countries: VisaCountryOption[] }) {
  const firstVerified = countries.find((country) => country.hasVisaRecord);
  const [slug, setSlug] = useState<string>(firstVerified?.slug ?? countries[0]?.slug ?? '');
  const data = COUNTRY_DESTINATIONS[slug];

  return (
    <div className="min-h-screen bg-alo-page pb-20">
      <div className="border-b border-alo-border bg-white">
        <PublicFrame className="py-10 sm:py-14">
          <BreadcrumbTrail items={[{ label: 'Home', href: '/' }, { label: 'Visa Support' }]} />
          <PageHeading
            eyebrow="Visa Support"
            title="Student visa guidance, step by step"
            lede="Select your destination to see the verified visa process, work rights, financial evidence and document requirements — each with the official source it came from and the date it was last checked."
          />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild className="h-12 rounded-button bg-alo-cta px-5 text-[14px] font-semibold text-white hover:bg-alo-cta-hover">
              <Link href="/book-consultation">Book Free Consultation</Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-button border-alo-border px-5 text-[14px] font-semibold">
              <Link href="/ai/visa-coach">Practise Your Interview</Link>
            </Button>
          </div>
        </PublicFrame>
      </div>

      <PublicFrame className="py-10">
        {/* Selector */}
        <Panel className="mb-8 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[320px_1fr] lg:items-center">
            <div>
              <label htmlFor="visa-country" className="mb-1.5 block text-[13px] font-semibold text-alo-text">
                Destination
              </label>
              <Select value={slug} onValueChange={setSlug}>
                <SelectTrigger id="visa-country" className="h-12 w-full rounded-input border-alo-border">
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.slug} value={country.slug}>
                      {country.flag} {country.name}
                      {country.hasVisaRecord ? '' : ' — being verified'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {data && (
              <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                {data.lastVerifiedAt && <StatusPill tone="success" label={`Verified ${formatDate(data.lastVerifiedAt)}`} />}
                <StatusPill tone="info" label={data.visaType || 'Visa type not published'} showIcon={false} />
              </div>
            )}
          </div>
        </Panel>

        {!data || !data.visaSteps?.length ? (
          <Panel className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <h2 className="text-[18px] font-semibold text-alo-navy">
              Country information is currently being verified.
            </h2>
            <p className="max-w-[560px] text-[14px] leading-relaxed text-alo-text-secondary">
              We only publish visa guidance we have checked against an official source. Verification for this
              destination is in progress — talk to an advisor for current requirements in the meantime.
            </p>
            <Button asChild className="mt-2 h-12 rounded-button bg-alo-cta px-5 text-[14px] font-semibold text-white hover:bg-alo-cta-hover">
              <Link href="/book-consultation">Book Free Consultation</Link>
            </Button>
          </Panel>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div className="space-y-6">
              {/* Visa process */}
              <Panel>
                <PanelHeader
                  title="Visa application process"
                  description={`Published steps for the ${data.name} student route.`}
                />
                <ol className="p-5 sm:p-6">
                  {data.visaSteps.map((step, index) => (
                    <li key={step.step} className={cn('flex gap-4', index < data.visaSteps.length - 1 && 'pb-6')}>
                      <div className="flex flex-col items-center">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-alo-brand text-[13px] font-bold text-white">
                          {step.step}
                        </span>
                        {index < data.visaSteps.length - 1 && <span className="mt-1 w-px flex-1 bg-alo-border" aria-hidden="true" />}
                      </div>
                      <div className="min-w-0 pb-1">
                        <h3 className="text-[15px] font-semibold text-alo-navy">{step.title}</h3>
                        <p className="mt-1 text-[14px] leading-relaxed text-alo-text-secondary">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Panel>

              {/* Documents */}
              <Panel>
                <PanelHeader
                  title="Documents"
                  description="Published document requirements by study level."
                />
                <ul className="divide-y divide-alo-border">
                  {data.entryRequirements.map((requirement) => (
                    <li key={requirement.level} className="px-5 py-4 sm:px-6">
                      <h3 className="flex items-center gap-2 text-[14px] font-semibold text-alo-navy">
                        <FileCheck2 className="h-4 w-4 text-alo-brand" aria-hidden="true" />
                        {requirement.level}
                      </h3>
                      <dl className="mt-2 grid gap-2 sm:grid-cols-2">
                        <div>
                          <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-alo-text-muted">Academic</dt>
                          <dd className="mt-0.5 text-[13px] text-alo-text">{requirement.academic}</dd>
                        </div>
                        <div>
                          <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-alo-text-muted">English</dt>
                          <dd className="mt-0.5 text-[13px] text-alo-text">{requirement.english}</dd>
                        </div>
                      </dl>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {requirement.documents.map((document) => (
                          <li key={document} className="rounded-button border border-alo-border bg-alo-surface-muted px-2 py-0.5 text-[12px] font-medium text-alo-text-secondary">
                            {document}
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </Panel>

              {/* Work rights */}
              {data.workRightRules?.length > 0 && (
                <Panel>
                  <PanelHeader title="Work rights" description="Published conditions for student visa holders." />
                  <ul className="divide-y divide-alo-border">
                    {data.workRightRules.map((rule, index) => (
                      <li key={index} className="px-5 py-4 sm:px-6">
                        <dl className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-alo-text-muted">During term</dt>
                            <dd className="mt-0.5 text-[13px] text-alo-text">{rule.termTime}</dd>
                          </div>
                          <div>
                            <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-alo-text-muted">During vacation</dt>
                            <dd className="mt-0.5 text-[13px] text-alo-text">{rule.vacation}</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-alo-text-muted">Condition</dt>
                            <dd className="mt-0.5 text-[13px] text-alo-text">{rule.condition}</dd>
                          </div>
                          <div className="sm:col-span-2">
                            <dt className="text-[12px] font-semibold uppercase tracking-[0.06em] text-alo-text-muted">After graduation</dt>
                            <dd className="mt-0.5 text-[13px] text-alo-text">{rule.postStudyRoute}</dd>
                          </div>
                        </dl>
                        {rule.sourceUrl && (
                          <a
                            href={rule.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-alo-brand hover:underline"
                          >
                            Official source
                            <ExternalLink className="h-3 w-3" aria-hidden="true" />
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </div>

            {/* Sidebar: money, prep, sources */}
            <div className="space-y-6">
              <Panel>
                <PanelHeader title="Financial evidence" description="What you must show you can afford." />
                <div className="space-y-3 p-5">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-alo-text-muted">Tuition</p>
                    <p className="mt-0.5 text-[14px] text-alo-text">{data.tuitionRange}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-alo-text-muted">Living cost</p>
                    <p className="mt-0.5 text-[14px] leading-relaxed text-alo-text">{data.livingCost}</p>
                  </div>
                  <p className="flex gap-2 pt-1 text-[12px] leading-relaxed text-alo-text-muted">
                    <Banknote className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    Funds normally need to be held for a minimum period in an accepted account. Confirm the exact
                    requirement with the official source before you apply.
                  </p>
                </div>
              </Panel>

              <Panel>
                <PanelHeader title="Interview preparation" />
                <div className="p-5">
                  <p className="text-[13px] leading-relaxed text-alo-text-secondary">
                    Credibility and visa interviews test whether you can explain your course choice, your funding
                    and your plans after graduating.
                  </p>
                  <Button asChild variant="outline" className="mt-4 h-12 w-full rounded-button border-alo-border text-[13px] font-semibold">
                    <Link href="/ai/visa-coach">Practise With the Visa Coach</Link>
                  </Button>
                </div>
              </Panel>

              <Panel>
                <PanelHeader title="Pre-departure" />
                <ul className="space-y-2 p-5">
                  {[
                    { icon: CalendarCheck, label: 'Accept your offer and pay the deposit', href: '/student/dashboard' },
                    { icon: FileCheck2, label: 'Complete your document checklist', href: '/student/documents' },
                    { icon: ShieldCheck, label: 'Check your visa readiness', href: '/student/visa' },
                    { icon: Plane, label: 'Book travel once the visa is granted', href: '/book-consultation' },
                  ].map((item) => (
                    <li key={item.label}>
                      <Link href={item.href} className="flex items-center gap-3 rounded-input px-2 py-2 text-[13px] font-medium text-alo-text transition-colors hover:bg-alo-surface-muted">
                        <item.icon className="h-4 w-4 shrink-0 text-alo-brand" aria-hidden="true" />
                        {item.label}
                        <ArrowRight className="ml-auto h-3.5 w-3.5 text-alo-text-muted" aria-hidden="true" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel>
                <PanelHeader title="Official sources" description="Where this guidance came from." />
                <ul className="divide-y divide-alo-border">
                  {data.sources.map((source, index) => (
                    <li key={`${source.sourceUrl}-${index}`} className="px-5 py-3.5">
                      <a
                        href={source.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer nofollow"
                        className="inline-flex items-center gap-1 text-[13px] font-semibold text-alo-brand hover:underline"
                      >
                        {source.sourceName}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                      <p className="mt-0.5 text-[12px] text-alo-text-muted">{source.section}</p>
                      <p className="text-[12px] text-alo-text-muted">Verified: {formatDate(source.lastVerifiedAt)}</p>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        )}

        <DataDisclaimer className="mt-8" />
      </PublicFrame>
    </div>
  );
}
