'use client';

// ============================================================
// REGULATORY RULE VERSIONING (s106) + POLICY CHANGES (s64)
// ============================================================
// Versioned country/visa/university rules with provenance, and the alerts raised
// when a monitored source changes.
//
// Honesty rules enforced in this UI:
//   * Superseded versions stay visible. History is never hidden or rewritten, so
//     an admin can see what ALO believed on a past date (s106).
//   * An unverified rule is labelled NOT AUTHORITATIVE and carries its trust
//     weight; it is never presented as fact (s105, s93).
//   * Approving requires a reason-bearing, named action and the UI states that
//     the change takes effect for live advice immediately (s116).
//   * Verification that gets downgraded to NEEDS_REVIEW (no source supplied) is
//     reported back to the user rather than silently accepted.
//   * A detected policy change shows `applied: false` prominently: detection is
//     not application (s64).
// ============================================================

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ScrollText,
  History,
  ShieldAlert,
  RefreshCw,
  CheckCircle2,
  XCircle,
  BadgeCheck,
  Bell,
  Info,
  Plus,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';

type RuleStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'SUPERSEDED' | 'REJECTED' | 'EXPIRED';

interface RuleVersion {
  id: string;
  ruleKey: string;
  ruleType: string;
  versionNumber: number;
  payload: Record<string, unknown>;
  summary: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  sourceType: string;
  sourceUrl: string;
  sourceName: string;
  verificationStatus: string;
  verifiedBy: string;
  verifiedAt: string | null;
  status: RuleStatus;
  approvedBy: string;
  approvedAt: string | null;
  rejectionReason: string;
  changeReason: string;
  supersededById: string | null;
  countryId: string;
  universityId: string;
  scope: string;
  createdBy: string;
  createdAt: string;
}

interface PolicyAlert {
  id: string;
  ruleKey: string;
  ruleType: string;
  title: string;
  description: string;
  severity: string;
  sourceType: string;
  sourceUrl: string;
  sourceName: string;
  affectedWorkflows: string[];
  affectedStudentIds: string[];
  affectedApplicationIds: string[];
  affectedCountryIds: string[];
  impactCount: number;
  status: string;
  proposedRuleVersionId: string;
  reviewTaskId: string;
  requiresApproval: boolean;
  detectedAt: string;
}

interface StaleRule {
  id: string;
  ruleKey: string;
  ruleType: string;
  versionNumber: number;
  summary: string;
  sourceType: string;
  sourceUrl: string;
  verificationStatus: string;
  verifiedAt: string | null;
  daysSinceVerified: number | null;
  authoritative: boolean;
}

const STATUS_STYLE: Record<RuleStatus, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  PENDING_APPROVAL: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand-deep)] border-[var(--alo-border)]',
  DRAFT: 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]',
  SUPERSEDED: 'bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)] border-[var(--alo-border)]',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  EXPIRED: 'bg-amber-100 text-amber-800 border-amber-200',
};

const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-200',
  URGENT: 'bg-[var(--alo-cta-soft)] text-[var(--alo-cta-active)] border-[var(--alo-cta)]/25',
  WARNING: 'bg-amber-100 text-amber-800 border-amber-200',
  INFO: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand-deep)] border-[var(--alo-border)]',
};

const RULE_TYPES = [
  'VISA_REQUIREMENT',
  'ENTRY_REQUIREMENT',
  'ENGLISH_REQUIREMENT',
  'FINANCIAL_REQUIREMENT',
  'WORK_RIGHT',
  'APPLICATION_DEADLINE',
  'POLICY',
  'OTHER',
];

const SOURCE_TYPES = [
  'OFFICIAL_GOVERNMENT',
  'OFFICIAL_UNIVERSITY',
  'APPROVED_PARTNER',
  'VERIFIED_INTERNAL',
  'UNVERIFIED',
];

