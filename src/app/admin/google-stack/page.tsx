'use client';

// ============================================================
// GOOGLE FREE STACK — configuration, verification and reporting
// ============================================================
// One place to see what ALO's Google integrations actually are: which services
// are configured, which are verified by a real API call, what each costs, and
// what the acquisition-to-enrolment funnel produced.
//
// This is a NEW module rather than an extension of the existing SEO panels,
// because those answer different questions and must not be forked:
//   /crm/seo-manager            — SEO keyword and draft/approval workbench
//   SeoEvidencePanel(technical) — sitemap/robots module-import checks
// This page covers Google SERVICE configuration and links to both.
//
// Honesty rules enforced in this UI:
//   * `configured` and `verified` are shown as separate columns. A credential
//     can be present and still be rejected by Google, and collapsing the two
//     would hide the most common real failure (a service account never added to
//     the property).
//   * An unconfigured service renders NOT CONFIGURED with the exact environment
//     variable to set. It never renders a zeroed dashboard that looks like
//     "working, but no traffic".
//   * The FREE / FREE_TIER / PAID classification is displayed per service, and
//     Maps and Cloud are shown as deliberately unused rather than as failures.
//   * The funnel states its own caveats, including how many leads could not be
//     joined to an application, so a low conversion rate is never mistaken for
//     a broken join.
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  RefreshCw,
  Search,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ExternalLink,
  TrendingUp,
  ShieldCheck,
  Banknote,
  Users,
  UploadCloud,
  Eye,
} from 'lucide-react';
import { toast } from 'sonner';

type CostTier = 'FREE' | 'FREE_TIER' | 'PAID';
type Verdict = 'PASS' | 'PARTIAL' | 'NOT_CONFIGURED' | 'NOT_VERIFIED' | 'BLOCKED';

interface ServiceStatus {
  configured: boolean;
  costTier: CostTier;
  billingRequired: boolean;
  optional: boolean;
  liveVerified: boolean | null;
  status: Verdict;
  reason: string;
  detail?: Record<string, unknown>;
}

interface GoogleStatusResponse {
  success: boolean;
  environment: string;
  siteUrl: string;
  liveChecksPerformed: boolean;
  tagLoader: { loader: string; id: string | null; reason: string };
  credential: { mode: string; configured: boolean; serviceAccountEmail: string | null };
  siteVerificationTokenConfigured: boolean;
  services: Record<string, ServiceStatus>;
  costSummary: { free: string[]; freeTier: string[]; paid: string[]; paidServicesInUse: string[] };
  note: string;
}

interface FunnelRow {
  key: string;
  channel: string;
  campaign: string;
  landingPage: string;
  leads: number;
  qualified: number;
  qualifiedByStatus: number;
  qualifiedByScore: number;
  applications: number;
  crmApplications: number;
  portalApplications: number;
  enrolments: number;
  leadsWithoutStudentLink: number;
  conversionRates: {
    leadToQualified: number | null;
    qualifiedToApplication: number | null;
    applicationToEnrolment: number | null;
    leadToEnrolment: number | null;
  };
}

interface FunnelResponse {
  success: boolean;
  groupBy: string;
  rows: FunnelRow[];
  totals: {
    leads: number;
    qualified: number;
    applications: number;
    enrolments: number;
    leadsWithoutStudentLink: number;
  };
  unattributedLeads: number;
  caveats: string[];
  enrolmentDefinition: { applicationStages: string[]; portalStage: string };
  error?: string;
}

interface PerformanceResponse {
  success: boolean;
  status: string;
  rows: { query?: string | null; url?: string | null; impressions: number; clicks: number; ctr: number; position: number }[];
  totals: { clicks: number; impressions: number; ctr: number; position: number; rowCount: number } | null;
  window: { startDate: string; endDate: string; days: number };
  reason?: string;
  liveProviderVerified: boolean;
}

interface SitemapEntry {
  path: string;
  lastSubmitted?: string | null;
  contents?: { submitted?: number; indexed?: number }[];
  warnings?: number;
  errors?: number;
}

interface SitemapsResponse {
  success: boolean;
  status: string;
  sitemaps: SitemapEntry[];
  totals: { submitted: number; indexed: number; warnings: number; errors: number };
  expectedSitemapUrl: string;
  expectedSitemapSubmitted: boolean;
  reason?: string;
}

interface BusinessProfileLocation {
  locationId: string;
  title: string;
  primaryPhone: string;
  websiteUri: string;
  addressLine: string;
  locality: string;
  country: string;
  primaryCategory: string;
  rating: number | null;
  reviewCount: number | null;
  hoursSummary: string;
}

interface BusinessProfileResponse {
  success: boolean;
  status: string;
  locations: BusinessProfileLocation[];
  reason?: string;
}

interface IngestResponse {
  success: boolean;
  status?: string;
  opportunitiesCreated?: number;
  skipped?: number;
  rowsFetched?: number;
  reason?: string;
  error?: string;
}

/** One row from the GA4 Analytics Data API report endpoint. */
interface Ga4ReportRow {
  dimensions: Record<string, string>;
  metrics: Record<string, number>;
}

interface Ga4ReportResponse {
  success: boolean;
  status: string;
  configured: boolean;
  propertyId: string | null;
  preset: string;
  label: string;
  rows: Ga4ReportRow[];
  totals: Record<string, number>;
  rowCount: number;
  sampled: boolean | null;
  dataFreshness: string | null;
  period: { startDate: string; endDate: string };
  fetchedAt: string | null;
  reason?: string;
  note: string;
  error?: string;
}

/**
 * Acquisition reports the specification requires, mapped to the named presets the
 * API exposes. Traffic source, the organic/referral/direct split, campaigns and
 * landing pages are the four that matter for recruitment reporting.
 */
