'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Share2, Search, Plus, Calendar, Send, BarChart3, FileText,
  Facebook, Instagram, Linkedin, Music, Globe, AlertTriangle, RefreshCw,
  CheckCircle, Clock, XCircle,
} from 'lucide-react';

type PlatformKey = 'facebook' | 'instagram' | 'linkedin' | 'tiktok';

/**
 * Mirrors a row from /api/social/posts. The API reads MarketingCalendar (or
 * MarketingGeneratedContent), so these are the fields that actually exist.
 * There is no follower, reach, like, comment or share metric stored, so the
 * page does not display any.
 */
interface SocialPost {
  id: string;
  platform: string;
  title: string;
  description?: string;
  content?: string;
  status: string;
  scheduledAt?: string | null;
  publishedAt?: string | null;
  failedAt?: string | null;
  failReason?: string;
  createdAt?: string;
}

const PLATFORM_META: Record<string, { label: string; bg: string; icon: React.ElementType }> = {
  facebook: { label: 'Facebook', bg: 'bg-[var(--alo-brand)]', icon: Facebook },
  instagram: { label: 'Instagram', bg: 'bg-gradient-to-r from-purple-600 to-pink-500', icon: Instagram },
  linkedin: { label: 'LinkedIn', bg: 'bg-[var(--alo-brand-hover)]', icon: Linkedin },
  tiktok: { label: 'TikTok', bg: 'bg-[var(--alo-page)]', icon: Music },
};

function platformMeta(value: string) {
  const key = (value || '').toLowerCase();
  return PLATFORM_META[key] ?? { label: value || 'Unspecified', bg: 'bg-[var(--alo-page)]', icon: Globe };
}

const STATUS_META: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  published: { label: 'Published', className: 'bg-crm-success-bg text-crm-success-text', icon: CheckCircle },
  scheduled: { label: 'Scheduled', className: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]', icon: Clock },
  draft: { label: 'Draft', className: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]', icon: FileText },
  failed: { label: 'Failed', className: 'bg-crm-danger-bg text-crm-danger-text', icon: XCircle },
};

