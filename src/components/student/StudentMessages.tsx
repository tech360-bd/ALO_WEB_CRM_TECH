'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search,
  Send,
  Paperclip,
  Sparkles,
  Check,
  CheckCheck,
  ChevronDown,
  Mail,
  Download,
  Circle,
  Bot,
  MessageSquare,
  FileText,
  Filter,
} from 'lucide-react';

/* ================================================================== */
/*  TYPES                                                              */
/* ================================================================== */

type MessageSource = 'whatsapp' | 'email' | 'portal' | 'ai';
type MessageDirection = 'received' | 'sent' | 'system';

interface Attachment {
  id: string;
  name: string;
  size: string;
  type: string;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  direction: MessageDirection;
  source: MessageSource;
  isAiMessage?: boolean;
  isStudentVisible: boolean;
  isInternalNote: boolean;
  isRead: boolean;
  attachments?: Attachment[];
}

interface ConversationThread {
  id: string;
  name: string;
  role: string;
  avatar: string;
  lastMessage: string;
  lastTimestamp: string;
  unreadCount: number;
  isOnline: boolean;
  type: 'counselor' | 'application' | 'ai';
  messages: Message[];
}

type FilterType = 'all' | 'unread' | 'counselor' | 'application' | 'document' | 'visa';

/* ================================================================== */
/*  MOCK DATA                                                          */
/* ================================================================== */

const MOCK_CONVERSATIONS: ConversationThread[] = [
  {
    id: 'thread-1',
    name: 'Sarah Khan',
    role: 'Counselor',
    avatar: 'SK',
    lastMessage: 'Great! I have received your attested certificates. The TB test is the next priority.',
    lastTimestamp: '10:32 AM',
    unreadCount: 2,
    isOnline: true,
    type: 'counselor',
    messages: [
      {
        id: 'm1-1',
        content: 'Hi Ahmed! I wanted to follow up on the documents you uploaded yesterday. The academic certificates look good but I noticed the English test certificate is the old IELTS format. We need to verify it meets UKVI requirements.',
        timestamp: '9:15 AM',
        direction: 'received',
        source: 'whatsapp',
        isStudentVisible: true,
        isInternalNote: false,
        isRead: true,
      },
      {
        id: 'm1-2',
        content: 'Hi Sarah, I checked and my IELTS is valid until Dec 2026. The score is overall 7.0 with no band below 6.5 which meets the UKVI requirement for my course.',
        timestamp: '9:28 AM',
        direction: 'sent',
        source: 'portal',
        isStudentVisible: true,
        isInternalNote: false,
        isRead: true,
      },
      {
        id: 'm1-3',
        content: 'Perfect, that meets the requirement. Could you also upload the attested copies of your BBA degree and transcripts? We need those for the visa application.',
        timestamp: '9:45 AM',
        direction: 'received',
        source: 'whatsapp',
        isStudentVisible: true,
        isInternalNote: false,
        isRead: true,
        attachments: [
          { id: 'a1', name: 'Document-Checklist-UK.pdf', size: '245 KB', type: 'pdf' },
        ],
      },
      {
        id: 'm1-4',
        content: 'Just uploaded the attested copies. Please check.',
        timestamp: '10:15 AM',
        direction: 'sent',
        source: 'portal',
        isStudentVisible: true,
        isInternalNote: false,
        isRead: true,
        attachments: [
          { id: 'a2', name: 'BBA-Degree-Attested.pdf', size: '1.2 MB', type: 'pdf' },
          { id: 'a3', name: 'BBA-Transcript-Attested.pdf', size: '890 KB', type: 'pdf' },
        ],
      },
      {
        id: 'm1-5',
        content: 'Great! I have received your attested certificates. The TB test is the next priority. You need to book an appointment at a UKVI-approved clinic.',
        timestamp: '10:32 AM',
        direction: 'received',
        source: 'whatsapp',
        isStudentVisible: true,
        isInternalNote: false,
        isRead: false,
      },
      {
        id: 'm1-6',
        content: 'Note: Check if ATAS is required for this course. Student needs to apply 6 weeks before CAS. — Internal only, not visible to student.',
        timestamp: '10:33 AM',
        direction: 'received',
        source: 'portal',
        isStudentVisible: false,
        isInternalNote: true,
        isRead: true,
      },
    ],
  },
  {
    id: 'thread-2',
    name: 'Application: Aberdeen',
    role: 'University of Aberdeen',
    avatar: 'UA',
    lastMessage: 'Your conditional offer has been updated. Please review the updated conditions.',
    lastTimestamp: 'Yesterday',
    unreadCount: 1,
    isOnline: false,
    type: 'application',
    messages: [
      {
        id: 'm2-1',
        content: '🎉 Good news! University of Aberdeen has issued a conditional offer for MSc International Business. Please review the offer letter and conditions.',
        timestamp: '2:00 PM',
        direction: 'received',
        source: 'portal',
        isStudentVisible: true,
        isInternalNote: false,
        isRead: true,
        attachments: [
          { id: 'a4', name: 'Conditional-Offer-Aberdeen.pdf', size: '320 KB', type: 'pdf' },
        ],
      },
      {
        id: 'm2-2',
        content: 'Thank you! What are the conditions I need to meet?',
        timestamp: '2:30 PM',
        direction: 'sent',
        source: 'portal',
        isStudentVisible: true,
        isInternalNote: false,
        isRead: true,
      },
      {
        id: 'm2-3',
        content: '📋 System Notification: Your conditional offer has been updated. Conditions: (1) Submit final degree certificate, (2) IELTS 7.0 with no band below 6.5, (3) Pay £2,000 deposit by 15 Aug 2025.',
        timestamp: '3:00 PM',
        direction: 'system',
        source: 'portal',
        isStudentVisible: true,
        isInternalNote: false,
        isRead: false,
      },
    ],
  },
  {
    id: 'thread-3',
    name: 'AI Study Coach',
    role: 'AI Assistant',
    avatar: 'AI',
    lastMessage: 'Based on your profile, you qualify for the Aberdeen Global Excellence Scholarship worth £5,000.',
    lastTimestamp: '2 days ago',
    unreadCount: 0,
    isOnline: true,
    type: 'ai',
    messages: [
      {
        id: 'm3-1',
        content: 'Hi! I\'m your AI Study Coach. Based on your profile and application to University of Aberdeen, I found 3 scholarship opportunities you may be eligible for:\n\n1. Aberdeen Global Excellence Scholarship — £5,000\n2. Chevening Scholarship — Full tuition + living\n3. Commonwealth Shared Scholarship — Full tuition\n\nWould you like me to help you prepare applications for any of these?',
        timestamp: '11:00 AM',
        direction: 'received',
        source: 'ai',
        isAiMessage: true,
        isStudentVisible: true,
        isInternalNote: false,
        isRead: true,
      },
      {
        id: 'm3-2',
        content: 'Yes! Can you tell me more about the Aberdeen Global Excellence Scholarship? What are the requirements?',
        timestamp: '11:15 AM',
        direction: 'sent',
        source: 'portal',
        isStudentVisible: true,
        isInternalNote: false,
        isRead: true,
      },
    ],
  },
];