const GA4_PRESETS = [
  { value: 'acquisition', label: 'Source / medium' },
  { value: 'channels', label: 'Channel group (organic, referral, direct)' },
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'landingPages', label: 'Landing pages' },
  { value: 'daily', label: 'Sessions per day' },
  { value: 'events', label: 'Events received' },
  { value: 'countries', label: 'Countries' },
  { value: 'devices', label: 'Devices' },
] as const;

const GROUP_OPTIONS = [
  { value: 'channel', label: 'Channel (source / medium)' },
  { value: 'source', label: 'Source' },
  { value: 'medium', label: 'Medium' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'landingPage', label: 'Landing page' },
  { value: 'firstTouchSource', label: 'First-touch source' },
] as const;

const SERVICE_LABELS: Record<string, string> = {
  GA4: 'Google Analytics 4',
  GA4_DATA_API: 'GA4 Analytics Data API (reporting)',
  GTM: 'Google Tag Manager',
  SEARCH_CONSOLE: 'Search Console',
  BUSINESS_PROFILE: 'Google Business Profile',
  YOUTUBE: 'YouTube',
  MAPS: 'Maps Platform',
  CLOUD: 'Google Cloud',
};

function costTierBadge(tier: CostTier) {
  if (tier === 'FREE') {
    return (
      <Badge className="border-crm-success-border bg-crm-success-bg text-crm-success-text">
        <Banknote className="mr-1 size-3" /> FREE — no billing account
      </Badge>
    );
  }
  if (tier === 'FREE_TIER') {
    return (
      <Badge className="border-crm-warning-border bg-crm-warning-bg text-crm-warning-text">
        <Banknote className="mr-1 size-3" /> FREE TIER — billing account required
      </Badge>
    );
  }
  return (
    <Badge className="border-crm-danger-border bg-crm-danger-bg text-crm-danger-text">
      <Banknote className="mr-1 size-3" /> PAID — billed usage
    </Badge>
  );
}

function verdictBadge(verdict: Verdict) {
  const styles: Record<Verdict, string> = {
    PASS: 'border-crm-success-border bg-crm-success-bg text-crm-success-text',
    PARTIAL: 'border-sky-300 bg-sky-50 text-sky-900',
    NOT_CONFIGURED: 'border-[var(--alo-border-strong)] bg-[var(--alo-surface-muted)] text-[var(--alo-body)]',
    NOT_VERIFIED: 'border-crm-warning-border bg-crm-warning-bg text-crm-warning-text',
    BLOCKED: 'border-crm-danger-border bg-crm-danger-bg text-crm-danger-text',
  };
  const icons: Record<Verdict, typeof CheckCircle2> = {
    PASS: CheckCircle2,
    PARTIAL: Info,
    NOT_CONFIGURED: XCircle,
    NOT_VERIFIED: AlertTriangle,
    BLOCKED: AlertTriangle,
  };
  const Icon = icons[verdict];
  return (
    <Badge className={styles[verdict]}>
      <Icon className="mr-1 size-3" /> {verdict.replace('_', ' ')}
    </Badge>
  );
}

function percent(value: number | null): string {
  if (value === null) return '—';
  return `${(value * 100).toFixed(2)}%`;
}


// ─────────────────────────────────────────────────────────────────────────────
// GOOGLE CONTACTS (People API)
// ─────────────────────────────────────────────────────────────────────────────
// The contacts integration is deliberately its own panel rather than a row in the
// services table, because it does something the other services do not: it WRITES to
// the CRM. The UI therefore shows a dry run before it offers an import, and it
// states the source-of-truth rule on screen (Google may fill empty fields and add
// contacts; it may never overwrite a CRM value or touch a Student).

interface ContactsStatus {
  account: string;
  scope: string;
  configured: boolean;
  authMode: string;
  note: string;
  verdict: 'PASS' | 'NOT_CONFIGURED' | 'NOT_VERIFIED' | 'FAILED';
  liveVerified: boolean;
  live: { status: string; reachable: boolean; reason: string | null } | null;
  syncedAt: string | null;
  incrementalReady: boolean;
  importedContacts: number;
  pendingReviews: number;
  lastBatch: { ranAt: string; status: string; found: number; created: number; linkedOrFilled: number; duplicates: number; errors: number } | null;
  nextSteps: string[];
}

interface ContactsPlan {
  mode: string;
  wroteNothing: boolean;
  incremental: boolean;
  truncated: boolean;
  counters?: { found: number; create: number; linkExisting: number; fillBlank: number; conflictReview: number; duplicate: number; skipped: number };
  written?: { created: number; linkedOrFilled: number; reviewQueued: number; duplicates: number; errors: number };
  samples?: Array<{ action: string; name: string; phone: string; reason: string }>;
  notice?: string;
  nextStep?: string;
}

