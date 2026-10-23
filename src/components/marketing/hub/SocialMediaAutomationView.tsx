'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Facebook, Instagram, Linkedin, MessageCircle, Send, Zap, Target, Search,
  Plus, Trash2, CheckCircle, XCircle, AlertTriangle, Sparkles, Youtube,
  MessageSquare, Globe, Hash, RefreshCw, ShieldAlert,
} from 'lucide-react';

// ============================================================
// Platform Config
// ============================================================

type PlatformKey = 'facebook' | 'instagram' | 'messenger' | 'linkedin' | 'tiktok' | 'youtube' | 'whatsapp_status' | 'website';

const platformConfig: Record<PlatformKey, { label: string; bg: string; icon: React.ElementType }> = {
  facebook: { label: 'Facebook', bg: 'bg-[var(--alo-brand)]', icon: Facebook },
  instagram: { label: 'Instagram', bg: 'bg-gradient-to-r from-purple-600 to-pink-500', icon: Instagram },
  messenger: { label: 'Messenger', bg: 'bg-purple-600', icon: MessageSquare },
  linkedin: { label: 'LinkedIn', bg: 'bg-[var(--alo-brand-hover)]', icon: Linkedin },
  tiktok: { label: 'TikTok', bg: 'bg-gray-900', icon: Youtube },
  youtube: { label: 'YouTube', bg: 'bg-red-600', icon: Youtube },
  whatsapp_status: { label: 'WhatsApp', bg: 'bg-green-600', icon: MessageCircle },
  website: { label: 'Website', bg: 'bg-teal-600', icon: Globe },
};

function platformMeta(value: string) {
  const key = (value || '').toLowerCase();
  if (key === 'whatsapp') return platformConfig.whatsapp_status;
  const match = platformConfig[key as PlatformKey];
  return match ?? { label: value || 'Unspecified', bg: 'bg-gray-500', icon: Globe };
}

// ============================================================
// Data shapes (mirror the real API responses)
// ============================================================

type Conversation = {
  conversationId: string;
  platform: string;
  senderName: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: number;
  aiHandled: boolean;
};

type InboxResponse = {
  conversations?: Conversation[];
  totalMessages?: number;
  unreadCount?: number;
  aiHandledCount?: number;
};

type MarketingComment = {
  id: string;
  platform: string;
  postId: string;
  authorName: string;
  text: string;
  intent: string;
  isLead: boolean;
  convertedToLead: string;
  leadId?: string | null;
  status: string;
  replyText: string;
  repliedAt?: string | null;
  createdAt: string;
};

type KeywordTrigger = {
  id: string;
  keyword: string;
  keywordType: string;
  platform: string;
  autoReplyText: string;
  autoDmText?: string | null;
  autoCreateLead: boolean;
  status: string;
  triggerCount: number;
  updatedAt: string;
};

type SocialAccount = {
  id: string;
  platform: string;
  accountName?: string | null;
  accountId?: string | null;
  organization?: string | null;
  connectionStatus: string;
  requiresConfig: boolean;
};

type ConsentSummary = { count?: number; optedOut?: number };

