'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bot, LoaderCircle, RefreshCw, Send, ShieldAlert, Sparkles } from 'lucide-react';

type ProviderStatus = {
  slug: string;
  name: string;
  configured: boolean;
  available: boolean;
  freeTier: string;
  freeTierVerified: boolean;
  provenance: string;
  blocker: string | null;
};
type ChatMessage = { role: 'user' | 'assistant'; content: string };
type Readiness = {
  providers: ProviderStatus[];
  selectedProvider: string | null;
  cloudInferenceApproved: boolean;
  paused: boolean;
  limitations: string[];
};

type ReplyMetadata = { provider: string; latencyMs: number };

export default function AICommandCenterAgent() {
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [confirmNonConfidential, setConfirmNonConfidential] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [lastReply, setLastReply] = useState<ReplyMetadata | null>(null);

  const loadReadiness = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/ai-command-center/assistant', { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Could not load provider readiness.');
      setReadiness(data as Readiness);
      setSelectedProvider((current) => {
        if (data.providers?.some((provider: ProviderStatus) => provider.slug === current && provider.available)) return current;
        return data.selectedProvider || '';
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load provider readiness.');
      setReadiness(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReadiness(); }, [loadReadiness]);

  const selected = useMemo(
    () => readiness?.providers.find((provider) => provider.slug === selectedProvider),
    [readiness, selectedProvider],
  );

  async function sendMessage() {
    const content = draft.trim();
    if (!content || sending || !selected?.available || (selectedProvider !== 'local' && !confirmNonConfidential)) return;
    const nextMessages = [...messages, { role: 'user' as const, content }].slice(-8);
    setMessages(nextMessages);
    setDraft('');
    setSending(true);
    setError('');
    try {
      const response = await fetch('/api/admin/ai-command-center/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: selectedProvider, messages: nextMessages, confirmNonConfidential }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'The provider did not complete the request.');
      setMessages((current) => [...current, { role: 'assistant', content: data.reply }].slice(-8));
      setLastReply({ provider: data.provider, latencyMs: data.latencyMs });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The provider did not complete the request.');
    } finally {
      setSending(false);
    }
  }

  const hasAvailableProvider = Boolean(readiness?.providers.some((provider) => provider.available));

  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--alo-border)] bg-white shadow-sm" aria-labelledby="alo-agent-title">
      <div className="flex flex-col gap-4 border-b border-[var(--alo-border)] bg-[var(--alo-blue-soft)] p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-white p-2.5 text-[var(--alo-brand)] shadow-sm"><Bot className="h-6 w-6" aria-hidden="true" /></div>
          <div>
            <h2 id="alo-agent-title" className="text-lg font-bold text-[var(--alo-text)]">ALO Admin Copilot</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--alo-text-secondary)]">
              ALO-owned text assistant using the existing provider gateway. It drafts and reasons over text you provide; it has no system tools or ALO record access.
            </p>
          </div>
        </div>
        <button type="button" onClick={() => void loadReadiness()} disabled={loading} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[var(--alo-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--alo-text)] hover:bg-slate-50 disabled:opacity-60">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh readiness
        </button>
      </div>

      <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--alo-text)]">
              Provider
              <select
                value={selectedProvider}
                onChange={(event) => { setSelectedProvider(event.target.value); setConfirmNonConfidential(false); }}
                disabled={loading || sending || !hasAvailableProvider}
                className="max-w-[17rem] rounded-lg border border-[var(--alo-border)] bg-white px-3 py-2 text-sm font-normal disabled:bg-slate-100"
              >
                {!selectedProvider && <option value="">No provider ready</option>}
                {readiness?.providers.map((provider) => (
                  <option key={provider.slug} value={provider.slug} disabled={!provider.available}>
                    {provider.name} · {provider.available ? 'ready' : 'blocked'}
                  </option>
                ))}
              </select>
            </label>
            <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${selected?.available ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${selected?.available ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {loading ? 'Checking configuration' : selected?.available ? 'Configured and permitted' : 'No permitted provider selected'}
            </span>
          </div>

          <div className="min-h-64 space-y-3 rounded-xl border border-[var(--alo-border)] bg-slate-50/70 p-4" aria-live="polite" aria-label="Assistant conversation">
            {messages.length === 0 && !sending && (
              <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
                <Sparkles className="mb-3 h-7 w-7 text-[var(--alo-brand)]" aria-hidden="true" />
                <p className="font-semibold text-[var(--alo-text)]">Start with a draft or question</p>
                <p className="mt-1 max-w-lg text-sm text-[var(--alo-text-secondary)]">For example: “Draft a checklist for reviewing a proposed admin workflow.” No ALO data is loaded into this conversation.</p>
              </div>
            )}
            {messages.map((message, index) => (
              <div key={`${index}-${message.role}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-[var(--alo-brand)] text-white' : 'border border-[var(--alo-border)] bg-white text-[var(--alo-text)]'}`}>
                  <div className="mb-1 text-[10px] font-bold uppercase tracking-wide opacity-70">{message.role === 'user' ? 'You' : 'ALO Admin Copilot'}</div>
                  {message.content}
                </div>
              </div>
            ))}
            {sending && <div className="flex items-center gap-2 text-sm text-[var(--alo-text-secondary)]"><LoaderCircle className="h-4 w-4 animate-spin" /> Waiting for the selected provider…</div>}
          </div>

          {selected?.available && selectedProvider !== 'local' && (
            <label className="mt-3 flex cursor-pointer items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
              <input type="checkbox" checked={confirmNonConfidential} onChange={(event) => setConfirmNonConfidential(event.target.checked)} className="mt-1" />
              <span>I confirm this conversation contains no confidential student, employee, financial, credential, or other restricted information. The selected cloud provider may process the text externally; free-tier and zero-cost use are not guaranteed.</span>
            </label>
          )}

          <form className="mt-3" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
            <label htmlFor="alo-agent-message" className="sr-only">Message ALO Admin Copilot</label>
            <div className="flex items-end gap-2 rounded-xl border border-[var(--alo-border)] bg-white p-2 focus-within:ring-2 focus-within:ring-[var(--alo-brand)]/30">
              <textarea
                id="alo-agent-message"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 4_000))}
                onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }}
                rows={2}
                maxLength={4_000}
                placeholder={selected?.available ? 'Ask for a draft or recommendation…' : 'Configure an allowed provider to start chatting.'}
                disabled={!selected?.available || sending}
                className="max-h-40 min-h-12 flex-1 resize-y border-0 bg-transparent px-2 py-2 text-sm text-[var(--alo-text)] outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
              />
              <button type="submit" disabled={!draft.trim() || !selected?.available || sending || (selectedProvider !== 'local' && !confirmNonConfidential)} aria-label="Send message" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--alo-brand)] text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
                {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-1 flex justify-between px-1 text-[11px] text-[var(--alo-text-muted)]"><span>Enter to send · Shift+Enter for a new line</span><span>{draft.length}/4000</span></div>
          </form>
          {error && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
          {lastReply && <p className="mt-2 text-xs text-[var(--alo-text-muted)]">Last response from {lastReply.provider} · {lastReply.latencyMs} ms. Model identifiers are not echoed to avoid exposing misconfigured credential values. This confirms a response only, not provider free-tier or billing status.</p>}
        </div>

        <aside className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2 text-amber-950"><ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><h3 className="text-sm font-bold">Privacy and action boundary</h3></div>
            <p className="mt-2 text-xs leading-5 text-amber-950">Do not enter confidential data into cloud inference. The agent cannot approve, submit, send, publish, delete, or execute changes. Review its drafts before use.</p>
          </div>

          <div className="rounded-xl border border-[var(--alo-border)] p-4">
            <h3 className="text-sm font-bold text-[var(--alo-text)]">Provider readiness</h3>
            {loading && <p className="mt-2 text-xs text-[var(--alo-text-secondary)]">Reading server-side configuration…</p>}
            {!loading && readiness && <ul className="mt-3 space-y-2">
              {readiness.providers.map((provider) => (
                <li key={provider.slug} className="flex items-start justify-between gap-2 border-t border-slate-100 pt-2 first:border-0 first:pt-0">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--alo-text)]">{provider.name}</p>
                    <p className="mt-0.5 text-[11px] leading-4 text-[var(--alo-text-secondary)]">{provider.available ? 'Configured · permitted' : provider.blocker || 'Not ready'}</p>
                    {provider.slug !== 'local' && <p className="mt-0.5 text-[10px] text-[var(--alo-text-muted)]">Free tier: {provider.freeTierVerified ? 'verified' : 'unverified'} · no zero-cost guarantee</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${provider.available ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>{provider.available ? 'READY' : 'BLOCKED'}</span>
                </li>
              ))}
            </ul>}
            {!loading && !readiness && <p className="mt-2 text-xs text-rose-700">Provider readiness is unavailable; inference remains disabled.</p>}
            {readiness && !readiness.cloudInferenceApproved && <p className="mt-3 rounded-lg bg-slate-50 p-2 text-[11px] leading-4 text-[var(--alo-text-secondary)]">Cloud inference is fail-closed. A provider key alone does not enable it; owner approval and billing review are required. No billing setting was changed.</p>}
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <h3 className="text-sm font-bold text-[var(--alo-text)]">Current scope</h3>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-[var(--alo-text-secondary)]">
              <li>Text drafting and reasoning only</li>
              <li>No record retrieval or system tools</li>
              <li>No image, audio, video, or web-search services</li>
              <li>Prompts and replies are not stored in ALO; audit logs keep provider, model, and latency only</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
