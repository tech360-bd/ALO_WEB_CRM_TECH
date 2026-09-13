'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquare, RefreshCw, Send, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type Conversation = {
  key: string;
  channel: string;
  studentId?: string | null;
  studentName?: string | null;
  fromPhone?: string | null;
  fromEmail?: string | null;
  messages: Array<{ id: string; body: string; direction: string; receivedAt: string; sentAt?: string | null }>;
  unread: number;
  lastMessageAt: string;
};

export default function UnifiedInboxView() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [channel, setChannel] = useState('ALL');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = channel === 'ALL' ? '' : `?channel=${encodeURIComponent(channel)}`;
      const response = await fetch(`/api/inbox/unified${query}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to load inbox');
      setConversations(data.conversations || []);
      setSelectedKey((current) => current && (data.conversations || []).some((item: Conversation) => item.key === current) ? current : data.conversations?.[0]?.key || null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load inbox');
    } finally {
      setLoading(false);
    }
  }, [channel]);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => conversations.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return `${item.studentName || ''} ${item.channel} ${item.fromPhone || ''} ${item.fromEmail || ''}`.toLowerCase().includes(q);
  }), [conversations, search]);
  const selected = filtered.find((item) => item.key === selectedKey) || filtered[0] || null;

  const send = async () => {
    if (!selected || !message.trim()) return;
    setSending(true);
    try {
      const last = selected.messages[selected.messages.length - 1];
      const response = await fetch('/api/inbox/unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: selected.channel,
          toPhone: selected.fromPhone,
          toEmail: selected.fromEmail,
          body: message.trim(),
          studentId: selected.studentId,
          counselorId: undefined,
          aiAssisted: false,
          humanApproved: true,
          replyToMessageId: last?.id,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to send message');
      setMessage('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="flex min-h-[600px] flex-col gap-4 rounded-xl border bg-background p-4">
      <header className="flex flex-wrap items-center gap-3">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-semibold">Unified Inbox</h1>
        <Badge variant="secondary">{conversations.length} conversations</Badge>
        <div className="ml-auto flex gap-2">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search contact or channel" className="w-56" />
          <Button variant="outline" size="icon" onClick={() => void load()} aria-label="Refresh inbox"><RefreshCw className="h-4 w-4" /></Button>
        </div>
      </header>
      <div className="flex gap-2 border-b pb-3">
        {['ALL', 'WHATSAPP', 'SMS', 'EMAIL', 'SOCIAL', 'PORTAL'].map((item) => <Button key={item} size="sm" variant={channel === item ? 'default' : 'outline'} onClick={() => setChannel(item)}>{item}</Button>)}
      </div>
      {error && <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"><AlertCircle className="h-4 w-4" />{error}</div>}
      {loading ? <div className="p-8 text-center text-muted-foreground">Loading conversations…</div> : (
        <div className="grid min-h-[480px] grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
          <aside className="overflow-y-auto rounded-lg border">
            {filtered.length === 0 ? <p className="p-5 text-sm text-muted-foreground">No real messages found.</p> : filtered.map((item) => <button key={item.key} onClick={() => setSelectedKey(item.key)} className={`block w-full border-b p-3 text-left hover:bg-muted ${selected?.key === item.key ? 'bg-muted' : ''}`}><div className="flex items-center gap-2 font-medium"><User className="h-4 w-4" />{item.studentName || item.fromPhone || item.fromEmail || 'Unknown contact'}{item.unread > 0 && <Badge>{item.unread}</Badge>}</div><div className="mt-1 text-xs text-muted-foreground">{item.channel} · {new Date(item.lastMessageAt).toLocaleString()}</div><div className="mt-1 truncate text-sm">{item.messages.at(-1)?.body || 'No message body'}</div></button>)}
          </aside>
          <main className="flex flex-col rounded-lg border">
            {!selected ? <div className="flex flex-1 items-center justify-center text-muted-foreground">Select a conversation.</div> : <>
              <div className="border-b p-4"><h2 className="font-semibold">{selected.studentName || 'Unknown contact'}</h2><p className="text-sm text-muted-foreground">{selected.channel} · {selected.fromPhone || selected.fromEmail || 'No contact address'}</p></div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">{selected.messages.map((item) => <div key={item.id} className={`max-w-[80%] rounded-lg p-3 text-sm ${item.direction === 'OUTBOUND' ? 'ml-auto bg-primary text-primary-foreground' : 'bg-muted'}`}><p>{item.body}</p><time className="mt-1 block text-[11px] opacity-70">{new Date(item.sentAt || item.receivedAt).toLocaleString()}</time></div>)}</div>
              <div className="flex gap-2 border-t p-3"><Input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Write a real reply…" disabled={sending} /><Button onClick={() => void send()} disabled={sending || !message.trim()}><Send className="mr-2 h-4 w-4" />Send</Button></div>
            </>}
          </main>
        </div>
      )}
    </section>
  );
}
