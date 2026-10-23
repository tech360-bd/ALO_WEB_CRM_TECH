'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Hash, Plus, Trash2, Search, Send, Target, MessageCircle, Facebook, Instagram,
  Linkedin, AlertTriangle, RefreshCw, Users, Globe, Zap,
} from 'lucide-react';

const API_PATH = '/api/marketing/keyword-triggers';

type KeywordTrigger = {
  id: string;
  keyword: string;
  keywordType: string;
  platform: string;
  autoReplyText: string;
  autoDmText?: string | null;
  autoCreateLead: boolean;
  autoAssignCounselor: boolean;
  sendPortalLink: boolean;
  status: string;
  triggerCount: number;
  createdAt: string;
  updatedAt: string;
};

const platformConfig: Record<string, { label: string; bg: string; icon: React.ElementType }> = {
  ALL: { label: 'All platforms', bg: 'bg-gray-600', icon: Globe },
  FACEBOOK: { label: 'Facebook', bg: 'bg-[var(--alo-brand)]', icon: Facebook },
  INSTAGRAM: { label: 'Instagram', bg: 'bg-gradient-to-r from-purple-600 to-pink-500', icon: Instagram },
  MESSENGER: { label: 'Messenger', bg: 'bg-purple-600', icon: MessageCircle },
  LINKEDIN: { label: 'LinkedIn', bg: 'bg-[var(--alo-brand-hover)]', icon: Linkedin },
  WHATSAPP: { label: 'WhatsApp', bg: 'bg-green-600', icon: MessageCircle },
  WEBSITE: { label: 'Website', bg: 'bg-teal-600', icon: Globe },
};

function platformMeta(value: string) {
  return platformConfig[value?.toUpperCase()] ?? { label: value || 'Unspecified', bg: 'bg-gray-500', icon: Hash };
}

/** Only real, persisted behaviour flags are surfaced — never inferred metrics. */
function actionsFor(trigger: KeywordTrigger): string[] {
  const actions: string[] = [];
  if (trigger.autoReplyText) actions.push('Auto reply');
  if (trigger.autoDmText) actions.push('Auto DM');
  if (trigger.autoCreateLead) actions.push('Create lead');
  if (trigger.autoAssignCounselor) actions.push('Assign counselor');
  if (trigger.sendPortalLink) actions.push('Portal link');
  return actions;
}

