'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SlaCountdownBadge from './SlaCountdownBadge';
import {
  MessageSquare, Search, Send, Bot, User, Paperclip, FileText,
  CheckCircle2, XCircle, Clock, Phone, ArrowRight, Sparkles,
  ShieldCheck, RefreshCw, AlertCircle, ChevronRight, X,
  Eye, Tag, Zap
} from 'lucide-react';
import { toast } from 'sonner';

// Message delivery status icons
const DeliveryIcon = ({ status }: { status: string }) => {
  if (status === 'read') return <span className="text-[var(--alo-brand)] text-[11px] font-bold">✓✓</span>;
  if (status === 'delivered') return <span className="text-[var(--alo-text-muted)] text-[11px]">✓✓</span>;
  if (status === 'sent') return <span className="text-[var(--alo-text-muted)] text-[11px]">✓</span>;
  if (status === 'failed') return <span className="text-red-500 text-[11px]">✗</span>;
  return null;
};

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: 'bg-emerald-500',
  email: 'bg-blue-500',
  sms: 'bg-purple-500',
  phone: 'bg-[var(--alo-cta)]',
  portal: 'bg-slate-500',
};

const INTENT_COLORS: Record<string, string> = {
  DOCUMENT_REQUIREMENT: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand-deep)]',
  PAYMENT_QUESTION: 'bg-red-100 text-red-800',
  VISA_QUESTION: 'bg-purple-100 text-purple-800',
  APPLICATION_QUESTION: 'bg-indigo-100 text-indigo-800',
  URGENT: 'bg-red-100 text-red-900',
  APPOINTMENT: 'bg-amber-100 text-amber-800',
  GENERAL: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
};

const WHATSAPP_TEMPLATES = [
  { id: 'doc_request', name: 'Document Request', body: 'Dear {name}, we need the following document: {document}. Please upload it at your earliest convenience.' },
  { id: 'offer_notify', name: 'Offer Notification', body: 'Congratulations {name}! You have received an offer from {university}. Please review and respond by {deadline}.' },
  { id: 'payment_reminder', name: 'Payment Reminder', body: 'Dear {name}, your tuition deposit of {amount} is due by {deadline}. Please confirm payment at our office.' },
  { id: 'interview_reminder', name: 'Interview Reminder', body: 'Dear {name}, your interview is scheduled on {date} at {time}. Please bring all original documents.' },
  { id: 'visa_reminder', name: 'Visa Reminder', body: 'Dear {name}, please ensure your visa documents are complete. Missing items: {items}.' },
];

