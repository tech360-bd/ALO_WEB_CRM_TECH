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
  AlertTriangle,
  RotateCcw,
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

/* A hard-coded MOCK_CONVERSATIONS array of invented counselor threads used to */
/* live here and was used as a FALLBACK whenever the API returned an empty list */
/* or threw. A student with no messages, or one whose load failed, was shown a  */
/* fabricated conversation with a named counselor. That is prohibited by spec   */
/* s92, so the array was deleted and replaced with distinct empty and error     */
/* states plus a retry.                                                        */

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
      return <MessageSquare className="w-3 h-3 text-crm-success-text" />;
    case 'email':
      return <Mail className="w-3 h-3 text-[var(--alo-text-muted)]" />;
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
        <div className="bg-crm-warning-bg text-crm-warning-text text-xs px-4 py-2 rounded-full max-w-md text-center border border-crm-warning-border">
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
              'text-[11px] font-semibold',
              isAi
                ? 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]'
                : 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]'
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
              ? 'bg-[var(--alo-brand)] text-white rounded-tr-md'
              : isAi
                ? 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border border-[var(--alo-border)] rounded-tl-md'
                : 'bg-[var(--alo-surface-muted)] text-[var(--alo-text)] rounded-tl-md'
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
          <span className="text-[11px] text-[var(--alo-text-muted)]">{message.timestamp}</span>
          {/* Read receipt for sent messages */}
          {isSent && (
            <span className="text-[var(--alo-brand)]">
              {message.isRead ? (
                <CheckCheck className="w-3.5 h-3.5" />
              ) : (
                <Check className="w-3.5 h-3.5 text-[var(--alo-text-muted)]" />
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
                className="flex items-center gap-2 bg-white border border-[var(--alo-border)] rounded-lg px-3 py-1.5 hover:bg-[var(--alo-page)] transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-[var(--alo-brand)]" />
                <div>
                  <p className="text-xs font-medium text-[var(--alo-body)]">{att.name}</p>
                  <p className="text-[11px] text-[var(--alo-text-muted)]">{att.size}</p>
                </div>
                <Download className="w-3.5 h-3.5 text-[var(--alo-text-muted)] ml-1" />
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
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load real messages from API
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    if (!token) {
      // Without a session we cannot know what conversations exist, so report
      // that instead of showing invented threads (s92).
      if (!cancelled) {
        setApiConversations([]);
        setLoading(false);
        setLoadError('You are not signed in, so messages could not be loaded.');
      }
      return;
    }

    fetch('/api/student-portal/messages', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(async (r) => {
        const j = await r.json().catch(() => null);
        if (cancelled) return;
        if (!r.ok || !j?.success) {
          setApiConversations([]);
          setLoadError(j?.error || `Could not load messages (status ${r.status}).`);
          return;
        }
        if (j.unreadCount !== undefined) setApiUnread(j.unreadCount as number);
        const rows = Array.isArray(j.data) ? (j.data as ConversationThread[]) : [];
        // An empty list is a truthful answer and is applied as-is.
        setApiConversations(rows);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setApiConversations([]);
        setLoadError(error instanceof Error ? error.message : 'Could not reach the message service.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [token, reloadKey]);

  // Real data only. There is deliberately no mock fallback: this screen shows a
  // student their own conversations with ALO staff, so invented threads and
  // messages would be misinformation rather than placeholder styling (s92).
  const conversations = apiConversations ?? [];

  // The initial activeThreadId was a mock id, so with real data it matches
  // nothing and the pane would render empty even when conversations exist.
  // Resolve the selection against what was actually loaded.
  useEffect(() => {
    if (conversations.length === 0) return;
    if (!conversations.some((thread) => thread.id === activeThreadId)) {
      setActiveThreadId(conversations[0].id);
    }
  }, [conversations, activeThreadId]);

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
        <div className="flex-1 flex min-h-0 border border-[var(--alo-border)] rounded-xl overflow-hidden">
          <div className="w-80 border-r border-[var(--alo-border)] p-4 space-y-3">
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
        <h1 className="text-2xl font-bold text-[var(--alo-text)]">Messages</h1>
        <p className="text-sm text-[var(--alo-text-muted)] mt-1">
          Communicate with your counselor and track application updates
        </p>
      </div>

      {/* Main messaging layout */}
      <div className="flex-1 flex min-h-0 border border-[var(--alo-border)] rounded-xl bg-white overflow-hidden shadow-sm">
        {/* ============ LEFT: Conversation List ============ */}
        <div
          className={cn(
            'w-80 border-r border-[var(--alo-border)] flex flex-col shrink-0 bg-white',
            mobileShowThread ? 'hidden md:flex' : 'flex'
          )}
        >
          {/* Search */}
          <div className="p-3 border-b border-[var(--alo-border)]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--alo-text-muted)]" />
              <Input
                placeholder="Search conversations..."
                className="pl-9 h-9 text-sm bg-[var(--alo-page)] border-[var(--alo-border)]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* AI Assistant collapsible */}
          <Collapsible open={aiOpen} onOpenChange={setAiOpen}>
            <CollapsibleTrigger className="w-full px-3 pt-3 pb-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--alo-brand-pale)] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--alo-brand)]" />
                </div>
                <span className="text-xs font-semibold text-[var(--alo-text)] flex-1 text-left">
                  Ask AI anything about your application
                </span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 text-[var(--alo-text-muted)] transition-transform',
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
                      className="text-[11px] px-2.5 py-1.5 rounded-full bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] border border-[var(--alo-border)] hover:bg-[var(--alo-brand-pale)] transition-colors text-left leading-tight"
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
                    ? 'bg-[var(--alo-brand)] text-white'
                    : 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] hover:bg-[var(--alo-page)]'
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
              {loadError ? (
                /* A failed load must not render as an empty inbox (s91): that
                   would tell a student no one has messaged them when we simply
                   could not check. */
                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                  <AlertTriangle className="size-8 text-crm-warning-text mb-3" />
                  <p className="text-sm font-semibold text-[var(--alo-text)]">
                    Messages could not be loaded
                  </p>
                  <p className="mt-1 text-xs text-[var(--alo-text-muted)] max-w-[220px]">{loadError}</p>
                  <p className="mt-2 text-[11px] text-[var(--alo-text-muted)] max-w-[220px]">
                    This does not mean you have no messages.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setReloadKey((key) => key + 1)}
                  >
                    <RotateCcw className="size-3.5 mr-1.5" />
                    Try again
                  </Button>
                </div>
              ) : loading ? (
                <div className="space-y-2 p-2">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="h-16 animate-pulse rounded-lg bg-[var(--alo-surface-muted)]" />
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                  <MessageSquare className="size-8 text-[var(--alo-placeholder)] mb-3" />
                  <p className="text-sm font-medium text-[var(--alo-text-muted)]">
                    {conversations.length === 0
                      ? 'No conversations yet'
                      : 'No conversations match this filter'}
                  </p>
                  <p className="mt-1 text-xs text-[var(--alo-text-muted)] max-w-[220px]">
                    {conversations.length === 0
                      ? 'Messages from your counselor and the ALO team will appear here.'
                      : 'Try a different filter or search term.'}
                  </p>
                </div>
              ) : null}
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleThreadSelect(conv.id)}
                  className={cn(
                    'w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left',
                    activeThreadId === conv.id
                      ? 'bg-[var(--alo-brand-pale)] border-l-[3px] border-[var(--alo-brand)]'
                      : 'hover:bg-[var(--alo-page)]'
                  )}
                >
                  <div className="relative shrink-0">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback
                        className={cn(
                          'text-xs font-semibold',
                          conv.type === 'ai'
                            ? 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]'
                            : conv.type === 'application'
                              ? 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]'
                              : 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]'
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
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[var(--alo-success)] rounded-full border-2 border-white" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'text-sm font-medium truncate',
                          activeThreadId === conv.id ? 'text-[var(--alo-brand)]' : 'text-[var(--alo-text)]'
                        )}
                      >
                        {conv.name}
                      </span>
                      <span className="text-[11px] text-[var(--alo-text-muted)] shrink-0">
                        {conv.lastTimestamp}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[11px] px-1 py-0 mb-1',
                        conv.type === 'counselor' && 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
                        conv.type === 'application' && 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]',
                        conv.type === 'ai' && 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]'
                      )}
                    >
                      {conv.role}
                    </Badge>
                    <p className="text-xs text-[var(--alo-text-muted)] line-clamp-1 mt-0.5">
                      {conv.lastMessage}
                    </p>
                  </div>

                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[var(--alo-brand)] text-white text-[11px] flex items-center justify-center font-bold shrink-0 mt-1">
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
              <div className="shrink-0 px-4 py-3 border-b border-[var(--alo-border)] flex items-center gap-3">
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
                        ? 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]'
                        : activeThread.type === 'application'
                          ? 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]'
                          : 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]'
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
                    <span className="text-sm font-semibold text-[var(--alo-text)] truncate">
                      {activeThread.name}
                    </span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'text-[11px] px-1.5 py-0',
                        activeThread.type === 'counselor' && 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]',
                        activeThread.type === 'application' && 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)]',
                        activeThread.type === 'ai' && 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]'
                      )}
                    >
                      {activeThread.role}
                    </Badge>
                    {activeThread.isOnline && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-[var(--alo-success)] rounded-full" />
                        <span className="text-[11px] text-crm-success-text font-medium">Online</span>
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
              <div className="shrink-0 border-t border-[var(--alo-border)] p-3">
                <div className="flex items-end gap-2">
                  <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-[var(--alo-text-muted)] hover:text-[var(--alo-body)]"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Textarea
                      placeholder="Type a message..."
                      className="min-h-[40px] max-h-32 resize-none text-sm pr-10 bg-[var(--alo-page)] border-[var(--alo-border)] rounded-xl"
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
 className="shrink-0 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white rounded-xl size-12 "
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
                <MessageSquare className="w-12 h-12 text-[var(--alo-placeholder)] mx-auto mb-3" />
                <p className="text-sm text-[var(--alo-text-muted)]">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}