function GoogleContactsPanel() {
  const [status, setStatus] = useState<ContactsStatus | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'check' | 'preview' | 'apply' | null>(null);
  const [plan, setPlan] = useState<ContactsPlan | null>(null);

  const loadStatus = useCallback(async (live: boolean) => {
    setBusy('check');
    setError('');
    try {
      const response = await fetch(`/api/google/contacts/status?live=${live ? 'true' : 'false'}`, { credentials: 'same-origin' });
      const data = (await response.json()) as ContactsStatus & { error?: string };
      if (!response.ok) throw new Error(data.error || `Status failed (HTTP ${response.status}).`);
      setStatus(data);
      if (live) {
        toast[data.liveVerified ? 'success' : 'error'](
          data.liveVerified
            ? 'Google answered the People API for the contacts account.'
            : data.live?.reason || 'Google did not confirm access to contacts.',
        );
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Contacts status unavailable.');
    } finally {
      setBusy(null);
    }
  }, []);

  const runSync = useCallback(async (mode: 'dry-run' | 'apply') => {
    setBusy(mode === 'dry-run' ? 'preview' : 'apply');
    setError('');
    try {
      const response = await fetch('/api/google/contacts/sync', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      });
      const data = (await response.json()) as ContactsPlan & { error?: string };
      if (!response.ok) throw new Error(data.error || `Sync failed (HTTP ${response.status}).`);
      setPlan({ ...data, mode });
      toast.success(mode === 'dry-run' ? 'Preview complete — nothing was written.' : 'Import complete.');
      if (mode === 'apply') await loadStatus(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Contacts sync failed.');
    } finally {
      setBusy(null);
    }
  }, [loadStatus]);

  useEffect(() => {
    void loadStatus(false);
  }, [loadStatus]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Users className="size-4" /> Google Contacts → central contact registry
        </CardTitle>
        <CardDescription>
          Imports the ALO Google Contacts account into the one contact registry the CRM already
          uses. Google may add contacts and fill fields ALO left empty; it never overwrites a CRM
          value, never touches a Student or Student ID, and never merges records automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        {status ? (
          <>
            <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border border-[var(--alo-border)] p-3">
                <p className="text-xs uppercase text-[var(--alo-text-muted)]">Account</p>
                <p className="truncate font-medium">{status.account}</p>
              </div>
              <div className="rounded-lg border border-[var(--alo-border)] p-3">
                <p className="text-xs uppercase text-[var(--alo-text-muted)]">Credential</p>
                <p className="font-medium">{status.configured ? 'OAuth refresh token present' : 'Not configured'}</p>
                <p className="text-xs text-[var(--alo-text-muted)]">mode: {status.authMode}</p>
              </div>
              <div className="rounded-lg border border-[var(--alo-border)] p-3">
                <p className="text-xs uppercase text-[var(--alo-text-muted)]">Live verification</p>
                <p className="font-medium">
                  {status.liveVerified ? 'Verified by a real API call' : status.live ? 'Failed' : 'Not verified'}
                </p>
                <p className="text-xs text-[var(--alo-text-muted)]">Configuration alone is never reported as working.</p>
              </div>
              <div className="rounded-lg border border-[var(--alo-border)] p-3">
                <p className="text-xs uppercase text-[var(--alo-text-muted)]">Last sync</p>
                <p className="font-medium">{status.syncedAt ? new Date(status.syncedAt).toLocaleString() : 'Never run'}</p>
                <p className="text-xs text-[var(--alo-text-muted)]">
                  {status.importedContacts} imported · {status.pendingReviews} awaiting review
                </p>
              </div>
            </div>

            <p className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-xs text-[var(--alo-body)]">
              {status.note}
            </p>

            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => void loadStatus(true)} disabled={busy !== null}>
                <ShieldCheck className="mr-2 size-4" />
                {busy === 'check' ? 'Calling Google…' : 'Verify access (live call)'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void runSync('dry-run')} disabled={busy !== null || !status.configured}>
                <Eye className="mr-2 size-4" />
                {busy === 'preview' ? 'Reading contacts…' : 'Preview import (writes nothing)'}
              </Button>
              <Button size="sm" onClick={() => void runSync('apply')} disabled={busy !== null || !status.configured}>
                <UploadCloud className="mr-2 size-4" />
                {busy === 'apply' ? 'Importing…' : 'Import into registry'}
              </Button>
            </div>

            {!status.configured ? (
              <ul className="list-disc space-y-1 pl-5 text-xs text-[var(--alo-body)]">
                {status.nextSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ul>
            ) : null}

            {status.lastBatch ? (
              <div className="rounded-lg border border-[var(--alo-border)] p-3 text-xs">
                <p className="font-semibold">Last run · {new Date(status.lastBatch.ranAt).toLocaleString()} ({status.lastBatch.status})</p>
                <p className="text-[var(--alo-text-muted)]">
                  found {status.lastBatch.found} · created {status.lastBatch.created} · linked/filled{' '}
                  {status.lastBatch.linkedOrFilled} · duplicates {status.lastBatch.duplicates} · errors{' '}
                  {status.lastBatch.errors}
                </p>
              </div>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-[var(--alo-text-muted)]">Loading Google Contacts status…</p>
        )}

        {plan ? (
          <div className="space-y-2 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-xs">
            <p className="font-semibold">
              {plan.mode === 'dry-run' ? 'Preview (nothing written)' : 'Import result'}
              {plan.truncated ? ' — page ceiling reached, run again to continue' : ''}
            </p>
            {plan.counters ? (
              <p>
                found {plan.counters.found} · new {plan.counters.create} · link {plan.counters.linkExisting} ·
                fill blanks {plan.counters.fillBlank} · review {plan.counters.conflictReview} · skipped{' '}
                {plan.counters.skipped + plan.counters.duplicate}
              </p>
            ) : null}
            {plan.written ? (
              <p>
                written: created {plan.written.created} · linked/filled {plan.written.linkedOrFilled} · queued
                for review {plan.written.reviewQueued} · duplicates {plan.written.duplicates} · errors{' '}
                {plan.written.errors}
              </p>
            ) : null}
            {plan.notice ? <p className="text-[var(--alo-text-muted)]">{plan.notice}</p> : null}
            {plan.nextStep ? <p className="text-[var(--alo-text-muted)]">{plan.nextStep}</p> : null}
            {plan.samples && plan.samples.length > 0 ? (
              <div className="max-h-56 overflow-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[var(--alo-text-muted)]">
                      <th className="p-1">Action</th>
                      <th className="p-1">Name</th>
                      <th className="p-1">Number</th>
                      <th className="p-1">Why</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.samples.map((sample, index) => (
                      <tr key={`${sample.name}-${index}`} className="border-t border-[var(--alo-border)]">
                        <td className="p-1 font-mono">{sample.action}</td>
                        <td className="p-1">{sample.name}</td>
                        <td className="p-1 font-mono">{sample.phone}</td>
                        <td className="p-1 text-[var(--alo-text-muted)]">{sample.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function GoogleStackAdminPage() {
  const [status, setStatus] = useState<GoogleStatusResponse | null>(null);
  const [statusError, setStatusError] = useState('');
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [funnel, setFunnel] = useState<FunnelResponse | null>(null);
  const [funnelError, setFunnelError] = useState('');
  const [loadingFunnel, setLoadingFunnel] = useState(false);
  const [groupBy, setGroupBy] = useState<string>('channel');
  const [days, setDays] = useState('90');

  const [performance, setPerformance] = useState<PerformanceResponse | null>(null);
  const [performanceError, setPerformanceError] = useState('');
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  const [sitemaps, setSitemaps] = useState<SitemapsResponse | null>(null);
  const [loadingSitemaps, setLoadingSitemaps] = useState(false);

  const [profile, setProfile] = useState<BusinessProfileResponse | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const [ingesting, setIngesting] = useState(false);

  const [ga4Report, setGa4Report] = useState<Ga4ReportResponse | null>(null);
  const [ga4Error, setGa4Error] = useState('');
  const [ga4Loading, setGa4Loading] = useState(false);
  const [ga4Preset, setGa4Preset] = useState<string>('acquisition');

  const loadStatus = useCallback(async (live: boolean) => {
    setLoadingStatus(true);
    setStatusError('');
    try {
      const response = await fetch(`/api/google/status?live=${live ? 'true' : 'false'}`, {
        credentials: 'same-origin',
      });
      const data = (await response.json()) as GoogleStatusResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || `Status request failed (HTTP ${response.status}).`);
      setStatus(data);
      if (live) {
        toast.success('Live verification complete — Google answered the API calls.');
      }
    } catch (error) {
      setStatusError(error instanceof Error ? error.message : 'Google stack status unavailable.');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const loadFunnel = useCallback(async (nextGroupBy: string, nextDays: string) => {
    setLoadingFunnel(true);
    setFunnelError('');
    try {
      const parsedDays = Number.parseInt(nextDays, 10);
      const safeDays = Number.isFinite(parsedDays) && parsedDays >= 1 && parsedDays <= 365 ? parsedDays : 90;
      const response = await fetch(
        `/api/analytics/conversion-funnel?groupBy=${encodeURIComponent(nextGroupBy)}&days=${safeDays}`,
        { credentials: 'same-origin' },
      );
      const data = (await response.json()) as FunnelResponse;
      if (!response.ok) throw new Error(data.error || `Funnel request failed (HTTP ${response.status}).`);
      setFunnel(data);
    } catch (error) {
      setFunnelError(error instanceof Error ? error.message : 'Conversion funnel unavailable.');
    } finally {
      setLoadingFunnel(false);
    }
  }, []);

  /**
   * GA4 acquisition report.
   *
   * Deliberately NOT part of the initial load: every call costs a Google API
   * round-trip against a shared property quota, and an operator should ask for it.
   * The response carries its own `status`, so a NOT_CONFIGURED answer is shown as
   * "not connected" rather than as a table of zeroes.
   */
  const loadGa4 = useCallback(async (preset: string) => {
    setGa4Loading(true);
    setGa4Error('');
    try {
      const response = await fetch(
        `/api/google/analytics/report?preset=${encodeURIComponent(preset)}&startDate=28daysAgo&endDate=yesterday`,
        { credentials: 'same-origin' },
      );
      const data = (await response.json()) as Ga4ReportResponse;
      if (!response.ok) throw new Error(data.error || `GA4 report failed (HTTP ${response.status}).`);
      setGa4Report(data);
      if (data.status !== 'READY') {
        toast.warning(data.reason || `GA4 reporting is ${data.status}.`);
      }
    } catch (error) {
      setGa4Error(error instanceof Error ? error.message : 'GA4 reporting unavailable.');
    } finally {
      setGa4Loading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatus(false);
    void loadFunnel('channel', '90');
  }, [loadStatus, loadFunnel]);

  const loadPerformance = useCallback(async () => {
    setLoadingPerformance(true);
    setPerformanceError('');
    try {
      const response = await fetch('/api/seo/search-console/performance?days=28&dimensions=query&pageContains=', {
        credentials: 'same-origin',
      });
      const data = (await response.json()) as PerformanceResponse & { error?: string };
      if (!response.ok) throw new Error(data.error || `Performance request failed (HTTP ${response.status}).`);
      setPerformance(data);
      if (data.status !== 'READY') {
        toast.warning(data.reason || 'Search Console returned no data.');
      }
    } catch (error) {
      setPerformanceError(error instanceof Error ? error.message : 'Search Console performance unavailable.');
    } finally {
      setLoadingPerformance(false);
    }
  }, []);

  const loadSitemaps = useCallback(async () => {
    setLoadingSitemaps(true);
    try {
      const response = await fetch('/api/seo/search-console/sitemaps', { credentials: 'same-origin' });
      const data = (await response.json()) as SitemapsResponse;
      setSitemaps(data);
      if (data.status !== 'READY') toast.warning(data.reason || 'Sitemap data unavailable.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Sitemap data unavailable.');
    } finally {
      setLoadingSitemaps(false);
    }
  }, []);

  const loadBusinessProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const response = await fetch('/api/google/business-profile', { credentials: 'same-origin' });
      const data = (await response.json()) as BusinessProfileResponse;
      setProfile(data);
      if (data.status !== 'READY') toast.warning(data.reason || 'Business Profile unavailable.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Business Profile unavailable.');
    } finally {
      setLoadingProfile(false);
    }
  }, []);

  const runIngest = useCallback(async () => {
    setIngesting(true);
    try {
      const response = await fetch('/api/seo/search-console/ingest', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: 28, dimension: 'query', rowLimit: 500 }),
      });
      const data = (await response.json()) as IngestResponse;
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.reason || `Ingest failed (HTTP ${response.status}).`);
      }
      toast.success(
        `${data.opportunitiesCreated ?? 0} SEO opportunit${(data.opportunitiesCreated ?? 0) === 1 ? 'y' : 'ies'} created from ${data.rowsFetched ?? 0} live Search Console rows.`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ingest failed.');
    } finally {
      setIngesting(false);
    }
  }, []);

  const services = status?.services ?? {};
  const serviceKeys = Object.keys(SERVICE_LABELS).filter((key) => key in services);

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--alo-text)]">Google Free Stack</h1>
          <p className="mt-1 text-sm text-[var(--alo-body)]">
            Configuration, live verification and acquisition reporting for ALO&rsquo;s Google
            integrations. Everything here is free-first: no service ALO runs requires a billing
            account.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={loadingStatus} onClick={() => void loadStatus(false)}>
            <RefreshCw className={`mr-2 size-4 ${loadingStatus ? 'animate-spin' : ''}`} />
            Configuration
          </Button>
          <Button disabled={loadingStatus} onClick={() => void loadStatus(true)}>
            <ShieldCheck className="mr-2 size-4" />
            Verify live
          </Button>
        </div>
      </div>

      {statusError ? (
        <Card className="border-crm-danger-border">
          <CardContent className="pt-6 text-sm text-crm-danger-text" role="alert">
            {statusError}
          </CardContent>
        </Card>
      ) : null}

      {status ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Deployment</CardTitle>
            <CardDescription>
              Analytics inject in production only, so development and preview traffic cannot reach
              the production GA4 property.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <span>
                <span className="font-medium text-[var(--alo-body)]">Environment:</span>{' '}
                <Badge variant="outline">{status.environment}</Badge>
              </span>
              <span>
                <span className="font-medium text-[var(--alo-body)]">Site:</span> {status.siteUrl}
              </span>
              <span>
                <span className="font-medium text-[var(--alo-body)]">Tag loader:</span>{' '}
                <Badge variant="outline">{status.tagLoader.loader.toUpperCase()}</Badge>{' '}
                {status.tagLoader.id ? <code className="text-xs">{status.tagLoader.id}</code> : null}
              </span>
              <span>
                <span className="font-medium text-[var(--alo-body)]">Live checks run:</span>{' '}
                {status.liveChecksPerformed ? 'yes' : 'no — configuration only'}
              </span>
            </div>
            <p className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
              <Info className="mr-1 inline size-3" />
              {status.tagLoader.reason}
            </p>
            {status.costSummary.paidServicesInUse.length > 0 ? (
              <p className="rounded-lg border border-crm-danger-border bg-crm-danger-bg p-3 text-xs text-crm-danger-text">
                <AlertTriangle className="mr-1 inline size-3" />
                A PAID Google service is configured:{' '}
                {status.costSummary.paidServicesInUse.join(', ')}. It requires a Cloud billing
                account, restricted API keys and a budget alert. See docs/GOOGLE-FREE-STACK.md.
              </p>
            ) : (
              <p className="rounded-lg border border-crm-success-border bg-crm-success-bg p-3 text-xs text-crm-success-text">
                <CheckCircle2 className="mr-1 inline size-3" />
                No paid Google service is in use. Configured: {status.costSummary.free.join(', ') || 'none'}.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* ── Service status ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {serviceKeys.map((key) => {
          const service = services[key];
          return (
            <Card key={key}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base">{SERVICE_LABELS[key] ?? key}</CardTitle>
                  {verdictBadge(service.status)}
                </div>
                <CardDescription className="pt-1">{costTierBadge(service.costTier)}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span>
                    <span className="font-medium text-[var(--alo-body)]">Configured:</span>{' '}
                    {service.configured ? 'yes' : 'no'}
                  </span>
                  <span>
                    <span className="font-medium text-[var(--alo-body)]">Live verified:</span>{' '}
                    {service.liveVerified === null ? 'not testable from the server' : service.liveVerified ? 'yes' : 'no'}
                  </span>
                  <span>
                    <span className="font-medium text-[var(--alo-body)]">Billing account:</span>{' '}
                    {service.billingRequired ? 'REQUIRED' : 'not required'}
                  </span>
                </div>
                <p className="text-[var(--alo-body)]">{service.reason}</p>
                {key === 'SEARCH_CONSOLE' ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" disabled={loadingPerformance} onClick={() => void loadPerformance()}>
                      <TrendingUp className="mr-1 size-3" /> Top queries
                    </Button>
                    <Button size="sm" variant="outline" disabled={loadingSitemaps} onClick={() => void loadSitemaps()}>
                      <Search className="mr-1 size-3" /> Sitemaps
                    </Button>
                    <Button size="sm" variant="outline" disabled={ingesting || !service.configured} onClick={() => void runIngest()}>
                      <RefreshCw className={`mr-1 size-3 ${ingesting ? 'animate-spin' : ''}`} /> Ingest opportunities
                    </Button>
                  </div>
                ) : null}
                {key === 'BUSINESS_PROFILE' ? (
                  <Button size="sm" variant="outline" className="mt-1" disabled={loadingProfile} onClick={() => void loadBusinessProfile()}>
                    <MapPin className="mr-1 size-3" /> Read locations
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Search Console performance ─────────────────────────────── */}
      {performance ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search Console — top queries</CardTitle>
            <CardDescription>
              {performance.status === 'READY'
                ? `${performance.window.startDate} to ${performance.window.endDate}. Live data from Google.`
                : `Status ${performance.status}. ${performance.reason ?? ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {performanceError ? <p className="text-crm-danger-text" role="alert">{performanceError}</p> : null}
            {performance.status !== 'READY' ? (
              <p className="rounded-lg border border-crm-warning-border bg-crm-warning-bg p-3 text-xs text-crm-warning-text">
                <AlertTriangle className="mr-1 inline size-3" />
                No data is displayed because Google did not return any. This is not a zero-traffic
                result — it is a connection state, and the two must not look the same.
              </p>
            ) : performance.totals ? (
              <>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                  <span><span className="font-medium">Clicks:</span> {performance.totals.clicks}</span>
                  <span><span className="font-medium">Impressions:</span> {performance.totals.impressions}</span>
                  <span><span className="font-medium">CTR:</span> {percent(performance.totals.ctr)}</span>
                  <span><span className="font-medium">Avg position:</span> {performance.totals.position.toFixed(1)}</span>
                  <span><span className="font-medium">Rows:</span> {performance.totals.rowCount}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b text-[var(--alo-body)]">
                      <tr>
                        <th className="p-2">Query</th>
                        <th className="p-2 text-right">Clicks</th>
                        <th className="p-2 text-right">Impressions</th>
                        <th className="p-2 text-right">CTR</th>
                        <th className="p-2 text-right">Position</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performance.rows.slice(0, 50).map((row, index) => (
                        <tr key={`${row.query ?? row.url ?? index}`} className="border-b last:border-0">
                          <td className="max-w-md truncate p-2">{row.query ?? row.url ?? '—'}</td>
                          <td className="p-2 text-right">{row.clicks}</td>
                          <td className="p-2 text-right">{row.impressions}</td>
                          <td className="p-2 text-right">{percent(row.ctr)}</td>
                          <td className="p-2 text-right">{row.position.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-[var(--alo-text-muted)]">
                  Position is the impression-weighted average Google reported. Search Console is not
                  a rank tracker and does not return a position for an arbitrary keyword.
                </p>
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* ── Sitemaps ───────────────────────────────────────────────── */}
      {sitemaps ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Search Console — sitemaps</CardTitle>
            <CardDescription>
              {sitemaps.status === 'READY'
                ? 'What Google has actually received, and how much of it was indexed.'
                : `Status ${sitemaps.status}. ${sitemaps.reason ?? ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {sitemaps.status === 'READY' ? (
              <>
                <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs">
                  <span><span className="font-medium">Submitted:</span> {sitemaps.totals.submitted}</span>
                  <span><span className="font-medium">Indexed:</span> {sitemaps.totals.indexed}</span>
                  <span><span className="font-medium">Warnings:</span> {sitemaps.totals.warnings}</span>
                  <span><span className="font-medium">Errors:</span> {sitemaps.totals.errors}</span>
                </div>
                <p className="text-xs">
                  Expected sitemap:{' '}
                  <code className="rounded bg-[var(--alo-surface-muted)] px-1">{sitemaps.expectedSitemapUrl}</code>{' '}
                  {sitemaps.expectedSitemapSubmitted ? (
                    <Badge className="border-crm-success-border bg-crm-success-bg text-crm-success-text">submitted to Google</Badge>
                  ) : (
                    <Badge className="border-crm-warning-border bg-crm-warning-bg text-crm-warning-text">NOT submitted</Badge>
                  )}
                </p>
                <ul className="space-y-1 text-xs">
                  {sitemaps.sitemaps.map((sitemap) => (
                    <li key={sitemap.path} className="flex flex-wrap justify-between gap-2 border-b py-1 last:border-0">
                      <code className="truncate">{sitemap.path}</code>
                      <span className="text-[var(--alo-body)]">
                        {(sitemap.contents ?? []).map((content) => `${content.indexed ?? 0}/${content.submitted ?? 0} indexed`).join(', ') || 'no contents reported'}
                        {sitemap.lastSubmitted ? ` · submitted ${sitemap.lastSubmitted.slice(0, 10)}` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[var(--alo-text-muted)]">
                  A gap between submitted and indexed is normal — Google chooses what to index and
                  does not explain every exclusion.
                </p>
              </>
            ) : (
              <p className="rounded-lg border border-crm-warning-border bg-crm-warning-bg p-3 text-xs text-crm-warning-text">
                <AlertTriangle className="mr-1 inline size-3" />
                Sitemap status could not be read from Google. The sitemap itself is still served at{' '}
                <code>{sitemaps.expectedSitemapUrl}</code>; only the Search Console view of it is
                unavailable.
              </p>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* ── Business Profile ───────────────────────────────────────── */}
      {profile ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Google Business Profile — locations</CardTitle>
            <CardDescription>
              {profile.status === 'READY'
                ? 'Read live from Google. Real locations only — nothing here can create one.'
                : `Status ${profile.status}. ${profile.reason ?? ''}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {profile.status === 'READY' && profile.locations.length > 0 ? (
              <div className="space-y-3">
                {profile.locations.map((location) => (
                  <div key={location.locationId} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-semibold text-[var(--alo-text)]">{location.title || 'Untitled location'}</p>
                      {location.rating !== null ? (
                        <Badge variant="outline">
                          {location.rating.toFixed(1)} ★ · {location.reviewCount ?? 0} reviews
                        </Badge>
                      ) : null}
                    </div>
                    <dl className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
                      <div><dt className="inline font-medium text-[var(--alo-body)]">Phone: </dt><dd className="inline">{location.primaryPhone || '—'}</dd></div>
                      <div><dt className="inline font-medium text-[var(--alo-body)]">Category: </dt><dd className="inline">{location.primaryCategory || '—'}</dd></div>
                      <div><dt className="inline font-medium text-[var(--alo-body)]">Website: </dt><dd className="inline">{location.websiteUri || '—'}</dd></div>
                      <div><dt className="inline font-medium text-[var(--alo-body)]">Address: </dt><dd className="inline">{[location.addressLine, location.locality, location.country].filter(Boolean).join(', ') || '—'}</dd></div>
                    </dl>
                    {location.hoursSummary ? (
                      <p className="mt-2 text-xs text-[var(--alo-body)]"><span className="font-medium">Hours:</span> {location.hoursSummary}</p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : profile.status === 'READY' ? (
              <p className="rounded-lg border border-crm-warning-border bg-crm-warning-bg p-3 text-xs text-crm-warning-text">
                <AlertTriangle className="mr-1 inline size-3" />
                The credential is connected but no location is readable. ALO must not create a
                location programmatically — create the real office listing in Google Business
                Profile first, then re-read it here.
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* ── GA4 acquisition reporting (Analytics Data API) ─────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acquisition — GA4 (Analytics Data API)</CardTitle>
          <CardDescription>
            Live figures read from the configured GA4 property. This panel never substitutes a zero
            for a failed Google request: if reporting is not connected, or Google refuses, it says so
            and shows nothing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="ga4-preset" className="text-xs">Report</Label>
              <select
                id="ga4-preset"
                value={ga4Preset}
                onChange={(event) => setGa4Preset(event.target.value)}
                className="h-9 rounded-md border border-[var(--alo-border)] bg-white px-2 text-sm"
              >
                {GA4_PRESETS.map((preset) => (
                  <option key={preset.value} value={preset.value}>{preset.label}</option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={ga4Loading}
              onClick={() => void loadGa4(ga4Preset)}
            >
              <RefreshCw className={`mr-1 size-3 ${ga4Loading ? 'animate-spin' : ''}`} />
              {ga4Loading ? 'Reading GA4…' : 'Load report'}
            </Button>
            <span className="text-xs text-[var(--alo-text-muted)]">
              Last 28 complete days (GA4 lags up to 48h).
            </span>
          </div>

          {ga4Error ? (
            <p className="rounded-md border border-crm-danger-border bg-crm-danger-bg p-2 text-crm-danger-text">
              {ga4Error}
            </p>
          ) : null}

          {!ga4Report && !ga4Error ? (
            <p className="text-[var(--alo-text-muted)]">
              Load a report to read acquisition data from GA4. Nothing is fetched automatically,
              because each call consumes the property&apos;s reporting quota.
            </p>
          ) : null}

          {ga4Report ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {ga4Report.status === 'READY' ? (
                  <Badge className="border-crm-success-border bg-crm-success-bg text-crm-success-text">
                    <CheckCircle2 className="mr-1 size-3" /> READY — {ga4Report.rowCount} rows
                  </Badge>
                ) : (
                  <Badge className="border-crm-danger-border bg-crm-danger-bg text-crm-danger-text">
                    <AlertTriangle className="mr-1 size-3" /> {ga4Report.status}
                  </Badge>
                )}
                {ga4Report.propertyId ? (
                  <Badge variant="outline">property {ga4Report.propertyId}</Badge>
                ) : null}
                <Badge variant="outline">
                  {ga4Report.period.startDate} → {ga4Report.period.endDate}
                </Badge>
                {ga4Report.sampled ? <Badge variant="outline">sampled / (other) row present</Badge> : null}
                {ga4Report.fetchedAt ? (
                  <span className="text-xs text-[var(--alo-text-muted)]">
                    fetched {new Date(ga4Report.fetchedAt).toLocaleString()}
                  </span>
                ) : null}
              </div>

              {ga4Report.reason ? (
                <p className="rounded-md border border-crm-warning-border bg-crm-warning-bg p-2 text-crm-warning-text">
                  {ga4Report.reason}
                </p>
              ) : null}

              {ga4Report.status === 'READY' && ga4Report.rows.length === 0 ? (
                <p className="text-[var(--alo-text-muted)]">
                  GA4 answered and the property has no rows for this period. That is a real result, not
                  a configuration error — a new property or a period before tagging started looks exactly
                  like this.
                </p>
              ) : null}

              {ga4Report.rows.length > 0 ? (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-[var(--alo-border)] text-left">
                          {Object.keys(ga4Report.rows[0].dimensions).map((dimension) => (
                            <th key={dimension} className="px-2 py-1 font-semibold">{dimension}</th>
                          ))}
                          {Object.keys(ga4Report.rows[0].metrics).map((metric) => (
                            <th key={metric} className="px-2 py-1 text-right font-semibold">{metric}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ga4Report.rows.slice(0, 50).map((row, index) => (
                          <tr key={`${index}-${Object.values(row.dimensions).join('-')}`} className="border-b border-[var(--alo-border)]/50">
                            {Object.keys(ga4Report.rows[0].dimensions).map((dimension) => (
                              <td key={dimension} className="px-2 py-1">{row.dimensions[dimension] || '(not set)'}</td>
                            ))}
                            {Object.keys(ga4Report.rows[0].metrics).map((metric) => (
                              <td key={metric} className="px-2 py-1 text-right tabular-nums">
                                {Number.isFinite(row.metrics[metric])
                                  ? row.metrics[metric].toLocaleString(undefined, { maximumFractionDigits: 2 })
                                  : '—'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {ga4Report.rows.length > 50 ? (
                    <p className="text-xs text-[var(--alo-text-muted)]">
                      Showing the top 50 of {ga4Report.rows.length} rows (sorted by the report&apos;s
                      primary metric).
                    </p>
                  ) : null}
                  <div className="flex flex-wrap gap-3 text-xs text-[var(--alo-text-muted)]">
                    {Object.entries(ga4Report.totals).map(([metric, value]) => (
                      <span key={metric}>
                        <strong className="text-[var(--alo-text)]">{metric}:</strong>{' '}
                        {value.toLocaleString(undefined, { maximumFractionDigits: 2 })} (Google total)
                      </span>
                    ))}
                  </div>
                </>
              ) : null}

              <p className="text-xs text-[var(--alo-text-muted)]">{ga4Report.note}{ga4Report.dataFreshness ? ` ${ga4Report.dataFreshness}` : ''}</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* ── Conversion funnel ──────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acquisition → enrolment funnel</CardTitle>
          <CardDescription>
            Built from the ALO database, not from GA4. Each lead carries the attribution it arrived
            with, so a campaign can be followed all the way to enrolment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="funnel-group" className="text-xs">Group by</Label>
              <select
                id="funnel-group"
                value={groupBy}
                onChange={(event) => setGroupBy(event.target.value)}
                className="h-9 rounded-md border border-[var(--alo-border-strong)] bg-white px-2 text-sm"
              >
                {GROUP_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="funnel-days" className="text-xs">Days</Label>
              <input
                id="funnel-days"
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(event) => setDays(event.target.value)}
                className="h-9 w-24 rounded-md border border-[var(--alo-border-strong)] px-2 text-sm"
              />
            </div>
            <Button
              disabled={loadingFunnel}
              onClick={() => void loadFunnel(groupBy, days)}
            >
              <RefreshCw className={`mr-2 size-4 ${loadingFunnel ? 'animate-spin' : ''}`} />
              Load funnel
            </Button>
          </div>

          {funnelError ? <p className="text-crm-danger-text" role="alert">{funnelError}</p> : null}

          {funnel ? (
            <>
              <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-lg border bg-[var(--alo-page)] p-3 text-xs">
                <span><span className="font-semibold">Leads:</span> {funnel.totals.leads}</span>
                <span><span className="font-semibold">Qualified:</span> {funnel.totals.qualified}</span>
                <span><span className="font-semibold">Applications:</span> {funnel.totals.applications}</span>
                <span><span className="font-semibold">Enrolments:</span> {funnel.totals.enrolments}</span>
                <span><span className="font-semibold">Unattributed leads:</span> {funnel.unattributedLeads}</span>
                <span><span className="font-semibold">Unjoinable leads:</span> {funnel.totals.leadsWithoutStudentLink}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b text-[var(--alo-body)]">
                    <tr>
                      <th className="p-2">{GROUP_OPTIONS.find((option) => option.value === funnel.groupBy)?.label ?? 'Group'}</th>
                      <th className="p-2 text-right">Leads</th>
                      <th className="p-2 text-right">Qualified</th>
                      <th className="p-2 text-right">Applications</th>
                      <th className="p-2 text-right">Enrolments</th>
                      <th className="p-2 text-right">Lead → qual.</th>
                      <th className="p-2 text-right">Qual. → app.</th>
                      <th className="p-2 text-right">App. → enrol.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funnel.rows.map((row) => (
                      <tr key={row.key} className="border-b last:border-0">
                        <td className="max-w-xs p-2">
                          <span className="block truncate font-medium text-[var(--alo-text)]">{row.key}</span>
                          {row.landingPage !== 'unknown' ? (
                            <span className="block truncate text-[var(--alo-text-muted)]">{row.landingPage}</span>
                          ) : null}
                        </td>
                        <td className="p-2 text-right">{row.leads}</td>
                        <td className="p-2 text-right" title={`${row.qualifiedByStatus} by status, ${row.qualifiedByScore} by score tier`}>
                          {row.qualified}
                        </td>
                        <td className="p-2 text-right" title={`${row.crmApplications} CRM, ${row.portalApplications} portal`}>
                          {row.applications}
                        </td>
                        <td className="p-2 text-right">{row.enrolments}</td>
                        <td className="p-2 text-right">{percent(row.conversionRates.leadToQualified)}</td>
                        <td className="p-2 text-right">{percent(row.conversionRates.qualifiedToApplication)}</td>
                        <td className="p-2 text-right">{percent(row.conversionRates.applicationToEnrolment)}</td>
                      </tr>
                    ))}
                    {funnel.rows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-4 text-center text-[var(--alo-text-muted)]">
                          No leads in this window. Nothing is displayed rather than a zeroed row,
                          because an empty period and a broken query must not look identical.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-xs text-[var(--alo-body)]">
                <p className="font-semibold text-[var(--alo-body)]">How to read this</p>
                {funnel.caveats.map((caveat) => (
                  <p key={caveat}>• {caveat}</p>
                ))}
                <p>
                  • Enrolment means an <code>Application</code> at stage{' '}
                  {funnel.enrolmentDefinition.applicationStages.join(', ')} or a portal application at
                  stage <code>{funnel.enrolmentDefinition.portalStage}</code>.
                </p>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <GoogleContactsPanel />

      {/* ── Links to the existing SEO surfaces (never forked) ───────── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Existing SEO surfaces</CardTitle>
          <CardDescription>
            These already existed and are deliberately not duplicated here.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <Button variant="outline" size="sm" asChild>
            <a href="/crm/seo-manager">
              <ExternalLink className="mr-2 size-4" /> SEO keyword &amp; approval workbench
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/seo/link-health">
              <ExternalLink className="mr-2 size-4" /> Link health
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/admin/seo/orphan-pages">
              <ExternalLink className="mr-2 size-4" /> Orphan pages
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/sitemap.xml">
              <ExternalLink className="mr-2 size-4" /> Live sitemap.xml
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="/robots.txt">
              <ExternalLink className="mr-2 size-4" /> Live robots.txt
            </a>
          </Button>
        </CardContent>
      </Card>

      {status?.note ? (
        <p className="text-xs text-[var(--alo-text-muted)]">{status.note}</p>
      ) : null}
    </div>
  );
}
