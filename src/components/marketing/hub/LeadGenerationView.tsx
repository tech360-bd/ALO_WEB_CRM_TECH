'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Target,
  Users,
  Filter,
  Download,
  RefreshCw,
  Sparkles,
  Globe,
  TrendingUp,
} from 'lucide-react';

type GroupByOption =
  | 'channel'
  | 'source'
  | 'medium'
  | 'campaign'
  | 'landingPage'
  | 'firstTouchSource';

interface FunnelRowView {
  key: string;
  leads: number;
  qualified: number;
  applications: number;
  enrolments: number;
  leadsWithoutStudentLink: number;
  conversionRates: {
    leadToQualified: number | null;
    qualifiedToApplication: number | null;
    leadToEnrolment: number | null;
  };
}

interface FunnelPayload {
  window: { from: string; to: string };
  groupBy: GroupByOption;
  rows: FunnelRowView[];
  totals: {
    leads: number;
    qualified: number;
    applications: number;
    enrolments: number;
    leadsWithoutStudentLink: number;
  };
}

function safeCsvCell(raw: unknown): string {
  const str = String(raw ?? '').replace(/\r?\n/g, ' ').trim();
  const guarded = /^[=+\-@]/.test(str) ? `'${str}` : str;
  if (/[",]/.test(guarded)) {
    return `"${guarded.replace(/"/g, '""')}"`;
  }
  return guarded;
}

function formatRate(rate: number | null | undefined): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) return '—';
  return `${(rate * 100).toFixed(1)}%`;
}

