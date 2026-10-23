'use client';

// ============================================================
// UNIVERSITY / INSTITUTION PORTAL (spec s39, s69, s116)
// ============================================================
// Institution-facing view of applications addressed to that institution.
//
// Rules enforced in this UI:
//   * The tenant comes from the server. The universityId is resolved from the
//     STORED account row of the signed-in representative, so this page has no
//     institution selector and cannot be pointed at another university (s69).
//   * A status change is a PROPOSAL, never an update. The server returns 202 with
//     requiresAloApproval:true, and the UI says so in the same words, so a
//     representative cannot believe they changed a student's record (s116).
//   * Actions the account lacks permission for are not rendered. A permission
//     refusal from the API is shown with its real code rather than a generic
//     error.
//   * Deposits are COUNTS only. The API deliberately returns no amounts and no
//     payer identity, so this page cannot show money it was never given.
//   * NOT_CONFIGURED (feature flag off) and "no linked account" render as
//     distinct, honest states (s94).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Building2,
  Search,
  RefreshCw,
  FileText,
  ClipboardCheck,
  BarChart3,
  Wallet,
  Lock,
  Info,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

interface Application {
  id: string;
  applicationCode: string;
  courseName: string;
  level: string;
  intake: string;
  country: string;
  stage: string;
  safeStatus: string;
  documentStatus: string;
  offerStatus: string;
  casI20CoeStatus: string;
  deadlineDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ApplicationDocument {
  id: string;
  documentType: string;
  fileName: string;
  status: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  universityId: string;
  totalApplications: number;
  offers: number;
  enrolled: number;
  conversionRate: number;
  byStage: Array<{ stage: string; count: number }>;
  byCountry: Array<{ country: string; count: number }>;
}

interface Deposits {
  universityId: string;
  depositPaid: number;
  depositPending: number;
  overdue: number;
}

type PortalState = 'loading' | 'ready' | 'not_configured' | 'no_account' | 'denied' | 'error';

/** Stages a representative may propose. ALO retains the authoritative list. */
const PROPOSABLE_STAGES = [
  'ACKNOWLEDGEMENT_RECEIVED',
  'UNDER_REVIEW',
  'CONDITIONAL_OFFER',
  'UNCONDITIONAL_OFFER',
  'REJECTED',
  'CAS_ISSUED',
  'I20_ISSUED',
  'COE_ISSUED',
];

const DOC_STATUS_STYLE: Record<string, string> = {
  VERIFIED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  APPROVED: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  PENDING: 'border-[var(--alo-border)] bg-[var(--alo-brand-pale)] text-[var(--alo-brand-deep)]',
  REJECTED: 'border-red-200 bg-red-50 text-red-700',
  EXPIRED: 'border-amber-200 bg-amber-50 text-amber-800',
};

export default function UniversityPortalPage() {
  const [state, setState] = useState<PortalState>('loading');
  const [message, setMessage] = useState('');

  const [universityId, setUniversityId] = useState('');
  const [role, setRole] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('');
  const [loadingList, setLoadingList] = useState(false);

  const [stats, setStats] = useState<Stats | null>(null);
  const [statsError, setStatsError] = useState('');
  const [deposits, setDeposits] = useState<Deposits | null>(null);
  const [depositsError, setDepositsError] = useState('');

  const [openId, setOpenId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState('');

  const [proposeFor, setProposeFor] = useState<Application | null>(null);
  const [proposedStage, setProposedStage] = useState('');
  const [proposalNote, setProposalNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const can = useCallback(
    (permission: string) => permissions.includes(permission),
    [permissions],
  );

  const loadApplications = useCallback(async (nextSearch: string, nextStage: string) => {
    setLoadingList(true);
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (nextSearch.trim()) params.set('search', nextSearch.trim());
      if (nextStage.trim()) params.set('stage', nextStage.trim());
      const res = await fetch(`/api/university-portal/applications?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);

      if (json?.status === 'NOT_CONFIGURED') {
        setState('not_configured');
        setMessage(json.error || 'The university portal is not enabled.');
        return;
      }
      if (res.status === 403) {
        const reason = String(json?.error || '');
        setState(reason.includes('No active university portal account') ? 'no_account' : 'denied');
        setMessage(reason || 'Access denied.');
        return;
      }
      if (!res.ok || !json?.success) {
        setState('error');
        setMessage(json?.error || `Request failed with status ${res.status}.`);
        return;
      }
      setUniversityId(json.universityId ?? '');
      setRole(json.role ?? '');
      setPermissions(Array.isArray(json.permissions) ? json.permissions : []);
      setApplications(json.applications ?? []);
      setTotal(json.total ?? 0);
      setState('ready');
    } catch (error) {
      setState('error');
      setMessage(error instanceof Error ? error.message : 'Could not reach the university portal.');
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsError('');
    try {
      const res = await fetch('/api/university-portal/stats', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setStatsError(json?.error || 'Recruitment data is not available for this account.');
        setStats(null);
        return;
      }
      setStats(json as Stats);
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : 'Could not load statistics.');
      setStats(null);
    }
  }, []);

  const loadDeposits = useCallback(async () => {
    setDepositsError('');
    try {
      const res = await fetch('/api/university-portal/deposits', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setDepositsError(json?.error || 'Deposit data is not available for this account.');
        setDeposits(null);
        return;
      }
      setDeposits(json as Deposits);
    } catch (error) {
      setDepositsError(error instanceof Error ? error.message : 'Could not load deposits.');
      setDeposits(null);
    }
  }, []);

  useEffect(() => {
    void loadApplications('', '');
  }, [loadApplications]);

  // Stats and deposits are separately permissioned; load them once identity is known.
  useEffect(() => {
    if (state !== 'ready') return;
    if (permissions.includes('view_recruitment_data')) void loadStats();
    if (permissions.includes('view_deposits')) void loadDeposits();
  }, [state, permissions, loadStats, loadDeposits]);

  async function loadDocuments(applicationId: string) {
    setDocsLoading(true);
    setDocsError('');
    setDocuments([]);
    try {
      const res = await fetch(`/api/university-portal/applications/${encodeURIComponent(applicationId)}/documents`, {
        cache: 'no-store',
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setDocsError(json?.error || `Request failed with status ${res.status}.`);
        return;
      }
      setDocuments(json.documents ?? []);
    } catch (error) {
      setDocsError(error instanceof Error ? error.message : 'Could not load documents.');
    } finally {
      setDocsLoading(false);
    }
  }

  function toggleApplication(application: Application) {
    if (openId === application.id) {
      setOpenId(null);
      return;
    }
    setOpenId(application.id);
    void loadDocuments(application.id);
  }

  async function requestDocument(application: Application) {
    const documentType = window.prompt(
      `Request a document for ${application.applicationCode || application.id}.\n\nDocument type (e.g. TRANSCRIPT, PASSPORT, IELTS):`,
    );
    if (documentType === null) return;
    if (!documentType.trim()) {
      toast.error('A document type is required.');
      return;
    }
    const reason = window.prompt('Reason the student will see:');
    if (reason === null) return;

    try {
      const res = await fetch(
        `/api/university-portal/applications/${encodeURIComponent(application.id)}/request-document`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ documentType: documentType.trim(), reason: reason.trim() }),
        },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Request failed with status ${res.status}.`);
        return;
      }
      toast.success(
        `Document request recorded for ${json.documentType}. ALO forwards it to the student; the request does not alter the document record.`,
      );
      await loadDocuments(application.id);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not record the request.');
    }
  }

  async function submitProposal() {
    if (!proposeFor) return;
    if (!proposedStage) {
      toast.error('Choose the stage you are proposing.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/university-portal/applications/${encodeURIComponent(proposeFor.id)}/propose-status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposedStage, note: proposalNote.trim() }),
        },
      );
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Request failed with status ${res.status}.`);
        return;
      }
      // Say plainly that nothing has changed yet (s116).
      toast.success(
        `Proposal submitted: ${json.currentStage} → ${json.proposedStage}. It is NOT applied yet — an ALO administrator must approve it.`,
      );
      setProposeFor(null);
      setProposedStage('');
      setProposalNote('');
      await loadApplications(search, stage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not submit the proposal.');
    } finally {
      setSubmitting(false);
    }
  }

  // ---------------- non-ready states ----------------
  if (state !== 'ready') {
    const copy: Record<Exclude<PortalState, 'ready'>, { title: string; detail: string }> = {
      loading: { title: 'Loading portal', detail: 'Resolving your institution…' },
      not_configured: {
        title: 'University portal not enabled',
        detail:
          'The institution portal is switched off on this platform. An ALO administrator can enable the UNIVERSITY_PORTAL feature flag.',
      },
      no_account: {
        title: 'No institution account linked',
        detail:
          'This login is not linked to an active university portal account. Ask your ALO contact to provision one.',
      },
      denied: {
        title: 'Access denied',
        detail: 'Your account does not permit this action, or the record belongs to another institution.',
      },
      error: { title: 'Portal unavailable', detail: 'The university portal service did not respond as expected.' },
    };
    const shown = copy[state];
    return (
      <div className="p-6">
        <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
          <CardContent className="flex flex-col items-center gap-3 pt-12 pb-12 text-center">
            {state === 'loading' ? (
              <RefreshCw className="size-9 animate-spin text-[var(--alo-text-muted)]" />
            ) : (
              <Lock className="size-9 text-[var(--alo-text-muted)]" />
            )}
            <h1 className="text-base font-bold text-[var(--alo-text)]">{shown.title}</h1>
            <p className="max-w-md text-sm text-[var(--alo-body)]">{message || shown.detail}</p>
            {message && state !== 'loading' && (
              <p className="max-w-md rounded-lg bg-[var(--alo-page)] px-3 py-2 font-mono text-[11px] text-[var(--alo-text-muted)]">
                reason: {message}
              </p>
            )}
            {state !== 'loading' && (
              <Button variant="outline" size="sm" onClick={() => void loadApplications(search, stage)}>
                <RefreshCw className="mr-1.5 size-3.5" />
                Try again
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--alo-text)]">
            <Building2 className="size-5 text-[var(--alo-brand)]" />
            Institution Portal
          </h1>
          <p className="mt-1 text-sm text-[var(--alo-body)]">
            Applications addressed to your institution. Your institution is resolved from your
            account — it cannot be changed here.
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-xs font-semibold text-[var(--alo-text)]">{universityId}</p>
          <p className="text-[11px] text-[var(--alo-text-muted)]">{role.replace('_', ' ').toLowerCase()}</p>
        </div>
      </div>

      {/* Granted permissions, stated openly */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-semibold text-[var(--alo-body)]">Your permissions:</span>
        {permissions.length === 0 ? (
          <span className="text-[11px] text-[var(--alo-text-muted)]">none granted</span>
        ) : (
          permissions.map((permission) => (
            <Badge key={permission} variant="outline" className="font-mono text-[11px]">
              {permission}
            </Badge>
          ))
        )}
      </div>

      {/* ---------------- Statistics ---------------- */}
      {can('view_recruitment_data') && (
        <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <BarChart3 className="size-4 text-[var(--alo-brand)]" />
              Recruitment statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsError ? (
              <p className="flex items-start gap-1.5 text-xs text-[var(--alo-body)]">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {statsError}
              </p>
            ) : stats ? (
              <div className="space-y-3">
                <div className="grid gap-2.5 sm:grid-cols-4">
                  {[
                    { label: 'Applications', value: stats.totalApplications },
                    { label: 'Offers', value: stats.offers },
                    { label: 'Enrolled', value: stats.enrolled },
                    { label: 'Conversion', value: `${stats.conversionRate}%` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">{item.label}</p>
                      <p className="text-2xl font-black text-[var(--alo-text)]">{item.value}</p>
                    </div>
                  ))}
                </div>
                {stats.totalApplications === 0 && (
                  <p className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[11px] text-amber-900">
                    No applications yet, so the conversion rate reads 0%. That is an absence of data,
                    not a measured zero.
                  </p>
                )}
                {stats.byStage.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {stats.byStage.map((row) => (
                      <Badge key={row.stage} variant="outline" className="text-[11px]">
                        {row.stage}: {row.count}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-[var(--alo-text-muted)]">Loading…</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------------- Deposits: counts only ---------------- */}
      {can('view_deposits') && (
        <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Wallet className="size-4 text-[var(--alo-brand)]" />
              Deposits
            </CardTitle>
          </CardHeader>
          <CardContent>
            {depositsError ? (
              <p className="flex items-start gap-1.5 text-xs text-[var(--alo-body)]">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {depositsError}
              </p>
            ) : deposits ? (
              <>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {[
                    { label: 'Deposit paid', value: deposits.depositPaid },
                    { label: 'Deposit pending', value: deposits.depositPending },
                    { label: 'Overdue', value: deposits.overdue },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">{item.label}</p>
                      <p className="text-2xl font-black text-[var(--alo-text)]">{item.value}</p>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-[var(--alo-text-muted)]">
                  Counts only. Payment amounts and payer identity are not exposed to institution
                  accounts.
                </p>
              </>
            ) : (
              <p className="text-xs text-[var(--alo-text-muted)]">Loading…</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ---------------- Applications ---------------- */}
      <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-bold">
            <ClipboardCheck className="size-4 text-[var(--alo-brand)]" />
            Applications ({total})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[200px] flex-1 space-y-1.5">
              <Label htmlFor="u-search" className="text-xs font-semibold">Search code or course</Label>
              <Input
                id="u-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="ALO-UK-2026-000123"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="u-stage" className="text-xs font-semibold">Stage</Label>
              <Input
                id="u-stage"
                value={stage}
                onChange={(event) => setStage(event.target.value)}
                placeholder="SUBMITTED_TO_UNIVERSITY"
                className="h-9 font-mono text-xs"
              />
            </div>
            <Button size="sm" onClick={() => void loadApplications(search, stage)} disabled={loadingList}>
              <Search className="mr-1.5 size-3.5" />
              {loadingList ? 'Loading…' : 'Search'}
            </Button>
          </div>

          {applications.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--alo-text-muted)]">
              No applications match. Only applications addressed to your institution are ever listed.
            </p>
          ) : (
            <div className="space-y-2">
              {applications.map((application) => (
                <div key={application.id} className="rounded-xl border border-[var(--alo-border)]">
                  <button
                    type="button"
                    onClick={() => toggleApplication(application)}
                    className="flex w-full flex-wrap items-center justify-between gap-2 p-3 text-left hover:bg-[var(--alo-page)]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--alo-text)]">
                        {application.applicationCode || application.id}
                      </p>
                      <p className="mt-0.5 truncate text-[11px] text-[var(--alo-body)]">
                        {[application.courseName, application.level, application.intake, application.country]
                          .filter(Boolean)
                          .join(' · ') || 'No course details'}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[11px]">{application.safeStatus || application.stage}</Badge>
                      {application.documentStatus && (
                        <Badge variant="outline" className={`text-[11px] ${DOC_STATUS_STYLE[application.documentStatus] ?? ''}`}>
                          docs: {application.documentStatus}
                        </Badge>
                      )}
                      {application.offerStatus && (
                        <Badge variant="outline" className="text-[11px]">offer: {application.offerStatus}</Badge>
                      )}
                      {application.deadlineDate && (
                        <span className="text-[11px] text-[var(--alo-text-muted)]">
                          due {new Date(application.deadlineDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </button>

                  {openId === application.id && (
                    <div className="space-y-3 border-t border-[var(--alo-border)] p-3">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--alo-text-muted)]">
                        <span>stage {application.stage}</span>
                        <span>CAS/I-20/CoE {application.casI20CoeStatus || '—'}</span>
                        <span>updated {new Date(application.updatedAt).toLocaleString()}</span>
                      </div>

                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-bold text-[var(--alo-text)]">
                          <FileText className="size-3.5 text-[var(--alo-brand)]" />
                          Documents ({documents.length})
                        </p>
                        {docsLoading ? (
                          <p className="mt-1.5 text-[11px] text-[var(--alo-text-muted)]">Loading documents…</p>
                        ) : docsError ? (
                          <p className="mt-1.5 rounded-lg border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">
                            {docsError}
                          </p>
                        ) : documents.length === 0 ? (
                          <p className="mt-1.5 text-[11px] text-[var(--alo-text-muted)]">No documents attached.</p>
                        ) : (
                          <div className="mt-1.5 space-y-1">
                            {documents.map((document) => (
                              <div key={document.id} className="flex items-center justify-between gap-2 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-page)] px-2.5 py-1.5">
                                <div className="min-w-0">
                                  <p className="truncate text-[11px] font-semibold text-[var(--alo-text)]">{document.documentType}</p>
                                  <p className="truncate font-mono text-[11px] text-[var(--alo-text-muted)]">
                                    {document.fileName || 'no file name'} · v{document.version}
                                  </p>
                                </div>
                                <Badge variant="outline" className={`shrink-0 text-[11px] ${DOC_STATUS_STYLE[document.status] ?? ''}`}>
                                  {document.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-1.5 border-t border-[var(--alo-border)] pt-2.5">
                        {can('request_documents') && (
                          <Button variant="outline" size="sm" onClick={() => void requestDocument(application)}>
                            <FileText className="mr-1.5 size-3.5" />
                            Request document
                          </Button>
                        )}
                        {can('update_application_status') && (
                          <Button size="sm" onClick={() => { setProposeFor(application); setProposedStage(''); setProposalNote(''); }}>
                            <Send className="mr-1.5 size-3.5" />
                            Propose status change
                          </Button>
                        )}
                        {!can('request_documents') && !can('update_application_status') && (
                          <p className="text-[11px] text-[var(--alo-text-muted)]">
                            Your account has read access only for this application.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ---------------- Proposal dialog ---------------- */}
      {proposeFor && (
        <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/30">
          <CardHeader>
            <CardTitle className="text-sm font-bold">
              Propose a status change — {proposeFor.applicationCode || proposeFor.id}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-brand-pale)] p-2.5 text-[11px] text-[var(--alo-brand-deep)]">
              This creates a PROPOSAL for ALO to review. It does not change the student&apos;s record.
              Current stage: <strong className="font-mono">{proposeFor.stage}</strong>.
            </p>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Proposed stage</Label>
              <select
                value={proposedStage}
                onChange={(event) => setProposedStage(event.target.value)}
                className="h-9 w-full max-w-sm rounded-lg border border-[var(--alo-border)] bg-white px-2 text-xs"
              >
                <option value="">Select a stage…</option>
                {PROPOSABLE_STAGES.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proposal-note" className="text-xs font-semibold">Note for the ALO team</Label>
              <Textarea
                id="proposal-note"
                value={proposalNote}
                onChange={(event) => setProposalNote(event.target.value)}
                rows={3}
                className="text-xs"
                placeholder="e.g. Unconditional offer issued 18 Oct; please update the student record."
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void submitProposal()} disabled={submitting || !proposedStage}>
                {submitting ? 'Submitting…' : 'Submit proposal'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setProposeFor(null)} disabled={submitting}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
