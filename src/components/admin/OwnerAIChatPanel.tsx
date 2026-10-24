'use client';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Send, ShieldCheck, MessageSquarePlus } from 'lucide-react';

type Model = { id: string; approved: boolean; retainsOrTrains: boolean; consentRequired: boolean };
type Turn = { id: string; message: string; reply: string | null; status: string; error?: string | null; model: string };
type State = {
  conversationId: string | null;
  conversations: { id: string; model: string; startedAt: string }[];
  messages: Turn[];
  local: { configured: boolean; model: string | null };
  unorouter: { enabled: boolean; keyConfigured: boolean; configurationValid: boolean; defaultModel: string; models: Model[]; catalogError: string | null };
};
export default function OwnerAIChatPanel({ focus }: { focus: string }) {
  const [state, setState] = useState<State | null>(null);
  const [provider, setProvider] = useState<'local' | 'unorouter'>('local');
  const [model, setModel] = useState('');
  const [conversation, setConversation] = useState('');
  const [message, setMessage] = useState('');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const pending = useRef<{ requestId: string; conversationId: string; message: string; model: string; provider: string; externalConsent: boolean } | null>(null);
  async function load(id?: string) {
    setLoading(true); setError('');
    try {
      const response = await fetch(`/api/admin/ai-chat${id ? `?conversationId=${encodeURIComponent(id)}` : ''}`, { cache: 'no-store', credentials: 'same-origin' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'Chat could not be loaded.');
      setState(data); setConversation(data.conversationId || crypto.randomUUID());
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chat could not be loaded.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const freeModels = state?.unorouter.models.filter(entry => entry.approved) || [];
  const selected = freeModels.find(entry => entry.id === model);
  const ready = !!state && (provider === 'local' ? state.local.configured : state.unorouter.enabled && state.unorouter.keyConfigured && state.unorouter.configurationValid && !!selected && consent);
  useEffect(() => {
    setModel(provider === 'local' ? state?.local.model || '' : freeModels.find(entry => entry.id === state?.unorouter.defaultModel)?.id || freeModels[0]?.id || '');
    setConsent(false); pending.current = null;
    // The catalog is refreshed by loading history, never inferred from model names alone.
  }, [provider, state]);
  async function send(event: React.FormEvent) {
    event.preventDefault(); if (!ready || !message.trim() || busy) return;
    setBusy(true); setError(''); setNotice('');
    const body = { conversationId: conversation, message: message.trim(), provider, model, externalConsent: provider === 'unorouter' && consent };
    const prior = pending.current;
    const requestId = prior && Object.entries(body).every(([key, value]) => prior[key as keyof typeof prior] === value) ? prior.requestId : crypto.randomUUID();
    pending.current = { ...body, requestId };
    try {
      const response = await fetch('/api/admin/ai-chat', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pending.current) });
      const data = await response.json();
      if (!response.ok || !data.success) {
        const wait = response.headers.get('retry-after');
        if (data.code !== 'RATE_LIMITED' && data.code !== 'CHAT_UNAVAILABLE') pending.current = null;
        throw new Error(`${data.error || 'AI reply was not completed.'}${wait ? ` Retry after ${wait} seconds.` : ''}`);
      }
      if (data.status === 'RUNNING') setNotice('This request is still running. Refresh history to check its saved result.');
      else { setMessage(''); pending.current = null; }
      await load(conversation);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Connection interrupted. Retry uses the same request ID.'); }
    finally { setBusy(false); }
  }
  return <Card className="min-w-0 bg-white border-[var(--alo-border)]">
    <CardHeader className="gap-3 border-b border-[var(--alo-border)]">
      <div className="flex flex-wrap items-center justify-between gap-2"><CardTitle className="text-base">Owner AI chat</CardTitle><span className="flex items-center gap-1 text-xs text-blue-800"><ShieldCheck size={15} /> Super Admin only</span></div>
      <p className="text-xs text-[var(--alo-text-secondary)]">Planning focus: {focus.replaceAll('-', ' ')}. Replies are drafts; chat cannot execute CRM changes, commands, payments or publishing.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="text-xs">Provider<select aria-label="AI provider" disabled={busy || loading} className="mt-1 w-full rounded-lg border p-2 bg-white" value={provider} onChange={e => setProvider(e.target.value as typeof provider)}><option value="local">Private local model</option><option value="unorouter">UnoRouter — free models only</option></select></label>
        <label className="text-xs">Model<select aria-label="AI model" className="mt-1 w-full rounded-lg border p-2 bg-white" disabled={busy || loading} value={model} onChange={e => { setModel(e.target.value); pending.current = null; }}><option value="">No configured model available</option>{provider === 'local' ? state?.local.model && <option value={state.local.model}>{state.local.model}</option> : freeModels.map(entry => <option key={entry.id} value={entry.id}>{entry.id}</option>)}</select></label>
      </div>
      {provider === 'unorouter' && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs space-y-2">
        <p>External cloud provider. Do not include employee, salary, student, identity, payment or other confidential data. No CRM records are automatically attached. Free models may be unavailable or rate limited; there is no paid fallback.</p>
        {selected?.retainsOrTrains && <p>This provider reports that prompts may be retained or used for training. Review its privacy terms before sending.</p>}
        {selected?.consentRequired && <p>Additional consent may be required in your UnoRouter account. The CRM never grants provider consent automatically.</p>}
        <label className="flex items-start gap-2"><input type="checkbox" checked={consent} disabled={busy} onChange={e => setConsent(e.target.checked)} /><span>I authorize sending this non-confidential conversation to the selected external free model.</span></label>
        {state?.unorouter.catalogError && <p role="status">{state.unorouter.catalogError}</p>}
        {state && (!state.unorouter.enabled || !state.unorouter.keyConfigured || !state.unorouter.configurationValid) && <p>Server configuration is required: UNOROUTER_ENABLED, UNOROUTER_API_KEY and UNOROUTER_ALLOWED_MODELS. Keep paid AI disabled.</p>}
      </div>}
      {provider === 'local' && state && !state.local.configured && <p className="text-xs text-[var(--alo-text-secondary)]">Configure LOCAL_AI_URL and LOCAL_AI_MODEL on the server to use private local chat.</p>}
      <div className="flex flex-wrap gap-2">
        <label className="flex-1 min-w-0 text-xs">Saved conversation<select aria-label="Saved conversation" className="mt-1 w-full rounded-lg border p-2 bg-white" disabled={busy || loading} value={conversation} onChange={e => { pending.current = null; void load(e.target.value); }}><option value={conversation}>Current conversation</option>{state?.conversations.filter(item => item.id !== conversation).map(item => <option key={item.id} value={item.id}>{new Date(item.startedAt).toLocaleString()} · {item.model}</option>)}</select></label>
        <Button variant="outline" size="sm" disabled={busy || loading} onClick={() => { const id = crypto.randomUUID(); pending.current = null; setNotice(''); void load(id); }}><MessageSquarePlus size={15} className="mr-1" />New</Button>
        <Button variant="outline" size="sm" disabled={busy} onClick={() => void load(conversation || undefined)} aria-label="Refresh chat"><RefreshCw size={15} /></Button>
      </div>
    </CardHeader>
    <CardContent className="p-4 space-y-4">
      {loading && <p role="status" className="animate-pulse text-sm text-[var(--alo-text-muted)]">Loading authorized chat history…</p>}
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {notice && <p role="status" className="text-sm text-blue-800">{notice}</p>}
      {!loading && state && state.messages.length === 0 && <p className="rounded-xl bg-[var(--alo-page)] p-6 text-center text-sm text-[var(--alo-text-muted)]">No messages yet. Select a configured model to start.</p>}
      <div className="max-h-[480px] overflow-y-auto space-y-4" aria-live="polite">
        {state?.messages.map(turn => <div key={turn.id} className="space-y-2 text-sm">
          <div className="ml-5 rounded-xl bg-[var(--alo-blue-soft)] p-3 whitespace-pre-wrap break-words"><span className="block text-xs font-semibold text-blue-800 mb-1">You</span>{turn.message}</div>
          <div className="mr-5 rounded-xl bg-[var(--alo-page)] p-3 whitespace-pre-wrap break-words"><span className="block text-xs font-semibold text-[var(--alo-text-muted)] mb-1">{turn.model} · {turn.status}</span>{turn.reply || (turn.status === 'RUNNING' ? 'Reply pending. Refresh history to check.' : `Reply unavailable${turn.error ? `: ${turn.error}` : '.'}`)}</div>
        </div>)}
      </div>
      <form onSubmit={send} className="space-y-2">
        <label htmlFor="owner-ai-message" className="text-xs font-medium">Message</label>
        <textarea id="owner-ai-message" rows={3} maxLength={4000} value={message} onChange={e => setMessage(e.target.value)} disabled={!state || busy} className="w-full rounded-xl border p-3 text-sm focus:outline-orange-500" />
        <div className="flex justify-between items-center gap-2"><span className="text-xs text-[var(--alo-text-muted)]">{message.length}/4000 · Encrypted saved history</span><Button type="submit" disabled={!ready || !message.trim() || busy || loading} className="bg-orange-500 hover:bg-orange-600 text-white"><Send size={15} className="mr-1" />{busy ? 'Waiting for reply…' : 'Send'}</Button></div>
      </form>
    </CardContent>
  </Card>;
}
