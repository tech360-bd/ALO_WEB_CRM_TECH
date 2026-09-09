'use client';

import { useState, useEffect, useRef } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  Search, Send, Phone, Paperclip,
  MessageSquare, Users, GraduationCap, Zap,
} from 'lucide-react';

type ContactType = 'colleague' | 'student';

interface Message {
  id: string; text: string; sentAt: string; isMine: boolean;
}

interface Conversation {
  id: string; name: string; type: ContactType;
  lastMessage: string; lastTime: string; unread: number;
  online: boolean; messages: Message[];
}

const mockConversations: Conversation[] = [
  { id: 'C1', name: 'Rahim Uddin', type: 'student', lastMessage: 'Thank you for the IELTS prep resources!', lastTime: '10:30 AM', unread: 2, online: true,
    messages: [
      { id: 'm1', text: 'Hi Rahim, I wanted to follow up on your IELTS registration. Have you booked the test date?', sentAt: '10:15 AM', isMine: true },
      { id: 'm2', text: 'Yes! I booked it for February 8th.', sentAt: '10:20 AM', isMine: false },
      { id: 'm3', text: 'Great! Here are some prep resources that should help you. Also, remember the university deadline is March 1st.', sentAt: '10:22 AM', isMine: true },
      { id: 'm4', text: 'Thank you for the IELTS prep resources!', sentAt: '10:30 AM', isMine: false },
    ]
  },
  { id: 'C2', name: 'Fatima Akter', type: 'student', lastMessage: 'I will send the bank statement by tomorrow.', lastTime: '9:45 AM', unread: 1, online: false,
    messages: [
      { id: 'm5', text: 'Fatima, your Melbourne application needs the bank statement. Can you send it by EOD?', sentAt: '9:30 AM', isMine: true },
      { id: 'm6', text: 'I will send the bank statement by tomorrow.', sentAt: '9:45 AM', isMine: false },
    ]
  },
  { id: 'C3', name: 'Karim Hossain', type: 'colleague', lastMessage: 'Can you check the visa status for Tanvir?', lastTime: 'Yesterday', unread: 0, online: true,
    messages: [
      { id: 'm7', text: 'Hey Karim, did you get the CAS for Tanvir?', sentAt: 'Yesterday', isMine: true },
      { id: 'm8', text: 'Yes, CAS is confirmed. We submitted the visa app yesterday.', sentAt: 'Yesterday', isMine: false },
      { id: 'm9', text: 'Can you check the visa status for Tanvir?', sentAt: 'Yesterday', isMine: false },
    ]
  },
  { id: 'C4', name: 'Tanvir Ahmed', type: 'student', lastMessage: 'Got it, I will prepare the documents tonight.', lastTime: 'Yesterday', unread: 0, online: false,
    messages: [
      { id: 'm10', text: 'Tanvir, please prepare your financial documents. We need them for the visa.', sentAt: 'Yesterday', isMine: true },
      { id: 'm11', text: 'Got it, I will prepare the documents tonight.', sentAt: 'Yesterday', isMine: false },
    ]
  },
  { id: 'C5', name: 'Nusrat Jahan', type: 'student', lastMessage: 'When can we schedule the next session?', lastTime: 'Mon', unread: 0, online: true,
    messages: [
      { id: 'm12', text: 'Hi Nusrat, your SOP looks good overall. I have shared some feedback.', sentAt: 'Mon', isMine: true },
      { id: 'm13', text: 'Thanks! When can we schedule the next session?', sentAt: 'Mon', isMine: false },
    ]
  },
  { id: 'C6', name: 'Rupali Das', type: 'colleague', lastMessage: 'Meeting rescheduled to 3 PM.', lastTime: 'Mon', unread: 0, online: false,
    messages: [
      { id: 'm14', text: 'Rupali, is the weekly meeting still at 2 PM?', sentAt: 'Mon', isMine: true },
      { id: 'm15', text: 'Meeting rescheduled to 3 PM.', sentAt: 'Mon', isMine: false },
    ]
  },
];

const quickTemplates = [
  { label: 'Follow-up', text: 'Hi {name}, I wanted to follow up on your application status. Could you please share an update?' },
  { label: 'Doc Reminder', text: 'Hi {name}, this is a gentle reminder to submit your pending documents before the deadline.' },
  { label: 'Meeting Invite', text: 'Hi {name}, I would like to schedule a counseling session. Are you available this week?' },
  { label: 'Congrats', text: 'Hi {name}, great news! Your application has moved to the next stage. Lets discuss next steps.' },
];

