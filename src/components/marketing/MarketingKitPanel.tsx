'use client';

import { useState } from 'react';
import { Check, Clipboard, Copy, Download, Megaphone, MessageCircle, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type MarketingKit = {
  id: string;
  name: string;
  objective: string;
  audience: string;
  channels: string[];
  hook: string;
  copy: string;
  cta: string;
};

export const DEFAULT_MARKETING_KITS: MarketingKit[] = [
  {
    id: 'consultation-launch',
    name: 'Consultation launch',
    objective: 'Convert high-intent study-abroad enquiries',
    audience: 'Prospective students and parents',
    channels: ['Facebook', 'Instagram', 'WhatsApp'],
    hook: 'Your next study destination starts with a clear plan.',
    copy: 'Get a realistic shortlist, budget view, and next-step plan from an ALO Education counselor. No pressure — just verified guidance.',
    cta: 'Book a consultation',
  },
  {
    id: 'ielts-prep',
    name: 'IELTS prep sprint',
    objective: 'Drive qualified language-prep leads',
    audience: 'Students preparing for September intake',
    channels: ['Instagram', 'YouTube', 'Search'],
    hook: 'Turn your target band into a study plan.',
    copy: 'See the score range, practice routine, and application deadlines that fit your destination. Start with a free readiness check.',
    cta: 'Check readiness',
  },
  {
    id: 'visa-readiness',
    name: 'Visa readiness',
    objective: 'Reduce incomplete application files',
    audience: 'Offer holders and active applicants',
    channels: ['Email', 'WhatsApp', 'Portal'],
    hook: 'A complete file is easier to review and easier to trust.',
    copy: 'Use the ALO checklist to track evidence, deadlines, and review status before submission. Your counselor sees the same source of truth.',
    cta: 'Open the checklist',
  },
];

export default function MarketingKitPanel({ kits = DEFAULT_MARKETING_KITS }: { kits?: MarketingKit[] }) {
  const [activeKit, setActiveKit] = useState(kits[0]?.id || '');
  const [copied, setCopied] = useState<string | null>(null);
  const kit = kits.find((item) => item.id === activeKit) || kits[0];

  const copyText = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };

  const downloadKit = () => {
    if (!kit) return;
    const blob = new Blob([[
      `ALO Education marketing kit: ${kit.name}`,
      `Objective: ${kit.objective}`,
      `Audience: ${kit.audience}`,
      `Channels: ${kit.channels.join(', ')}`,
      `Hook: ${kit.hook}`,
      `Copy: ${kit.copy}`,
      `CTA: ${kit.cta}`,
    ].join('\n\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${kit.id}-marketing-kit.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!kit) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-labelledby="marketing-kits-title">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#F97316]">Launch library</p>
          <h2 id="marketing-kits-title" className="mt-1 text-lg font-bold text-slate-900">Marketing kits with review-ready copy</h2>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">Reusable hooks, channel plans, and CTAs inspired by the supplied marketing-skill references. Nothing publishes until an approved workflow sends it.</p>
        </div>
        <Button type="button" variant="outline" className="gap-2 self-start" onClick={downloadKit}>
          <Download className="h-4 w-4" aria-hidden="true" /> Download kit
        </Button>
      </div>

      <div className="mt-5 grid gap-2 md:grid-cols-3" role="tablist" aria-label="Marketing kits">
        {kits.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={item.id === kit.id}
            onClick={() => setActiveKit(item.id)}
            className={`rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B5ED7] ${item.id === kit.id ? 'border-[#0B5ED7] bg-[#0B5ED7]/[0.04]' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <span className="flex items-center gap-2 text-xs font-bold text-slate-900"><Megaphone className="h-4 w-4 text-[#0B5ED7]" aria-hidden="true" />{item.name}</span>
            <span className="mt-2 block text-[11px] leading-4 text-slate-500">{item.objective}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl bg-slate-950 p-5 text-white">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
            <Sparkles className="h-3.5 w-3.5 text-[#F97316]" aria-hidden="true" /> {kit.audience}
            {kit.channels.map((channel) => <span key={channel} className="rounded-full border border-white/20 px-2 py-1 normal-case tracking-normal">{channel}</span>)}
          </div>
          <p className="mt-5 text-xl font-bold leading-7">{kit.hook}</p>
          <p className="mt-3 text-sm leading-6 text-slate-300">{kit.copy}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button type="button" className="gap-2 bg-[#F97316] text-white hover:bg-[#cf4515]" onClick={() => copyText(`${kit.copy} ${kit.cta}`, `${kit.id}-copy`)}>
              {copied === `${kit.id}-copy` ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied === `${kit.id}-copy` ? 'Copied' : 'Copy campaign copy'}
            </Button>
            <span className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-xs text-slate-200"><MessageCircle className="h-4 w-4" aria-hidden="true" /> Draft only</span>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Creative brief</p>
          <dl className="mt-4 space-y-4 text-sm">
            <div><dt className="text-xs font-semibold text-slate-500">Objective</dt><dd className="mt-1 text-slate-800">{kit.objective}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">Primary CTA</dt><dd className="mt-1 font-semibold text-[#0B5ED7]">{kit.cta}</dd></div>
            <div><dt className="text-xs font-semibold text-slate-500">Review checklist</dt><dd className="mt-1 flex items-center gap-2 text-slate-700"><Search className="h-4 w-4 text-emerald-600" aria-hidden="true" /> Claims, consent, source, destination</dd></div>
          </dl>
          <button type="button" className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-[#0B5ED7] hover:underline" onClick={() => copyText(kit.hook, `${kit.id}-hook`)}>
            <Clipboard className="h-3.5 w-3.5" aria-hidden="true" /> {copied === `${kit.id}-hook` ? 'Hook copied' : 'Copy hook'}
          </button>
        </div>
      </div>
    </section>
  );
}