function statusMeta(value: string) {
  const key = (value || '').toLowerCase();
  return STATUS_META[key] ?? { label: value || 'Unknown', className: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]', icon: FileText };
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function bodyText(post: SocialPost) {
  return post.content || post.description || post.title || '';
}

export default function CrmSocialPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [activePlatform, setActivePlatform] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostPlatform, setNewPostPlatform] = useState<PlatformKey>('facebook');
  const [newPostStatus, setNewPostStatus] = useState<string>('draft');
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');

  const loadPosts = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (activePlatform !== 'all') params.set('platform', activePlatform);
      const response = await fetch(`/api/social/posts?${params.toString()}`, { cache: 'no-store' });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Social posts could not be loaded.');
      }
      const rows: SocialPost[] = Array.isArray(result.data) ? result.data : [];
      setPosts(rows);
      setTotal(result.pagination?.total ?? rows.length);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Social posts could not be loaded.');
      setPosts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activePlatform]);

  useEffect(() => { void loadPosts(); }, [loadPosts]);

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return bodyText(post).toLowerCase().includes(q);
  });

  const countByStatus = (status: string) =>
    posts.filter((p) => (p.status || '').toLowerCase() === status).length;

  const publishedCount = countByStatus('published');
  const scheduledCount = countByStatus('scheduled');
  const failedCount = countByStatus('failed');

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) {
      toast({ title: 'Post content required', description: 'Write the post text before saving.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: newPostPlatform,
          content: newPostContent.trim(),
          contentType: 'post',
          status: newPostStatus,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'The post could not be saved.');
      }
      toast({ title: 'Post saved', description: `Saved as ${statusMeta(newPostStatus).label.toLowerCase()}.` });
      setNewPostContent('');
      setShowCreatePost(false);
      await loadPosts();
    } catch (error) {
      toast({ title: 'Save failed', description: error instanceof Error ? error.message : 'Please retry.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (post: SocialPost) => {
    setBusyId(post.id);
    try {
      const response = await fetch('/api/social/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: post.id, status: 'published', platform: post.platform }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Status could not be updated.');
      }
      toast({ title: 'Marked as published', description: 'The post status was updated.' });
      await loadPosts();
    } catch (error) {
      toast({ title: 'Update failed', description: error instanceof Error ? error.message : 'Please retry.', variant: 'destructive' });
    } finally {
      setBusyId(null);
    }
  };

  // Calendar grid for the current month, marked from real scheduled dates.
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const postsByDay = new Map<number, number>();
  for (const post of posts) {
    const when = post.scheduledAt || post.publishedAt;
    if (!when) continue;
    const date = new Date(when);
    if (Number.isNaN(date.getTime())) continue;
    if (date.getFullYear() !== year || date.getMonth() !== month) continue;
    postsByDay.set(date.getDate(), (postsByDay.get(date.getDate()) ?? 0) + 1);
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[var(--alo-cta-hover)] rounded-lg">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--alo-text)]">Social Media</h1>
            <p className="text-sm text-[var(--alo-text-muted)]">Manage your social media presence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={() => void loadPosts()} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />Refresh
          </Button>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'table' ? 'bg-[var(--alo-brand)] text-white' : 'text-[var(--alo-text-muted)] hover:bg-[var(--alo-page)]'}`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-medium ${viewMode === 'calendar' ? 'bg-[var(--alo-brand)] text-white' : 'text-[var(--alo-text-muted)] hover:bg-[var(--alo-page)]'}`}
            >
              Calendar
            </button>
          </div>
          <Button size="sm" onClick={() => setShowCreatePost(true)} className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)]">
            <Plus className="h-4 w-4 mr-1" />
            Create Post
          </Button>
        </div>
      </div>

      {/* Summary — counts derived from stored records only */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="p-2 bg-[var(--alo-brand-pale)] rounded-lg w-fit"><BarChart3 className="h-4 w-4 text-[var(--alo-brand)]" /></div>
            <p className="text-2xl font-bold text-[var(--alo-text)] mt-3">{total}</p>
            <p className="text-xs text-[var(--alo-text-muted)]">Stored posts</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="p-2 bg-crm-success-bg rounded-lg w-fit"><CheckCircle className="h-4 w-4 text-crm-success-text" /></div>
            <p className="text-2xl font-bold text-[var(--alo-text)] mt-3">{publishedCount}</p>
            <p className="text-xs text-[var(--alo-text-muted)]">Published</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="p-2 bg-[var(--alo-cta-soft)] rounded-lg w-fit"><Clock className="h-4 w-4 text-[var(--alo-cta-active)]" /></div>
            <p className="text-2xl font-bold text-[var(--alo-text)] mt-3">{scheduledCount}</p>
            <p className="text-xs text-[var(--alo-text-muted)]">Scheduled</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="p-2 bg-crm-danger-bg rounded-lg w-fit"><XCircle className="h-4 w-4 text-crm-danger-text" /></div>
            <p className="text-2xl font-bold text-[var(--alo-text)] mt-3">{failedCount}</p>
            <p className="text-xs text-[var(--alo-text-muted)]">Failed</p>
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] text-[var(--alo-text-muted)]">
        Follower, reach and engagement figures are not stored for these accounts, so none are shown. Connect a provider to collect them.
      </p>

      {/* Platform Tabs */}
      <Tabs value={activePlatform} onValueChange={setActivePlatform}>
        <div className="flex items-center gap-3">
          <TabsList>
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="facebook" className="text-xs">Facebook</TabsTrigger>
            <TabsTrigger value="instagram" className="text-xs">Instagram</TabsTrigger>
            <TabsTrigger value="linkedin" className="text-xs">LinkedIn</TabsTrigger>
            <TabsTrigger value="tiktok" className="text-xs">TikTok</TabsTrigger>
          </TabsList>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--alo-text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search posts..."
              className="pl-9 h-8 text-xs"
            />
          </div>
        </div>
      </Tabs>

      {loadError && (
        <Card className="shadow-sm border-destructive/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3" role="alert">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive" />
              <div>
                <p className="text-sm font-semibold text-[var(--alo-text)]">Social posts are unavailable</p>
                <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">{loadError}</p>
                <Button size="sm" variant="outline" className="mt-2 h-7 " onClick={() => void loadPosts()}>Try again</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && !loadError && (
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-2" aria-busy="true" aria-live="polite">
            {[0, 1, 2, 3].map((row) => <div key={row} className="h-12 animate-pulse rounded bg-[var(--alo-surface-muted)]" />)}
            <p className="text-xs text-[var(--alo-text-muted)]">Loading posts…</p>
          </CardContent>
        </Card>
      )}

      {!loading && !loadError && posts.length === 0 && (
        <Card className="shadow-sm">
          <CardContent className="p-10 text-center">
            <Share2 className="h-8 w-8 mx-auto text-[var(--alo-placeholder)]" />
            <p className="text-sm font-semibold text-[var(--alo-text)] mt-2">No posts have been created yet</p>
            <p className="text-xs text-[var(--alo-text-muted)] mt-1 max-w-md mx-auto">
              Create your first post to start scheduling content. Posts are stored against the marketing calendar.
            </p>
            <Button size="sm" className="mt-3 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)]" onClick={() => setShowCreatePost(true)}>
              <Plus className="h-4 w-4 mr-1" />Create Post
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !loadError && posts.length > 0 && viewMode === 'table' && (
        <Card className="shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-[var(--alo-page)]/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--alo-text-muted)]">Platform</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--alo-text-muted)]">Content</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--alo-text-muted)]">Scheduled</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--alo-text-muted)]">Published</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[var(--alo-text-muted)]">Status</th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[var(--alo-text-muted)]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((post) => {
                    const pMeta = platformMeta(post.platform);
                    const sMeta = statusMeta(post.status);
                    const PIcon = pMeta.icon;
                    const SIcon = sMeta.icon;
                    return (
                      <tr key={post.id} className="border-b hover:bg-[var(--alo-page)]/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded ${pMeta.bg} flex items-center justify-center`}>
                              <PIcon className="h-3 w-3 text-white" />
                            </span>
                            <span className="text-xs text-[var(--alo-body)]">{pMeta.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-[var(--alo-text)] max-w-xs truncate">{bodyText(post) || '—'}</p>
                          {post.failReason && (
                            <p className="text-[11px] text-crm-danger-text mt-0.5 max-w-xs truncate">Reason: {post.failReason}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--alo-text-muted)]">{formatDate(post.scheduledAt)}</td>
                        <td className="px-4 py-3 text-xs text-[var(--alo-text-muted)]">{formatDate(post.publishedAt)}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[11px] ${sMeta.className}`}>
                            <SIcon className="h-3 w-3 mr-0.5" />
                            {sMeta.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {(post.status || '').toLowerCase() !== 'published' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={busyId === post.id}
                                onClick={() => void handlePublish(post)}
                                aria-label={`Mark post as published`}
                                title="Mark as published"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filteredPosts.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-sm text-[var(--alo-text-muted)]">No posts match your search.</p>
                  <Button size="sm" variant="ghost" className="mt-2 h-7 " onClick={() => setSearchQuery('')}>
                    Clear search
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !loadError && posts.length > 0 && viewMode === 'calendar' && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[var(--alo-brand)]" />{monthLabel} Schedule
              </CardTitle>
              <span className="text-[11px] text-[var(--alo-text-muted)]">{postsByDay.size} day(s) with posts</span>
            </div>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-7 gap-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-[var(--alo-text-muted)] py-1">{d}</div>
              ))}
              {Array.from({ length: firstDay }).map((_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const count = postsByDay.get(day) ?? 0;
                const hasPosts = count > 0;
                return (
                  <div
                    key={day}
                    className={`p-1 min-h-[48px] rounded text-center text-xs ${hasPosts ? 'bg-[var(--alo-brand-pale)] border border-[var(--alo-border)]' : 'hover:bg-[var(--alo-page)]'} text-[var(--alo-body)]`}
                  >
                    <span className="font-medium">{day}</span>
                    {hasPosts && (
                      <div className="mt-0.5">
                        <span className="bg-[var(--alo-brand)] text-white text-[11px] rounded px-1 py-0.5">
                          {count} post{count > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Post */}
      {showCreatePost && (
        <Card className="shadow-lg border-[var(--alo-border)]">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Create New Post</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowCreatePost(false)}>Cancel</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(['facebook', 'instagram', 'linkedin', 'tiktok'] as PlatformKey[]).map((p) => {
                const meta = platformMeta(p);
                const Icon = meta.icon;
                return (
                  <button
                    key={p}
                    onClick={() => setNewPostPlatform(p)}
                    className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-colors ${newPostPlatform === p ? 'border-[var(--alo-brand)] bg-[var(--alo-brand-pale)]' : 'hover:bg-[var(--alo-page)]'}`}
                  >
                    <span className={`w-8 h-8 rounded ${meta.bg} flex items-center justify-center`}>
                      <Icon className="h-4 w-4 text-white" />
                    </span>
                    <span className="text-xs font-medium">{meta.label}</span>
                  </button>
                );
              })}
            </div>
            <Textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="Write your post content..."
              rows={4}
              className="resize-y"
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-xs text-[var(--alo-text-muted)]">Status:</span>
                <select
                  value={newPostStatus}
                  onChange={(e) => setNewPostStatus(e.target.value)}
                  className="text-xs border rounded px-2 py-1"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="published">Publish Now</option>
                </select>
              </div>
            </div>
            <p className="text-[11px] text-[var(--alo-text-muted)]">
              Do not include unsubstantiated claims such as visa success rates or approval odds in post content.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreatePost(false)} disabled={saving}>Cancel</Button>
              <Button onClick={() => void handleCreatePost()} disabled={saving} className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)]">
                <Send className="h-4 w-4 mr-1" />
                {saving ? 'Saving…' : newPostStatus === 'published' ? 'Publish' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
