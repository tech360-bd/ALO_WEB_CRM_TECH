'use client';

/**
 * Shared shell for the ALO AI tools (/ai/*).
 *
 * These tools are advisory. The shell therefore makes three things impossible
 * to miss:
 *   1. what the tool does and does not do,
 *   2. whether the output came from a verified rule engine or a language model,
 *   3. that a recommendation is never an admission guarantee.
 */

import Link from 'next/link';
import { AlertTriangle, Sparkles, TriangleAlert } from 'lucide-react';
import { Panel } from './alo-public-primitives';
import { cn } from '@/lib/utils';

export interface AiToolStep {
  title: string;
  description: string;
}

export function AiToolShell({
  eyebrow,
  title,
  lede,
  breadcrumbs,
  howItWorks,
  method,
  disclaimer,
  sidebar,
  children,
}: {
  eyebrow: string;
  title: string;
  lede: string;
  breadcrumbs: { label: string; href?: string }[];
  howItWorks: AiToolStep[];
  /** How the answer is produced. Shown verbatim so nothing looks like magic. */
  method: string;
  disclaimer: string;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-alo-page pb-20">
      <div className="border-b border-alo-border bg-white">
        <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-[13px] text-alo-text-muted">
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5">
                  {crumb.href && index < breadcrumbs.length - 1 ? (
                    <Link href={crumb.href} className="hover:text-alo-brand transition-colors">{crumb.label}</Link>
                  ) : (
                    <span className="font-medium text-alo-text">{crumb.label}</span>
                  )}
                  {index < breadcrumbs.length - 1 && <span aria-hidden="true">/</span>}
                </li>
              ))}
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
            <div className="max-w-[760px]">
              <p className="mb-3 inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-alo-ai">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {eyebrow}
              </p>
              <h1 className="text-h1 font-bold tracking-[-0.02em] text-alo-navy sm:text-[48px] sm:leading-[1.1]">
                {title}
              </h1>
              <p className="mt-4 text-body-lg text-alo-text-secondary">{lede}</p>
            </div>

            <Panel className="p-5">
              <h2 className="text-[14px] font-semibold text-alo-navy">How this tool works</h2>
              <ol className="mt-3 space-y-3">
                {howItWorks.map((step, index) => (
                  <li key={step.title} className="flex gap-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-alo-ai-soft text-[11px] font-bold text-alo-ai">
                      {index + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold text-alo-navy">{step.title}</span>
                      <span className="mt-0.5 block text-[12px] leading-relaxed text-alo-text-muted">{step.description}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Panel>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-4 py-10 sm:px-6 lg:px-8">
        <div className={cn('grid gap-8', sidebar ? 'lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start' : '')}>
          <div className="min-w-0">{children}</div>
          {sidebar && <aside className="space-y-6 lg:sticky lg:top-24">{sidebar}</aside>}
        </div>

        <div className="mt-10 space-y-3">
          <Panel className="flex gap-3 border-alo-brand-border bg-alo-brand-light/40 p-5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-alo-brand-deep" aria-hidden="true" />
            <div>
              <h2 className="text-[14px] font-semibold text-alo-brand-deep">How this answer was produced</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-alo-text-secondary">{method}</p>
            </div>
          </Panel>
          <Panel className="flex gap-3 p-5">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-alo-warning" aria-hidden="true" />
            <p className="text-[13px] leading-relaxed text-alo-text-secondary">{disclaimer}</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
