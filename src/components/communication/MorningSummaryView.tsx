"use client";

// ============================================================
// Morning Counselor Summary — ALO Education CRM
// Daily AI briefing: overnight conversations, urgent cases,
// pending OCR reviews, overdue replies, channel breakdown
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  Sun, MessageSquare, AlertTriangle, FileText, Clock,
  RefreshCw, CheckCircle2, BarChart3, Zap, Facebook,
  Instagram, Mail, Phone, Globe, ChevronRight, Bell,
} from 'lucide-react';

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  whatsapp: <Zap className="w-3.5 h-3.5 text-emerald-500" />,
  facebook: <Facebook className="w-3.5 h-3.5 text-blue-600" />,
  instagram: <Instagram className="w-3.5 h-3.5 text-pink-500" />,
  email: <Mail className="w-3.5 h-3.5 text-amber-500" />,
  live_chat: <Globe className="w-3.5 h-3.5 text-blue-400" />,
  sms: <Phone className="w-3.5 h-3.5 text-slate-500" />,
};

interface SummaryData {
  generatedAt: string;
  scope: string;
  overnight: {
    newConversations: number;
    totalUnread: number;
    highPriority: number;
    byChannel: Record<string, number>;
  };
  pendingActions: {
    ocrReviewRequired: number;
    approvalsPending: number;
    overdueReplies: number;
    contentApprovalsPending: number;
  };
  topPriorityConversations: Array<{
    id: string;
    name: string;
    channel: string;
    priority: string;
    lastMessage?: string;
    lastAt: string;
    country?: string;
  }>;
  overdueConversations: Array<{
    id: string;
    participantName: string;
    channel: string;
    lastMessageAt: string;
    priority: string;
  }>;
}

export default function MorningSummaryView() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/crm/ucc/morning-summary');
      const data = await res.json();
      if (data.success) setSummary(data.summary);
      else setError(data.error || 'Failed to load summary');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load summary');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 text-slate-400">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#0B5ED7] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs">Loading your briefing...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-[#EF4444] mx-auto mb-2" />
        <p className="text-sm font-medium text-[#EF4444]">{error}</p>
        <button onClick={fetchSummary} className="mt-3 text-xs text-[#0B5ED7] hover:underline">Retry</button>
      </div>
    );
  }

  if (!summary) return null;

  const totalActions =
    summary.pendingActions.ocrReviewRequired +
    summary.pendingActions.approvalsPending +
    summary.pendingActions.overdueReplies +
    summary.pendingActions.contentApprovalsPending;

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Greeting header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center">
            <Sun className="w-8 h-8 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">{greeting()} ☀️</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Daily briefing • {new Date(summary.generatedAt).toLocaleString('en-GB', { dateStyle: 'full', timeStyle: 'short' })}
              {' '}• Scope: {summary.scope === 'all' ? 'All Teams' : 'Your Assignments'}
            </p>
          </div>
        </div>
        <button
          onClick={fetchSummary}
          className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] transition text-slate-400"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            icon: <MessageSquare className="w-6 h-6 text-[#0B5ED7]" />,
            value: summary.overnight.newConversations,
            label: 'New Conversations',
            bg: 'bg-blue-50',
          },
          {
            icon: <AlertTriangle className="w-6 h-6 text-[#F97316]" />,
            value: summary.overnight.highPriority,
            label: 'High Priority',
            bg: 'bg-orange-50',
          },
          {
            icon: <FileText className="w-6 h-6 text-amber-500" />,
            value: summary.pendingActions.ocrReviewRequired,
            label: 'OCR Reviews',
            bg: 'bg-amber-50',
          },
          {
            icon: <Clock className="w-6 h-6 text-[#EF4444]" />,
            value: summary.pendingActions.overdueReplies,
            label: 'Overdue Replies',
            bg: 'bg-red-50',
          },
        ].map((kpi, i) => (
          <div key={i} className={`${kpi.bg} rounded-2xl p-4 border border-white text-center`}>
            <div className="flex justify-center mb-2">{kpi.icon}</div>
            <div className="text-3xl font-extrabold text-[#0F172A]">{kpi.value}</div>
            <div className="text-[10px] text-slate-500 mt-0.5 font-medium">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Urgent conversations */}
      {summary.topPriorityConversations.length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-3.5 border-b border-[#E2E8F0] flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F97316]" />
            <h2 className="font-bold text-sm text-[#0F172A]">Urgent / High Priority Conversations</h2>
            <span className="ml-auto text-xs font-bold text-[#F97316] bg-red-50 px-2 py-0.5 rounded-full">
              {summary.topPriorityConversations.length} cases
            </span>
          </div>
          <div className="divide-y divide-[#E2E8F0]">
            {summary.topPriorityConversations.map((conv) => (
              <div key={conv.id} className="flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC] transition">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-sm font-bold text-red-700">
                  {(conv.name || 'U')[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs text-[#0F172A]">{conv.name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                    {CHANNEL_ICONS[conv.channel]}
                    <span className="capitalize">{conv.channel}</span>
                    {conv.country && <><span>•</span><span>{conv.country}</span></>}
                    {conv.lastMessage && <><span>•</span><span className="truncate max-w-40">{conv.lastMessage}</span></>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full mb-1 ${
                    conv.priority === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {conv.priority.toUpperCase()}
                  </div>
                  <div className="text-[9px] text-slate-400">
                    {new Date(conv.lastAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Channel breakdown */}
      {Object.keys(summary.overnight.byChannel).length > 0 && (
        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#0B5ED7]" />
            <h2 className="font-bold text-sm text-[#0F172A]">Overnight Channel Breakdown</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(summary.overnight.byChannel)
              .sort(([, a], [, b]) => (b as number) - (a as number))
              .map(([channel, count]) => (
                <div key={channel} className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5">
                    {CHANNEL_ICONS[channel] || <Globe className="w-3.5 h-3.5 text-slate-400" />}
                    <span className="text-xs font-medium capitalize text-[#0F172A]">{channel}</span>
                  </div>
                  <span className="text-sm font-extrabold text-[#0B5ED7]">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Pending actions summary */}
      {totalActions > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-4 h-4 text-amber-600" />
            <h2 className="font-bold text-sm text-amber-900">
              {totalActions} Pending Action{totalActions !== 1 ? 's' : ''} Required
            </h2>
          </div>
          <div className="space-y-2">
            {summary.pendingActions.ocrReviewRequired > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-800">OCR documents awaiting human review</span>
                <span className="font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">{summary.pendingActions.ocrReviewRequired}</span>
              </div>
            )}
            {summary.pendingActions.approvalsPending > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-800">Approval requests pending</span>
                <span className="font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">{summary.pendingActions.approvalsPending}</span>
              </div>
            )}
            {summary.pendingActions.overdueReplies > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-800">Conversations with overdue replies (4h+)</span>
                <span className="font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">{summary.pendingActions.overdueReplies}</span>
              </div>
            )}
            {summary.pendingActions.contentApprovalsPending > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-amber-800">Social content pending approval</span>
                <span className="font-bold text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">{summary.pendingActions.contentApprovalsPending}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {totalActions === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-emerald-900">All clear!</p>
            <p className="text-xs text-emerald-700">No pending actions. You are fully up to date.</p>
          </div>
        </div>
      )}
    </div>
  );
}
