"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Facebook,
  Instagram,
  Mail,
  Phone,
  Send,
  Bot,
  User,
  Paperclip,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ChevronRight,
  Shield,
  Tag,
  Zap,
  Globe,
  FileCheck
} from 'lucide-react';

export default function EnterpriseUnifiedCommunicationCenter() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [activeChannel, setActiveChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [sendError, setSendError] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Assistant States
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [prefilledForm, setPrefilledForm] = useState<any | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  async function triggerAiAssistant(convId: string) {
    try {
      setIsAiLoading(true);
      // Fetch AI Suggestions & Summaries in parallel
      const [replyRes, summaryRes, formRes] = await Promise.all([
        fetch('/api/crm/ucc/ai-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'suggest_replies', conversationId: convId }),
        }),
        fetch('/api/crm/ucc/ai-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'summarize', conversationId: convId }),
        }),
        fetch('/api/crm/ucc/ai-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'form_prefill', conversationId: convId }),
        }),
      ]);

      const replyData = await replyRes.json();
      const summaryData = await summaryRes.json();
      const formData = await formRes.json();

      if (replyData.suggestions) setAiSuggestions(replyData.suggestions);
      if (summaryData.summary) setAiSummary(summaryData.summary);
      if (formData.prefilledData) setPrefilledForm(formData.prefilledData);
    } catch (err) {
      console.error('AI assistant trigger failed:', err);
    } finally {
      setIsAiLoading(false);
    }
  }

  async function fetchConversationDetails(convId: string) {
    try {
      const response = await fetch(`/api/crm/ucc/conversations?id=${encodeURIComponent(convId)}`);
      const data = await response.json();
      if (!response.ok || !data.success) return;
      setSelectedApplicationId((current) => data.applications?.some((application: any) => application.id === current)
        ? current
        : data.applications?.[0]?.id || '');
      setSelectedConv((current: any) => current?.id === convId
        ? { ...current, ...data.conversation, applications: data.applications || [], messages: data.messages || [] }
        : current);
    } catch (err) {
      console.error('Failed to fetch conversation details:', err);
    }
  }

  async function fetchConversations() {
    try {
      setLoading(true);
      const url = `/api/crm/ucc/conversations?channel=${activeChannel}&search=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.conversations) {
        setConversations(data.conversations);
        if (!selectedConv && data.conversations.length > 0) {
          const firstConversation = data.conversations[0];
          setSelectedConv(firstConversation);
          fetchConversationDetails(firstConversation.id);
          triggerAiAssistant(firstConversation.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch UCC conversations:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConversations();
  }, [activeChannel, searchQuery]);



  const handleSendMessage = async (customContent?: string) => {
    const textToSend = customContent ?? messageInput;
    if (!selectedConv || (!textToSend.trim() && !selectedFile) || sending) return;
    setSendError('');
    setSending(true);
    try {
      let attachmentId: string | undefined;
      if (selectedFile) {
        if (selectedConv.channel !== 'whatsapp') {
          throw new Error('Private document sending is currently available only on WhatsApp.');
        }
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
          content: textToSend,
          messageType: 'text',
          ...(attachmentId ? { attachment: { attachmentId, caption: textToSend } } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.error || 'The reply could not be sent.');

      setMessageInput('');
      setSelectedFile(null);
      await Promise.all([fetchConversations(), fetchConversationDetails(selectedConv.id)]);
    } catch (err: any) {
      setSendError(err?.message || 'Send message failed.');
      console.error('Send message failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleSelectConv = (conv: any) => {
    setSelectedConv(conv);
    setSelectedFile(null);
    setSelectedApplicationId('');
    setSendError('');
    fetchConversationDetails(conv.id);
    triggerAiAssistant(conv.id);
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1"><MessageSquare className="w-3 h-3" /> WhatsApp</span>;
      case 'facebook':
        return <span className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1"><Facebook className="w-3 h-3" /> Facebook</span>;
      case 'instagram':
        return <span className="bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram</span>;
      case 'email':
        return <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>;
      default:
        return <span className="bg-[var(--alo-surface-muted)] text-[var(--alo-body)] text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1"><Globe className="w-3 h-3" /> Chat</span>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-[var(--alo-surface-muted)] dark:bg-slate-950 text-[var(--alo-text)] dark:text-slate-100 overflow-hidden">
      {/* UCC Top Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-[var(--alo-border)] dark:border-slate-800 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--alo-brand)]/10 rounded-lg">
            <MessageSquare className="w-6 h-6 text-[var(--alo-brand)]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[var(--alo-text)] dark:text-white flex items-center gap-2">
              Enterprise Unified Communication Center (UCC)
              <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
                Live Omni-Channel Inbox
              </span>
            </h1>
            <p className="text-xs text-[var(--alo-text-muted)]">
              WhatsApp, Facebook Messenger, Instagram, Email, Live Chat & Portal Messages in one timeline.
            </p>
          </div>
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center gap-1 bg-[var(--alo-surface-muted)] dark:bg-slate-800 p-1 rounded-lg border border-[var(--alo-border)] dark:border-slate-700 text-xs">
          {['all', 'whatsapp', 'facebook', 'instagram', 'email', 'live_chat'].map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition ${
                activeChannel === ch
                  ? 'bg-white dark:bg-slate-700 text-[var(--alo-brand)] dark:text-white shadow-sm'
                  : 'text-[var(--alo-body)] dark:text-[var(--alo-text-muted)] hover:text-[var(--alo-text)] dark:hover:text-white'
              }`}
            >
              {ch.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Conversation List */}
        <div className="w-80 border-r border-[var(--alo-border)] dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
          <div className="p-3 border-b border-[var(--alo-border)] dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-[var(--alo-text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search conversations, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--alo-page)] dark:bg-slate-800 border border-[var(--alo-border)] dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[var(--alo-brand)]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[var(--alo-border)] dark:divide-slate-800/60">
            {loading ? (
              <div className="p-6 text-center text-xs text-[var(--alo-text-muted)]">Loading inbox...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--alo-text-muted)]">No conversations found.</div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConv(conv)}
                    className={`p-3.5 cursor-pointer hover:bg-[var(--alo-page)] dark:hover:bg-slate-800/50 transition ${
                      isSelected ? 'bg-[var(--alo-brand-pale)]/70 dark:bg-slate-800 border-l-4 border-[var(--alo-brand)]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-xs text-[var(--alo-text)] dark:text-white truncate max-w-[160px]">
                        {conv.participantName}
                      </h4>
                      {getChannelBadge(conv.channel)}
                    </div>
                    <p className="text-xs text-[var(--alo-text-muted)] dark:text-[var(--alo-text-muted)] line-clamp-1 mt-1">
                      {conv.lastMessageText || 'No message yet.'}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-[11px] text-[var(--alo-text-muted)]">
                      <span>{new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {conv.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Center Column: Conversation Active Chat Window */}
        <div className="flex-1 flex flex-col bg-[var(--alo-page)] dark:bg-slate-950">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-slate-900 px-6 py-3 border-b border-[var(--alo-border)] dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm text-[var(--alo-text)] dark:text-white flex items-center gap-2">
                    {selectedConv.participantName}
                    <span className="text-xs font-normal text-[var(--alo-text-muted)]">{selectedConv.participantPhone || selectedConv.participantEmail}</span>
                  </h2>
                  <p className="text-xs text-[var(--alo-text-muted)] flex items-center gap-2 mt-0.5">
                    <span>Channel: <strong className="capitalize">{selectedConv.channel}</strong></span>
                    <span>•</span>
                    {selectedConv.studentId ? (
                      <span>Auto ID: <strong className="text-emerald-600 dark:text-emerald-400">Matched Student Profile · {selectedConv.studentId}</strong></span>
                    ) : selectedConv.leadId ? (
                      <span>Auto ID: <strong className="text-amber-600 dark:text-amber-400">Matched Lead · {selectedConv.leadId}</strong></span>
                    ) : (
                      <span>Auto ID: <strong className="text-[var(--alo-text-muted)] dark:text-[var(--alo-text-muted)]">No record matched — resolve contact match first</strong></span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendMessage('Thank you for your message. A counselor is reviewing your case and will reply with the verified details shortly.')}
                    className="px-3 py-1 bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] dark:bg-[var(--alo-brand-deep)]/40 dark:text-blue-300 text-xs font-medium rounded-lg hover:bg-[var(--alo-brand-pale)]"
                  >
                    + Acknowledge
                  </button>
                  <button
                    onClick={() => handleSendMessage('Please upload the documents requested in your document checklist so we can proceed with your application.')}
                    className="px-3 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-medium rounded-lg hover:bg-emerald-100"
                  >
                    + Request Document
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {selectedConv.messages?.map((msg: any) => {
                  const isOutbound = msg.direction === 'outbound' || msg.direction === 'system';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-lg p-3.5 rounded-2xl text-xs space-y-1.5 ${
                          isOutbound
                            ? 'bg-[var(--alo-brand)] text-white rounded-br-none shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-[var(--alo-text)] dark:text-slate-100 rounded-bl-none border border-[var(--alo-border)] dark:border-slate-700 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[11px] opacity-80 border-b border-white/20 pb-1">
                          <span className="font-semibold">{msg.senderName} ({msg.senderRole})</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                        {/* Attachments */}
                        {msg.attachments?.map((att: any) => (
                          <a
                            key={att.id}
                            href={`/api/crm/ucc/documents/${encodeURIComponent(att.id)}/download`}
                            className="mt-2 p-2 bg-black/10 rounded-lg flex items-center justify-between gap-2 text-[11px] hover:bg-black/20"
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 shrink-0" />
                              <span className="font-medium truncate max-w-[180px]">{att.fileName}</span>
                            </span>
                            <span className="text-[11px] uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded font-bold">
                              {att.detectedDocType || 'Private file'}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 border-t border-[var(--alo-border)] dark:border-slate-800 space-y-2">
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
                    className="max-w-full rounded-lg border border-[var(--alo-border)] bg-white px-2 py-1.5 text-xs text-[var(--alo-body)] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--alo-body)] dark:text-[var(--alo-placeholder)]">
                    <span className="truncate">Private attachment: {selectedFile.name}</span>
                    <button type="button" onClick={() => setSelectedFile(null)} className="text-rose-600 hover:underline">Remove</button>
                  </div>
                )}
                {sendError && <p role="alert" className="text-xs text-rose-600">{sendError}</p>}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Attach private PDF or image"
                    title={selectedConv.channel === 'whatsapp' ? 'Upload a private PDF/JPEG/PNG and send it via WhatsApp' : 'Document sending is currently available only on WhatsApp'}
                    disabled={selectedConv.channel !== 'whatsapp' || sending}
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 rounded-xl border border-[var(--alo-border)] dark:border-slate-700 text-[var(--alo-text-muted)] hover:bg-[var(--alo-page)] disabled:opacity-40"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    placeholder="Type reply or pick an AI suggested response below..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-2.5 bg-[var(--alo-page)] dark:bg-slate-800 border border-[var(--alo-border)] dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[var(--alo-brand)]"
                  />
                  <button
                    disabled={sending || (!messageInput.trim() && !selectedFile)}
                    onClick={() => handleSendMessage()}
                    className="px-5 py-2.5 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
                <p className="text-[11px] text-[var(--alo-text-muted)]">Private files are uploaded to protected storage. WhatsApp provider credentials are required to send externally.</p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-[var(--alo-text-muted)]">
              Select a conversation to open omni-channel inbox
            </div>
          )}
        </div>

        {/* Right Column: AI Assistant & Auto CRM Student Profile Card */}
        <div className="w-80 border-l border-[var(--alo-border)] dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col space-y-4 overflow-y-auto">
          {/* AI Smart Copilot Panel */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-xl border border-[var(--alo-border)] dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-[var(--alo-brand)] dark:text-blue-300">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> ALO AI Smart Suggestions
            </div>

            {isAiLoading ? (
              <p className="text-xs text-[var(--alo-text-muted)]">Analyzing conversation context...</p>
            ) : (
              <div className="space-y-2">
                {aiSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMessageInput(sug)}
                    className="w-full text-left p-2.5 bg-white dark:bg-slate-900 hover:bg-[var(--alo-brand-pale)] dark:hover:bg-slate-700 border border-[var(--alo-border)] dark:border-slate-700 rounded-lg text-[11px] text-[var(--alo-body)] dark:text-slate-200 transition line-clamp-2"
                  >
                    💡 {sug}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Conversation AI Summary */}
          {aiSummary && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1.5">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                AI Timeline Summary
              </span>
              <p className="text-xs text-[var(--alo-body)] dark:text-[var(--alo-placeholder)] leading-relaxed">{aiSummary}</p>
            </div>
          )}

          {/* Auto Form Prefill Metadata */}
          {prefilledForm && (
            <div className="p-3.5 bg-[var(--alo-page)] dark:bg-slate-800 rounded-xl border border-[var(--alo-border)] dark:border-slate-700 space-y-2">
              <span className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase tracking-wide flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-[var(--alo-brand)]" /> Auto Form Prefill Data
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-[var(--alo-text-muted)]">Name:</span> <span className="font-semibold">{prefilledForm.studentName}</span></div>
                <div className="flex justify-between"><span className="text-[var(--alo-text-muted)]">Country:</span> <span className="font-semibold">{prefilledForm.destinationCountry}</span></div>
                <div className="flex justify-between"><span className="text-[var(--alo-text-muted)]">Intake:</span> <span className="font-semibold">{prefilledForm.targetIntake}</span></div>
                <div className="flex justify-between"><span className="text-[var(--alo-text-muted)]">Test:</span> <span className="font-semibold">{prefilledForm.englishScore}</span></div>
              </div>
              <button
                onClick={() => alert('Form fields pre-filled in CRM Student Profile.')}
                className="w-full mt-2 py-1.5 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white font-medium text-xs rounded-lg transition"
              >
                Apply to CRM Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
