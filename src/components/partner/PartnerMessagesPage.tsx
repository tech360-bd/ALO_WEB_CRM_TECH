'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  MessageSquare, Send, Loader2, Search,
  ArrowLeft, Circle, CheckCheck,
} from 'lucide-react';

/* ── Types ──────────────────────────────────────────── */

interface Message {
  id: string;
  text: string;
  sender: 'me' | 'them';
  time: string;
  read: boolean;
}

interface Conversation {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

/* ── Mock Data ──────────────────────────────────────── */

const mockConversations: Conversation[] = [
  {
    id: 'conv-1', name: 'ALO Admin', role: 'System Administrator', avatar: 'A',
    lastMessage: 'Your commission for January has been processed.', lastTime: '2 min ago', unread: 2, online: true,
    messages: [
      { id: 'm1-1', text: 'Welcome to the partner portal! Let me know if you need any assistance.', sender: 'them', time: '10:00 AM', read: true },
      { id: 'm1-2', text: 'Thank you! I was wondering about the commission schedule.', sender: 'me', time: '10:05 AM', read: true },
      { id: 'm1-3', text: 'Commissions are processed on the 15th of each month for the previous month enrollments.', sender: 'them', time: '10:08 AM', read: true },
      { id: 'm1-4', text: 'Got it. Also, when will the new university list be available?', sender: 'me', time: '10:12 AM', read: true },
      { id: 'm1-5', text: 'The updated list will be shared by end of this week. We are finalizing partnerships with 3 new UK universities.', sender: 'them', time: '10:15 AM', read: true },
      { id: 'm1-6', text: 'Great! Looking forward to it.', sender: 'me', time: '10:18 AM', read: true },
      { id: 'm1-7', text: 'Your commission for January has been processed.', sender: 'them', time: '10:30 AM', read: false },
      { id: 'm1-8', text: 'Please check the Commission page for details.', sender: 'them', time: '10:31 AM', read: false },
    ],
  },
  {
    id: 'conv-2', name: 'Counselor Sarah', role: 'Lead Counselor', avatar: 'S',
    lastMessage: 'The student documents look good. We can proceed.', lastTime: '1 hr ago', unread: 1, online: true,
    messages: [
      { id: 'm2-1', text: 'Hi, I submitted 3 new leads yesterday. Can you check them?', sender: 'me', time: '09:00 AM', read: true },
      { id: 'm2-2', text: 'Yes, I have reviewed them. Two look very promising for UK universities.', sender: 'them', time: '09:15 AM', read: true },
      { id: 'm2-3', text: 'Which universities would you recommend for the MSc Data Science student?', sender: 'me', time: '09:20 AM', read: true },
      { id: 'm2-4', text: 'I would suggest University of Birmingham and University of Leeds. Both have strong programs.', sender: 'them', time: '09:25 AM', read: true },
      { id: 'm2-5', text: 'Perfect, I will share this with the student.', sender: 'me', time: '09:30 AM', read: true },
      { id: 'm2-6', text: 'The student documents look good. We can proceed.', sender: 'them', time: '09:45 AM', read: false },
    ],
  },
  {
    id: 'conv-3', name: 'Finance Team', role: 'Accounts & Payments', avatar: 'F',
    lastMessage: 'Payment of BDT 45,000 credited to your account.', lastTime: '3 hrs ago', unread: 0, online: false,
    messages: [
      { id: 'm3-1', text: 'Hello, I wanted to check on my pending commission payment.', sender: 'me', time: '08:00 AM', read: true },
      { id: 'm3-2', text: 'Let me check the records. Which month are you referring to?', sender: 'them', time: '08:10 AM', read: true },
      { id: 'm3-3', text: 'December commission for the 3 enrolled students.', sender: 'me', time: '08:12 AM', read: true },
      { id: 'm3-4', text: 'Found it. The payment was delayed due to bank processing. It should clear today.', sender: 'them', time: '08:20 AM', read: true },
      { id: 'm3-5', text: 'Payment of BDT 45,000 credited to your account.', sender: 'them', time: '07:30 AM', read: true },
    ],
  },
  {
    id: 'conv-4', name: 'Visa Officer Kamal', role: 'Visa Processing', avatar: 'K',
    lastMessage: 'The CAS has been issued. Student needs to book biometrics.', lastTime: 'Yesterday', unread: 3, online: false,
    messages: [
      { id: 'm4-1', text: 'Kamal bhai, what is the status of Rafiq visa application?', sender: 'me', time: '2:00 PM', read: true },
      { id: 'm4-2', text: 'We are waiting for the CAS from the university. Should arrive in 2-3 days.', sender: 'them', time: '2:10 PM', read: true },
      { id: 'm4-3', text: 'The student is getting anxious. Can we expedite?', sender: 'me', time: '2:15 PM', read: true },
      { id: 'm4-4', text: 'I have followed up with the university. They confirmed the CAS will be issued today.', sender: 'them', time: '2:30 PM', read: true },
      { id: 'm4-5', text: 'The CAS has been issued. Student needs to book biometrics.', sender: 'them', time: '4:00 PM', read: false },
      { id: 'm4-6', text: 'I have attached the CAS document. Please share with the student.', sender: 'them', time: '4:01 PM', read: false },
      { id: 'm4-7', text: 'Also remind them about the tuberculosis test requirement.', sender: 'them', time: '4:02 PM', read: false },
    ],
  },
  {
    id: 'conv-5', name: 'Marketing Team', role: 'Marketing & Branding', avatar: 'M',
    lastMessage: 'New banners are ready for download in the Resources section.', lastTime: '2 days ago', unread: 0, online: true,
    messages: [
      { id: 'm5-1', text: 'Hi, can we get some updated marketing materials for the Spring 2025 intake?', sender: 'me', time: '11:00 AM', read: true },
      { id: 'm5-2', text: 'Absolutely! What type of materials do you need?', sender: 'them', time: '11:10 AM', read: true },
      { id: 'm5-3', text: 'Social media banners, flyers for our office, and university brochures.', sender: 'me', time: '11:15 AM', read: true },
      { id: 'm5-4', text: 'We are working on it. The new campaign materials will be ready by Friday.', sender: 'them', time: '11:20 AM', read: true },
      { id: 'm5-5', text: 'New banners are ready for download in the Resources section.', sender: 'them', time: '3:00 PM', read: true },
    ],
  },
];

/* ── Component ─────────────────────────────────────── */

export default function PartnerMessagesPage() {
  const { user } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const token = usePortalStore.getState().token;
        const headers: HeadersInit = token
          ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
          : { 'Content-Type': 'application/json' };
        const res = await fetch('/api/partner/messages?partnerId=' + (user?.id || ''), { headers });
        const data = await res.json();
        if (data.success && Array.isArray(data.threads) && data.threads.length > 0) {
          setConversations(data.threads);
          setSelectedId(data.threads[0].id);
        } else {
          setConversations(mockConversations);
          if (mockConversations.length > 0) setSelectedId(mockConversations[0].id);
        }
      } catch {
        setConversations(mockConversations);
        if (mockConversations.length > 0) setSelectedId(mockConversations[0].id);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = conversations.find((c) => c.id === selectedId);

  const filtered = conversations.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q);
  });

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedId) return;
    const text = newMessage.trim();
    setSending(true);
    try {
      const token = usePortalStore.getState().token;
      const headers: HeadersInit = token
        ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        : { 'Content-Type': 'application/json' };
      await fetch('/api/partner/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({ partnerId: user?.id, conversationId: selectedId, text, recipientId: selected?.name }),
      });
    } catch { /* fallback local */ } finally {
      const msg: Message = {
        id: `m-${Date.now()}`,
        text,
        sender: 'me',
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        read: true,
      };
      setConversations((prev) => prev.map((c) =>
        c.id === selectedId
          ? { ...c, messages: [...c.messages, msg], lastMessage: text, lastTime: 'Just now' }
          : c
      ));
      setNewMessage('');
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 h-[600px]">
          <Skeleton className="w-80 flex-shrink-0 rounded-xl" />
          <Skeleton className="flex-1 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-1">
      <div>
        <h1 className="text-2xl font-bold text-alo-text">Messages</h1>
        <p className="text-sm text-alo-text-muted mt-0.5">Communicate with ALO team members</p>
      </div>

      <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Left Panel */}
        <Card className="w-80 flex-shrink-0 bg-white rounded-xl border border-alo-border flex flex-col overflow-hidden">
          <div className="p-3 border-b border-alo-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" />
              <Input placeholder="Search conversations..." className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-alo-text-muted">No conversations found</div>
            ) : (
              filtered.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => {
                    setSelectedId(conv.id);
                    setConversations((prev) => prev.map((c) => c.id === conv.id ? { ...c, unread: 0 } : c));
                  }}
                  className={cn(
                    'w-full text-left p-3 border-b border-alo-border/50 transition-colors flex items-start gap-3',
                    selectedId === conv.id ? 'bg-alo-brand-light/20' : 'hover:bg-muted/50'
                  )}
                >
                  <div className="relative flex-shrink-0">
                    <div className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold text-white',
                      selectedId === conv.id ? 'bg-alo-brand' : 'bg-alo-text-secondary'
                    )}>
                      {conv.avatar}
                    </div>
                    {conv.online && <Circle className="w-3 h-3 fill-emerald-500 text-emerald-500 absolute -bottom-0.5 -right-0.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate text-alo-text">{conv.name}</p>
                      <span className="text-[10px] text-alo-text-muted flex-shrink-0">{conv.lastTime}</span>
                    </div>
                    <p className="text-[11px] text-alo-text-muted truncate mt-0.5">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <Badge variant="brand" className="mt-1 text-[10px] px-1.5 py-0 h-4 min-w-[18px] justify-center">{conv.unread}</Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Right Panel */}
        <Card className="flex-1 bg-white rounded-xl border border-alo-border flex flex-col overflow-hidden">
          {selected ? (
            <>
              <div className="flex items-center gap-3 p-4 border-b border-alo-border">
                <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setSelectedId(null)}><ArrowLeft className="w-4 h-4" /></Button>
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-alo-brand flex items-center justify-center text-sm font-semibold text-white">{selected.avatar}</div>
                  {selected.online && <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500 absolute -bottom-0.5 -right-0.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-alo-text">{selected.name}</p>
                  <p className="text-[11px] text-alo-text-muted">{selected.role}{selected.online ? ' · Online' : ''}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {selected.messages.map((msg) => (
                  <div key={msg.id} className={cn('flex', msg.sender === 'me' ? 'justify-end' : 'justify-start')}>
                    <div className={cn(
                      'max-w-[75%] rounded-2xl px-4 py-2.5',
                      msg.sender === 'me' ? 'bg-alo-brand text-white rounded-br-md' : 'bg-muted text-alo-text rounded-bl-md'
                    )}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={cn('flex items-center gap-1 mt-1', msg.sender === 'me' ? 'justify-end' : 'justify-start')}>
                        <span className={cn('text-[10px]', msg.sender === 'me' ? 'text-white/70' : 'text-alo-text-muted')}>{msg.time}</span>
                        {msg.sender === 'me' && <CheckCheck className={cn('w-3.5 h-3.5', msg.read ? 'text-blue-200' : 'text-white/50')} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-alo-border">
                <div className="flex items-center gap-2">
                  <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} className="flex-1" />
                  <Button variant="brand" size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-alo-text-muted/30 mx-auto mb-3" />
                <p className="text-sm text-alo-text-muted">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
