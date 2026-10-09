'use client';

/**
 * Marketing Kit Panel — the full ALO marketing kit library in one panel:
 * campaign kits · email sequences · lead magnets · SMS/WhatsApp templates ·
 * social calendar · CRO checklist.
 *
 * Content lives in src/lib/marketing-kit (frameworks adapted from
 * coreyhaines31/marketingskills). This component is presentational only.
 * Backward compatible: default props, `kits` override, and the
 * MarketingKit / DEFAULT_MARKETING_KITS exports are unchanged.
 */

import { useMemo, useState } from 'react';
import {
  Check,
  Clipboard,
  Download,
  Megaphone,
  Mail,
  Gift,
  MessageCircle,
  Share2,
  TrendingUp,
  CalendarDays,
  Users,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_MARKETING_KITS,
  EMAIL_SEQUENCES,
  LEAD_MAGNETS,
  SMS_TEMPLATES,
  SOCIAL_CALENDAR,
  CRO_CHECKLIST,
} from '@/lib/marketing-kit';
import type { MarketingKit } from '@/lib/marketing-kit';

// Backward-compatible re-exports (the previous panel version exported both).
export type { MarketingKit };
export { DEFAULT_MARKETING_KITS };

type TabId = 'campaigns' | 'email' | 'magnets' | 'sms' | 'social' | 'cro';

const TABS: { id: TabId; label: string; icon: typeof Megaphone }[] = [
  { id: 'campaigns', label: 'Campaign kits', icon: Megaphone },
  { id: 'email', label: 'Email sequences', icon: Mail },
  { id: 'magnets', label: 'Lead magnets', icon: Gift },
  { id: 'sms', label: 'SMS & WhatsApp', icon: MessageCircle },
  { id: 'social', label: 'Social calendar', icon: Share2 },
  { id: 'cro', label: 'CRO checklist', icon: TrendingUp },
];

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copyText = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      window.setTimeout(() => setCopied(null), 1800);
    } catch {
      setCopied(null);
    }
  };
  const downloadText = (filename: string, text: string) => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };
  return { copied, copyText, downloadText };
}

function CopyButton({ id, text, copied, onCopy }: { id: string; text: string; copied: string | null; onCopy: (text: string, id: string) => void }) {
  const isCopied = copied === id;
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 rounded-lg text-xs"
      onClick={() => onCopy(text, id)}
    >
      {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Clipboard className="h-3.5 w-3.5" />}
      {isCopied ? 'Copied' : 'Copy'}
    </Button>
  );
}

