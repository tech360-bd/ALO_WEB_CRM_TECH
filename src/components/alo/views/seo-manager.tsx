'use client';

/**
 * SEO Manager — /crm/seo-manager
 *
 * A draft-and-approval workbench over the existing SEO endpoints
 * (GET/POST /api/marketing/seo). Nothing is published from here: generation
 * produces a draft row and a human approves it, per the marketing spec's
 * "draft first, approval required before publish" rule.
 *
 * The list is the persisted MarketingGeneratedContent table, so an empty
 * database shows an empty state rather than invented pages.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, CheckCircle2, FileSearch, Loader2, RefreshCw, Search, Sparkles, XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { usePortalStore } from '@/lib/stores/portal-store';
import { cn } from '@/lib/utils';

interface SeoItem {
  id: string;
  contentType: string;
  topic: string;
  title: string;
  language: string;
  targetCountry: string;
  targetCourse: string;
  status: string;
  publishedAt: string | null;
  approvedAt: string | null;
  rejectionReason: string;
  createdAt: string;
  updatedAt: string;
}

interface ListResponse {
  success: boolean;
  data: SeoItem[];
  total: number;
  error?: string;
}

const TOPIC_TYPES = [
  { value: 'country_page', label: 'Country guide page' },
  { value: 'course_page', label: 'Course / programme page' },
  { value: 'university_page', label: 'University profile page' },
  { value: 'scholarship_page', label: 'Scholarship information page' },
  { value: 'blog_topic', label: 'Blog post' },
];

const STATUS_TONE: Record<string, string> = {
  draft: 'border-[var(--alo-border)] bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  approved: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  rejected: 'border-red-200 bg-red-50 text-red-800',
};

function statusLabel(value: string): string {
  return (value || 'draft').replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SeoManager() {
  const token = usePortalStore((state) => state.token);
  const [items, setItems] = useState<SeoItem[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [topicType, setTopicType] = useState(TOPIC_TYPES[0].value);
  const [topic, setTopic] = useState('');
  const [country, setCountry] = useState('');
  const [course, setCourse] = useState('');
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  const headers = useMemo(
    () => ({
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token],
  );

  const load = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (status !== 'all') params.set('status', status);
      if (search) params.set('search', search);
      const response = await fetch(`/api/marketing/seo?${params.toString()}`, { headers, credentials: 'include' });
      const payload = (await response.json().catch(() => null)) as ListResponse | null;
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `The SEO queue could not be loaded (status ${response.status}).`);
      }
      setItems(payload.data ?? []);
      setTotal(payload.total ?? 0);
      setState('ready');
    } catch (caught) {
      setError((caught as Error).message || 'The SEO queue could not be loaded.');
      setState('error');
    }
  }, [headers, status, search]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const generate = async (event: React.FormEvent) => {
    event.preventDefault();
    setGenerating(true);
    setActionError(null);
    try {
      const response = await fetch('/api/marketing/seo?action=generate', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ topicType, topic, country, course, language: 'english' }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.error) {
        throw new Error(payload?.error || `Generation failed (status ${response.status}).`);
      }
      setTopic('');
      await load();
    } catch (caught) {
      setActionError((caught as Error).message || 'Generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const approve = async (item: SeoItem) => {
    setApproving(item.id);
    setActionError(null);
    try {
      const response = await fetch('/api/marketing/seo?action=approve', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ contentId: item.id }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.error) {
        throw new Error(payload?.error || `Approval failed (status ${response.status}).`);
      }
      await load();
    } catch (caught) {
      setActionError((caught as Error).message || 'Approval failed.');
    } finally {
      setApproving(null);
    }
  };

  const counts = useMemo(() => ({
    draft: items.filter((item) => item.status === 'draft').length,
    approved: items.filter((item) => item.status === 'approved').length,
    rejected: items.filter((item) => item.status === 'rejected').length,
  }), [items]);

  return (
    <div className="min-h-screen bg-[var(--alo-page)] px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 text-[20px] font-bold leading-tight tracking-[-0.01em] text-[var(--alo-text)]">
              <FileSearch className="h-5 w-5 text-[var(--alo-brand)]" aria-hidden="true" />
              SEO Manager
            </h1>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--alo-text-muted)]">
              Generate SEO page drafts and approve them before anything goes live. Generated content is always a
              draft first — approval is required and every action is audited.
            </p>
          </div>
          <Button variant="outline" className=" shrink-0 rounded-button border-[var(--alo-border)] bg-white px-4 text-[13px] font-semibold" onClick={load}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </Button>
        </header>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Metric label="Total records" value={total} />
          <Metric label="Drafts" value={counts.draft} />
          <Metric label="Approved" value={counts.approved} tone="success" />
          <Metric label="Rejected" value={counts.rejected} tone={counts.rejected > 0 ? 'danger' : 'neutral'} />
        </div>

        {actionError && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{actionError}</span>
          </div>
        )}

        {/* Generator */}
        <form onSubmit={generate} className="mb-6 rounded-xl border border-[var(--alo-border)] bg-white p-5">
          <h2 className="text-[14px] font-semibold text-[var(--alo-text)]">Generate a draft</h2>
          <p className="mt-0.5 text-[12px] text-[var(--alo-text-muted)]">
            Drafts are written from the topic you supply. Verify every factual claim against an official source
            before approving — the model can be wrong about fees, deadlines and requirements.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="seo-type" className="mb-1.5 block text-[13px] font-semibold text-[var(--alo-body)]">Page type</Label>
              <Select value={topicType} onValueChange={setTopicType}>
                <SelectTrigger id="seo-type" className="h-10 w-full rounded-input border-[var(--alo-border)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOPIC_TYPES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="seo-topic" className="mb-1.5 block text-[13px] font-semibold text-[var(--alo-body)]">Topic</Label>
              <Input id="seo-topic" required value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Study Data Science in the UK" className="h-10 rounded-input border-[var(--alo-border)] text-sm" />
            </div>
            <div>
              <Label htmlFor="seo-country" className="mb-1.5 block text-[13px] font-semibold text-[var(--alo-body)]">Country</Label>
              <Input id="seo-country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United Kingdom" className="h-10 rounded-input border-[var(--alo-border)] text-sm" />
            </div>
            <div>
              <Label htmlFor="seo-course" className="mb-1.5 block text-[13px] font-semibold text-[var(--alo-body)]">Course</Label>
              <Input id="seo-course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="MSc Data Science" className="h-10 rounded-input border-[var(--alo-border)] text-sm" />
            </div>
          </div>
          <Button type="submit" disabled={generating} className="mt-4 rounded-button bg-[var(--alo-cta-hover)] px-5 text-[13px] font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />}
            {generating ? 'Generating Draft…' : 'Generate Draft'}
          </Button>
        </form>

        {/* Queue */}
        <div className="rounded-xl border border-[var(--alo-border)] bg-white">
          <div className="flex flex-col gap-3 border-b border-[var(--alo-border)] p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--alo-text-muted)]" aria-hidden="true" />
              <Input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by title or topic" aria-label="Search SEO content" className="h-9 rounded-input border-[var(--alo-border)] pl-9 text-sm" />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9 w-full rounded-input border-[var(--alo-border)] sm:w-40" aria-label="Filter by status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state === 'loading' && (
            <div className="space-y-2 p-4" aria-busy="true" aria-live="polite">
              {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 w-full rounded-lg" />)}
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-red-900">SEO queue unavailable</p>
                <p className="mt-0.5 text-[13px] text-red-800">{error}</p>
              </div>
              <Button variant="outline" className="shrink-0 border-red-300 bg-white text-red-700" onClick={load}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Try Again
              </Button>
            </div>
          )}

          {state === 'ready' && items.length === 0 && (
            <div className="px-6 py-14 text-center">
              <FileSearch className="mx-auto mb-3 h-10 w-10 text-[var(--alo-placeholder)]" aria-hidden="true" />
              <h3 className="text-[15px] font-semibold text-[var(--alo-text)]">
                {status !== 'all' || search ? 'No drafts match those filters' : 'No SEO drafts yet'}
              </h3>
              <p className="mx-auto mt-1 max-w-[440px] text-[13px] leading-relaxed text-[var(--alo-text-muted)]">
                {status !== 'all' || search
                  ? 'Clear the search or status filter to see the full queue.'
                  : 'Generate a draft above to start building the SEO queue.'}
              </p>
            </div>
          )}

          {state === 'ready' && items.length > 0 && (
            <ul className="divide-y divide-[var(--alo-border)]">
              {items.map((item) => (
                <li key={item.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-semibold text-[var(--alo-text)]">{item.title || item.topic || 'Untitled draft'}</p>
                    <p className="mt-0.5 text-[12px] text-[var(--alo-text-muted)]">
                      {[item.contentType.replace(/_/g, ' '), item.targetCountry, item.targetCourse]
                        .filter(Boolean).join(' · ') || 'No targeting set'}
                    </p>
                    {item.rejectionReason && (
                      <p className="mt-1 text-[12px] text-red-700">Rejected: {item.rejectionReason}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <Badge className={cn('rounded border font-semibold', STATUS_TONE[item.status] ?? STATUS_TONE.draft)}>
                      {statusLabel(item.status)}
                    </Badge>
                    <span className="text-[11px] text-[var(--alo-text-muted)]">
                      {new Date(item.createdAt).toLocaleDateString('en-GB')}
                    </span>
                    {item.status !== 'approved' && (
                      <Button
 variant="outline"
 className=" rounded-button border-emerald-300 px-3 text-[12px] font-semibold text-emerald-700"
 onClick={() => approve(item)}
                        disabled={approving === item.id}
                      >
                        {approving === item.id ? (
                          <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                        ) : (
                          <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        {approving === item.id ? 'Approving…' : 'Approve'}
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <p className="mt-4 flex items-start gap-1.5 text-[12px] leading-relaxed text-[var(--alo-text-muted)]">
          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Generated drafts may contain inaccurate fees, deadlines, entry requirements or visa rules. Check each claim
          against the official university or government source before approving, and record the source and
          verification date on the published page.
        </p>
      </div>
    </div>
  );
}

function Metric({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'success' | 'danger' }) {
  const toneClass = tone === 'success' ? 'text-emerald-600' : tone === 'danger' ? 'text-red-600' : 'text-[var(--alo-text)]';
  return (
    <div className="rounded-xl border border-[var(--alo-border)] bg-white px-4 py-3">
      <p className={cn('text-[24px] font-bold leading-none tracking-[-0.02em]', toneClass)}>{value}</p>
      <p className="mt-1.5 text-[12px] font-medium text-[var(--alo-text-muted)]">{label}</p>
    </div>
  );
}
