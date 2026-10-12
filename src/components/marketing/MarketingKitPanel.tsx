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

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
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
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import CampaignCreativeComposer from './CampaignCreativeComposer';
import {
  DEFAULT_MARKETING_KITS,
  EMAIL_SEQUENCES,
  LEAD_MAGNETS,
  SMS_TEMPLATES,
  SOCIAL_CALENDAR,
  CRO_CHECKLIST,
  MARKETING_KIT_REVIEW_CHECKLIST,
  buildMarketingKitLibraryMarkdown,
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
  const [feedback, setFeedback] = useState('');
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
  }, []);

  const announceCopied = (id: string) => {
    setCopied(id);
    setFeedback('Copied to clipboard.');
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => {
      setCopied(null);
      feedbackTimer.current = null;
    }, 1800);
  };

  const copyText = async (value: string, id: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setCopied(null);
      setFeedback('Clipboard access is unavailable. Use the download option or select the text to copy it manually.');
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      announceCopied(id);
    } catch {
      setCopied(null);
      setFeedback('Copy was blocked by the browser. Use the download option or select the text to copy it manually.');
    }
  };

  const downloadText = (filename: string, text: string) => {
    try {
      const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Keep the object URL alive long enough for browsers to start the download.
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      setFeedback(`Download started: ${filename}.`);
    } catch {
      setFeedback('The download could not be started in this browser.');
    }
  };

  return { copied, feedback, copyText, downloadText };
}

function CopyButton({
  id,
  text,
  copied,
  onCopy,
  label,
}: {
  id: string;
  text: string;
  copied: string | null;
  onCopy: (text: string, id: string) => void | Promise<void>;
  label?: string;
}) {
  const isCopied = copied === id;
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="h-8 rounded-lg text-xs"
      aria-label={label ? `${isCopied ? 'Copied' : 'Copy'} ${label}` : undefined}
      onClick={() => onCopy(text, id)}
    >
      {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" /> : <Clipboard className="h-3.5 w-3.5" aria-hidden="true" />}
      {isCopied ? 'Copied' : 'Copy'}
    </Button>
  );
}