const QUICK_QUESTIONS = [
  'What documents do I need?',
  'When is my deadline?',
  "How's my visa readiness?",
  'Explain my offer conditions',
];

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'counselor', label: 'Counselor' },
  { value: 'application', label: 'Application' },
  { value: 'document', label: 'Document' },
  { value: 'visa', label: 'Visa' },
];

/* ================================================================== */
/*  HELPER COMPONENTS                                                   */
/* ================================================================== */

function SourceIcon({ source }: { source: MessageSource }) {
  switch (source) {
    case 'whatsapp':
      return <MessageSquare className="w-3 h-3 text-green-600" />;
    case 'email':
      return <Mail className="w-3 h-3 text-slate-500" />;
    default:
      return null;
  }
}

function MessageBubble({ message }: { message: Message }) {
  const isSystem = message.direction === 'system';
  const isSent = message.direction === 'sent';
  const isAi = message.isAiMessage;

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-amber-50 text-amber-800 text-xs px-4 py-2 rounded-full max-w-md text-center border border-amber-100">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex gap-2 mb-3 max-w-[85%]',
        isSent ? 'ml-auto flex-row-reverse' : 'mr-auto'
      )}
    >
      {/* Avatar for received messages */}
      {!isSent && (
        <Avatar className="w-7 h-7 shrink-0 mt-1">
          <AvatarFallback
            className={cn(
              'text-[10px] font-semibold',
              isAi
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'
            )}
          >
            {isAi ? <Bot className="w-3.5 h-3.5" /> : 'SK'}
          </AvatarFallback>
        </Avatar>
      )}

      <div className="flex flex-col gap-1">
        {/* Bubble */}
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line',
            isSent
              ? 'bg-blue-600 text-white rounded-tr-md'
              : isAi
                ? 'bg-purple-50 text-purple-900 border border-purple-200 rounded-tl-md'
                : 'bg-slate-100 text-slate-900 rounded-tl-md'
          )}
        >
          {message.content}
        </div>

        {/* Bottom row: timestamp, source, read receipt, attachments */}
        <div
          className={cn(
            'flex items-center gap-2 px-1',
            isSent ? 'justify-end' : 'justify-start'
          )}
        >
          {/* Source icon */}
          <SourceIcon source={message.source} />
          <span className="text-[10px] text-slate-400">{message.timestamp}</span>
          {/* Read receipt for sent messages */}
          {isSent && (
            <span className="text-blue-500">
              {message.isRead ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5 text-slate-400" />
              )}
            </span>
          )}
        </div>

        {/* Attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-1">
            {message.attachments.map((att) => (
              <div
                key={att.id}
                className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <div>
                  <p className="text-xs font-medium text-slate-700">{att.name}</p>
                  <p className="text-[10px] text-slate-400">{att.size}</p>
                </div>
                <Download className="w-3.5 h-3.5 text-slate-400 ml-1" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  MAIN COMPONENT                                                      */
/* ================================================================== */

export default function StudentMessages() {
  const { setView, token } = usePortalStore();
  const [activeThreadId, setActiveThreadId] = useState('thread-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [messageInput, setMessageInput] = useState('');
  const [aiOpen, setAiOpen] = useState(true);
  const [mobileShowThread, setMobileShowThread] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiUnread, setApiUnread] = useState(0);
  const [apiConversations, setApiConversations] = useState<ConversationThread[] | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load real messages from API
  useEffect(() => {
    if (!token) { setLoading(false); return; }
    fetch('/api/student-portal/messages', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          if (j.unreadCount !== undefined) setApiUnread(j.unreadCount as number);
          if (j.data && j.data.length > 0) {
            setApiConversations(j.data as ConversationThread[]);
          }
        }
      })
      .catch(() => { /* fallback to mock */ })
      .finally(() => setLoading(false));
  }, [token]);

  const conversations = (apiConversations && apiConversations.length > 0) ? apiConversations : MOCK_CONVERSATIONS;

  const activeThread = conversations.find((t) => t.id === activeThreadId);
  const visibleMessages = activeThread?.messages.filter(
    (m) => m.isStudentVisible && !m.isInternalNote
  );

  // Filter conversations
  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch =
      !searchQuery ||
      conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeFilter === 'all') return matchesSearch;
    if (activeFilter === 'unread') return matchesSearch && conv.unreadCount > 0;
    if (activeFilter === 'counselor') return matchesSearch && conv.type === 'counselor';
    if (activeFilter === 'application') return matchesSearch && conv.type === 'application';
    if (activeFilter === 'document') return matchesSearch && conv.type === 'counselor'; // Reuse
    if (activeFilter === 'visa') return matchesSearch && conv.type === 'counselor'; // Reuse
    return matchesSearch;
  });

  const handleSend = async () => {
    if (!messageInput.trim()) return;
    const content = messageInput.trim();
    setMessageInput('');
    // Send to API
    if (token) {
      try {
        await fetch('/api/student-portal/messages', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });
      } catch { /* silent fail */ }
    }
  };

  const handleThreadSelect = (id: string) => {
    setActiveThreadId(id);
    setMobileShowThread(true);
  };

  const handleBackToList = () => {
    setMobileShowThread(false);
  };

  // Auto scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeThreadId]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col">
        <div className="shrink-0 mb-4">
          <Skeleton className="h-8 w-36 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex-1 flex min-h-0 border border-slate-200 rounded-xl overflow-hidden">
          <div className="w-80 border-r border-slate-200 p-4 space-y-3">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)}
          </div>
          <div className="flex-1 p-4 space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 rounded-lg max-w-[80%]" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {/* Page header */}
      <div className="shrink-0 mb-4">
        <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
        <p className="text-sm text-slate-500 mt-1">
          Communicate with your counselor and track application updates
        </p>
      </div>

      {/* Main messaging layout */}
      <div className="flex-1 flex min-h-0 border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm">
        {/* ============ LEFT: Conversation List ============ */}
        <div
          className={cn(
            'w-80 border-r border-slate-200 flex flex-col shrink-0 bg-white',
            mobileShowThread ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Search */}
          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search conversations..."
                className="pl-9 h-9 text-sm bg-slate-50 border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* AI Assistant collapsible */}
          <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
            <CollapsibleTrigger className="w-full px-3 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                </div>
                <span className="text-xs font-semibold text-slate-900 flex-1 text-left">
                  Ask AI anything about your application
                </span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-slate-400 transition-transform',
                    aiOpen && 'rotate-180'
                  )}
                />
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-3 pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map((q) => (
                    <button
                      key={q}
                      onClick={() => setActiveThreadId('thread-3')}
                      className="text-[11px] px-2.5 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors text-left leading-tight"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <Separator className="mx-3" />

          {/* Filter chips */}
          <div className="px-3 py-2 flex flex-wrap gap-1.5">
            {FILTER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setActiveFilter(opt.value)}
                className={cn(
                  'text-[11px] px-2.5 py-1 rounded-full transition-colors font-medium',
                  activeFilter === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <Separator className="mx-3" />

          {/* Conversation list */}
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-0.5">
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleThreadSelect(conv.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left',
                    activeThreadId === conv.id
                      ? 'bg-blue-50 border-l-[3px] border-blue-600'
                      : 'hover:bg-slate-50'
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback
                        className={cn(
                          'text-xs font-semibold',
                          conv.type === 'ai'
                            ? 'bg-purple-100 text-purple-700'
                            : conv.type === 'application'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-blue-100 text-blue-700'
                        )}
                      >
                        {conv.type === 'ai' ? (
                          <Bot className="w-4 h-4" />
                        ) : (
                          conv.avatar
                        )}
                      </AvatarFallback>
                    </Avatar>
                    {conv.isOnline && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'text-sm font-medium truncate',
                          activeThreadId === conv.id ? 'text-blue-700' : 'text-slate-900'
                        )}
                      >
                        {conv.name}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {conv.lastTimestamp}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[9px] px-1 py-0 mb-1',
                        conv.type === 'counselor' && 'bg-blue-50 text-blue-600',
                        conv.type === 'application' && 'bg-orange-50 text-orange-600',
                        conv.type === 'ai' && 'bg-purple-50 text-purple-600'
                      )}
                    >
                      {conv.role}
                    </Badge>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {conv.lastMessage}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold shrink-0 mt-1">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ============ RIGHT: Message Thread ============ */}
        <div
          className={cn(
            'flex-1 flex flex-col min-w-0 bg-white',
            !mobileShowThread ? 'hidden md:flex' : 'flex'
          )}
        >
          {activeThread && visibleMessages ? (
            <>
              {/* Thread header */}
              <div className="shrink-0 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
                {/* Back button (mobile) */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden shrink-0"
                  onClick={handleBackToList}
                >
                  <span className="text-lg">←</span>
                </Button>

                <Avatar className="w-9 h-9">
                  <AvatarFallback
                    className={cn(
                      'text-xs font-semibold',
                      activeThread.type === 'ai'
                        ? 'bg-purple-100 text-purple-700'
                        : activeThread.type === 'application'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    {activeThread.type === 'ai' ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      activeThread.avatar
                    )}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 truncate">
                      {activeThread.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[10px] px-1.5 py-0',
                        activeThread.type === 'counselor' && 'bg-blue-50 text-blue-600',
                        activeThread.type === 'application' && 'bg-orange-50 text-orange-600',
                        activeThread.type === 'ai' && 'bg-purple-50 text-purple-600'
                      )}
                    >
                      {activeThread.role}
                    </Badge>
                    {activeThread.isOnline && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] text-emerald-600 font-medium">Online</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-1">
                  {visibleMessages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Message input */}
              <div className="shrink-0 border-t border-slate-100 p-3">
                <div className="flex items-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-slate-400 hover:text-slate-600"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Type a message..."
                      className="min-h-[40px] max-h-32 resize-none text-sm pr-10 bg-slate-50 border-slate-200 rounded-xl"
                      rows={1}
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                  </div>
                  <Button
                    size="icon"
                    className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 w-10"
                    onClick={handleSend}
                    disabled={!messageInput.trim()}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}