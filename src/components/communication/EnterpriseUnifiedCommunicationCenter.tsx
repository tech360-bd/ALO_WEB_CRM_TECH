"use client";

import React, { useState, useEffect } from 'react';
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
  const [loading, setLoading] = useState(true);

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
    } fontFinally: {
      setIsAiLoading(false);
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
          setSelectedConv(data.conversations[0]);
          triggerAiAssistant(data.conversations[0].id);
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



  const handleSendMessage = async (customContent?: string, attachmentUrl?: string, attachmentName?: string) => {
    const textToSend = customContent || messageInput;
    if (!selectedConv || (!textToSend && !attachmentUrl)) return;

    try {
      const res = await fetch('/api/crm/ucc/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConv.id,
          content: textToSend || `[File Uploaded: ${attachmentName || 'document.pdf'}]`,
          channel: selectedConv.channel,
          attachmentUrl,
          attachmentName,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setMessageInput('');
        fetchConversations();
        if (selectedConv) {
          setSelectedConv((prev: any) => ({
            ...prev,
            messages: [...(prev?.messages || []), data.message],
            lastMessageText: textToSend,
          }));
        }
      }
    } catch (err) {
      console.error('Send message failed:', err);
    }
  };

  const handleSelectConv = (conv: any) => {
    setSelectedConv(conv);
    triggerAiAssistant(conv.id);
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1"><MessageSquare className="w-3 h-3" /> WhatsApp</span>;
      case 'facebook':
        return <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1"><Facebook className="w-3 h-3" /> Facebook</span>;
      case 'instagram':
        return <span className="bg-pink-100 text-pink-700 text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1"><Instagram className="w-3 h-3" /> Instagram</span>;
      case 'email':
        return <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded font-semibold flex items-center gap-1"><Globe className="w-3 h-3" /> Chat</span>;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden">
      {/* UCC Top Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0057B8]/10 rounded-lg">
            <MessageSquare className="w-6 h-6 text-[#0057B8]" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Enterprise Unified Communication Center (UCC)
              <span className="text-xs bg-emerald-100 text-emerald-700 font-medium px-2 py-0.5 rounded-full border border-emerald-200">
                Live Omni-Channel Inbox
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              WhatsApp, Facebook Messenger, Instagram, Email, Live Chat & Portal Messages in one timeline.
            </p>
          </div>
        </div>

        {/* Channel Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
          {['all', 'whatsapp', 'facebook', 'instagram', 'email', 'live_chat'].map((ch) => (
            <button
              key={ch}
              onClick={() => setActiveChannel(ch)}
              className={`px-3 py-1.5 rounded-md font-medium capitalize transition ${
                activeChannel === ch
                  ? 'bg-white dark:bg-slate-700 text-[#0057B8] dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col">
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search conversations, phone, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0057B8]"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading inbox...</div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No conversations found.</div>
            ) : (
              conversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConv(conv)}
                    className={`p-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${
                      isSelected ? 'bg-blue-50/70 dark:bg-slate-800 border-l-4 border-[#0057B8]' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white truncate max-w-[160px]">
                        {conv.participantName}
                      </h4>
                      {getChannelBadge(conv.channel)}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                      {conv.lastMessageText || 'No message yet.'}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
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
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="bg-white dark:bg-slate-900 px-6 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    {selectedConv.participantName}
                    <span className="text-xs font-normal text-slate-500">{selectedConv.participantPhone || selectedConv.participantEmail}</span>
                  </h2>
                  <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>Channel: <strong className="capitalize">{selectedConv.channel}</strong></span>
                    <span>•</span>
                    <span>Auto ID: <strong className="text-emerald-600 dark:text-emerald-400">Matched Student Profile</strong></span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendMessage('Here is your course shortlist for Aston University London.')}
                    className="px-3 py-1 bg-blue-50 text-[#0057B8] dark:bg-blue-900/40 dark:text-blue-300 text-xs font-medium rounded-lg hover:bg-blue-100"
                  >
                    + Course Shortlist
                  </button>
                  <button
                    onClick={() => handleSendMessage('Please upload your IELTS test report copy.', 'https://aloeducation.com/sample-passport.pdf', 'Passport_Copy.pdf')}
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
                            ? 'bg-[#0057B8] text-white rounded-br-none shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-200 dark:border-slate-700 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[10px] opacity-80 border-b border-white/20 pb-1">
                          <span className="font-semibold">{msg.senderName} ({msg.senderRole})</span>
                          <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                        {/* Attachments */}
                        {msg.attachments?.map((att: any) => (
                          <div
                            key={att.id}
                            className="mt-2 p-2 bg-black/10 rounded-lg flex items-center justify-between text-[11px]"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span className="font-medium truncate max-w-[180px]">{att.fileName}</span>
                            </div>
                            <span className="text-[9px] uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded font-bold">
                              Auto-Classified: {att.detectedDocType}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Chat Input Bar */}
              <div className="bg-white dark:bg-slate-900 p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type reply or pick an AI suggested response below..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#0057B8]"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    className="px-5 py-2.5 bg-[#0057B8] hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a conversation to open omni-channel inbox
            </div>
          )}
        </div>

        {/* Right Column: AI Assistant & Auto CRM Student Profile Card */}
        <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col space-y-4 overflow-y-auto">
          {/* AI Smart Copilot Panel */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 rounded-xl border border-blue-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-[#0057B8] dark:text-blue-300">
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> ALO AI Smart Suggestions
            </div>

            {isAiLoading ? (
              <p className="text-xs text-slate-400">Analyzing conversation context...</p>
            ) : (
              <div className="space-y-2">
                {aiSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMessageInput(sug)}
                    className="w-full text-left p-2.5 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-200 transition line-clamp-2"
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
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide">
                AI Timeline Summary
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{aiSummary}</p>
            </div>
          )}

          {/* Auto Form Prefill Metadata */}
          {prefilledForm && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                <FileCheck className="w-3.5 h-3.5 text-blue-500" /> Auto Form Prefill Data
              </span>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-slate-400">Name:</span> <span className="font-semibold">{prefilledForm.studentName}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Country:</span> <span className="font-semibold">{prefilledForm.destinationCountry}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Intake:</span> <span className="font-semibold">{prefilledForm.targetIntake}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Test:</span> <span className="font-semibold">{prefilledForm.englishScore}</span></div>
              </div>
              <button
                onClick={() => alert('Form fields pre-filled in CRM Student Profile.')}
                className="w-full mt-2 py-1.5 bg-[#0057B8] hover:bg-blue-700 text-white font-medium text-xs rounded-lg transition"
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