export default function LeadGenerationView() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterInput, setFilterInput] = useState('');
  const [appliedFilter, setAppliedFilter] = useState('');

  // First-party attribution funnel state
  const [groupBy, setGroupBy] = useState<GroupByOption>('landingPage');
  const [days, setDays] = useState<number>(90);
  const [funnel, setFunnel] = useState<FunnelPayload | null>(null);
  const [funnelLoading, setFunnelLoading] = useState(true);
  const [funnelError, setFunnelError] = useState<string | null>(null);

  const loadLeads = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const qs = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
      const response = await fetch(`/api/marketing/lead-pipeline${qs}`, {
        credentials: 'same-origin',
      });
      const json = await response.json().catch(() => ({}));
      setLeads(Array.isArray(json.leads) ? json.leads : Array.isArray(json.campaigns) ? json.campaigns : []);
    } catch {
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFunnel = useCallback(async () => {
    setFunnelLoading(true);
    setFunnelError(null);
    try {
      const response = await fetch(
        `/api/analytics/conversion-funnel?groupBy=${encodeURIComponent(groupBy)}&days=${days}`,
        { credentials: 'same-origin' },
      );
      const json = await response.json().catch(() => ({}));
      if (!response.ok || json.success === false) {
        setFunnelError(json.error || `Attribution funnel unavailable (${response.status}).`);
        setFunnel(null);
        return;
      }
      setFunnel(json as FunnelPayload);
    } catch (error) {
      setFunnelError(error instanceof Error ? error.message : 'Unable to load attribution funnel.');
      setFunnel(null);
    } finally {
      setFunnelLoading(false);
    }
  }, [groupBy, days]);

  useEffect(() => {
    void loadLeads(appliedFilter);
  }, [loadLeads, appliedFilter]);

  useEffect(() => {
    void loadFunnel();
  }, [loadFunnel]);

  const visibleLeads = useMemo(() => {
    const q = appliedFilter.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l: any) =>
      [l.name, l.fullName, l.phone, l.source, l.destination, l.preferredCountry, l.utmCampaign, l.landingPage]
        .some((v) => String(v || '').toLowerCase().includes(q)),
    );
  }, [leads, appliedFilter]);

  const exportCsv = () => {
    const headers = [
      'LeadID',
      'Name',
      'Source',
      'UTM_Source',
      'UTM_Medium',
      'UTM_Campaign',
      'LandingPage',
      'Destination',
      'Status',
      'Score',
    ];
    const rows = visibleLeads.map((l: any) =>
      [
        l.leadId || l.id,
        l.fullName || l.name,
        l.source,
        l.utmSource,
        l.utmMedium,
        l.utmCampaign || l.campaign,
        l.landingPage,
        l.preferredCountry || l.destination,
        l.status,
        l.leadScore ?? l.score ?? 0,
      ]
        .map(safeCsvCell)
        .join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `alo-lead-attribution-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--alo-text)] flex items-center gap-2">
            <Target className="w-6 h-6 text-[var(--alo-cta)]" />
            Lead Generation &amp; First-Party Funnel Attribution
          </h2>
          <p className="text-sm text-[var(--alo-text-muted)]">
            Privacy-safe UTM &amp; Course Finder first-touch capture → CRM Lead → Qualified → Application → Enrolment, computed directly from ALO Prisma rows (no third-party cookies, no guessed &ldquo;direct&rdquo; backfill).
          </p>
        </div>
        <Badge className="bg-[var(--alo-brand)] text-white">First-Party Attribution • CRM Verified</Badge>
      </div>

      {/* First-Party UTM -> Course Finder -> Enrolment Funnel Card */}
      <Card className="border-[var(--alo-border)]">
        <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--alo-cta)]" />
              First-Party Conversion Funnel (UTM / Landing Page / Course Finder → Enrolment)
            </CardTitle>
            <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">
              Unattributed leads appear under <code>unknown</code>, never invented as direct traffic.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              aria-label="Group attribution funnel by"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
              className="h-8 rounded-md border border-[var(--alo-border)] bg-white px-2 text-xs"
            >
              <option value="landingPage">Group by Landing Page (/course-finder, /destinations/*)</option>
              <option value="channel">Group by Acquisition Channel</option>
              <option value="source">Group by UTM Source</option>
              <option value="medium">Group by UTM Medium</option>
              <option value="campaign">Group by UTM Campaign</option>
              <option value="firstTouchSource">Group by Immutable First-Touch Source</option>
            </select>
            <select
              aria-label="Funnel window days"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-8 rounded-md border border-[var(--alo-border)] bg-white px-2 text-xs"
            >
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last 365 days</option>
            </select>
            <Button variant="outline" size="sm" onClick={() => void loadFunnel()} disabled={funnelLoading}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1 ${funnelLoading ? 'animate-spin' : ''}`} />
              Refresh Funnel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {funnelLoading ? (
            <Loader2 className="w-5 h-5 animate-spin text-[var(--alo-cta)]" />
          ) : funnelError ? (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              {funnelError}
            </p>
          ) : !funnel || funnel.rows.length === 0 ? (
            <p className="text-xs text-[var(--alo-text-muted)] py-4">
              No leads recorded in the selected window ({funnel?.window.from.slice(0, 10)} → {funnel?.window.to.slice(0, 10)}). Zero synthetic rows are generated.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="rounded-lg border p-2.5">
                  <p className="text-[var(--alo-text-muted)]">Leads</p>
                  <p className="text-lg font-bold tabular-nums">{funnel.totals.leads}</p>
                </div>
                <div className="rounded-lg border p-2.5">
                  <p className="text-[var(--alo-text-muted)]">Qualified</p>
                  <p className="text-lg font-bold tabular-nums">{funnel.totals.qualified}</p>
                </div>
                <div className="rounded-lg border p-2.5">
                  <p className="text-[var(--alo-text-muted)]">Applications</p>
                  <p className="text-lg font-bold tabular-nums">{funnel.totals.applications}</p>
                </div>
                <div className="rounded-lg border p-2.5">
                  <p className="text-[var(--alo-text-muted)]">Enrolments</p>
                  <p className="text-lg font-bold tabular-nums text-emerald-700">{funnel.totals.enrolments}</p>
                </div>
                <div className="rounded-lg border p-2.5">
                  <p className="text-[var(--alo-text-muted)]">Unlinked to Student</p>
                  <p className="text-lg font-bold tabular-nums">{funnel.totals.leadsWithoutStudentLink}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b text-[var(--alo-text-muted)]">
                      <th className="py-2 pr-3 font-semibold">{groupBy}</th>
                      <th className="py-2 px-2 font-semibold">Leads</th>
                      <th className="py-2 px-2 font-semibold">Qualified</th>
                      <th className="py-2 px-2 font-semibold">Applications</th>
                      <th className="py-2 px-2 font-semibold">Enrolments</th>
                      <th className="py-2 px-2 font-semibold">Lead → Qual</th>
                      <th className="py-2 pl-2 font-semibold">Lead → Enrol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funnel.rows.slice(0, 15).map((row) => (
                      <tr key={row.key} className="border-b">
                        <td className="py-2 pr-3 font-mono text-[11px] font-medium">{row.key}</td>
                        <td className="py-2 px-2 tabular-nums">{row.leads}</td>
                        <td className="py-2 px-2 tabular-nums">{row.qualified}</td>
                        <td className="py-2 px-2 tabular-nums">{row.applications}</td>
                        <td className="py-2 px-2 tabular-nums font-semibold">{row.enrolments}</td>
                        <td className="py-2 px-2 tabular-nums">{formatRate(row.conversionRates.leadToQualified)}</td>
                        <td className="py-2 pl-2 tabular-nums">{formatRate(row.conversionRates.leadToEnrolment)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-4">
          <Card>
            <CardHeader className="flex flex-wrap flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-[var(--alo-brand)]" />
                Attributed CRM Leads ({visibleLeads.length})
              </CardTitle>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setAppliedFilter(filterInput);
                }}
                className="flex gap-2"
              >
                <Input
                  placeholder="Filter source / campaign / country"
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                  className="h-8 text-xs w-52"
                />
                <Button type="submit" variant="outline" size="sm" className="h-8 text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  Filter
                </Button>
              </form>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin text-[var(--alo-cta)]" />
              ) : visibleLeads.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="w-10 h-10 text-[var(--alo-placeholder)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--alo-text-muted)]">
                    No attributed leads matched. Leads appear automatically from Course Finder, Consultation Forms, Facebook Lead Ads, and WhatsApp Intake.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleLeads.slice(0, 15).map((l: any) => (
                    <div key={l.id} className="p-3 border rounded-xl flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{l.fullName || l.name || l.phone || 'Lead'}</p>
                        <p className="text-xs text-[var(--alo-text-muted)]">
                          {l.source || '—'}
                          {l.utmCampaign ? ` • utm_campaign=${l.utmCampaign}` : ''}
                          {l.landingPage ? ` • ${l.landingPage}` : ''}
                          {' • Destination '}
                          {l.preferredCountry || l.destination || '—'}
                          {' • Score '}
                          {l.leadScore ?? l.score ?? 0}
                          {(l.hotLead || l.leadTier === 'HOT') && (
                            <Badge className="bg-[var(--alo-cta)] text-white ml-1 text-[11px]">HOT</Badge>
                          )}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {l.status || 'NEW'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--alo-cta)]" />
                Live Pipeline Sync
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p className="text-[var(--alo-body)]">
                Course Finder records first-party UTM &amp; landing context in session storage across multi-step registration and application flows.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  void loadLeads(appliedFilter);
                  void loadFunnel();
                }}
                disabled={loading || funnelLoading}
              >
                <RefreshCw className={`w-3 h-3 mr-1 ${loading || funnelLoading ? 'animate-spin' : ''}`} />
                Refresh Leads &amp; Funnel
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="w-4 h-4 text-[var(--alo-brand)]" />
                Attribution Export
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs space-y-2">
              <p className="text-[var(--alo-body)]">
                Exports currently visible leads with <code>utmSource, utmMedium, utmCampaign, landingPage</code> (formula-injection guarded).
              </p>
              <Button
                variant="outline"
                size="sm"
                disabled={visibleLeads.length === 0}
                onClick={exportCsv}
              >
                <Download className="w-3 h-3 mr-1" />
                Export CSV ({visibleLeads.length})
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