export default function MarketingKitPanel({ kits = DEFAULT_MARKETING_KITS }: { kits?: MarketingKit[] }) {
  const [activeTab, setActiveTab] = useState<TabId>('campaigns');
  const [activeKit, setActiveKit] = useState(kits[0]?.id || '');
  const [activeSequence, setActiveSequence] = useState(EMAIL_SEQUENCES[0]?.id || 'welcome');
  const { copied, copyText, downloadText } = useCopy();

  const kit = kits.find((item) => item.id === activeKit) || kits[0];
  const sequence = EMAIL_SEQUENCES.find((item) => item.id === activeSequence) || EMAIL_SEQUENCES[0];

  const kitAsText = useMemo(() => {
    if (!kit) return '';
    return [
      `ALO Education marketing kit: ${kit.name}`,
      `Objective: ${kit.objective}`,
      `Audience: ${kit.audience}`,
      `Channels: ${kit.channels.join(', ')}`,
      `Hook: ${kit.hook}`,
      `Copy: ${kit.copy}`,
      `CTA: ${kit.cta}`,
    ].join('\n\n');
  }, [kit]);

  const sequenceAsText = useMemo(() => {
    if (!sequence) return '';
    return [
      `ALO Education email sequence: ${sequence.name}`,
      `Purpose: ${sequence.purpose}`,
      '',
      ...sequence.emails.map(
        (email, i) =>
          `--- Email ${i + 1} (${email.timing}) ---\nSubject: ${email.subject}\nPreview: ${email.preview}\n\n${email.body}\n\nCTA: ${email.cta}`,
      ),
    ].join('\n\n');
  }, [sequence]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6" aria-label="Marketing kit library">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2563EB]">Marketing kit</p>
          <h2 className="mt-1 text-base font-bold text-slate-900">Ready-to-run campaign library</h2>
          <p className="mt-1 text-xs text-slate-500">
            Campaign kits, email sequences, lead magnets, SMS templates, social calendar, and CRO checklist — copy or download each asset.
          </p>
        </div>
        <span className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500">
          6 kits · 2 sequences · 6 magnets
        </span>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Kit categories">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Campaign kits */}
      {activeTab === 'campaigns' && kit ? (
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <div className="space-y-2">
            {kits.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveKit(item.id)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                  item.id === kit.id
                    ? 'border-[#F97316] bg-[#FFF7ED] text-[#C2410C]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">{kit.name}</h3>
                <p className="text-xs text-slate-500">{kit.objective}</p>
              </div>
              <div className="flex gap-2">
                <CopyButton id="kit" text={kitAsText} copied={copied} onCopy={copyText} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  onClick={() => downloadText(`${kit.id}-marketing-kit.txt`, kitAsText)}
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
              </div>
            </div>
            <dl className="space-y-3 text-xs">
              <div>
                <dt className="font-bold uppercase tracking-[0.12em] text-slate-400">Audience</dt>
                <dd className="mt-0.5 text-slate-700">{kit.audience}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-[0.12em] text-slate-400">Channels</dt>
                <dd className="mt-0.5 flex flex-wrap gap-1.5">
                  {kit.channels.map((channel) => (
                    <span key={channel} className="rounded-full border border-slate-200 bg-white px-2 py-0.5 font-semibold text-slate-600">
                      {channel}
                    </span>
                  ))}
                </dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-[0.12em] text-slate-400">Hook</dt>
                <dd className="mt-0.5 text-base font-bold text-slate-900">{kit.hook}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-[0.12em] text-slate-400">Body copy</dt>
                <dd className="mt-0.5 leading-relaxed text-slate-700">{kit.copy}</dd>
              </div>
              <div>
                <dt className="font-bold uppercase tracking-[0.12em] text-slate-400">CTA</dt>
                <dd className="mt-0.5">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F97316] px-3 py-1.5 font-bold text-white">
                    <Target className="h-3.5 w-3.5" />
                    {kit.cta}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      ) : null}

      {/* Email sequences */}
      {activeTab === 'email' && sequence ? (
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <div className="space-y-2">
            {EMAIL_SEQUENCES.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSequence(item.id)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                  item.id === sequence.id
                    ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="block">{item.name}</span>
                <span className="mt-0.5 block text-[10px] font-medium text-slate-500">{item.emails.length} emails</span>
              </button>
            ))}
            <div className="flex gap-2 pt-2">
              <CopyButton id="sequence" text={sequenceAsText} copied={copied} onCopy={copyText} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() => downloadText(`${sequence.id}-sequence.txt`, sequenceAsText)}
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs text-slate-500">{sequence.purpose}</p>
            {sequence.emails.map((email, index) => (
              <article key={email.subject} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600">
                    <Mail className="h-3 w-3" />
                    Email {index + 1} · {email.timing}
                  </span>
                  <CopyButton
                    id={`email-${index}`}
                    text={`Subject: ${email.subject}\nPreview: ${email.preview}\n\n${email.body}\n\nCTA: ${email.cta}`}
                    copied={copied}
                    onCopy={copyText}
                  />
                </div>
                <h4 className="text-sm font-bold text-slate-900">{email.subject}</h4>
                <p className="text-xs italic text-slate-500">{email.preview}</p>
                <p className="mt-2 text-xs leading-relaxed text-slate-700">{email.body}</p>
                <p className="mt-2 text-xs font-bold text-[#C2410C]">CTA: {email.cta}</p>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {/* Lead magnets */}
      {activeTab === 'magnets' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {LEAD_MAGNETS.map((magnet) => {
            const magnetText = [
              `ALO Education lead magnet: ${magnet.name}`,
              `Format: ${magnet.format}`,
              `Audience: ${magnet.audience}`,
              `Hook: ${magnet.hook}`,
              `Description: ${magnet.description}`,
              `Deliverable: ${magnet.deliverable.join('; ')}`,
              `CTA: ${magnet.cta}`,
              `Sequence after capture: ${magnet.sequence}`,
            ].join('\n');
            return (
              <article key={magnet.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#C2410C]">
                    <Gift className="h-3 w-3" />
                    {magnet.format}
                  </span>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {magnet.sequence} sequence
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900">{magnet.name}</h3>
                <p className="mt-1 text-xs font-semibold text-[#1D4ED8]">{magnet.hook}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{magnet.description}</p>
                <ul className="mt-3 space-y-1 text-xs text-slate-600">
                  {magnet.deliverable.map((item) => (
                    <li key={item} className="flex items-start gap-1.5">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[11px] text-slate-500">Audience: {magnet.audience}</p>
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <span className="text-xs font-bold text-[#C2410C]">CTA: {magnet.cta}</span>
                  <CopyButton id={`magnet-${magnet.id}`} text={magnetText} copied={copied} onCopy={copyText} />
                </div>
              </article>
            );
          })}
        </div>
      ) : null}

      {/* SMS & WhatsApp */}
      {activeTab === 'sms' ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Every send carries sender identity and an opt-out. Promotional sends stay inside the recipient&apos;s local 8am–8pm window.
          </p>
          {SMS_TEMPLATES.map((template) => (
            <article key={template.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{template.name}</h3>
                  <p className="text-[11px] text-slate-500">
                    {template.channel} · trigger: {template.trigger} · {template.timing}
                  </p>
                </div>
                <CopyButton
                  id={`sms-${template.id}`}
                  text={`${template.name}\n${template.body}`}
                  copied={copied}
                  onCopy={copyText}
                />
              </div>
              <p className="rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-700">{template.body}</p>
              <p className="mt-2 flex items-start gap-1.5 text-[11px] text-amber-700">
                <MessageCircle className="mt-0.5 h-3 w-3 shrink-0" />
                {template.compliance}
              </p>
            </article>
          ))}
        </div>
      ) : null}

      {/* Social calendar */}
      {activeTab === 'social' ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Two weeks of ready-to-schedule posts. One hook, one idea, one CTA per post — times are Bangladesh local.
          </p>
          {SOCIAL_CALENDAR.map((post) => (
            <article key={`${post.day}-${post.platform}`} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#1D4ED8]">
                    <CalendarDays className="h-3 w-3" />
                    Day {post.day}
                  </span>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {post.platform} · {post.format}
                  </span>
                  <span className="rounded-full border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                    {post.bestTime}
                  </span>
                </div>
                <CopyButton
                  id={`social-${post.day}-${post.platform}`}
                  text={`Hook: ${post.hook}\n\n${post.copy}\n\nCTA: ${post.cta}`}
                  copied={copied}
                  onCopy={copyText}
                />
              </div>
              <h3 className="text-sm font-bold text-slate-900">{post.hook}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">{post.copy}</p>
              <p className="mt-2 text-xs font-bold text-[#C2410C]">CTA: {post.cta}</p>
            </article>
          ))}
        </div>
      ) : null}

      {/* CRO checklist */}
      {activeTab === 'cro' ? (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Page-level conversion review items with a suggested experiment for each — run one experiment per page at a time.
          </p>
          {CRO_CHECKLIST.map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F0FDF4] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-700">
                    <TrendingUp className="h-3 w-3" />
                    {item.page}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">{item.principle}</h3>
                </div>
                <CopyButton
                  id={`cro-${item.id}`}
                  text={`${item.page} — ${item.principle}\nAction: ${item.action}\nExperiment: ${item.experiment}`}
                  copied={copied}
                  onCopy={copyText}
                />
              </div>
              <p className="mt-1 flex items-start gap-1.5 text-xs leading-relaxed text-slate-700">
                <Users className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2563EB]" />
                {item.action}
              </p>
              <p className="mt-1 text-[11px] italic text-slate-500">Experiment: {item.experiment}</p>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
