'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { MessageSquare, Send, Loader2, Search, ArrowLeft, CheckCheck, Plus, RefreshCw } from 'lucide-react';

interface Message { id: string; text: string; sender: 'me' | 'them'; senderName: string; createdAt: string; read: boolean }
interface Conversation { id: string; subject: string; status: string; lastMessage: string; lastTime: string; unread: number }

function formatTime(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function PartnerMessagesPage() {
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/partner/messages?page=1&limit=100', { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.data?.threads)) {
        throw new Error(payload.error || `Could not load support conversations (HTTP ${response.status})`);
      }
      const rows = payload.data.threads.map((thread: any): Conversation => ({
        id: String(thread.id || ''),
        subject: String(thread.subject || 'Support conversation'),
        status: String(thread.status || 'open'),
        lastMessage: String(thread.messages?.[0]?.content || thread.lastMessagePreview || ''),
        lastTime: String(thread.lastMessageAt || thread.createdAt || ''),
        unread: Number(thread.unreadCount || 0),
      }));
      setConversations(rows);
      setSelectedId((current) => current && rows.some((row: Conversation) => row.id === current) ? current : rows[0]?.id || null);
    } catch (caught) {
      setConversations([]);
      setSelectedId(null);
      setError(caught instanceof Error ? caught.message : 'Could not load support conversations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchConversations(); }, [fetchConversations]);

  const fetchThread = useCallback(async (threadId: string) => {
    setMessagesLoading(true);
    setThreadError(null);
    try {
      const response = await fetch(`/api/partner/messages?threadId=${encodeURIComponent(threadId)}`, { credentials: 'include' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.data?.messages)) {
        throw new Error(payload.error || `Could not load messages (HTTP ${response.status})`);
      }
      setMessages(payload.data.messages.map((message: any): Message => ({
        id: String(message.id || ''),
        text: String(message.content || ''),
        sender: message.isMine ? 'me' : 'them',
        senderName: String(message.senderName || (message.isMine ? 'You' : 'ALO Support')),
        createdAt: String(message.createdAt || ''),
        read: Boolean(message.isRead),
      })));
      setConversations((current) => current.map((conversation) => conversation.id === threadId ? { ...conversation, unread: 0 } : conversation));
    } catch (caught) {
      setMessages([]);
      setThreadError(caught instanceof Error ? caught.message : 'Could not load this conversation.');
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedId) void fetchThread(selectedId);
    else { setMessages([]); setThreadError(null); }
  }, [selectedId, fetchThread]);

  const filtered = conversations.filter((conversation) => !search || conversation.subject.toLowerCase().includes(search.toLowerCase()) || conversation.lastMessage.toLowerCase().includes(search.toLowerCase()));

  const handleSend = async () => {
    const content = newMessage.trim();
    if (!content) return;
    if (!selectedId && !newSubject.trim()) { toast.error('Add a subject for the new support conversation.'); return; }
    setSending(true);
    try {
      const response = await fetch('/api/partner/messages', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedId ? { threadId: selectedId, content } : { subject: newSubject.trim(), content }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success) throw new Error(payload.error || `Message was not saved (HTTP ${response.status})`);
      const threadId = String(payload.data?.threadId || payload.data?.thread?.id || selectedId || '');
      setNewMessage('');
      setNewSubject('');
      setCreating(false);
      await fetchConversations();
      if (threadId) {
        setSelectedId(threadId);
        await fetchThread(threadId);
      }
      toast.success('Message saved to your support conversation.');
    } catch (caught) {
      toast.error(caught instanceof Error ? caught.message : 'Message could not be sent.');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="space-y-6 p-1"><Skeleton className="h-8 w-48" /><div className="flex gap-4 h-[600px]"><Skeleton className="w-80 flex-shrink-0 rounded-xl" /><Skeleton className="flex-1 rounded-xl" /></div></div>;

  return (
    <div className="space-y-4 p-1">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"><div><h1 className="text-2xl font-bold text-alo-text">Messages</h1><p className="text-sm text-alo-text-muted mt-0.5">Saved partner support conversations with ALO Education</p></div><Button variant="brand" size="sm" onClick={() => { setCreating(true); setSelectedId(null); setMessages([]); setThreadError(null); }}><Plus className="h-4 w-4" />New Support Message</Button></div>
      {error && <Card className="border-amber-200 bg-amber-50"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><p className="text-sm text-amber-900">{error}</p><Button variant="outline" size="sm" onClick={() => void fetchConversations()}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button></CardContent></Card>}

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        <Card className="w-80 flex-shrink-0 bg-white rounded-xl border border-alo-border flex flex-col overflow-hidden"><div className="p-3 border-b border-alo-border"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" /><Input placeholder="Search conversations..." className="pl-9 h-9 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div><div className="flex-1 overflow-y-auto custom-scrollbar">{filtered.length === 0 ? <div className="p-6 text-center text-sm text-alo-text-muted">{error ? 'Conversations unavailable.' : 'No saved support conversations.'}</div> : filtered.map((conversation) => <button key={conversation.id} onClick={() => { setCreating(false); setSelectedId(conversation.id); }} className={cn('w-full text-left p-3 border-b border-alo-border/50 transition-colors flex items-start gap-3', selectedId === conversation.id && !creating ? 'bg-alo-brand-light/20' : 'hover:bg-muted/50')}><div className="w-10 h-10 rounded-full bg-alo-brand flex items-center justify-center text-sm font-semibold text-white shrink-0"><MessageSquare className="h-4 w-4" /></div><div className="flex-1 min-w-0"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium truncate text-alo-text">{conversation.subject}</p><span className="text-[11px] text-alo-text-muted shrink-0">{formatTime(conversation.lastTime)}</span></div><p className="text-[11px] text-alo-text-muted truncate mt-0.5">{conversation.lastMessage || 'No message preview'}</p><div className="mt-1 flex items-center gap-2"><Badge variant="outline" className="text-[11px]">{conversation.status}</Badge>{conversation.unread > 0 && <Badge variant="brand" className="text-[11px] px-1.5 py-0 h-4">{conversation.unread} unread</Badge>}</div></div></button>)}</div></Card>

        <Card className="flex-1 bg-white rounded-xl border border-alo-border flex flex-col overflow-hidden"><div className="flex items-center gap-3 p-4 border-b border-alo-border"><Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setSelectedId(null)}><ArrowLeft className="w-4 h-4" /></Button><div className="w-9 h-9 rounded-full bg-alo-brand flex items-center justify-center text-white"><MessageSquare className="h-4 w-4" /></div><div className="flex-1 min-w-0"><p className="text-sm font-semibold text-alo-text">{creating ? 'New Support Message' : conversations.find((conversation) => conversation.id === selectedId)?.subject || 'Select a support conversation'}</p><p className="text-[11px] text-alo-text-muted">ALO Education partner support</p></div></div>
          {creating && <div className="border-b border-alo-border p-4"><label htmlFor="supportSubject" className="mb-1 block text-xs font-medium text-alo-text-secondary">Subject</label><Input id="supportSubject" maxLength={200} placeholder="What do you need help with?" value={newSubject} onChange={(event) => setNewSubject(event.target.value)} /></div>}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">{messagesLoading ? <Skeleton className="h-24 w-full" /> : threadError ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{threadError}</p> : messages.length === 0 ? <div className="flex h-full items-center justify-center text-sm text-alo-text-muted">{creating ? 'Send your first message to open a support conversation.' : 'No messages are recorded in this conversation.'}</div> : messages.map((message) => <div key={message.id} className={cn('flex', message.sender === 'me' ? 'justify-end' : 'justify-start')}><div className={cn('max-w-[75%] rounded-2xl px-4 py-2.5', message.sender === 'me' ? 'bg-alo-brand text-white rounded-br-md' : 'bg-muted text-alo-text rounded-bl-md')}><p className="text-[11px] opacity-75 mb-1">{message.senderName}</p><p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p><div className={cn('flex items-center gap-1 mt-1', message.sender === 'me' ? 'justify-end' : 'justify-start')}><span className={cn('text-[11px]', message.sender === 'me' ? 'text-white/70' : 'text-alo-text-muted')}>{formatTime(message.createdAt)}</span>{message.sender === 'me' && <CheckCheck className={cn('w-3.5 h-3.5', message.read ? 'text-[var(--alo-brand-pale)]' : 'text-white/50')} />}</div></div></div>)}</div>
          <div className="p-3 border-t border-alo-border"><div className="flex items-end gap-2"><Textarea placeholder="Write a message to ALO Support…" value={newMessage} onChange={(event) => setNewMessage(event.target.value)} rows={2} maxLength={5000} className="resize-none min-h-[44px] max-h-28 text-sm" onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void handleSend(); } }} /><Button variant="brand" size="icon" onClick={() => void handleSend()} disabled={sending || !newMessage.trim() || (!selectedId && !creating)} title="Save message"><span className="sr-only">Send message</span>{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</Button></div><p className="mt-1 text-[11px] text-alo-text-muted">Enter sends · Shift+Enter adds a line break · Messages are saved in your support record</p></div>
        </Card>
      </div>
    </div>
  );
}