export default function MarketingKitPanel({ kits = DEFAULT_MARKETING_KITS }: { kits?: MarketingKit[] }) {
  const instanceId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [activeTab, setActiveTab] = useState<TabId>('campaigns');
  const [activeKit, setActiveKit] = useState(kits[0]?.id || '');
  const [activeSequence, setActiveSequence] = useState(EMAIL_SEQUENCES[0]?.id || 'welcome');
  const [reviewedItemsByKit, setReviewedItemsByKit] = useState<Record<string, string[]>>({});
  const { copied, feedback, copyText, downloadText } = useCopy();

  const kit = kits.find((item) => item.id === activeKit) || kits[0];
  const sequence = EMAIL_SEQUENCES.find((item) => item.id === activeSequence) || EMAIL_SEQUENCES[0];
  const reviewedItemIds = kit ? reviewedItemsByKit[kit.id] || [] : [];
  const libraryAsMarkdown = useMemo(() => buildMarketingKitLibraryMarkdown(kits), [kits]);
  const tabCounts: Record<TabId, number> = {
    campaigns: kits.length,
    email: EMAIL_SEQUENCES.length,
    magnets: LEAD_MAGNETS.length,
    sms: SMS_TEMPLATES.length,
    social: SOCIAL_CALENDAR.length,
    cro: CRO_CHECKLIST.length,
  };

  const toggleReviewItem = (itemId: string) => {
    if (!kit) return;
    setReviewedItemsByKit((current) => {
      const checked = new Set(current[kit.id] || []);
      if (checked.has(itemId)) checked.delete(itemId);
      else checked.add(itemId);
      return { ...current, [kit.id]: Array.from(checked) };
    });
  };

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % TABS.length;
    if (event.key === 'ArrowLeft') nextIndex = (index - 1 + TABS.length) % TABS.length;
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = TABS.length - 1;
    if (nextIndex === null) return;

    event.preventDefault();
    setActiveTab(TABS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
  };

  const kitAsText = useMemo(() => {
    if (!kit) return '';
    return [
      `ALO Education marketing kit: ${kit.name}`,
      'Status: Draft material — verify claims and obtain human approval before use.',
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
      'Status: Draft material — verify consent, claims, links, and approvals before use.',
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
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#2563EB]">Marketing kit</p>
          <h2 className="mt-1 text-base font-bold text-slate-900">Marketing content library</h2>
          <p className="mt-1 max-w-3xl text-xs text-slate-500">
            Campaign kits, email sequences, lead magnets, SMS templates, a social calendar, and a CRO checklist — copy individual assets or download the complete library.
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Draft material — verify facts and get human approval before live use.
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <span className="rounded-full border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500">
            {kits.length} campaign {kits.length === 1 ? 'kit' : 'kits'} · {EMAIL_SEQUENCES.length} sequences · {LEAD_MAGNETS.length} magnets
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 rounded-lg text-xs"
            aria-label="Download the full marketing library as Markdown"
            onClick={() => downloadText('alo-marketing-kit-library.md', libraryAsMarkdown)}
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            Download full library
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Marketing library categories">
        {TABS.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              ref={(node) => { tabRefs.current[index] = node; }}
              id={`${instanceId}-tab-${tab.id}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`${instanceId}-tabpanel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${
                isActive
                  ? 'border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {tab.label}
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500" aria-hidden="true">
                {tabCounts[tab.id]}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id={`${instanceId}-tabpanel`}
        role="tabpanel"
        aria-labelledby={`${instanceId}-tab-${activeTab}`}
        tabIndex={0}
        className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
      >
      {/* Campaign kits */}
      {activeTab === 'campaigns' && kit ? (
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <div className="space-y-2" role="group" aria-label="Campaign kit selection">
            {kits.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === kit.id}
                onClick={() => setActiveKit(item.id)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${
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
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900">{kit.name}</h3>
                  <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                    Draft only · not approved
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{kit.objective}</p>
              </div>
              <div className="flex gap-2">
                <CopyButton id={`kit-${kit.id}`} label={`${kit.name} campaign kit`} text={kitAsText} copied={copied} onCopy={copyText} />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  onClick={() => downloadText(`${kit.id}-marketing-kit.md`, kitAsText)}
                >
                  <Download className="h-3.5 w-3.5" aria-hidden="true" />
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
            <CampaignCreativeComposer key={kit.id} kit={kit} />

            <section
              className="mt-5 rounded-2xl border border-amber-200 bg-white p-4"
              aria-labelledby={`${instanceId}-review-heading-${kit.id}`}
            >
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 id={`${instanceId}-review-heading-${kit.id}`} className="text-sm font-bold text-slate-900">
                    Human review checklist
                  </h4>
                  <p className="mt-1 text-xs text-slate-500">Check each item while preparing this draft for review.</p>
                </div>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold text-slate-600" role="status" aria-live="polite">
                  {reviewedItemIds.length} of {MARKETING_KIT_REVIEW_CHECKLIST.length} checked
                </span>
              </div>
              <ul className="space-y-2">
                {MARKETING_KIT_REVIEW_CHECKLIST.map((item) => {
                  const checkboxId = `${instanceId}-review-${kit.id}-${item.id}`;
                  return (
                    <li key={item.id}>
                      <label htmlFor={checkboxId} className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-100 p-3 hover:bg-slate-50">
                        <input
                          id={checkboxId}
                          type="checkbox"
                          checked={reviewedItemIds.includes(item.id)}
                          onChange={() => toggleReviewItem(item.id)}
                          className="mt-0.5 h-4 w-4 shrink-0 accent-[#2563EB]"
                        />
                        <span>
                          <span className="block text-xs font-semibold text-slate-800">{item.label}</span>
                          <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">{item.detail}</span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-[11px] leading-relaxed text-amber-800">
                Checklist progress is kept only in this page view. It does not create an approval record or schedule, send, or publish this campaign.
              </p>
            </section>
          </div>
        </div>
      ) : null}
      {activeTab === 'campaigns' && !kit ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <h3 className="text-sm font-bold text-slate-900">No campaign kits are available</h3>
          <p className="mt-1 text-xs text-slate-500">Add a kit through the marketing kit library configuration to make it available here.</p>
        </div>
      ) : null}

      {/* Email sequences */}
      {activeTab === 'email' && sequence ? (
        <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
          <div className="space-y-2" role="group" aria-label="Email sequence selection">
            {EMAIL_SEQUENCES.map((item) => (
              <button
                key={item.id}
                type="button"
                aria-pressed={item.id === sequence.id}
                onClick={() => setActiveSequence(item.id)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2 ${
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
              <CopyButton id={`sequence-${sequence.id}`} label={`${sequence.name} email sequence`} text={sequenceAsText} copied={copied} onCopy={copyText} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs"
                onClick={() => downloadText(`${sequence.id}-sequence.md`, sequenceAsText)}
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
                    id={`email-${sequence.id}-${index}`}
                    label={`email ${index + 1} in ${sequence.name}`}
                    text={`Status: Draft material — confirm consent, current facts, links, and approval before use.\n\nSubject: ${email.subject}\nPreview: ${email.preview}\n\n${email.body}\n\nCTA: ${email.cta}`}
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
              'Status: Draft concept — confirm deliverable, claims, links, permissions, and approval before use.',
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
                  <CopyButton id={`magnet-${magnet.id}`} label={`${magnet.name} lead magnet`} text={magnetText} copied={copied} onCopy={copyText} />
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
            These are draft message templates, not outbound sends. Before use, confirm sender identity, documented consent, opt-out handling, and any local sending-hour limits with the live provider and applicable policy.
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
                  label={`${template.name} message template`}
                  text={`ALO Education draft message template: ${template.name}\nChannel: ${template.channel}\nTrigger: ${template.trigger}\nTiming: ${template.timing}\nCompliance: ${template.compliance}\n\n${template.body}\n\nVerify consent, local send-time rules, and approval before use.`}
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
            Two weeks of draft social posts. One hook, one idea, one CTA per post — suggested times are Bangladesh local and must be checked against live audience analytics before scheduling.
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
                  label={`day ${post.day} ${post.platform} social post`}
                  text={`Status: Draft material — verify current claims, links, consent, and approval before use.\n\nHook: ${post.hook}\n\n${post.copy}\n\nCTA: ${post.cta}`}
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
            Planning prompts only — confirm traffic, measurement, consent, and experiment design before changing a live page.
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
                  label={`${item.page} conversion review item`}
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
      </div>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">{feedback}</div>
    </section>
  );
}