export default function WhatsAppCommandCenter() {
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [slaFilter, setSlaFilter] = useState('');
  const [stats, setStats] = useState<any>({});

  // Compose state
  const [draftText, setDraftText] = useState('');
  const [sendMode, setSendMode] = useState<'ai_draft_only' | 'ai_human_send' | 'human_send'>('human_send');
  const [aiDraft, setAiDraft] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiApproved, setAiApproved] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  // Document attachment received banner
  const [pendingAttachment, setPendingAttachment] = useState<any | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchThreads = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: '30' });
      if (slaFilter) params.set('sla', slaFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/crm/ucc/whatsapp/command?${params}`);
      const json = await res.json();
      if (json.success) {
        setThreads(json.threads || []);
        setStats(json.stats || {});
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [slaFilter, search]);

  const fetchMessages = useCallback(async (threadId: string) => {
    try {
      setMsgLoading(true);
      const res = await fetch(`/api/crm/ucc/conversations/${threadId}`);
      const json = await res.json();
      if (json.success || json.data) {
        setMessages(json.data || []);
        // Check for pending document attachments
        const attach = (json.data || []).find((m: any) => m.type === 'document' || m.type === 'image');
        if (attach) setPendingAttachment(attach);
      }
    } catch {
      // silently fail
    } finally {
      setMsgLoading(false);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, []);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const selectThread = (thread: any) => {
    setSelectedThread(thread);
    setAiDraft('');
    setAiApproved(false);
    setPendingAttachment(null);
    fetchMessages(thread.id);
  };

  const handleAiDraft = async () => {
    if (!selectedThread) return;
    setAiLoading(true);
    try {
      const res = await fetch('/api/crm/ucc/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest_replies', conversationId: selectedThread.id }),
      });
      const json = await res.json();
      const suggestions = json.suggestions || [];
      const draft = suggestions[0] || 'Dear student, thank you for reaching out. I will review your query and get back to you shortly.';
      setAiDraft(draft);
      setDraftText(draft);
      setAiApproved(false);
      toast.info('AI draft ready — review before sending');
    } catch {
      toast.error('AI draft generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSend = async () => {
    if (!selectedThread || !draftText.trim()) return;

    // Enforce AI approval for AI-generated drafts
    if (aiDraft && draftText === aiDraft && !aiApproved && sendMode !== 'ai_draft_only') {
      toast.error('Please review and approve the AI draft before sending.');
      return;
    }

    try {
      const res = await fetch('/api/crm/ucc/whatsapp/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threadId: selectedThread.id,
          content: draftText,
          mode: sendMode,
          isAiGenerated: !!aiDraft && draftText === aiDraft,
          aiApprovedBy: aiApproved ? 'counselor' : '',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setDraftText('');
        setAiDraft('');
        setAiApproved(false);
        fetchMessages(selectedThread.id);
        fetchThreads();
        toast.success('Message sent ✓');
      } else {
        toast.error(json.error || 'Failed to send message');
      }
    } catch {
      toast.error('Send failed');
    }
  };

  const filteredThreads = threads.filter((t) =>
    !search || (t.contactName || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-120px)] bg-white border border-[var(--alo-border)] rounded-2xl overflow-hidden shadow-sm">
      {/* LEFT: Thread List */}
      <div className="w-72 border-r border-[var(--alo-border)] flex flex-col shrink-0">
        {/* Header */}
        <div className="p-3 border-b border-[var(--alo-border)] bg-[var(--alo-page)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-bold text-xs text-[var(--alo-text)]">WhatsApp Command Center</span>
            <Badge className="bg-emerald-50 text-emerald-700 text-[11px] font-bold ml-auto">
              {stats.unread || 0} unread
            </Badge>
          </div>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[var(--alo-text-muted)]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="pl-8 text-xs h-8"
            />
          </div>
          <div className="flex gap-1 mt-2">
            {['', 'overdue', 'warning', 'normal'].map((f) => (
              <button
                key={f}
                onClick={() => setSlaFilter(f)}
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold border transition-colors ${
                  slaFilter === f
                    ? f === 'overdue' ? 'bg-red-500 text-white border-red-500'
                      : f === 'warning' ? 'bg-amber-400 text-white border-amber-400'
                      : 'bg-[var(--alo-brand)] text-white border-[var(--alo-brand)]'
                    : 'bg-white text-[var(--alo-body)] border-[var(--alo-border)] hover:bg-[var(--alo-page)]'
                }`}
              >
                {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 divide-x divide-[var(--alo-border)] bg-white border-b border-[var(--alo-border)]">
          <div className="text-center py-2">
            <p className="text-base font-black text-red-600">{stats.overdue || 0}</p>
            <p className="text-[11px] text-[var(--alo-text-muted)] font-bold uppercase">Overdue</p>
          </div>
          <div className="text-center py-2">
            <p className="text-base font-black text-amber-600">{stats.warning || 0}</p>
            <p className="text-[11px] text-[var(--alo-text-muted)] font-bold uppercase">Warning</p>
          </div>
          <div className="text-center py-2">
            <p className="text-base font-black text-[var(--alo-text)]">{stats.total || 0}</p>
            <p className="text-[11px] text-[var(--alo-text-muted)] font-bold uppercase">Total</p>
          </div>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-xs text-[var(--alo-text-muted)]">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
              Loading conversations...
            </div>
          ) : filteredThreads.length === 0 ? (
            <div className="p-4 text-center text-xs text-[var(--alo-text-muted)]">No conversations found</div>
          ) : (
            filteredThreads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => selectThread(thread)}
                className={`w-full text-left p-3 border-b border-[var(--alo-border)] hover:bg-[var(--alo-page)] transition-colors ${
                  selectedThread?.id === thread.id ? 'bg-[var(--alo-brand-pale)] border-l-2 border-l-[#0057B8]' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${CHANNEL_COLORS[thread.channel] || 'bg-slate-400'}`} />
                    <span className="font-bold text-xs text-[var(--alo-text)] truncate">
                      {thread.studentContext?.fullName || thread.contactName || 'Unknown'}
                    </span>
                  </div>
                  {thread.unreadCount > 0 && (
                    <Badge className="bg-emerald-500 text-white text-[11px] font-bold rounded-full h-4 min-w-4 px-1">
                      {thread.unreadCount}
                    </Badge>
                  )}
                </div>

                <p className="text-[11px] text-[var(--alo-text-muted)] truncate mb-1.5">
                  {thread.lastMessagePreview || 'No messages yet'}
                </p>

                <div className="flex items-center justify-between">
                  <SlaCountdownBadge
                    slaDueAt={thread.slaDueAt}
                    slaTriggeredAt={thread.slaTriggeredAt}
                    size="sm"
                  />
                  {thread.intent && thread.intent !== 'GENERAL' && (
                    <Badge className={`text-[11px] px-1.5 py-0 ${INTENT_COLORS[thread.intent] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}`}>
                      {thread.intent.split('_')[0]}
                    </Badge>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* CENTER: Conversation */}
      {selectedThread ? (
        <div className="flex-1 flex flex-col min-w-0">
          {/* Conv Header */}
          <div className="p-3 border-b border-[var(--alo-border)] bg-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--alo-brand)] text-white flex items-center justify-center font-bold text-sm">
              {(selectedThread.studentContext?.fullName || selectedThread.contactName || 'U')[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-[var(--alo-text)] truncate">
                {selectedThread.studentContext?.fullName || selectedThread.contactName || 'Unknown Contact'}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[var(--alo-text-muted)]">
                  {selectedThread.studentContext?.studentCode || selectedThread.studentContext?.phone || ''}
                </span>
                {selectedThread.intent && (
                  <Badge className={`text-[11px] px-1.5 ${INTENT_COLORS[selectedThread.intent] || 'bg-[var(--alo-surface-muted)]'}`}>
                    {selectedThread.intent}
                  </Badge>
                )}
              </div>
            </div>
            <SlaCountdownBadge slaDueAt={selectedThread.slaDueAt} slaTriggeredAt={selectedThread.slaTriggeredAt} size="md" />
          </div>

          {/* Document Attachment Banner */}
          {pendingAttachment && (
            <div className="p-3 bg-amber-50 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <div>
                  <p className="text-xs font-bold text-amber-900">📎 Student sent a document via WhatsApp</p>
                  <p className="text-[11px] text-amber-700">DOCUMENT MATCH REVIEW REQUIRED — Select the application and document slot before saving</p>
                </div>
              </div>
              <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="bg-amber-600 text-white text-[11px] font-bold gap-1.5 hover:bg-amber-700">
                <ArrowRight className="w-3.5 h-3.5" /> Review & Assign
              </Button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[var(--alo-page)]">
            {msgLoading ? (
              <div className="text-center text-xs text-[var(--alo-text-muted)] pt-8">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                Loading messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-xs text-[var(--alo-text-muted)] pt-8">No messages yet in this conversation</div>
            ) : (
              messages.map((msg: any) => {
                const isOutbound = msg.direction === 'outbound';
                return (
                  <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] space-y-1`}>
                      {/* AI label */}
                      {msg.isAiGenerated && (
                        <div className="flex items-center gap-1 text-[11px] text-purple-600 font-bold">
                          <Bot className="w-3 h-3" /> AI GENERATED DRAFT
                        </div>
                      )}

                      <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        isOutbound
                          ? 'bg-[var(--alo-brand)] text-white rounded-br-sm'
                          : 'bg-white text-[var(--alo-text)] border border-[var(--alo-border)] rounded-bl-sm shadow-sm'
                      }`}>
                        {msg.messageBody || msg.content || ''}

                        {/* File attachment */}
                        {(msg.type === 'document' || msg.type === 'image') && (
                          <div className="mt-2 p-2 bg-white/20 rounded-lg flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span className="text-[11px]">{msg.fileName || 'Attachment'}</span>
                          </div>
                        )}
                      </div>

                      <div className={`flex items-center gap-1.5 text-[11px] text-[var(--alo-text-muted)] ${isOutbound ? 'justify-end' : ''}`}>
                        {!isOutbound && <User className="w-3 h-3" />}
                        <span>{msg.senderName || ''}</span>
                        <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                        {isOutbound && <DeliveryIcon status={msg.deliveryStatus || 'sent'} />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Compose Area */}
          <div className="p-3 border-t border-[var(--alo-border)] bg-white space-y-2">
            {/* AI Draft Banner */}
            {aiDraft && draftText === aiDraft && (
              <div className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded-xl text-xs">
                <div className="flex items-center gap-2 text-purple-700">
                  <Bot className="w-4 h-4" />
                  <span className="font-bold">AI GENERATED DRAFT</span>
                  <span className="text-purple-500">— Review before sending</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAiApproved(true)}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      aiApproved ? 'bg-emerald-500 text-white border-emerald-500' : 'border-emerald-400 text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {aiApproved ? '✓ Approved' : 'Approve to Send'}
                  </button>
                  <button onClick={() => { setAiDraft(''); setDraftText(''); }} className="text-purple-400 hover:text-purple-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Mode Selector */}
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-[var(--alo-text-muted)] font-bold">Mode:</span>
              {([
                ['human_send', 'Human Send', 'bg-slate-800'],
                ['ai_human_send', 'AI Draft + Human Send', 'bg-purple-600'],
                ['ai_draft_only', 'AI Draft Only', 'bg-indigo-500'],
              ] as const).map(([m, label, color]) => (
                <button
                  key={m}
                  onClick={() => setSendMode(m as any)}
                  className={`px-2 py-0.5 rounded-full font-bold border transition-colors ${
                    sendMode === m ? `${color} text-white border-transparent` : 'text-[var(--alo-body)] border-[var(--alo-border)] hover:bg-[var(--alo-page)]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Text Input Row */}
            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full p-2.5 pr-24 border border-[var(--alo-border)] rounded-xl text-xs resize-none h-16 focus:ring-1 focus:ring-[var(--alo-brand)] focus:outline-none"
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) handleSend(); }}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <button onClick={() => setShowTemplates(!showTemplates)} className="p-1 text-[var(--alo-text-muted)] hover:text-[var(--alo-brand)]">
                    <Tag className="w-4 h-4" />
                  </button>
                  <button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="p-1 text-[var(--alo-text-muted)] hover:text-[var(--alo-brand)]">
                    <Paperclip className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Button
                  onClick={handleAiDraft}
                  disabled={aiLoading}
                  size="sm"
                  variant="outline"
                  className="text-[11px] font-bold gap-1 border-purple-300 text-purple-700 hover:bg-purple-50 h-7"
                >
                  {aiLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
                  AI Draft
                </Button>
                <Button
                  onClick={handleSend}
                  disabled={!draftText.trim()}
                  size="sm"
                  className="bg-[var(--alo-brand)] text-white text-[11px] font-bold gap-1 h-7"
                >
                  <Send className="w-3 h-3" /> Send
                </Button>
              </div>
            </div>

            {/* Template Picker */}
            {showTemplates && (
              <div className="p-3 bg-[var(--alo-page)] rounded-xl border border-[var(--alo-border)] space-y-1.5">
                <p className="text-[11px] font-bold text-[var(--alo-body)] uppercase tracking-wider">Official Templates</p>
                {WHATSAPP_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setDraftText(t.body); setShowTemplates(false); }}
                    className="w-full text-left p-2 hover:bg-white rounded-lg border border-transparent hover:border-[var(--alo-border)] text-xs transition-colors"
                  >
                    <span className="font-bold text-[var(--alo-brand)]">{t.name}</span>
                    <p className="text-[var(--alo-text-muted)] text-[11px] mt-0.5 truncate">{t.body}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[var(--alo-page)]">
          <div className="text-center space-y-3">
            <MessageSquare className="w-12 h-12 text-[var(--alo-placeholder)] mx-auto" />
            <p className="text-sm font-bold text-[var(--alo-text-muted)]">Select a WhatsApp conversation</p>
            <p className="text-xs text-[var(--alo-text-muted)] max-w-48">
              Student context, SLA timer, and AI draft reply will appear here
            </p>
          </div>
        </div>
      )}

      {/* RIGHT: Student Context Panel */}
      {selectedThread?.studentContext && (
        <div className="w-64 border-l border-[var(--alo-border)] overflow-y-auto bg-white shrink-0">
          <div className="p-3 border-b border-[var(--alo-border)] bg-[var(--alo-page)]">
            <p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase tracking-wider">Student Context</p>
          </div>
          <div className="p-3 space-y-3 text-xs">
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[var(--alo-text-muted)]">Name</span>
                <span className="font-bold text-[var(--alo-text)] text-right">{selectedThread.studentContext.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--alo-text-muted)]">Student ID</span>
                <span className="font-mono text-[var(--alo-body)]">{selectedThread.studentContext.studentCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--alo-text-muted)]">Phone</span>
                <span className="text-[var(--alo-body)]">{selectedThread.studentContext.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--alo-text-muted)]">Counselor</span>
                <span className="font-bold text-[var(--alo-brand)] text-right">{selectedThread.studentContext.assignedCounselorName || 'Unassigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--alo-text-muted)]">Stage</span>
                <Badge className="text-[11px] bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] font-bold">
                  {selectedThread.studentContext.currentStage || 'Unknown'}
                </Badge>
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--alo-border)]">
              <p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase tracking-wider mb-2">SLA Timer</p>
              <SlaCountdownBadge slaDueAt={selectedThread.slaDueAt} slaTriggeredAt={selectedThread.slaTriggeredAt} size="lg" />
            </div>

            <div className="pt-2 border-t border-[var(--alo-border)]">
              <p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase tracking-wider mb-2">AI Intent</p>
              <Badge className={`text-[11px] font-bold ${INTENT_COLORS[selectedThread.intent] || 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]'}`}>
                {selectedThread.intent || 'GENERAL'}
              </Badge>
            </div>

            <div className="pt-2 border-t border-[var(--alo-border)]">
              <p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase tracking-wider mb-2">Quick Actions</p>
              <div className="space-y-1.5">
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="w-full text-[11px] font-bold gap-1.5 justify-start h-7">
                  <FileText className="w-3 h-3 text-[var(--alo-brand)]" /> View Full Profile
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="w-full text-[11px] font-bold gap-1.5 justify-start h-7">
                  <Phone className="w-3 h-3 text-emerald-600" /> Call Student
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" size="sm" className="w-full text-[11px] font-bold gap-1.5 justify-start h-7">
                  <Zap className="w-3 h-3 text-amber-500" /> Escalate SLA
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
