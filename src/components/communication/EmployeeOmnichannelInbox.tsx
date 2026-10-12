"use client";

// ============================================================
// Employee Omnichannel Inbox — ALO Education
// Full 3-pane inbox: Sidebar / Thread / Profile+Actions
// Supports: WhatsApp, Facebook, Instagram, Email, Chat, SMS
// Features: AI reply suggestions, internal notes, lead creation,
//           real-time channel filter, office hours indicator
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  MessageSquare, Phone, Mail, Facebook, Instagram,
  Zap, Globe, Bot, User, Send, Paperclip, Tag, Clock,
  AlertTriangle, CheckCircle2, Search, RefreshCw,
  Sparkles, Link2, Users, BookOpen, ChevronDown,
  Lock, XCircle, ArrowRight, Bell, Filter,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <Zap className="w-3.5 h-3.5 text-emerald-500" />,
  facebook: <Facebook className="w-3.5 h-3.5 text-blue-600" />,
  instagram: <Instagram className="w-3.5 h-3.5 text-pink-500" />,
  email: <Mail className="w-3.5 h-3.5 text-amber-500" />,
  live_chat: <Globe className="w-3.5 h-3.5 text-blue-400" />,
  sms: <Phone className="w-3.5 h-3.5 text-slate-500" />,
  internal: <Users className="w-3.5 h-3.5 text-purple-500" />,
  portal: <BookOpen className="w-3.5 h-3.5 text-indigo-500" />,
  telegram: <Bot className="w-3.5 h-3.5 text-sky-500" />,
};

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook: 'Messenger',
  instagram: 'Instagram DM',
  email: 'Email',
  live_chat: 'Website Chat',
  sms: 'SMS',
  internal: 'Internal',
  portal: 'Portal',
  telegram: 'Telegram',
};

