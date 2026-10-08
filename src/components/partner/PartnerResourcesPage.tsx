'use client';

/**
 * Partner resource library — /partner/resources (spec §65)
 *
 * Every field comes from GET /api/partner/resources, which returns the partner's
 * own quota and usage alongside the catalogue. Downloads are recorded through
 * POST /api/partner/resources with the session token, so the counter shown here
 * is the recorded value rather than a number the UI invents.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Search, Download, FileText, Image as ImageIcon, Video, FileSpreadsheet,
  BookOpen, GraduationCap, Plane, Award, Palette, FileCheck, Filter, Loader2,
  FolderOpen, CalendarDays, HardDrive, AlertCircle, RefreshCw,
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  category: string;
  type: string;
  size: string;
  description: string;
  url?: string;
  uploadedAt?: string;
  downloads?: number;
}

interface ResourcesResponse {
  success: boolean;
  data?: { partnerId: string; resources: Resource[]; quota?: number; usage?: number };
  meta?: {
    total: number;
    available: number;
    categories: string[];
    downloadedThisMonth: number;
    downloadLimit: number;
    quotaReached: boolean;
  };
  error?: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Marketing Materials': <Palette className="w-4 h-4" aria-hidden="true" />,
  'University Guides': <GraduationCap className="w-4 h-4" aria-hidden="true" />,
  'Application Forms': <FileCheck className="w-4 h-4" aria-hidden="true" />,
  'Visa Information': <Plane className="w-4 h-4" aria-hidden="true" />,
  'Scholarship Lists': <Award className="w-4 h-4" aria-hidden="true" />,
  'Brand Guidelines': <BookOpen className="w-4 h-4" aria-hidden="true" />,
};

const TYPE_STYLES: Record<string, { icon: React.ReactNode; tone: string }> = {
  PDF: { icon: <FileText className="w-4 h-4" aria-hidden="true" />, tone: 'bg-red-50 text-red-600' },
  Image: { icon: <ImageIcon className="w-4 h-4" aria-hidden="true" />, tone: 'bg-emerald-50 text-emerald-600' },
  Video: { icon: <Video className="w-4 h-4" aria-hidden="true" />, tone: 'bg-amber-50 text-amber-600' },
  Doc: { icon: <FileSpreadsheet className="w-4 h-4" aria-hidden="true" />, tone: 'bg-blue-50 text-blue-600' },
};

function typeStyle(type: string) {
  return TYPE_STYLES[type] ?? { icon: <FileText className="w-4 h-4" aria-hidden="true" />, tone: 'bg-slate-100 text-slate-600' };
}

function formatDate(value?: string) {
  if (!value) return 'Date not recorded';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Date not recorded';
  return parsed.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PartnerResourcesPage() {
  const { user, token } = usePortalStore();
  const [resources, setResources] = useState<Resource[]>([]);
  const [meta, setMeta] = useState<ResourcesResponse['meta'] | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [downloading, setDownloading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    setError(null);
    try {
      const response = await fetch('/api/partner/resources', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const payload = (await response.json().catch(() => null)) as ResourcesResponse | null;
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || `The resource library could not be loaded (status ${response.status}).`);
      }
      setResources(payload.data?.resources ?? []);
      setMeta(payload.meta ?? null);
      setState('ready');
    } catch (caught) {
      setError((caught as Error).message || 'The resource library could not be loaded.');
      setState('error');
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(
    () => meta?.categories ?? Array.from(new Set(resources.map((resource) => resource.category))).sort(),
    [meta, resources],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return resources.filter((resource) => {
      if (categoryFilter !== 'All' && resource.category !== categoryFilter) return false;
      if (!needle) return true;
      return [resource.title, resource.description, resource.category]
        .some((field) => (field ?? '').toLowerCase().includes(needle));
    });
  }, [resources, categoryFilter, search]);

  const handleDownload = async (resource: Resource) => {
    setDownloading(resource.id);
    try {
      const response = await fetch('/api/partner/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ partnerId: user?.id, resourceId: resource.id, action: 'download' }),
      });
      if (!response.ok) throw new Error(`Download could not be recorded (status ${response.status}).`);

      if (resource.url) {
        const anchor = document.createElement('a');
        anchor.href = resource.url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        anchor.click();
      }

      // Re-read the catalogue so counts and quota come from the server rather
      // than being incremented locally.
      await load();
    } catch (caught) {
      setError((caught as Error).message || 'The download could not be recorded.');
      setState('error');
    } finally {
      setDownloading(null);
    }
  };

  if (state === 'loading') {
    return (
      <div className="space-y-6 p-1" aria-busy="true" aria-live="polite">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="space-y-6 p-1">
        <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-5 sm:flex-row sm:items-center">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-red-900">Resource library unavailable</p>
            <p className="mt-0.5 text-sm text-red-800">{error}</p>
          </div>
          <Button variant="outline" className="shrink-0 border-red-300 bg-white text-red-700" onClick={load}>
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Resource Library</h1>
          <p className="mt-0.5 text-sm text-alo-text-muted">
            Download marketing materials, guides and forms published for your agency.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="w-fit">
            <FolderOpen className="w-3 h-3" aria-hidden="true" /> {resources.length} resources
          </Badge>
          {meta && (
            <Badge variant={meta.quotaReached ? 'destructive' : 'outline'} className="w-fit">
              {meta.quotaReached
                ? 'Monthly download limit reached'
                : `${meta.downloadedThisMonth} of ${meta.downloadLimit} downloads used`}
            </Badge>
          )}
        </div>
      </div>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-alo-text-muted" aria-hidden="true" />
              <Input
                placeholder="Search resources by title, description or category…"
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search resources"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <Filter className="w-4 h-4 text-alo-text-muted hidden sm:block flex-shrink-0" aria-hidden="true" />
              <div className="flex items-center gap-1">
                {['All', ...categories].map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setCategoryFilter(category)}
                    aria-pressed={categoryFilter === category}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap',
                      categoryFilter === category ? 'bg-alo-brand text-white' : 'text-alo-text-secondary hover:bg-muted',
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {resources.length === 0 ? (
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-alo-text-muted/40 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm font-semibold text-alo-text">No resources published yet</p>
            <p className="mt-1 text-sm text-alo-text-muted">
              Materials published by the ALO partner team will appear here. Ask your account manager if you were
              expecting something specific.
            </p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-12 text-center">
            <Search className="w-10 h-10 text-alo-text-muted/40 mx-auto mb-3" aria-hidden="true" />
            <p className="text-sm text-alo-text-muted">No resources match that search or filter.</p>
            <Button
              variant="outline"
              className="mt-3"
              onClick={() => { setSearch(''); setCategoryFilter('All'); }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((resource) => {
            const style = typeStyle(resource.type);
            const blocked = Boolean(meta?.quotaReached);
            return (
              <Card key={resource.id} className="bg-white rounded-xl border border-alo-border hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', style.tone)}>
                      {style.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-alo-text truncate">{resource.title}</p>
                      <p className="text-xs text-alo-text-muted flex items-center gap-1 mt-0.5">
                        {CATEGORY_ICONS[resource.category] ?? <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />}
                        {resource.category}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-alo-text-secondary line-clamp-2 mb-3">{resource.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-alo-text-muted mb-3 flex-wrap">
                    <span className={cn('inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-semibold', style.tone)}>
                      {resource.type}
                    </span>
                    {resource.size && (
                      <span className="flex items-center gap-1">
                        <HardDrive className="w-3 h-3" aria-hidden="true" />{resource.size}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Download className="w-3 h-3" aria-hidden="true" />{resource.downloads ?? 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" aria-hidden="true" />{formatDate(resource.uploadedAt)}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDownload(resource)}
                    disabled={downloading === resource.id || blocked}
                  >
                    {downloading === resource.id ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> Preparing…</>
                    ) : blocked ? (
                      'Download limit reached'
                    ) : (
                      <><Download className="w-3.5 h-3.5" aria-hidden="true" /> Download</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {resources.length > 0 && (
        <p className="text-xs text-alo-text-muted text-center">
          Showing {filtered.length} of {resources.length} resources
        </p>
      )}
    </div>
  );
}