export default function EmployeeMessagesPage() {
  const { setView } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>(mockConversations);
  const [activeId, setActiveId] = useState('C1');
  const [search, setSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeId);
  const filteredConversations = search
    ? conversations.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : conversations;

  useEffect(() => { const t = setTimeout(() => setLoading(false), 400); return () => clearTimeout(t); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [activeConversation?.messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeId) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 300));
    const msg: Message = { id: 'm' + Date.now(), text: newMessage.trim(), sentAt: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }), isMine: true };
    setConversations((prev) => prev.map((c) => {
      if (c.id !== activeId) return c;
      return { ...c, messages: [...c.messages, msg], lastMessage: newMessage.trim(), lastTime: 'Just now' };
    }));
    setNewMessage('');
    setSending(false);
  };

  const applyTemplate = (template: typeof quickTemplates[0]) => {
    const name = activeConversation?.name || '{name}';
    setNewMessage(template.text.replace('{name}', name));
    setShowTemplates(false);
  };

  if (loading) {
    return (
      <div className="bg-alo-page min-h-screen p-4 lg:p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ height: 'calc(100vh - 140px)' }}>
          <Skeleton className="rounded-xl" />
          <Skeleton className="md:col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-alo-page min-h-screen p-4 lg:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-alo-text">Messages</h1>
        <p className="text-sm text-alo-text-muted mt-1">Communicate with students and colleagues</p>
      </div>

      <Card className="bg-white rounded-xl border border-alo-border overflow-hidden flex flex-col md:flex-row" style={{ height: 'calc(100vh - 160px)', minHeight: '500px' }}>
        <div className="w-full md:w-80 lg:w-96 border-r border-alo-border flex flex-col shrink-0">
          <div className="p-3 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" />
              <Input placeholder="Search conversations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-alo-page border-alo-border h-9 text-sm" />
            </div>
            <div className="flex gap-1">
              <button className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-alo-brand text-white">All</button>
              <button className="flex-1 py-1.5 text-xs font-medium rounded-lg text-alo-text-secondary hover:bg-alo-page">Students</button>
              <button className="flex-1 py-1.5 text-xs font-medium rounded-lg text-alo-text-secondary hover:bg-alo-page">Colleagues</button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div>
              {filteredConversations.map((conv) => {
                const isActive = conv.id === activeId;
                return (
                  <button key={conv.id} onClick={() => setActiveId(conv.id)}
                    className={cn('w-full flex items-center gap-3 px-3 py-3 text-left transition-colors border-b border-alo-border/50',
                      isActive ? 'bg-alo-brand-light' : 'hover:bg-alo-page/50')}>
                    <div className="relative shrink-0">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className={cn('text-xs font-semibold', conv.type === 'student' ? 'bg-alo-brand-light text-alo-brand' : 'bg-amber-50 text-amber-700')}>
                          {conv.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      {conv.online && <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-medium text-alo-text truncate">{conv.name}</span>
                        <span className="text-[11px] text-alo-text-muted shrink-0">{conv.lastTime}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className="text-xs text-alo-text-muted truncate">{conv.lastMessage}</p>
                        {conv.unread > 0 && <span className="w-5 h-5 bg-alo-brand text-white text-[10px] rounded-full flex items-center justify-center font-bold shrink-0">{conv.unread}</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {activeConversation ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="px-4 py-3 border-b border-alo-border flex items-center gap-3">
              <Avatar className="w-9 h-9">
                <AvatarFallback className={cn('text-xs font-semibold', activeConversation.type === 'student' ? 'bg-alo-brand-light text-alo-brand' : 'bg-amber-50 text-amber-700')}>
                  {activeConversation.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-alo-text truncate">{activeConversation.name}</h3>
                <p className="text-xs text-alo-text-muted flex items-center gap-1">
                  {activeConversation.online ? <span className="text-emerald-500">Online</span> : <span>Offline</span>}
                  <span className="mx-1">{'\u00B7'}</span>
                  <Badge variant={activeConversation.type === 'student' ? 'brand' : 'secondary'} className="text-[10px] px-1.5">
                    {activeConversation.type === 'student' ? <GraduationCap className="w-2.5 h-2.5 mr-0.5" /> : <Users className="w-2.5 h-2.5 mr-0.5" />}
                    {activeConversation.type}
                  </Badge>
                </p>
              </div>
              <Button variant="ghost" size="icon-sm"><Phone className="w-4 h-4 text-alo-text-muted" /></Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4 max-w-2xl mx-auto">
                {activeConversation.messages.map((msg) => (
                  <div key={msg.id} className={cn('flex', msg.isMine ? 'justify-end' : 'justify-start')}>
                    <div className={cn('max-w-[75%] px-4 py-2.5 rounded-2xl',
                      msg.isMine ? 'bg-alo-brand text-white rounded-br-md' : 'bg-alo-page text-alo-text rounded-bl-md')}>
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={cn('text-[10px] mt-1', msg.isMine ? 'text-white/70' : 'text-alo-text-muted')}>{msg.sentAt}</p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="border-t border-alo-border p-3">
              {showTemplates && (
                <div className="mb-3 p-3 bg-alo-page rounded-lg border border-alo-border">
                  <p className="text-xs font-medium text-alo-text-secondary mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> Quick Templates</p>
                  <div className="grid grid-cols-2 gap-2">
                    {quickTemplates.map((t, i) => (
                      <button key={i} onClick={() => applyTemplate(t)}
                        className="text-left px-3 py-2 text-xs text-alo-text-secondary bg-white rounded-lg border border-alo-border hover:border-alo-brand hover:text-alo-brand transition-colors">
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-end gap-2">
                <Button variant="ghost" size="icon-sm" onClick={() => setShowTemplates(!showTemplates)} title="Quick Templates"><Zap className="w-4 h-4 text-alo-text-muted" /></Button>
                <Button variant="ghost" size="icon-sm"><Paperclip className="w-4 h-4 text-alo-text-muted" /></Button>
                <div className="flex-1">
                  <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    className="bg-alo-page border-alo-border" />
                </div>
                <Button variant="brand" size="icon" onClick={handleSend} disabled={sending || !newMessage.trim()}>
                  {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-alo-text-muted/30 mx-auto mb-4" />
              <p className="text-alo-text-secondary font-medium">Select a conversation</p>
              <p className="text-sm text-alo-text-muted mt-1">Choose from your existing conversations or start a new one</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