function formatTimestamp(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function KeywordTriggersView() {
  const { toast } = useToast();
  const [triggers, setTriggers] = useState<KeywordTrigger[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [form, setForm] = useState({
    keyword: '',
    keywordType: 'CONTAINS',
    platform: 'ALL',
    autoReplyText: '',
    autoDmText: '',
  });

  const loadTriggers = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await fetch(API_PATH, { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Keyword triggers could not be loaded.');
      setTriggers(Array.isArray(result?.triggers) ? result.triggers : []);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Keyword triggers could not be loaded.');
      setTriggers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTriggers(); }, [loadTriggers]);

  const filtered = triggers.filter((trigger) => {
    const matchSearch = !search || trigger.keyword.toLowerCase().includes(search.toLowerCase());
    const matchPlatform = platformFilter === 'all' || (trigger.platform || '').toUpperCase() === platformFilter;
    return matchSearch && matchPlatform;
  });

  const activeCount = triggers.filter((t) => t.status === 'ACTIVE').length;
  const totalFires = triggers.reduce((sum, t) => sum + (t.triggerCount || 0), 0);
  const leadCount = triggers.filter((t) => t.autoCreateLead).length;

  const handleCreate = async () => {
    if (!form.keyword.trim()) {
      toast({ title: 'Keyword required', description: 'Enter the phrase that should trigger a reply.', variant: 'destructive' });
      return;
    }
    if (!form.autoReplyText.trim()) {
      toast({ title: 'Reply text required', description: 'Write the auto reply that will be sent.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch(API_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: form.keyword.trim(),
          keywordType: form.keywordType,
          platform: form.platform,
          autoReplyText: form.autoReplyText.trim(),
          autoDmText: form.autoDmText.trim() || null,
          autoCreateLead: true,
          autoAssignCounselor: true,
          sendPortalLink: true,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Keyword trigger could not be saved.');
      toast({ title: 'Keyword trigger created', description: `"${form.keyword.trim()}" is now active.` });
      setForm({ keyword: '', keywordType: 'CONTAINS', platform: 'ALL', autoReplyText: '', autoDmText: '' });
      setShowAddForm(false);
      await loadTriggers();
    } catch (error) {
      toast({ title: 'Could not save keyword trigger', description: error instanceof Error ? error.message : 'Please retry.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (trigger: KeywordTrigger) => {
    const nextStatus = trigger.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    setBusyId(trigger.id);
    try {
      const response = await fetch(API_PATH, {
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

  const handleDelete = async (trigger: KeywordTrigger) => {
    setBusyId(trigger.id);
    try {
      const response = await fetch(`${API_PATH}?id=${encodeURIComponent(trigger.id)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error((await response.json().catch(() => null))?.error || 'Trigger could not be deleted.');
      setTriggers((prev) => prev.filter((t) => t.id !== trigger.id));
      toast({ title: 'Keyword trigger deleted', description: `"${trigger.keyword}" was removed.` });
    } catch (error) {
      toast({ title: 'Delete failed', description: error instanceof Error ? error.message : 'Please retry.', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const response = await fetch(`${API_PATH}/seed`, { method: 'POST' });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.error || 'Default triggers could not be loaded.');
      toast({ title: 'Default keyword set loaded', description: `${result?.created ?? 0} created, ${result?.skipped ?? 0} already present.` });
      await loadTriggers();
    } catch (error) {
      toast({ title: 'Seeding failed', description: error instanceof Error ? error.message : 'Please retry.', variant: 'destructive' });
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--alo-text)]">Keyword Triggers</h1>
          <p className="text-sm text-[var(--alo-text-muted)]">Auto-reply to social media comments containing specific keywords</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => void loadTriggers()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <Button size="sm" className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-1" />Add Keyword
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-white border border-[var(--alo-border)]">
          <CardContent className="p-4">
            <div className="p-2 bg-[var(--alo-cta-soft)] rounded-lg w-fit"><Hash className="w-4 h-4 text-[var(--alo-cta-active)]" /></div>
            <p className="text-2xl font-bold text-[var(--alo-text)] mt-2">{activeCount}<span className="text-sm text-[var(--alo-text-muted)] font-normal">/{triggers.length}</span></p>
            <p className="text-xs text-[var(--alo-text-muted)]">Active keywords</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-[var(--alo-border)]">
          <CardContent className="p-4">
            <div className="p-2 bg-[var(--alo-brand-pale)] rounded-lg w-fit"><Zap className="w-4 h-4 text-[var(--alo-brand)]" /></div>
            <p className="text-2xl font-bold text-[var(--alo-text)] mt-2">{totalFires.toLocaleString()}</p>
            <p className="text-xs text-[var(--alo-text-muted)]">Total fires</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-[var(--alo-border)]">
          <CardContent className="p-4">
            <div className="p-2 bg-green-100 rounded-lg w-fit"><Target className="w-4 h-4 text-green-600" /></div>
            <p className="text-2xl font-bold text-[var(--alo-text)] mt-2">{leadCount.toLocaleString()}</p>
            <p className="text-xs text-[var(--alo-text-muted)]">Rules creating leads</p>
          </CardContent>
        </Card>
        <Card className="bg-white border border-[var(--alo-border)]">
          <CardContent className="p-4">
            <div className="p-2 bg-purple-100 rounded-lg w-fit"><Send className="w-4 h-4 text-purple-600" /></div>
            <p className="text-2xl font-bold text-[var(--alo-text)] mt-2">{triggers.filter((t) => t.autoDmText).length}</p>
            <p className="text-xs text-[var(--alo-text-muted)]">Rules sending a DM</p>
          </CardContent>
        </Card>
      </div>

      {showAddForm && (
        <Card className="bg-[var(--alo-cta-soft)] border border-[var(--alo-cta)]/25">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-[var(--alo-text)]">Add New Keyword Trigger</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input value={form.keyword} onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))} placeholder="Keyword (e.g. Study Abroad)" className="h-9 text-sm" />
              <Select value={form.platform} onValueChange={(v) => setForm((f) => ({ ...f, platform: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Platform" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(platformConfig).map(([key, value]) => (
                    <SelectItem key={key} value={key}>{value.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.keywordType} onValueChange={(v) => setForm((f) => ({ ...f, keywordType: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Match type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CONTAINS">Contains</SelectItem>
                  <SelectItem value="EXACT">Exact match</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)]" onClick={() => void handleCreate()} disabled={saving}>
                  {saving ? 'Saving…' : 'Add'}
                </Button>
                <Button size="sm" variant="ghost" className="" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </div>
            <Textarea value={form.autoReplyText} onChange={(e) => setForm((f) => ({ ...f, autoReplyText: e.target.value }))} placeholder="Auto reply text (required)" rows={2} className="text-sm" />
            <Textarea value={form.autoDmText} onChange={(e) => setForm((f) => ({ ...f, autoDmText: e.target.value }))} placeholder="Optional auto DM text" rows={2} className="text-sm" />
            <p className="text-[11px] text-[var(--alo-text-muted)]">
              Do not include unverified claims such as success rates or student counts in reply text. Every message is sent to a real prospect.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--alo-text-muted)]" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search keywords..." className="pl-9 h-9 text-sm" />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[160px] h-9 text-sm"><SelectValue placeholder="All Platforms" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {Object.entries(platformConfig).map(([key, value]) => (
              <SelectItem key={key} value={key}>{value.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="bg-white border border-[var(--alo-border)]">
        <CardContent className="p-4">
          {loadError && (
            <div role="alert" className="mb-4 flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-3">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-destructive" />
              <div className="text-sm">
                <p className="font-semibold">Keyword triggers are unavailable</p>
                <p className="text-muted-foreground">{loadError}</p>
                <Button size="sm" variant="outline" className="mt-2 " onClick={() => void loadTriggers()}>Try again</Button>
              </div>
            </div>
          )}

          {loading && !loadError && (
            <div className="space-y-2 py-2" aria-busy="true" aria-live="polite">
              {[0, 1, 2].map((row) => (
                <div key={row} className="h-12 animate-pulse rounded-md bg-[var(--alo-surface-muted)]" />
              ))}
              <p className="text-xs text-[var(--alo-text-muted)]">Loading keyword triggers…</p>
            </div>
          )}

          {!loading && !loadError && triggers.length === 0 && (
            <div className="text-center py-10">
              <Hash className="w-8 h-8 mx-auto mb-2 text-[var(--alo-placeholder)]" />
              <p className="text-sm font-semibold text-[var(--alo-text)]">No keyword triggers configured</p>
              <p className="text-xs text-[var(--alo-text-muted)] mt-1 max-w-md mx-auto">
                Create a rule to auto-reply to comments, or load the default set to start from a working baseline.
              </p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => void handleSeed()} disabled={seeding}>
                {seeding ? 'Loading…' : 'Load default keyword set'}
              </Button>
            </div>
          )}

          {!loading && !loadError && triggers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--alo-border)] text-left">
                    <th className="pb-3 text-[11px] font-semibold text-[var(--alo-text-muted)]">Keyword</th>
                    <th className="pb-3 text-[11px] font-semibold text-[var(--alo-text-muted)]">Platform</th>
                    <th className="pb-3 text-[11px] font-semibold text-[var(--alo-text-muted)]">Actions</th>
                    <th className="pb-3 text-[11px] font-semibold text-[var(--alo-text-muted)]">Auto Reply</th>
                    <th className="pb-3 text-[11px] font-semibold text-[var(--alo-text-muted)] text-center">Fires</th>
                    <th className="pb-3 text-[11px] font-semibold text-[var(--alo-text-muted)] text-center">Updated</th>
                    <th className="pb-3 text-[11px] font-semibold text-[var(--alo-text-muted)] text-center">Active</th>
                    <th className="pb-3 text-[11px] font-semibold text-[var(--alo-text-muted)] text-right">Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((trigger) => {
                    const meta = platformMeta(trigger.platform);
                    const PlatformIcon = meta.icon;
                    const isActive = trigger.status === 'ACTIVE';
                    return (
                      <tr key={trigger.id} className="border-b border-gray-50 hover:bg-[var(--alo-page)]/50 transition-colors">
                        <td className="py-3">
                          <span className="text-sm font-bold text-[var(--alo-cta-active)]">{trigger.keyword}</span>
                          <Badge variant="outline" className="ml-2 text-[11px] font-normal">{trigger.keywordType}</Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-5 h-5 rounded ${meta.bg} flex items-center justify-center`}>
                              <PlatformIcon className="w-3 h-3 text-white" />
                            </span>
                            <span className="text-xs text-[var(--alo-body)]">{meta.label}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-1 max-w-[190px]">
                            {actionsFor(trigger).length === 0 ? (
                              <span className="text-xs text-[var(--alo-text-muted)]">No automation enabled</span>
                            ) : actionsFor(trigger).map((action) => (
                              <Badge key={action} variant="outline" className="text-[11px] font-normal">{action}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="py-3">
                          <p className="text-xs text-[var(--alo-body)] line-clamp-2 max-w-[260px]">{trigger.autoReplyText || '—'}</p>
                          {trigger.autoDmText && (
                            <p className="text-[11px] text-[var(--alo-text-muted)] mt-0.5 line-clamp-1 max-w-[260px]">DM: {trigger.autoDmText}</p>
                          )}
                        </td>
                        <td className="py-3 text-center text-xs font-bold text-green-600">{trigger.triggerCount}</td>
                        <td className="py-3 text-center text-[11px] text-[var(--alo-text-muted)]">{formatTimestamp(trigger.updatedAt)}</td>
                        <td className="py-3 text-center">
                          <span className="flex items-center justify-center gap-2">
                            <Switch
                              checked={isActive}
                              disabled={busyId === trigger.id}
                              onCheckedChange={() => void handleToggle(trigger)}
                              aria-label={`${isActive ? 'Pause' : 'Activate'} keyword ${trigger.keyword}`}
                            />
                            <span className="text-[11px] text-[var(--alo-text-muted)]">{isActive ? 'On' : 'Paused'}</span>
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                            disabled={busyId === trigger.id}
                            onClick={() => void handleDelete(trigger)}
                            aria-label={`Delete keyword ${trigger.keyword}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-8 text-[var(--alo-text-muted)]">
                  <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No keywords match your filters</p>
                  <Button size="sm" variant="ghost" className="mt-2 h-7 " onClick={() => { setSearch(''); setPlatformFilter('all'); }}>
                    Clear filters
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-[var(--alo-text-muted)] flex items-center gap-1.5">
        <Users className="w-3 h-3" />
        Figures shown are counts stored against each rule. No conversion or success-rate metrics are estimated.
      </p>
    </div>
  );
}
