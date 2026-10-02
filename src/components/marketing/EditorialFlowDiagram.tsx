'use client';

import { ArrowDown, CheckCircle2, CircleDot, Database, Megaphone, ShieldCheck, Sparkles } from 'lucide-react';

export type EditorialFlowStep = {
  label: string;
  detail: string;
  tone: 'blue' | 'orange' | 'green' | 'slate';
  icon: 'capture' | 'qualify' | 'approve' | 'publish';
};

const ICONS = {
  capture: Megaphone,
  qualify: Sparkles,
  approve: ShieldCheck,
  publish: Database,
};

const TONES = {
  blue: 'border-[#0B5ED7]/30 bg-[#0B5ED7]/[0.04] text-[#0B5ED7]',
  orange: 'border-[#F97316]/30 bg-[#F97316]/[0.04] text-[#B63A12]',
  green: 'border-emerald-300 bg-emerald-50 text-emerald-700',
  slate: 'border-slate-300 bg-slate-50 text-slate-700',
};

/**
 * A static-first, accessible editorial diagram inspired by the supplied
 * diagram-design reference. It intentionally uses semantic HTML and inline SVG
 * rather than Mermaid or an autoplay animation, so it remains usable in print,
 * reduced-motion mode, and on narrow screens.
 */
export default function EditorialFlowDiagram({
  title = 'Lead-to-campaign control loop',
  steps = [
    { label: 'Capture', detail: 'Website, WhatsApp, events', tone: 'blue', icon: 'capture' },
    { label: 'Qualify', detail: 'Consent + enrichment', tone: 'orange', icon: 'qualify' },
    { label: 'Approve', detail: 'Human review gate', tone: 'green', icon: 'approve' },
    { label: 'Publish', detail: 'Campaign + CRM audit', tone: 'slate', icon: 'publish' },
  ] as EditorialFlowStep[],
}: {
  title?: string;
  steps?: EditorialFlowStep[];
}) {
  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="editorial-flow-title">
      <figcaption id="editorial-flow-title" className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0B5ED7]">System map</p>
          <h2 className="mt-1 text-base font-bold text-slate-900">{title}</h2>
        </div>
        <span className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500">static · auditable</span>
      </figcaption>
      <ol className="grid gap-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:items-center">
        {steps.map((step, index) => {
          const Icon = ICONS[step.icon];
          return (
            <li key={step.label} className="contents">
              <div className={`min-h-[108px] rounded-xl border p-3 ${TONES[step.tone]}`}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="text-xs font-bold">{step.label}</span>
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-600">{step.detail}</p>
                <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold opacity-70">
                  <CircleDot className="h-3 w-3" aria-hidden="true" /> step {index + 1}
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="flex justify-center text-slate-300" aria-hidden="true">
                  <ArrowDown className="h-4 w-4 md:hidden" />
                  <svg className="hidden h-4 w-8 md:block" viewBox="0 0 32 16" fill="none">
                    <path d="M1 8h26m0 0-5-5m5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <p className="mt-4 flex items-center gap-2 text-[11px] leading-4 text-slate-500">
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        Automation drafts stay reviewable before any external reply or campaign publish.
      </p>
    </figure>
  );
}