export default function RuleVersionsPage() {
  const [tab, setTab] = useState<'rules' | 'changes' | 'stale'>('rules');

  // --- rule chain ---
  const [ruleKey, setRuleKey] = useState('');
  const [history, setHistory] = useState<RuleVersion[]>([]);
  const [historyState, setHistoryState] = useState<'idle' | 'loading' | 'empty' | 'error'>('idle');
  const [historyMessage, setHistoryMessage] = useState('');

  // --- point-in-time resolution ---
  const [asOf, setAsOf] = useState('');
  const [resolved, setResolved] = useState<(RuleVersion & { authoritative?: boolean; trustWeight?: number; advisory?: string }) | null>(null);
  const [resolveNote, setResolveNote] = useState('');

  // --- propose ---
  const [showPropose, setShowPropose] = useState(false);
  const [proposing, setProposing] = useState(false);
  const [form, setForm] = useState({
    ruleType: 'VISA_REQUIREMENT',
    countryId: '',
    universityId: '',
    scope: '',
    summary: '',
    changeReason: '',
    effectiveFrom: '',
    sourceType: 'OFFICIAL_GOVERNMENT',
    sourceUrl: '',
    sourceName: '',
    payload: '{}',
  });

  // --- policy changes ---
  const [alerts, setAlerts] = useState<PolicyAlert[]>([]);
  const [alertLoading, setAlertLoading] = useState(false);

  // --- stale ---
  const [stale, setStale] = useState<StaleRule[]>([]);
  const [neverVerified, setNeverVerified] = useState(0);
  const [staleLoading, setStaleLoading] = useState(false);

  const [busyId, setBusyId] = useState<string | null>(null);

  const loadHistory = useCallback(async (key: string, atDate?: string) => {
    const trimmed = key.trim();
    if (!trimmed) {
      toast.error('Enter a rule key first, e.g. country:GBR:VISA_REQUIREMENT');
      return;
    }
    setHistoryState('loading');
    setHistoryMessage('');
    try {
      const res = await fetch(`/api/rules/versions?ruleKey=${encodeURIComponent(trimmed)}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        setHistoryState('error');
        setHistoryMessage(json?.error || `Request failed with status ${res.status}.`);
        return;
      }
      setHistory(json.history ?? []);
      setHistoryState(json.count === 0 ? 'empty' : 'idle');
      if (json.count === 0) setHistoryMessage('No version exists for this rule key yet.');
    } catch (error) {
      setHistoryState('error');
      setHistoryMessage(error instanceof Error ? error.message : 'Could not load history.');
    }

    // Also resolve what is in force, optionally at a past date.
    try {
      const params = new URLSearchParams({ ruleKey: trimmed });
      if (atDate) params.set('at', atDate);
      const res = await fetch(`/api/rules/active?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setResolved({ ...json.rule, authoritative: json.authoritative, trustWeight: json.trustWeight, advisory: json.advisory } as never);
        setResolveNote('');
      } else {
        setResolved(null);
        setResolveNote(json?.error || 'No rule version is in force for this key.');
      }
    } catch {
      setResolved(null);
      setResolveNote('Could not resolve the active version.');
    }
  }, []);

  const loadAlerts = useCallback(async () => {
    setAlertLoading(true);
    try {
      const res = await fetch('/api/policy-changes', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) setAlerts(json.alerts ?? []);
      else toast.error(json?.error || 'Could not load policy changes.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load policy changes.');
    } finally {
      setAlertLoading(false);
    }
  }, []);

  const loadStale = useCallback(async () => {
    setStaleLoading(true);
    try {
      const res = await fetch('/api/rules/stale?olderThanDays=180', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setStale(json.stale ?? []);
        setNeverVerified(json.neverVerified ?? 0);
      } else toast.error(json?.error || 'Could not load stale rules.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not load stale rules.');
    } finally {
      setStaleLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'changes') void loadAlerts();
    if (tab === 'stale') void loadStale();
  }, [tab, loadAlerts, loadStale]);

  async function propose() {
    if (!form.changeReason.trim()) {
      toast.error('A change reason is required — it becomes part of the audit record.');
      return;
    }
    if (!form.effectiveFrom) {
      toast.error('An effective date is required.');
      return;
    }
    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(form.payload);
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('not an object');
    } catch {
      toast.error('Payload must be a JSON object.');
      return;
    }
    setProposing(true);
    try {
      const res = await fetch('/api/rules/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleType: form.ruleType,
          countryId: form.countryId || null,
          universityId: form.universityId || null,
          scope: form.scope || null,
          summary: form.summary,
          changeReason: form.changeReason,
          effectiveFrom: new Date(form.effectiveFrom).toISOString(),
          sourceType: form.sourceType,
          sourceUrl: form.sourceUrl,
          sourceName: form.sourceName,
          payload,
          submitForApproval: true,
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Proposal failed with status ${res.status}.`);
        return;
      }
      toast.success(
        `Version ${json.versionNumber} created as ${json.status}. Nothing is in force until an administrator approves it.`,
      );
      setShowPropose(false);
      setRuleKey(json.ruleKey);
      await loadHistory(json.ruleKey);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Proposal failed.');
    } finally {
      setProposing(false);
    }
  }

  async function approve(version: RuleVersion) {
    if (!window.confirm(
      `Approve ${version.ruleKey} v${version.versionNumber}?\n\nThis makes it the rule in force and supersedes the previous version, which is retained as history.`,
    )) return;
    setBusyId(version.id);
    try {
      const res = await fetch(`/api/rules/versions/${version.id}/approve`, { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Approval failed with status ${res.status}.`);
        return;
      }
      toast.success(json.superseded ? `Approved. Previous version retained as SUPERSEDED.` : 'Approved and now in force.');
      await loadHistory(version.ruleKey, asOf || undefined);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Approval failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function reject(version: RuleVersion) {
    const reason = window.prompt(`Reject ${version.ruleKey} v${version.versionNumber}?\n\nReason (required, recorded in the audit trail):`);
    if (reason === null) return;
    if (reason.trim().length < 3) {
      toast.error('A reason of at least 3 characters is required.');
      return;
    }
    setBusyId(version.id);
    try {
      const res = await fetch(`/api/rules/versions/${version.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Rejection failed with status ${res.status}.`);
        return;
      }
      toast.success('Version rejected.');
      await loadHistory(version.ruleKey);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Rejection failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function verify(version: RuleVersion) {
    const sourceUrl = window.prompt('Source URL this rule was checked against:', version.sourceUrl || '');
    if (sourceUrl === null) return;
    setBusyId(version.id);
    try {
      const res = await fetch(`/api/rules/versions/${version.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: sourceUrl.trim(), verificationStatus: 'VERIFIED' }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Verification failed with status ${res.status}.`);
        return;
      }
      // Report a downgrade honestly instead of implying it was recorded as asked.
      if (json.downgraded) {
        toast.warning(json.warning || `Recorded as ${json.verificationStatus}, not VERIFIED.`);
      } else {
        toast.success(`Verification recorded as ${json.verificationStatus}.`);
      }
      await loadHistory(version.ruleKey);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Verification failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function dismissAlert(alert: PolicyAlert) {
    const reason = window.prompt(`Dismiss "${alert.title}"?\n\nReason (required):`);
    if (reason === null) return;
    if (reason.trim().length < 3) {
      toast.error('A reason of at least 3 characters is required.');
      return;
    }
    setBusyId(alert.id);
    try {
      const res = await fetch(`/api/policy-changes/${alert.id}/dismiss`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Dismiss failed with status ${res.status}.`);
        return;
      }
      toast.success('Alert dismissed with reason recorded.');
      await loadAlerts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Dismiss failed.');
    } finally {
      setBusyId(null);
    }
  }

  async function resolveAlert(alert: PolicyAlert) {
    setBusyId(alert.id);
    try {
      const res = await fetch(`/api/policy-changes/${alert.id}/resolve`, { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        toast.error(json?.error || `Resolve failed with status ${res.status}.`);
        return;
      }
      toast.success('Alert marked resolved.');
      await loadAlerts();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Resolve failed.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-[var(--alo-text)]">
            <ScrollText className="size-5 text-[var(--alo-brand)]" />
            Regulatory Rules &amp; Policy Changes
          </h1>
          <p className="mt-1 text-sm text-[var(--alo-body)]">
            Versioned visa, entry, financial and university rules with provenance. History is never
            overwritten.
          </p>
        </div>
        <div className="flex gap-2">
          {([
            { id: 'rules', label: 'Rule versions' },
            { id: 'changes', label: 'Policy changes' },
            { id: 'stale', label: 'Stale rules' },
          ] as const).map((item) => (
            <Button key={item.id} variant={tab === item.id ? 'default' : 'outline'} size="sm" onClick={() => setTab(item.id)}>
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      {/* ---------------- RULE VERSIONS ---------------- */}
      {tab === 'rules' && (
        <>
          <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
            <CardContent className="space-y-3 pt-5 pb-5">
              <div className="flex flex-wrap items-end gap-2">
                <div className="min-w-[260px] flex-1 space-y-1.5">
                  <Label htmlFor="rule-key" className="text-xs font-semibold">Rule key</Label>
                  <Input
                    id="rule-key"
                    value={ruleKey}
                    onChange={(event) => setRuleKey(event.target.value)}
                    placeholder="country:GBR:VISA_REQUIREMENT"
                    className="h-9 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="as-of" className="text-xs font-semibold">In force on (optional)</Label>
                  <Input
                    id="as-of"
                    type="date"
                    value={asOf}
                    onChange={(event) => setAsOf(event.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
                <Button size="sm" onClick={() => void loadHistory(ruleKey, asOf || undefined)}>
                  <History className="mr-1.5 size-3.5" />
                  Load chain
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowPropose((value) => !value)}>
                  <Plus className="mr-1.5 size-3.5" />
                  Propose version
                </Button>
              </div>
              <p className="text-[11px] text-[var(--alo-text-muted)]">
                Keys look like <code className="font-mono">country:GBR:VISA_REQUIREMENT:MASTERS</code> or{' '}
                <code className="font-mono">university:&#123;id&#125;:APPLICATION_DEADLINE</code>. Setting a
                past date shows what ALO believed then, not what it believes now.
              </p>
            </CardContent>
          </Card>

          {showPropose && (
            <Card className="rounded-2xl border-2 border-[var(--alo-brand)]/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold">Propose a new version</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Rule type</Label>
                    <select
                      value={form.ruleType}
                      onChange={(event) => setForm({ ...form, ruleType: event.target.value })}
                      className="h-9 w-full rounded-lg border border-[var(--alo-border)] bg-white px-2 text-xs"
                    >
                      {RULE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Source type</Label>
                    <select
                      value={form.sourceType}
                      onChange={(event) => setForm({ ...form, sourceType: event.target.value })}
                      className="h-9 w-full rounded-lg border border-[var(--alo-border)] bg-white px-2 text-xs"
                    >
                      {SOURCE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-country" className="text-xs font-semibold">Country id</Label>
                    <Input id="p-country" value={form.countryId} onChange={(e) => setForm({ ...form, countryId: e.target.value })} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-uni" className="text-xs font-semibold">University id</Label>
                    <Input id="p-uni" value={form.universityId} onChange={(e) => setForm({ ...form, universityId: e.target.value })} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-scope" className="text-xs font-semibold">Scope (e.g. MASTERS)</Label>
                    <Input id="p-scope" value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-eff" className="text-xs font-semibold">Effective from</Label>
                    <Input id="p-eff" type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-url" className="text-xs font-semibold">Source URL</Label>
                    <Input id="p-url" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://www.gov.uk/…" className="h-9 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="p-src" className="text-xs font-semibold">Source name</Label>
                    <Input id="p-src" value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} className="h-9 text-xs" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="p-summary" className="text-xs font-semibold">Summary</Label>
                  <Input id="p-summary" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} className="h-9 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-reason" className="text-xs font-semibold">Change reason (required)</Label>
                  <Textarea id="p-reason" value={form.changeReason} onChange={(e) => setForm({ ...form, changeReason: e.target.value })} rows={2} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="p-payload" className="text-xs font-semibold">Payload (JSON object)</Label>
                  <Textarea id="p-payload" value={form.payload} onChange={(e) => setForm({ ...form, payload: e.target.value })} rows={4} className="font-mono text-xs" />
                </div>

                <div className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-brand-pale)] p-2.5 text-[11px] text-[var(--alo-brand-deep)]">
                  Proposing does not change what is in force. A named administrator must approve the
                  version before it applies (human-in-the-loop).
                </div>

                <Button size="sm" onClick={() => void propose()} disabled={proposing}>
                  {proposing ? 'Proposing…' : 'Propose version'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* What is in force */}
          {(resolved || resolveNote) && (
            <Card className={`rounded-2xl border-2 ${resolved?.authoritative ? 'border-emerald-200' : 'border-amber-300'}`}>
              <CardHeader>
                <CardTitle className="text-sm font-bold">
                  {resolved ? `In force: v${resolved.versionNumber}` : 'Nothing in force'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {resolved ? (
                  <>
                    <p className="text-[var(--alo-body)]">{resolved.summary || 'No summary recorded.'}</p>
                    <pre className="overflow-x-auto rounded-lg bg-[var(--alo-page)] p-2.5 font-mono text-[11px]">
                      {JSON.stringify(resolved.payload, null, 2)}
                    </pre>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="text-[11px]">{resolved.sourceType}</Badge>
                      <Badge variant="outline" className="text-[11px]">{resolved.verificationStatus}</Badge>
                      <span className="font-mono text-[11px] text-[var(--alo-text-muted)]">
                        trust {resolved.trustWeight}
                      </span>
                      {resolved.sourceUrl && (
                        <a href={resolved.sourceUrl} target="_blank" rel="noreferrer" className="text-[11px] text-[var(--alo-brand)] underline">
                          source
                        </a>
                      )}
                    </div>
                    {resolved.advisory && (
                      <p className="flex items-start gap-1.5 rounded-lg border border-amber-300 bg-amber-50 p-2.5 font-semibold text-amber-900">
                        <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
                        {resolved.advisory}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="flex items-start gap-1.5 text-[var(--alo-body)]">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    {resolveNote}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Full chain, oldest last so the current rule is on top */}
          {historyState === 'loading' && <p className="py-6 text-center text-sm text-[var(--alo-text-muted)]">Loading…</p>}
          {(historyState === 'empty' || historyState === 'error') && (
            <p className="rounded-xl border border-[var(--alo-border)] bg-[var(--alo-page)] p-3 text-xs text-[var(--alo-body)]">{historyMessage}</p>
          )}

          {history.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--alo-text-muted)]">
                Full history — {history.length} version{history.length === 1 ? '' : 's'}, all retained
              </p>
              {[...history].reverse().map((version) => (
                <Card key={version.id} className={`rounded-2xl border-2 ${version.status === 'ACTIVE' ? 'border-emerald-200' : 'border-[var(--alo-border)]'}`}>
                  <CardContent className="space-y-2 pt-4 pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--alo-text)]">
                          v{version.versionNumber}
                          <span className="ml-2 font-mono text-[11px] font-normal text-[var(--alo-text-muted)]">{version.ruleType}</span>
                        </p>
                        <p className="mt-0.5 text-[11px] text-[var(--alo-body)]">{version.summary || 'No summary.'}</p>
                      </div>
                      <Badge variant="outline" className={`text-[11px] ${STATUS_STYLE[version.status] ?? ''}`}>
                        {version.status}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-[var(--alo-text-muted)]">
                      <span>from {new Date(version.effectiveFrom).toISOString().slice(0, 10)}</span>
                      <span>until {version.effectiveUntil ? new Date(version.effectiveUntil).toISOString().slice(0, 10) : 'open'}</span>
                      <span>src {version.sourceType}</span>
                      <span>verif {version.verificationStatus}</span>
                      {version.verifiedAt && <span>checked {new Date(version.verifiedAt).toISOString().slice(0, 10)} by {version.verifiedBy}</span>}
                      {version.approvedAt && <span>approved by {version.approvedBy}</span>}
                    </div>

                    {version.changeReason && (
                      <p className="rounded-lg bg-[var(--alo-page)] p-2 text-[11px] text-[var(--alo-body)]">
                        <strong className="font-semibold">Why:</strong> {version.changeReason}
                      </p>
                    )}
                    {version.rejectionReason && (
                      <p className="rounded-lg bg-red-50 p-2 text-[11px] text-red-800">
                        <strong className="font-semibold">Rejected:</strong> {version.rejectionReason}
                      </p>
                    )}

                    <details className="text-[11px]">
                      <summary className="cursor-pointer font-semibold text-[var(--alo-body)]">Payload</summary>
                      <pre className="mt-1.5 overflow-x-auto rounded-lg bg-[var(--alo-page)] p-2.5 font-mono text-[11px]">
                        {JSON.stringify(version.payload, null, 2)}
                      </pre>
                    </details>

                    <div className="flex flex-wrap gap-1.5 border-t border-[var(--alo-border)] pt-2.5">
                      {(version.status === 'PENDING_APPROVAL' || version.status === 'DRAFT') && (
                        <>
                          <Button size="sm" onClick={() => void approve(version)} disabled={busyId === version.id}>
                            <CheckCircle2 className="mr-1.5 size-3.5" />
                            Approve
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => void reject(version)} disabled={busyId === version.id}>
                            <XCircle className="mr-1.5 size-3.5" />
                            Reject
                          </Button>
                        </>
                      )}
                      {version.status !== 'REJECTED' && version.status !== 'SUPERSEDED' && (
                        <Button variant="outline" size="sm" onClick={() => void verify(version)} disabled={busyId === version.id}>
                          <BadgeCheck className="mr-1.5 size-3.5" />
                          Record verification
                        </Button>
                      )}
                      {version.status === 'SUPERSEDED' && (
                        <span className="flex items-center gap-1.5 text-[11px] text-[var(--alo-text-muted)]">
                          <History className="size-3.5" />
                          Retained history — immutable. Propose a new version to change this rule.
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------------- POLICY CHANGES ---------------- */}
      {tab === 'changes' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--alo-body)]">
              Changes detected on monitored sources. Detection never applies a change.
            </p>
            <Button variant="outline" size="sm" onClick={() => void loadAlerts()} disabled={alertLoading}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Refresh
            </Button>
          </div>

          {alerts.length === 0 ? (
            <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
              <CardContent className="py-8 text-center text-sm text-[var(--alo-text-muted)]">
                {alertLoading ? 'Loading…' : 'No open policy change alerts.'}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {alerts.map((alert) => (
                <Card key={alert.id} className="rounded-2xl border-2 border-[var(--alo-border)]">
                  <CardContent className="space-y-2 pt-4 pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--alo-text)]">{alert.title}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-[var(--alo-text-muted)]">{alert.ruleKey || 'no rule key'}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline" className={`text-[11px] ${SEVERITY_STYLE[alert.severity] ?? ''}`}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline" className="text-[11px]">{alert.status}</Badge>
                      </div>
                    </div>

                    {alert.description && <p className="text-[11px] text-[var(--alo-body)]">{alert.description}</p>}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[var(--alo-text-muted)]">
                      <span>source {alert.sourceType}</span>
                      {alert.sourceUrl && (
                        <a href={alert.sourceUrl} target="_blank" rel="noreferrer" className="text-[var(--alo-brand)] underline">view source</a>
                      )}
                      <span>detected {new Date(alert.detectedAt).toLocaleString()}</span>
                    </div>

                    <div className="rounded-lg border border-[var(--alo-border)] bg-[var(--alo-page)] p-2.5 text-[11px]">
                      <p className="font-semibold text-[var(--alo-body)]">Impact — {alert.impactCount} record(s)</p>
                      <p className="mt-0.5 text-[var(--alo-body)]">
                        {alert.affectedStudentIds.length} student(s), {alert.affectedApplicationIds.length}{' '}
                        application(s), {alert.affectedCountryIds.length} country(ies)
                        {alert.affectedWorkflows.length > 0 && `, workflows: ${alert.affectedWorkflows.join(', ')}`}
                      </p>
                      {alert.impactCount === 0 && (
                        <p className="mt-1 text-amber-800">
                          No affected records were identified. That is an absence of analysis, not proof
                          of no impact.
                        </p>
                      )}
                    </div>

                    {alert.requiresApproval && (
                      <p className="flex items-start gap-1.5 rounded-lg border border-[var(--alo-border)] bg-[var(--alo-brand-pale)] p-2.5 text-[11px] text-[var(--alo-brand-deep)]">
                        <ShieldAlert className="mt-0.5 size-3.5 shrink-0" />
                        Applying this change requires administrator approval. Nothing has been applied.
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 border-t border-[var(--alo-border)] pt-2.5">
                      {alert.status !== 'APPROVED' && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => {
                            setTab('rules');
                            setShowPropose(true);
                            setForm((current) => ({
                              ...current,
                              ruleType: alert.ruleType,
                              changeReason: `Policy change: ${alert.title}`,
                              sourceUrl: alert.sourceUrl,
                              sourceName: alert.sourceName,
                              sourceType: alert.sourceType,
                              summary: alert.title,
                            }));
                          }}>
                            <Plus className="mr-1.5 size-3.5" />
                            Draft rule version
                          </Button>
                          <Button size="sm" onClick={() => void resolveAlert(alert)} disabled={busyId === alert.id}>
                            <CheckCircle2 className="mr-1.5 size-3.5" />
                            Mark resolved
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => void dismissAlert(alert)} disabled={busyId === alert.id}>
                            <XCircle className="mr-1.5 size-3.5" />
                            Dismiss
                          </Button>
                        </>
                      )}
                      {alert.reviewTaskId && (
                        <span className="flex items-center gap-1 text-[11px] text-[var(--alo-text-muted)]">
                          <Clock className="size-3.5" />
                          review task {alert.reviewTaskId}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* ---------------- STALE ---------------- */}
      {tab === 'stale' && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--alo-body)]">
              Active rules not verified against their source in the last 180 days.
            </p>
            <Button variant="outline" size="sm" onClick={() => void loadStale()} disabled={staleLoading}>
              <RefreshCw className="mr-1.5 size-3.5" />
              Refresh
            </Button>
          </div>

          {neverVerified > 0 && (
            <Card className="rounded-2xl border-2 border-amber-300 bg-amber-50">
              <CardContent className="flex items-start gap-3 pt-5 pb-5">
                <Bell className="mt-0.5 size-5 shrink-0 text-amber-700" />
                <p className="text-xs text-amber-900">
                  <strong className="font-bold">{neverVerified}</strong> active rule(s) have NEVER been
                  verified against a source. They are being used for advice without provenance.
                </p>
              </CardContent>
            </Card>
          )}

          {stale.length === 0 ? (
            <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
              <CardContent className="py-8 text-center text-sm text-[var(--alo-text-muted)]">
                {staleLoading ? 'Loading…' : 'No stale rules. Every active rule was verified within the window.'}
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border-2 border-[var(--alo-border)]">
              <CardContent className="overflow-x-auto pt-5 pb-5">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-[var(--alo-border)] text-left font-bold text-[var(--alo-body)]">
                      <th className="p-2">Rule key</th>
                      <th className="p-2">v</th>
                      <th className="p-2">Source</th>
                      <th className="p-2">Verification</th>
                      <th className="p-2">Last checked</th>
                      <th className="p-2">Authoritative</th>
                      <th className="p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {stale.map((rule) => (
                      <tr key={rule.id} className="border-b border-[var(--alo-border)] hover:bg-[var(--alo-page)]">
                        <td className="p-2 font-mono">{rule.ruleKey}</td>
                        <td className="p-2 font-mono">{rule.versionNumber}</td>
                        <td className="p-2">{rule.sourceType}</td>
                        <td className="p-2">{rule.verificationStatus}</td>
                        <td className="p-2">
                          {rule.daysSinceVerified === null ? 'never' : `${rule.daysSinceVerified}d ago`}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className={rule.authoritative ? 'border-emerald-200 bg-emerald-50 text-[11px] text-emerald-800' : 'border-red-200 bg-red-50 text-[11px] text-red-700'}>
                            {rule.authoritative ? 'yes' : 'NO'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Button variant="outline" size="sm" onClick={() => { setTab('rules'); setRuleKey(rule.ruleKey); void loadHistory(rule.ruleKey); }}>
                            Open
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