const CHANNEL_FILTERS = ['all', 'whatsapp', 'facebook', 'instagram', 'email', 'live_chat', 'sms'];
const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'pending', label: 'Pending' },
  { key: 'snoozed', label: 'Snoozed' },
  { key: 'closed', label: 'Closed' },
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function EmployeeOmnichannelInbox() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeChannel, setActiveChannel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [sendError, setSendError] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAi, setShowAi] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [officeOpen, setOfficeOpen] = useState<boolean | null>(null);
  const [creatingLead, setCreatingLead] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Data fetchers ──────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ channel: activeChannel });
      if (activeFilter !== 'all') params.set('status', activeFilter);
      if (searchQuery) params.set('search', searchQuery);
      const res = await fetch(`/api/crm/ucc/conversations?${params}`);
      const data = await res.json();
      if (data.success) setConversations(data.conversations || []);
    } catch {}
    setLoading(false);
  }, [activeChannel, activeFilter, searchQuery]);

  const fetchOfficeStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/crm/ucc/office-hours');
      const data = await res.json();
      if (data.success) setOfficeOpen(data.isCurrentlyOpen);
    } catch {}
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchOfficeStatus();
  }, [fetchConversations, fetchOfficeStatus]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConversation = async (conv: any) => {
    setSelectedConv(conv);
    setMessages([]);
    setSelectedFile(null);
    setSelectedApplicationId('');
    setSendError('');
    setShowAi(false);
    setAiSuggestions([]);
    try {
      const res = await fetch(`/api/crm/ucc/conversations?id=${conv.id}`);
      const data = await res.json();
      if (data.success && data.messages) {
        setMessages(data.messages);
        setSelectedApplicationId((current) => data.applications?.some((application: any) => application.id === current)
          ? current
          : data.applications?.[0]?.id || '');
        setSelectedConv((current: any) => current?.id === conv.id
          ? { ...current, ...data.conversation, applications: data.applications || [] }
          : current);
      }
    } catch {}

    // Fetch AI suggestions
    setAiLoading(true);
    try {
      const aiRes = await fetch('/api/crm/ucc/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suggest_replies', conversationId: conv.id }),
      });
      const aiData = await aiRes.json();
      if (aiData.success && aiData.replies?.length > 0) {
        setAiSuggestions(aiData.replies);
        setShowAi(true);
      }
    } catch {}
    setAiLoading(false);
  };

  const sendMessage = async () => {
    if (!selectedConv || (!messageInput.trim() && !selectedFile) || sending) return;
    setSending(true);
    setSendError('');
    try {
      let attachmentId: string | undefined;
      if (selectedFile) {
        if (isInternalNote) throw new Error('Internal notes cannot include attachments.');
        if (selectedConv.channel !== 'whatsapp') throw new Error('Private document sending is currently available only on WhatsApp.');
        const form = new FormData();
        form.append('file', selectedFile);
        form.append('conversationId', selectedConv.id);
        if (selectedConv.studentId) form.append('studentId', selectedConv.studentId);
        if (selectedApplicationId) form.append('applicationId', selectedApplicationId);
        const uploadResponse = await fetch('/api/crm/ucc/documents/upload', { method: 'POST', body: form });
        const uploadData = await uploadResponse.json().catch(() => ({}));
        if (!uploadResponse.ok || !uploadData.success || !uploadData.attachment?.id) {
          throw new Error(uploadData.error || 'Private document upload failed.');
        }
        attachmentId = uploadData.attachment.id;
      }

      const res = await fetch(`/api/crm/ucc/conversations/${selectedConv.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageInput,
          isInternalNote,
          ...(attachmentId ? { attachment: { attachmentId, caption: messageInput } } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'Reply could not be sent.');
      setMessageInput('');
      setSelectedFile(null);
      const [detailResponse] = await Promise.all([
        fetch(`/api/crm/ucc/conversations?id=${encodeURIComponent(selectedConv.id)}`),
        fetchConversations(),
      ]);
      const detail = await detailResponse.json().catch(() => ({}));
      if (detail.success) setMessages(detail.messages || []);
    } catch (error: any) {
      setSendError(error?.message || 'Reply could not be sent.');
    } finally {
      setSending(false);
    }
  };

  const createLead = async () => {
    if (!selectedConv || creatingLead) return;
    setCreatingLead(true);
    try {
      const res = await fetch(`/api/crm/ucc/conversations/${selectedConv.id}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          createNew: true,
          leadData: {
            name: selectedConv.participantName,
            phone: selectedConv.participantPhone,
            email: selectedConv.participantEmail,
            destination: selectedConv.destinationCountry,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSelectedConv({ ...selectedConv, leadId: data.lead?.id || data.leadId });
        fetchConversations();
      }
    } catch {}
    setCreatingLead(false);
  };

  // ── Render helpers ─────────────────────────────────────────
  const priorityBadge = (priority: string) => {
    const map: Record<string, string> = {
      urgent: 'bg-red-100 text-red-600',
      high: 'bg-amber-100 text-amber-700',
      normal: 'bg-slate-100 text-slate-500',
      low: 'bg-green-50 text-green-600',
    };
    return map[priority] || map.normal;
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      open: 'bg-emerald-100 text-emerald-700',
      pending: 'bg-amber-100 text-amber-700',
      snoozed: 'bg-purple-100 text-purple-600',
      closed: 'bg-slate-100 text-slate-500',
    };
    return map[status] || map.open;
  };

  // ── Layout ─────────────────────────────────────────────────
  return (
    <div className="flex h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── LEFT: Conversation List ─────────────────────── */}
      <div className="w-80 flex-shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#E2E8F0] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#2563EB] rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-sm text-[#0F172A]">Unified Inbox</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                officeOpen === null ? 'bg-slate-100 text-slate-500' :
                officeOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {officeOpen === null ? 'Checking...' : officeOpen ? 'OPEN' : 'CLOSED'}
              </div>
              <button
                onClick={fetchConversations}
                className="p-1.5 rounded-lg hover:bg-[#F8FAFC] transition text-slate-400 hover:text-slate-700"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB]"
            />
          </div>

          {/* Channel filters */}
          <div className="flex flex-wrap gap-1">
            {CHANNEL_FILTERS.map((ch) => (
              <button
                key={ch}
                onClick={() => setActiveChannel(ch)}
                className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition ${
                  activeChannel === ch
                    ? 'bg-[#2563EB] text-white shadow-sm'
                    : 'bg-[#F8FAFC] border border-[#E2E8F0] text-slate-500 hover:border-[#2563EB] hover:text-[#2563EB]'
                }`}
              >
                {ch === 'all' ? 'All Channels' : CHANNEL_LABELS[ch] || ch}
              </button>
            ))}
          </div>
        </div>

        {/* Status tabs */}
        <div className="flex border-b border-[#E2E8F0] bg-white overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`text-[10px] font-semibold px-3 py-2.5 whitespace-nowrap border-b-2 transition ${
                activeFilter === f.key
                  ? 'border-[#2563EB] text-[#2563EB]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-xs font-medium">No conversations found</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full text-left px-4 py-3 border-b border-[#E2E8F0] hover:bg-[#F8FAFC] transition-all ${
                  selectedConv?.id === conv.id
                    ? 'bg-blue-50 border-l-2 border-l-[#2563EB]'
                    : 'border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {CHANNEL_ICONS[conv.channel]}
                    <span className="text-xs font-semibold text-[#0F172A] truncate">
                      {conv.participantName || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {conv.unreadCount > 0 && (
                      <span className="min-w-[16px] h-4 bg-[#2563EB] text-white text-[9px] font-bold rounded-full px-1 flex items-center justify-center">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                    {(conv.priority === 'urgent' || conv.priority === 'high') && (
                      <AlertTriangle className="w-3 h-3 text-[#F97316]" />
                    )}
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 truncate mb-1.5">
                  {conv.lastMessageText || 'No messages yet'}
                </p>
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${statusBadge(conv.status)}`}>
                    {conv.status}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {new Date(conv.lastMessageAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── CENTER: Message Thread ───────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F8FAFC]">
        {selectedConv ? (
          <>
            {/* Conversation header */}
            <div className="px-5 py-3.5 bg-white border-b border-[#E2E8F0] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2563EB] to-blue-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                  {(selectedConv.participantName || 'U')[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-[#0F172A] truncate">{selectedConv.participantName}</h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    {CHANNEL_ICONS[selectedConv.channel]}
                    <span>{CHANNEL_LABELS[selectedConv.channel] || selectedConv.channel}</span>
                    {selectedConv.participantPhone && <><span>•</span><span>{selectedConv.participantPhone}</span></>}
                    {selectedConv.destinationCountry && <><span>•</span><span>{selectedConv.destinationCountry}</span></>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!selectedConv.leadId && (
                  <button
                    onClick={createLead}
                    disabled={creatingLead}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold bg-[#10B981] hover:bg-green-600 text-white rounded-xl transition disabled:opacity-50"
                  >
                    <Link2 className="w-3 h-3" />
                    {creatingLead ? 'Creating...' : 'Create Lead'}
                  </button>
                )}
                {selectedConv.leadId && (
                  <span className="text-[10px] font-semibold px-2 py-1 bg-emerald-50 text-emerald-700 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Lead Linked
                  </span>
                )}
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${priorityBadge(selectedConv.priority)}`}>
                  {selectedConv.priority}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-16 text-center text-slate-400">
                  <div>
                    <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-xs">No messages yet in this conversation</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.direction === 'outbound' ? 'justify-end' :
                      msg.direction === 'internal_note' || msg.direction === 'system' ? 'justify-center' :
                      'justify-start'
                    }`}
                  >
                    {msg.direction === 'internal_note' && (
                      <div className="max-w-lg w-full text-center">
                        <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-xl text-[10px]">
                          <Lock className="w-3 h-3" />
                          <span className="font-bold">INTERNAL NOTE</span>
                          <span>—</span>
                          <span className="italic">{msg.content}</span>
                        </div>
                      </div>
                    )}
                    {msg.direction === 'system' && (
                      <div className="text-[10px] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full">
                        {msg.content}
                      </div>
                    )}
                    {(msg.direction === 'outbound' || msg.direction === 'inbound') && (
                      <div className={`max-w-[72%] space-y-1 ${msg.direction === 'outbound' ? 'items-end' : 'items-start'} flex flex-col`}>
                        {msg.aiGenerated && (
                          <div className="text-[9px] font-bold text-purple-500 flex items-center gap-1">
                            <Bot className="w-3 h-3" /> AI Generated
                            {!msg.aiApproved && <span className="text-amber-500">— Pending Approval</span>}
                          </div>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                          msg.direction === 'outbound'
                            ? 'bg-[#2563EB] text-white rounded-br-none'
                            : 'bg-white border border-[#E2E8F0] text-[#0F172A] rounded-bl-none shadow-sm'
                        }`}>
                          {msg.content}
                          {msg.attachments?.map((attachment: any) => (
                            <a
                              key={attachment.id}
                              href={`/api/crm/ucc/documents/${encodeURIComponent(attachment.id)}/download`}
                              className="mt-2 flex items-center gap-2 rounded-lg bg-black/10 px-2 py-1.5 underline underline-offset-2"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span className="truncate">{attachment.fileName}</span>
                            </a>
                          ))}
                        </div>
                        <div className={`text-[9px] text-slate-400 ${msg.direction === 'outbound' ? 'text-right' : 'text-left'}`}>
                          {msg.senderName} • {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Suggestions */}
            {showAi && aiSuggestions.length > 0 && (
              <div className="px-5 py-2 bg-purple-50 border-t border-purple-100">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-purple-700">
                    <Sparkles className="w-3 h-3" /> AI Suggested Replies
                  </div>
                  <button onClick={() => setShowAi(false)} className="text-slate-400 hover:text-slate-600">
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiSuggestions.slice(0, 3).map((s, i) => (
                    <button
                      key={i}
                      onClick={() => setMessageInput(s)}
                      className="text-[10px] px-3 py-1.5 bg-white border border-purple-200 text-purple-700 rounded-full hover:bg-purple-50 transition max-w-xs truncate"
                    >
                      {s.substring(0, 70)}{s.length > 70 ? '...' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reply Box */}
            <div className="p-4 bg-white border-t border-[#E2E8F0]">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(event) => {
                  setSelectedFile(event.currentTarget.files?.[0] || null);
                  event.currentTarget.value = '';
                }}
              />
              {selectedConv.studentId && selectedConv.applications?.length > 0 && (
                <select
                  aria-label="Link the document to an application"
                  value={selectedApplicationId}
                  onChange={(event) => setSelectedApplicationId(event.target.value)}
                  className="mb-2 max-w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[10px] text-slate-700"
                >
                  <option value="">Choose related application</option>
                  {selectedConv.applications.map((application: any) => (
                    <option key={application.id} value={application.id}>
                      {application.isB2bConfidential ? '[B2B confidential] ' : ''}{application.applicationCode || application.id} · {application.universityName} · {application.courseName}
                    </option>
                  ))}
                </select>
              )}
              {selectedFile && (
                <div className="mb-2 flex items-center justify-between gap-2 text-[10px] text-slate-600">
                  <span className="truncate">Private attachment: {selectedFile.name}</span>
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-rose-600 hover:underline">Remove</button>
                </div>
              )}
              {sendError && <p role="alert" className="mb-2 text-[10px] text-rose-600">{sendError}</p>}
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => setIsInternalNote(false)}
                  className={`text-[10px] font-semibold px-3 py-1 rounded-full transition ${
                    !isInternalNote ? 'bg-[#2563EB] text-white' : 'bg-[#F8FAFC] border border-[#E2E8F0] text-slate-500'
                  }`}
                >
                  Reply to Customer
                </button>
                <button
                  onClick={() => { setIsInternalNote(true); setSelectedFile(null); }}
                  className={`text-[10px] font-semibold px-3 py-1 rounded-full transition flex items-center gap-1 ${
                    isInternalNote ? 'bg-amber-500 text-white' : 'bg-[#F8FAFC] border border-[#E2E8F0] text-slate-500'
                  }`}
                >
                  <Lock className="w-2.5 h-2.5" /> Internal Note
                </button>
                {aiLoading && (
                  <span className="text-[9px] text-purple-500 flex items-center gap-1 ml-auto">
                    <Sparkles className="w-3 h-3 animate-pulse" /> Getting AI suggestions...
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label="Attach private document"
                  disabled={isInternalNote || selectedConv.channel !== 'whatsapp' || sending}
                  title="Upload a private PDF/JPEG/PNG and send it via WhatsApp"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-10 w-10 self-end flex items-center justify-center rounded-xl border border-[#E2E8F0] text-slate-500 hover:bg-slate-50 disabled:opacity-40"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <textarea
                  rows={2}
                  placeholder={isInternalNote ? 'Add an internal staff note...' : 'Type your reply to the customer...'}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); sendMessage(); } }}
                  className={`flex-1 text-xs resize-none p-3 rounded-xl border focus:outline-none focus:ring-2 transition ${
                    isInternalNote
                      ? 'bg-amber-50 border-amber-200 focus:ring-amber-300 focus:border-amber-400'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] focus:ring-[#2563EB]/20 focus:border-[#2563EB]'
                  }`}
                />
                <button
                  onClick={sendMessage}
                  disabled={(!messageInput.trim() && !selectedFile) || sending}
                  className="w-10 h-10 self-end flex items-center justify-center rounded-xl bg-[#2563EB] hover:bg-blue-700 disabled:opacity-40 text-white transition shadow-sm"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-[9px] text-slate-400 mt-1">Ctrl+Enter to send</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="w-20 h-20 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-center shadow-sm">
              <MessageSquare className="w-10 h-10 opacity-20" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-600">Select a conversation</p>
              <p className="text-xs mt-1">{conversations.length} conversation{conversations.length !== 1 ? 's' : ''} in your inbox</p>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT: Profile + Actions ─────────────────────── */}
      {selectedConv && (
        <div className="w-64 flex-shrink-0 bg-white border-l border-[#E2E8F0] flex flex-col overflow-y-auto">
          {/* Contact card */}
          <div className="p-4 border-b border-[#E2E8F0] text-center">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#2563EB] to-blue-400 mx-auto flex items-center justify-center text-white font-bold text-xl mb-2">
              {(selectedConv.participantName || 'U')[0].toUpperCase()}
            </div>
            <p className="font-bold text-sm text-[#0F172A]">{selectedConv.participantName}</p>
            {selectedConv.participantPhone && (
              <p className="text-[10px] text-slate-400 mt-0.5">{selectedConv.participantPhone}</p>
            )}
            {selectedConv.participantEmail && (
              <p className="text-[10px] text-slate-400 truncate">{selectedConv.participantEmail}</p>
            )}
          </div>

          {/* Conversation details */}
          <div className="p-4 space-y-3 text-xs">
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Channel</label>
              <div className="flex items-center gap-1.5 mt-1">
                {CHANNEL_ICONS[selectedConv.channel]}
                <span className="font-medium text-[#0F172A]">{CHANNEL_LABELS[selectedConv.channel] || selectedConv.channel}</span>
              </div>
            </div>

            {selectedConv.destinationCountry && (
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Destination</label>
                <p className="mt-1 font-medium text-[#0F172A]">{selectedConv.destinationCountry}</p>
              </div>
            )}

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Status</label>
              <div className={`mt-1 inline-flex px-2 py-0.5 rounded-full font-semibold text-[10px] ${statusBadge(selectedConv.status)}`}>
                {selectedConv.status}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Priority</label>
              <div className={`mt-1 inline-flex px-2 py-0.5 rounded-full font-semibold text-[10px] ${priorityBadge(selectedConv.priority)}`}>
                {selectedConv.priority}
              </div>
            </div>

            {selectedConv.leadId && (
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Lead ID</label>
                <p className="mt-1 text-[#2563EB] font-mono text-[10px]">{selectedConv.leadId.substring(0, 16)}...</p>
              </div>
            )}

            {selectedConv.tags && JSON.parse(selectedConv.tags || '[]').length > 0 && (
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tags</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {JSON.parse(selectedConv.tags).map((tag: string) => (
                    <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-4 space-y-2 border-t border-[#E2E8F0]">
            <button
              disabled={selectedConv.channel !== 'whatsapp' || isInternalNote || sending}
              title={selectedConv.channel === 'whatsapp' ? 'Choose a private PDF/JPEG/PNG to send with your reply' : 'Document sending is currently available only on WhatsApp'}
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-40"
            >
              <Paperclip className="w-3 h-3" /> Upload Document
            </button>
            <button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="w-full py-2 bg-[#F8FAFC] hover:bg-slate-100 border border-[#E2E8F0] rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1.5 transition">
              <Tag className="w-3 h-3" /> Add Tag
            </button>
            <button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="w-full py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1.5 transition">
              <AlertTriangle className="w-3 h-3" /> Escalate
            </button>
            <button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="w-full py-2 bg-slate-100 hover:bg-slate-200 border border-[#E2E8F0] text-slate-500 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1.5 transition">
              <Clock className="w-3 h-3" /> Snooze
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
