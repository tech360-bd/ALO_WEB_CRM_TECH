'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, GraduationCap, Plane, Award, Palette, FileCheck, Filter, AlertCircle, RefreshCw, Image as ImageIcon, Video, CalendarDays, ExternalLink } from 'lucide-react';

interface Resource {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  url: string;
  country: string;
  studyLevel: string;
  readingTime: number;
  publishedAt: string;
  verificationStatus: string;
  sourceName: string;
  lastVerifiedAt: string;
}
interface MarketingQuota {
  monthlyImageLimit: number;
  monthlyVideoLimit: number;
  videoDurationLimitSeconds: number;
  autoPublishAllowed: boolean;
  requiresAloApproval: boolean;
  status: string;
}
interface MarketingUsage { monthYear: string; imagesUsed: number; videosUsed: number; ideasSubmitted: number; postsScheduled: number; postsPublished: number }

function categoryIcon(category: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes('market')) return Palette;
  if (normalized.includes('univers')) return GraduationCap;
  if (normalized.includes('visa')) return Plane;
  if (normalized.includes('scholar')) return Award;
  if (normalized.includes('application') || normalized.includes('document')) return FileCheck;
  return FileText;
}
function formatDate(value: string) {
  if (!value) return 'Date not recorded';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Date not recorded' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PartnerResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [quota, setQuota] = useState<MarketingQuota | null>(null);
  const [usage, setUsage] = useState<MarketingUsage | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const load = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const response = await fetch('/api/partner/resources', { credentials: 'include', cache: 'no-store' });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.success || !Array.isArray(payload.data?.resources)) {
        throw new Error(payload.error || `The resource library could not be loaded (HTTP ${response.status}).`);
      }
      setResources(payload.data.resources.map((resource: any): Resource => ({
        id: String(resource.id || ''),
        slug: String(resource.slug || ''),
        title: String(resource.title || 'Untitled resource'),
        category: String(resource.category || 'Resource'),
        description: String(resource.description || ''),
        url: String(resource.url || ''),
        country: String(resource.country || ''),
        studyLevel: String(resource.studyLevel || ''),
        readingTime: Number(resource.readingTime || 0),
        publishedAt: String(resource.publishedAt || ''),
        verificationStatus: String(resource.verificationStatus || ''),
        sourceName: String(resource.sourceName || ''),
        lastVerifiedAt: String(resource.lastVerifiedAt || ''),
      })));
      setQuota(payload.data.marketingQuota || null);
      setUsage(payload.data.marketingUsage || null);
      setState('ready');
    } catch (caught) {
      setResources([]);
      setQuota(null);
      setUsage(null);
      setError(caught instanceof Error ? caught.message : 'The resource library could not be loaded.');
      setState('error');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);
  const categories = useMemo(() => Array.from(new Set(resources.map((resource) => resource.category))).sort(), [resources]);
  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return resources.filter((resource) => {
      if (categoryFilter !== 'All' && resource.category !== categoryFilter) return false;
      if (!needle) return true;
      return [resource.title, resource.description, resource.category, resource.country, resource.studyLevel].some((field) => field.toLowerCase().includes(needle));
    });
  }, [resources, categoryFilter, search]);

  if (state === 'loading') return <div className="space-y-6 p-1" aria-busy="true"><Skeleton className="h-8 w-48" /><Skeleton className="h-12 w-full" /><div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-40 w-full rounded-xl" />)}</div></div>;
  if (state === 'error') return <div className="p-1"><div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-5 sm:flex-row sm:items-center"><AlertCircle className="h-5 w-5 shrink-0 text-red-600" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-red-900">Resource library unavailable</p><p className="mt-0.5 text-sm text-red-800">{error}</p></div><Button variant="outline" className="shrink-0 border-red-300 bg-white text-red-700" onClick={() => void load()}><RefreshCw className="w-3.5 h-3.5" />Try Again</Button></div></div>;

  const monthLabel = usage?.monthYear || 'Current month not recorded';
  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold text-alo-text">Resource Library</h1><p className="mt-0.5 text-sm text-alo-text-muted">Published guides and articles from the shared ALO resource catalog.</p></div><Badge variant="outline" className="w-fit"><FileText className="mr-1 h-3 w-3" />{resources.length} published resources</Badge></div>

      <Card className="bg-white rounded-xl border border-alo-border"><CardHeader><div className="flex items-center justify-between gap-2"><CardTitle className="text-base font-semibold text-alo-text">Marketing quota (from partner account)</CardTitle><Badge variant="muted"><CalendarDays className="mr-1 h-3 w-3" />{monthLabel}</Badge></div></CardHeader><CardContent>{!quota ? <p className="text-sm text-alo-text-muted">No marketing quota is configured for this partner account.</p> : <div className="grid grid-cols-2 gap-4 md:grid-cols-4"><QuotaMetric icon={ImageIcon} title="Images" used={usage?.imagesUsed || 0} limit={quota.monthlyImageLimit} /><QuotaMetric icon={Video} title="Videos" used={usage?.videosUsed || 0} limit={quota.monthlyVideoLimit} /><QuotaMetric icon={FileCheck} title="Ideas submitted" used={usage?.ideasSubmitted || 0} /><QuotaMetric icon={Palette} title="Posts published" used={usage?.postsPublished || 0} /></div>}{quota && <p className="mt-4 text-xs text-alo-text-muted">Status: {quota.status.replace(/[_-]+/g, ' ')} · Auto-publish: {quota.autoPublishAllowed ? 'enabled' : 'disabled'} · ALO approval required: {quota.requiresAloApproval ? 'yes' : 'no'} · Video duration limit: {quota.videoDurationLimitSeconds} seconds</p>}</CardContent></Card>

      <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-alo-text-muted" /><Input placeholder="Search published resources..." className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} /></div><div className="flex items-center gap-2"><Filter className="hidden h-4 w-4 text-alo-text-muted sm:block" /><Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All Categories</SelectItem>{categories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent></Select></div></CardContent></Card>

      {filtered.length === 0 ? <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-12 text-center"><FileText className="mx-auto mb-3 h-10 w-10 text-alo-text-muted/40" /><p className="text-sm text-alo-text-muted">{resources.length ? 'No published resources match your search.' : 'No published partner resources are available yet.'}</p></CardContent></Card> : <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((resource) => { const Icon = categoryIcon(resource.category); return <Card key={resource.id} className="bg-white rounded-xl border border-alo-border flex flex-col"><CardContent className="flex flex-1 flex-col p-5"><div className="mb-3 flex items-center justify-between gap-2"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-alo-brand-light/50 text-alo-brand"><Icon className="h-5 w-5" /></div><Badge variant="outline" className="text-[10px]">{resource.category}</Badge></div><h2 className="text-base font-semibold text-alo-text">{resource.title}</h2><p className="mt-2 line-clamp-3 flex-1 text-sm text-alo-text-secondary">{resource.description || 'Description not recorded.'}</p><div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-alo-text-muted">{resource.country && <span>{resource.country}</span>}{resource.studyLevel && <span>{resource.studyLevel}</span>}{resource.readingTime > 0 && <span>{resource.readingTime} min read</span>}<span>Published {formatDate(resource.publishedAt)}</span></div>{resource.verificationStatus && <p className="mt-2 text-[11px] text-alo-text-muted">Verification status: {resource.verificationStatus}{resource.sourceName ? ` · Source: ${resource.sourceName}` : ''}{resource.lastVerifiedAt ? ` · Checked ${formatDate(resource.lastVerifiedAt)}` : ''}</p>}<Button asChild variant="outline" className="mt-4 w-full" disabled={!resource.url}><Link href={resource.url || '#'}><ExternalLink className="h-4 w-4" />Open published guide</Link></Button></CardContent></Card>; })}</div>}
    </div>
  );
}

function QuotaMetric({ icon: Icon, title, used, limit }: { icon: typeof ImageIcon; title: string; used: number; limit?: number }) {
  return <div className="rounded-lg bg-slate-50 p-3"><div className="flex items-center gap-2 text-xs text-alo-text-muted"><Icon className="h-4 w-4 text-alo-brand" />{title}</div><p className="mt-1 text-lg font-semibold text-alo-text">{used}{limit !== undefined ? ` / ${limit}` : ''}</p></div>;
}