function formatTime(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function actionsFor(trigger: KeywordTrigger): string[] {
  const actions: string[] = [];
  if (trigger.autoReplyText) actions.push('Auto reply');
  if (trigger.autoDmText) actions.push('Auto DM');
  if (trigger.autoCreateLead) actions.push('Create lead');
  return actions;
}

// ============================================================
// Component
// ============================================================

export default function SocialMediaAutomationView() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('inbox');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [inboxStats, setInboxStats] = useState<{ total: number; unread: number; aiHandled: number }>({ total: 0, unread: 0, aiHandled: 0 });
  const [inboxLoading, setInboxLoading] = useState(true);
  const [inboxError, setInboxError] = useState('');

  const [comments, setComments] = useState<MarketingComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentsError, setCommentsError] = useState('');
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const [triggers, setTriggers] = useState<KeywordTrigger[]>([]);
  const [triggersLoading, setTriggersLoading] = useState(true);
  const [triggersError, setTriggersError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [accountsError, setAccountsError] = useState('');

  const [consent, setConsent] = useState<ConsentSummary | null>(null);

  const loadInbox = useCallback(async () => {
    setInboxLoading(true);
    setInboxError('');
    try {
      const response = await fetch('/api/marketing/social-inbox', { cache: 'no-store' });
      const result: InboxResponse = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error('Social inbox is unavailable.');
      setConversations(Array.isArray(result.conversations) ? result.conversations : []);
      setInboxStats({
        total: result.totalMessages ?? 0,
        unread: result.unreadCount ?? 0,
        aiHandled: result.aiHandledCount ?? 0,
      });
    } catch (error) {
      setInboxError(error instanceof Error ? error.message : 'Social inbox is unavailable.');
      setConversations([]);
    } finally {
      setInboxLoading(false);
    }
  }, []);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    setCommentsError('');
    try {
      const response = await fetch('/api/crm/social?tab=comments&limit=50', { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) throw new Error(result?.error || 'Comments could not be loaded.');
      setComments(Array.isArray(result.data) ? result.data : []);
    } catch (error) {
      setCommentsError(error instanceof Error ? error.message : 'Comments could not be loaded.');
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  }, []);

  const loadTriggers = useCallback(async () => {
    setTriggersLoading(true);
    setTriggersError('');
    try {
      const response = await fetch('/api/marketing/keyword-triggers', { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Keyword triggers could not be loaded.');
      setTriggers(Array.isArray(result?.triggers) ? result.triggers : []);
    } catch (error) {
      setTriggersError(error instanceof Error ? error.message : 'Keyword triggers could not be loaded.');
      setTriggers([]);
    } finally {
      setTriggersLoading(false);
    }
  }, []);

  const loadAccounts = useCallback(async () => {
    setAccountsError('');
    try {
      const response = await fetch('/api/communications/social-accounts', { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Connected accounts could not be loaded.');
      setAccounts(Array.isArray(result?.socialAccounts) ? result.socialAccounts : []);
    } catch (error) {
      setAccountsError(error instanceof Error ? error.message : 'Connected accounts could not be loaded.');
      setAccounts([]);
    }
  }, []);

  const loadConsent = useCallback(async () => {
    try {
      const response = await fetch('/api/marketing/consent', { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.success) setConsent({ count: result.count ?? 0, optedOut: result.optedOut ?? 0 });
      else setConsent(null);
    } catch {
      setConsent(null);
    }
  }, []);

  useEffect(() => {
    void loadInbox();
    void loadComments();
    void loadTriggers();
    void loadAccounts();
    void loadConsent();
  }, [loadInbox, loadComments, loadTriggers, loadAccounts, loadConsent]);

  const filteredConversations = conversations.filter((c) => {
    if (platformFilter !== 'all' && (c.platform || '').toLowerCase() !== platformFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (c.senderName || '').toLowerCase().includes(q) || (c.lastMessage || '').toLowerCase().includes(q);
    }
    return true;
  });

  const filteredComments = comments.filter((c) => {
    if (platformFilter !== 'all' && (c.platform || '').toLowerCase() !== platformFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (c.authorName || '').toLowerCase().includes(q) || (c.text || '').toLowerCase().includes(q);
    }
    return true;
  });

  const convertedCount = comments.filter((c) => Boolean(c.convertedToLead)).length;

  const handleConvert = async (comment: MarketingComment) => {
    setConvertingId(comment.id);
    try {
      const response = await fetch('/api/marketing/comments/convert-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId: comment.id }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Comment could not be converted.');
      toast({ title: 'Lead created', description: `"${comment.authorName}" was converted to a lead.` });
      await loadComments();
    } catch (error) {
      toast({ title: 'Conversion failed', description: error instanceof Error ? error.message : 'Please retry.', variant: 'destructive' });
    } finally {
      setConvertingId(null);
    }
  };

  const handleToggleTrigger = async (trigger: KeywordTrigger) => {
    const nextStatus = trigger.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setBusyId(trigger.id);
    try {
      const response = await fetch('/api/marketing/keyword-triggers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trigger.id, status: nextStatus }),
      });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Status could not be updated.');
      setTriggers((prev) => prev.map((t) => (t.id === trigger.id ? { ...t, status: nextStatus } : t)));
    } catch (error) {
      toast({ title: 'Status update failed', description: error instanceof Error ? error.message : 'Please retry.', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteTrigger = async (trigger: KeywordTrigger) => {
    setBusyId(trigger.id);
    try {
      const response = await fetch(`/api/marketing/keyword-triggers?id=${encodeURIComponent(trigger.id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Trigger could not be deleted.');
      setTriggers((prev) => prev.filter((t) => t.id !== trigger.id));
      toast({ title: 'Keyword trigger deleted', description: `"${trigger.keyword}" was removed.` });
    } catch (error) {
      toast({ title: 'Delete failed', description: error instanceof Error ? error.message : 'Please retry.', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--alo-text)]">Social Media Automation</h1>
          <p className="text-sm text-[var(--alo-text-muted)]">Comment-to-Lead, Keyword Triggers &amp; Auto DM</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => { void loadInbox(); void loadComments(); void loadTriggers(); void loadAccounts(); }}
        >
          <RefreshCw className="w-4 h-4 mr-1" />Refresh all
        </Button>
      </div>

      {/* Connected Accounts */}
      <Card className="bg-white border border-[var(--alo-border)]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold text-[var(--alo-text)]">Connected Accounts</p>
            <span className="text-[11px] text-[var(--alo-text-muted)]">{accounts.length} account record(s)</span>
          </div>
          {accountsError ? (
            <p className="text-xs text-destructive" role="alert">{accountsError}</p>
          ) : accounts.length === 0 ? (
            <p className="text-xs text-[var(--alo-text-muted)]">
              No social accounts are registered. Connect a provider before automation can run.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {accounts.map((acc) => {
                const config = platformMeta(acc.platform);
                const Icon = config.icon;
                return (
                  <div key={acc.id} className="p-2.5 rounded-lg border border-[var(--alo-border)]">
                    <div className="flex items-center gap-2">
                      <span className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-[var(--alo-text)] truncate">{config.label}</p>
                        <p className="text-[11px] text-[var(--alo-text-muted)] truncate">{acc.accountName || acc.accountId || 'Unnamed account'}</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-[var(--alo-text-muted)] mt-1.5 truncate">
                      Status: {acc.connectionStatus || 'NOT VERIFIED'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
          {accounts.length > 0 && (
            <p className="text-[11px] text-[var(--alo-text-muted)] mt-3 flex items-center gap-1.5">
              <ShieldAlert className="w-3 h-3" />
              Account rows are registration records only. Provider connection is not verified until OAuth, webhook and live tests are stored.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--alo-text-muted)]" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search…" className="pl-9 h-8 text-xs" />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {Object.entries(platformConfig).map(([key, value]) => (
              <SelectItem key={key} value={key}>{value.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-[var(--alo-border)]">
          <TabsTrigger value="inbox"><MessageCircle className="w-4 h-4 mr-1" />Social Inbox</TabsTrigger>
          <TabsTrigger value="comments"><Zap className="w-4 h-4 mr-1" />Comment Automation</TabsTrigger>
          <TabsTrigger value="keywords"><Hash className="w-4 h-4 mr-1" />Keyword Triggers</TabsTrigger>
          <TabsTrigger value="dm"><Send className="w-4 h-4 mr-1" />Auto DM Manager</TabsTrigger>
        </TabsList>

        {/* ── Social Inbox ─────────────────────────────────────── */}
        <TabsContent value="inbox">
          <Card className="bg-white border border-[var(--alo-border)] mt-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[var(--alo-text)]">Conversations</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="secondary" className="text-[11px]">{inboxStats.total} messages</Badge>
                  <Badge variant="secondary" className="text-[11px]">{inboxStats.unread} unread</Badge>
                  <Badge variant="secondary" className="text-[11px]">{inboxStats.aiHandled} AI-handled</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {inboxError ? (
                <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p className="font-semibold">Social inbox is unavailable</p>
                  <p className="text-muted-foreground">{inboxError}</p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 " onClick={() => void loadInbox()}>Try again</Button>
                </div>
              ) : inboxLoading ? (
                <div className="space-y-2" aria-busy="true" aria-live="polite">
                  {[0, 1, 2, 3].map((row) => <div key={row} className="h-14 animate-pulse rounded-lg bg-[var(--alo-surface-muted)]" />)}
                </div>
              ) : filteredConversations.length === 0 ? (
                <p className="text-sm text-[var(--alo-text-muted)] py-8 text-center">
                  {conversations.length === 0
                    ? 'No inbound social messages have been received yet.'
                    : 'No conversations match your filters.'}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[28rem] overflow-y-auto">
                  {filteredConversations.map((conversation) => {
                    const config = platformMeta(conversation.platform);
                    const Icon = config.icon;
                    const initials = (conversation.senderName || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
                    return (
                      <div key={conversation.conversationId} className="p-3 rounded-lg bg-[var(--alo-page)] hover:bg-[var(--alo-surface-muted)] transition-colors">
                        <div className="flex items-start gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-bold text-[var(--alo-body)] shrink-0">
                            {initials}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[var(--alo-text)] flex items-center gap-1.5">
                                {conversation.senderName || 'Unknown sender'}
                                {conversation.unread > 0 && <span className="w-2 h-2 rounded-full bg-[var(--alo-cta)]" aria-label="unread" />}
                              </span>
                              <span className="flex items-center gap-1 shrink-0">
                                <Icon className="w-3 h-3 text-[var(--alo-text-muted)]" />
                                <span className="text-[11px] text-[var(--alo-text-muted)]">{formatTime(conversation.lastMessageAt)}</span>
                              </span>
                            </div>
                            <p className="text-xs text-[var(--alo-body)] mt-0.5 line-clamp-2">{conversation.lastMessage || '—'}</p>
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <span className="text-[11px] text-[var(--alo-text-muted)]">{config.label}</span>
                              {conversation.aiHandled && (
                                <Badge className="text-[11px] bg-purple-100 text-purple-700">
                                  <Sparkles className="w-2.5 h-2.5 mr-0.5" />AI handled
                                </Badge>
                              )}
                              {conversation.unread > 0 && (
                                <Badge variant="muted" className="text-[11px]">{conversation.unread} unread</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Comment Automation ───────────────────────────────── */}
        <TabsContent value="comments">
          <Card className="bg-white border border-[var(--alo-border)] mt-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-[var(--alo-text)]">Recent Comments</CardTitle>
                <div className="flex gap-2">
                  <Badge variant="muted" className="text-[11px]">{filteredComments.length} comments</Badge>
                  <Badge variant="success" className="text-[11px]">{convertedCount} converted</Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {commentsError ? (
                <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p className="font-semibold">Comments are unavailable</p>
                  <p className="text-muted-foreground">{commentsError}</p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 " onClick={() => void loadComments()}>Try again</Button>
                </div>
              ) : commentsLoading ? (
                <div className="space-y-2" aria-busy="true" aria-live="polite">
                  {[0, 1, 2].map((row) => <div key={row} className="h-10 animate-pulse rounded bg-[var(--alo-surface-muted)]" />)}
                </div>
              ) : filteredComments.length === 0 ? (
                <p className="text-sm text-[var(--alo-text-muted)] py-8 text-center">
                  {comments.length === 0
                    ? 'No comments have been captured yet. Comments arrive from connected platform webhooks.'
                    : 'No comments match your filters.'}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--alo-border)] text-left">
                        <th className="pb-2 text-[11px] font-medium text-[var(--alo-text-muted)]">Platform</th>
                        <th className="pb-2 text-[11px] font-medium text-[var(--alo-text-muted)]">Author</th>
                        <th className="pb-2 text-[11px] font-medium text-[var(--alo-text-muted)]">Comment</th>
                        <th className="pb-2 text-[11px] font-medium text-[var(--alo-text-muted)]">Intent</th>
                        <th className="pb-2 text-[11px] font-medium text-[var(--alo-text-muted)]">Auto-Reply</th>
                        <th className="pb-2 text-[11px] font-medium text-[var(--alo-text-muted)] text-right">Lead</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredComments.map((comment) => {
                        const config = platformMeta(comment.platform);
                        const Icon = config.icon;
                        const isConverted = Boolean(comment.convertedToLead);
                        return (
                          <tr key={comment.id} className="border-b border-gray-50 hover:bg-[var(--alo-page)]">
                            <td className="py-2.5">
                              <span className="flex items-center gap-1.5">
                                <span className={`w-5 h-5 rounded ${config.bg} flex items-center justify-center`}>
                                  <Icon className="w-3 h-3 text-white" />
                                </span>
                                <span className="text-[11px] text-[var(--alo-text-muted)]">{config.label}</span>
                              </span>
                            </td>
                            <td className="py-2.5 text-xs font-medium text-[var(--alo-text)]">{comment.authorName || 'Unknown'}</td>
                            <td className="py-2.5 text-xs text-[var(--alo-body)] max-w-[220px] truncate">{comment.text || '—'}</td>
                            <td className="py-2.5">
                              {comment.intent
                                ? <Badge variant="outline" className="text-[11px]">{comment.intent}</Badge>
                                : <span className="text-[11px] text-[var(--alo-text-muted)]">—</span>}
                            </td>
                            <td className="py-2.5">
                              {comment.repliedAt ? (
                                <Badge className="text-[11px] bg-green-100 text-green-700">
                                  <CheckCircle className="w-2.5 h-2.5 mr-0.5" />Sent
                                </Badge>
                              ) : (
                                <Badge variant="muted" className="text-[11px]">
                                  <XCircle className="w-2.5 h-2.5 mr-0.5" />Not sent
                                </Badge>
                              )}
                            </td>
                            <td className="py-2.5 text-right">
                              {isConverted ? (
                                <Badge className="text-[11px] bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]">
                                  <Target className="w-2.5 h-2.5 mr-0.5" />{comment.leadId || 'Converted'}
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[11px] px-2"
                                  disabled={convertingId === comment.id}
                                  onClick={() => void handleConvert(comment)}
                                >
                                  <Target className="w-3 h-3 mr-0.5" />
                                  {convertingId === comment.id ? 'Converting…' : 'Convert'}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Keyword Triggers ─────────────────────────────────── */}
        <TabsContent value="keywords">
          <Card className="bg-white border border-[var(--alo-border)] mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-[var(--alo-text)] flex items-center gap-2">
                <Hash className="w-4 h-4 text-[var(--alo-cta)]" /> Keyword Triggers
              </CardTitle>
            </CardHeader>
            <CardContent>
              {triggersError ? (
                <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <p className="font-semibold">Keyword triggers are unavailable</p>
                  <p className="text-muted-foreground">{triggersError}</p>
                  <Button size="sm" variant="outline" className="mt-2 h-7 " onClick={() => void loadTriggers()}>Try again</Button>
                </div>
              ) : triggersLoading ? (
                <div className="space-y-2" aria-busy="true" aria-live="polite">
                  {[0, 1, 2].map((row) => <div key={row} className="h-10 animate-pulse rounded bg-[var(--alo-surface-muted)]" />)}
                </div>
              ) : triggers.length === 0 ? (
                <p className="text-sm text-[var(--alo-text-muted)] py-8 text-center">
                  No keyword triggers are configured. Create rules in the Keyword Triggers page to start automating replies.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--alo-border)] text-left">
                        <th className="pb-2 text-[11px] font-medium text-[var(--alo-text-muted)]">Keyword</th>
                        <th className="pb-2 text-[11px] font-medium text-[var(--alo-text-muted)]">Platform</th>
                        <th className="pb-2 text-[11px] font-medium text-[var(--alo-text-muted)]">Actions</th>
                        <th className="pb-2 text-[11px] font-medium text-[var(--alo-text-muted)] text-center">Fires</th>
                        <th className="pb-2 text-[11px] font-medium text-[var(--alo-text-muted)] text-center">Updated</th>
                        <th className="pb-2 text-[11px] font-medium text-[var(--alo-text-muted)] text-right">Manage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {triggers.map((trigger) => {
                        const config = platformMeta(trigger.platform);
                        const Icon = config.icon;
                        const isActive = trigger.status === 'ACTIVE';
                        return (
                          <tr key={trigger.id} className="border-b border-gray-50 hover:bg-[var(--alo-page)]">
                            <td className="py-2.5">
                              <span className="text-xs font-bold text-[var(--alo-cta-active)]">{trigger.keyword}</span>
                              <Badge variant="outline" className="ml-1.5 text-[11px] font-normal">{trigger.keywordType}</Badge>
                            </td>
                            <td className="py-2.5">
                              <span className="flex items-center gap-1.5">
                                <span className={`w-5 h-5 rounded ${config.bg} flex items-center justify-center`}>
                                  <Icon className="w-3 h-3 text-white" />
                                </span>
                                <span className="text-[11px] text-[var(--alo-text-muted)]">{config.label}</span>
                              </span>
                            </td>
                            <td className="py-2.5">
                              <span className="flex flex-wrap gap-1 max-w-[180px]">
                                {actionsFor(trigger).length === 0
                                  ? <span className="text-[11px] text-[var(--alo-text-muted)]">None enabled</span>
                                  : actionsFor(trigger).map((action) => (
                                    <Badge key={action} variant="outline" className="text-[11px] font-normal">{action}</Badge>
                                  ))}
                              </span>
                            </td>
                            <td className="py-2.5 text-center text-xs font-semibold text-[var(--alo-text)]">{trigger.triggerCount}</td>
                            <td className="py-2.5 text-center text-[11px] text-[var(--alo-text-muted)]">{formatTime(trigger.updatedAt)}</td>
                            <td className="py-2.5 text-right">
                              <span className="flex justify-end gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-6 text-[11px] px-2"
                                  disabled={busyId === trigger.id}
                                  onClick={() => void handleToggleTrigger(trigger)}
                                >
                                  {isActive ? 'Pause' : 'Activate'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                  disabled={busyId === trigger.id}
                                  onClick={() => void handleDeleteTrigger(trigger)}
                                  aria-label={`Delete keyword ${trigger.keyword}`}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Auto DM Manager ──────────────────────────────────── */}
        <TabsContent value="dm">
          <div className="mt-4 space-y-4">
            <Card className="bg-white border border-[var(--alo-border)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[var(--alo-text)] flex items-center gap-2">
                  <Send className="w-4 h-4 text-[var(--alo-cta)]" /> Auto DM Sequences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3 rounded-md border border-dashed border-[var(--alo-border)] bg-[var(--alo-page)]/60 p-4">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[var(--alo-text-muted)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--alo-text)]">No DM sequence engine is connected</p>
                    <p className="text-xs text-[var(--alo-text-muted)] mt-1 max-w-xl">
                      DM sequences are not stored in this workspace, so nothing is shown here rather than a sample sequence.
                      Per-keyword auto DM text is configured on each keyword trigger and is sent by the platform integration
                      once a provider is connected and verified.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-[var(--alo-border)]">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-[var(--alo-text)]">Opt-out &amp; Block Management</CardTitle>
              </CardHeader>
              <CardContent>
                {consent ? (
                  <div className="flex items-center gap-4">
                    <div className="px-3 py-2 rounded bg-green-50 border border-green-100">
                      <p className="text-xs font-bold text-green-600">{(consent.count ?? 0).toLocaleString()}</p>
                      <p className="text-[11px] text-green-500">Active consented contacts</p>
                    </div>
                    <div className="px-3 py-2 rounded bg-yellow-50 border border-yellow-100">
                      <p className="text-xs font-bold text-yellow-600">{(consent.optedOut ?? 0).toLocaleString()}</p>
                      <p className="text-[11px] text-yellow-500">Opted out</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[var(--alo-text-muted)]">Consent figures are temporarily unavailable.</p>
                )}
                <p className="text-[11px] text-[var(--alo-text-muted)] mt-3">
                  Counts come from stored consent records. Per-platform block lists are held by the provider and are not mirrored here.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
