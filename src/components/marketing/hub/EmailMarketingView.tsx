'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mail, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';

/**
 * Email marketing console. Every control calls a real route under /api/email/campaigns.
 * Nothing is marked sent here. Sending happens only in the outbox worker, and only when
 * EMAIL_SENDING_ENABLED=true. The banner shows the live send state.
 */

interface ConfigSummary {
  sendingEnabled: boolean;
  testMode: boolean;
  testRecipientCount: number;
  hourlyCap: number;
  dailyCap: number;
  batchSize: number;
  maxAttempts: number;
  unsubscribeConfigured: boolean;
  publicLinksConfigured: boolean;
  smtpConfigured: boolean;
}

interface CampaignRow {
  id: string;
  name: string;
  subject: string;
  status: string;
  testMode: boolean;
  recipientCount: number;
  consentBasis: string | null;
  queuedAt: string | null;
  completedAt: string | null;
  lastErrorCode: string | null;
  createdAt: string;
}

interface CampaignDetail {
  campaign: CampaignRow;
  outbox: Record<string, number>;
  events: Record<string, number>;
}

interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T & { success?: boolean; error?: string; detail?: unknown; config?: unknown };
}

const TERMINAL = new Set(['sent', 'cancelled']);
const OUTBOX_ORDER = ['queued', 'sending', 'sent', 'failed', 'suppressed', 'skipped', 'draft'];

async function call<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  const res = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  const data = (await res.json().catch(() => ({}))) as ApiResult<T>['data'];
  return { ok: res.ok, status: res.status, data };
}

function parseRecipientLines(raw: string): Array<{ email: string; first_name?: string; last_name?: string; company?: string }> {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const [email, first_name, last_name, company] = line.split(',').map((part) => part.trim());
      return { email: email ?? '', first_name, last_name, company };
    });
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === 'sent'
      ? 'bg-crm-success-bg text-crm-success-text'
      : status === 'paused' || status === 'cancelled'
        ? 'bg-crm-warning-bg text-crm-warning-text'
        : status === 'sending' || status === 'queued'
          ? 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]'
          : 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)]';
  return <Badge className={tone}>{status}</Badge>;
}

export default function EmailMarketingView() {
  const [config, setConfig] = useState<ConfigSummary | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState({
    name: '',
    subject: '',
    html: '<p>Hi {{first_name}},</p>\n<p>Your message here.</p>\n<p><a href="{{unsubscribe_url}}">Unsubscribe</a></p>',
    text: '',
    recipients: '',
    consentBasis: '',
    consentConfirmed: false,
    testMode: true,
  });
  const [queueConfirm, setQueueConfirm] = useState({ recipientCount: '', subject: '' });

  const loadCampaigns = useCallback(async () => {
    const result = await call<{ campaigns?: CampaignRow[]; config?: ConfigSummary & { error?: string; variable?: string } }>('/api/email/campaigns');
    if (!result.ok) {
      setError(`Could not load campaigns (${result.data.error ?? result.status}).`);
      return;
    }
    setCampaigns((result.data.campaigns as CampaignRow[]) ?? []);
    const cfg = result.data.config as (ConfigSummary & { error?: string; variable?: string }) | undefined;
    if (cfg?.error) setConfigError(`Email configuration is invalid (${cfg.variable ?? 'unknown variable'}).`);
    else if (cfg) setConfig(cfg);
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    const result = await call<CampaignDetail>(`/api/email/campaigns/${encodeURIComponent(id)}`);
    if (result.ok) setDetail(result.data as unknown as CampaignDetail);
    else setError(`Could not load campaign (${result.data.error ?? result.status}).`);
  }, []);

  useEffect(() => {
    void loadCampaigns();
  }, [loadCampaigns]);

  useEffect(() => {
    if (selectedId) void loadDetail(selectedId);
    else setDetail(null);
    setQueueConfirm({ recipientCount: '', subject: '' });
  }, [selectedId, loadDetail]);

  const sendBanner = useMemo(() => {
    if (configError) return { tone: 'red', text: configError };
    if (!config) return { tone: 'gray', text: 'Loading email settings…' };
    if (!config.smtpConfigured) return { tone: 'amber', text: 'SMTP is not configured. Nothing can be delivered until SMTP_HOST, SMTP_USER, SMTP_PASSWORD and SMTP_FROM are set.' };
    if (!config.sendingEnabled) return { tone: 'amber', text: 'Sending is OFF (EMAIL_SENDING_ENABLED is not "true"). Queued campaigns wait until it is enabled. Nothing is sent.' };
    if (config.testMode) return { tone: 'amber', text: `Test mode ON: only the ${config.testRecipientCount} test recipient(s) can receive email.` };
    return {
      tone: 'emerald',
      text: `Live sending enabled. Configured ceilings: ${config.hourlyCap} SMTP attempts per hour and ${config.dailyCap} per 24 hours. These are settings, not your provider's limits.`,
    };
  }, [config, configError]);

  const createDraft = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    const result = await call<{ campaignId?: string; recipientCount?: number; skipped?: Record<string, number>; testModeRestricted?: boolean }>(
      '/api/email/campaigns',
      {
        method: 'POST',
        body: JSON.stringify({
          name: draft.name,
          subject: draft.subject,
          html: draft.html,
          text: draft.text.trim() ? draft.text : null,
          recipients: parseRecipientLines(draft.recipients),
          testMode: draft.testMode,
          consentBasis: draft.consentBasis,
          consentConfirmed: draft.consentConfirmed,
        }),
      }
    );
    setBusy(false);
    if (!result.ok) {
      setError(`Draft not created: ${result.data.error ?? result.status}${result.data.detail ? ` (${JSON.stringify(result.data.detail)})` : ''}`);
      return;
    }
    const d = result.data as unknown as { campaignId: string; recipientCount: number; skipped: Record<string, number>; testModeRestricted: boolean };
    setMessage(
      `Draft saved with ${d.recipientCount} recipient(s). Skipped: ${Object.entries(d.skipped).map(([k, v]) => `${k} ${v}`).join(', ')}. Nothing has been sent. Review it, then queue it.`
    );
    setSelectedId(d.campaignId);
    await loadCampaigns();
  };

  const queueCampaign = async () => {
    if (!detail) return;
    setBusy(true);
    setError(null);
    const result = await call<{ queued?: number; sendingEnabled?: boolean }>(`/api/email/campaigns/${encodeURIComponent(detail.campaign.id)}/queue`, {
      method: 'POST',
      body: JSON.stringify({ recipientCount: Number(queueConfirm.recipientCount), subject: queueConfirm.subject }),
    });
    setBusy(false);
    if (!result.ok) {
      setError(`Not queued: ${result.data.error ?? result.status}`);
      return;
    }
    const r = result.data as unknown as { queued: number; sendingEnabled: boolean };
    setMessage(
      r.sendingEnabled
        ? `Queued ${r.queued} email(s). The outbox worker sends them in batches under the caps.`
        : `Queued ${r.queued} email(s). Sending is OFF, so nothing will be delivered until EMAIL_SENDING_ENABLED is "true".`
    );
    await Promise.all([loadCampaigns(), loadDetail(detail.campaign.id)]);
  };

  const changeStatus = async (action: 'pause' | 'resume' | 'cancel') => {
    if (!detail) return;
    if (action === 'cancel' && !window.confirm('Cancel this campaign? Unsent recipients will be skipped and this cannot be undone.')) return;
    setBusy(true);
    setError(null);
    const result = await call<{ status?: string }>(`/api/email/campaigns/${encodeURIComponent(detail.campaign.id)}/status`, {
      method: 'POST',
      body: JSON.stringify({ action }),
    });
    setBusy(false);
    if (!result.ok) {
      setError(`Could not ${action}: ${result.data.error ?? result.status}`);
      return;
    }
    setMessage(`Campaign ${action === 'cancel' ? 'cancelled' : action === 'pause' ? 'paused' : 'resumed'}.`);
    await Promise.all([loadCampaigns(), loadDetail(detail.campaign.id)]);
  };

  const campaign = detail?.campaign ?? null;
  const confirmReady =
    campaign !== null &&
    campaign.status === 'draft' &&
    queueConfirm.recipientCount === String(campaign.recipientCount) &&
    queueConfirm.subject === campaign.subject;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--alo-text)] flex items-center gap-2">
          <Mail className="w-6 h-6 text-[var(--alo-cta)]" />Email Marketing
        </h2>
        <p className="text-sm text-[var(--alo-text-muted)]">
          Drafts, confirmation, and a queue that sends under caps. Nothing is marked sent until the SMTP server accepts the message.
        </p>
      </div>

      <div
        className={`rounded-xl border p-3 text-sm flex gap-2 items-start ${
          sendBanner.tone === 'emerald'
            ? 'bg-crm-success-bg border-crm-success-border text-crm-success-text'
            : sendBanner.tone === 'red'
              ? 'bg-crm-danger-bg border-crm-danger-border text-crm-danger-text'
              : sendBanner.tone === 'amber'
                ? 'bg-crm-warning-bg border-crm-warning-border text-crm-warning-text'
                : 'bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-body)]'
        }`}
      >
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <span>{sendBanner.text}</span>
      </div>

      {error && <p className="text-sm text-crm-danger-text bg-crm-danger-bg border border-crm-danger-border rounded-lg p-3">{error}</p>}
      {message && <p className="text-sm text-[var(--alo-text)] bg-[var(--alo-page)] border rounded-lg p-3">{message}</p>}

      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">New draft</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold">Campaign name</label>
                  <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="mt-1 h-9" />
                </div>
                <div>
                  <label className="text-xs font-semibold">Subject</label>
                  <Input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className="mt-1 h-9" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold">HTML body (placeholders: {'{{first_name}} {{last_name}} {{company}} {{email}} {{campaign_name}}'}; {'{{unsubscribe_url}}'} is required)</label>
                <Textarea value={draft.html} onChange={(e) => setDraft({ ...draft, html: e.target.value })} className="mt-1 min-h-[140px] font-mono text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold">Plain-text body (optional; leave empty to derive from HTML)</label>
                <Textarea value={draft.text} onChange={(e) => setDraft({ ...draft, text: e.target.value })} className="mt-1 min-h-[70px] font-mono text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold">Recipients (one per line: email,first_name,last_name,company)</label>
                <Textarea value={draft.recipients} onChange={(e) => setDraft({ ...draft, recipients: e.target.value })} className="mt-1 min-h-[90px] font-mono text-xs" placeholder="ann@example.com,Ann,Rahman,ABC School" />
              </div>
              <div>
                <label className="text-xs font-semibold">How were these people opted in? (required, at least 10 characters)</label>
                <Input value={draft.consentBasis} onChange={(e) => setDraft({ ...draft, consentBasis: e.target.value })} className="mt-1 h-9" placeholder="e.g. Newsletter sign-up form on aloeducation.com, 2026" />
              </div>
              <label className="flex items-start gap-2 text-xs">
                <input type="checkbox" className="mt-0.5" checked={draft.consentConfirmed} onChange={(e) => setDraft({ ...draft, consentConfirmed: e.target.checked })} />
                <span>I confirm every recipient in this list gave consent to receive this marketing email, and I have described the basis above.</span>
              </label>
              <label className="flex items-start gap-2 text-xs">
                <input type="checkbox" className="mt-0.5" checked={draft.testMode} onChange={(e) => setDraft({ ...draft, testMode: e.target.checked })} />
                <span>Test campaign: keep only the configured test recipients. Turn this off only for a real send.</span>
              </label>
              <Button onClick={createDraft} disabled={busy} className="bg-[var(--alo-cta)] text-white">
                {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}Create draft (nothing is sent)
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Campaigns</span>
                <Button size="sm" variant="outline" onClick={() => void loadCampaigns()} className="h-7 text-xs">Refresh</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {campaigns.length === 0 ? (
                <p className="text-xs text-[var(--alo-text-muted)]">No campaigns yet.</p>
              ) : (
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[var(--alo-text-muted)]">
                      <th className="py-1">Name</th>
                      <th>Status</th>
                      <th>Recipients</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((row) => (
                      <tr key={row.id} className={`border-t ${selectedId === row.id ? 'bg-[var(--alo-cta-soft)]' : ''}`}>
                        <td className="py-1.5 pr-2">
                          {row.name}
                          {row.testMode && <span className="ml-1 text-[11px] text-crm-warning-text">[test]</span>}
                        </td>
                        <td><StatusBadge status={row.status} /></td>
                        <td>{row.recipientCount}</td>
                        <td className="text-right">
                          <Button size="sm" variant="outline" className="h-6 text-[11px]" onClick={() => setSelectedId(row.id)}>Open</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-crm-success-text" />Campaign detail
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {!campaign && <p className="text-[var(--alo-text-muted)]">Select a campaign to see its queue, events, and actions.</p>}
              {campaign && detail && (
                <>
                  <div>
                    <p className="font-semibold text-sm">{campaign.name}</p>
                    <p className="text-[var(--alo-body)]">Subject: {campaign.subject}</p>
                    <p className="mt-1"><StatusBadge status={campaign.status} />{campaign.testMode && <span className="ml-2 text-crm-warning-text">test campaign</span>}</p>
                    {campaign.lastErrorCode && <p className="text-crm-warning-text mt-1">Reason: {campaign.lastErrorCode}</p>}
                    {campaign.consentBasis && <p className="text-[var(--alo-body)] mt-1">Consent basis: {campaign.consentBasis}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {OUTBOX_ORDER.map((status) => (
                      <div key={status} className="p-2 bg-white border rounded-lg">
                        <p className="text-[var(--alo-text-muted)]">{status}</p>
                        <p className="font-semibold text-sm">{detail.outbox[status] ?? 0}</p>
                      </div>
                    ))}
                  </div>

                  {Object.keys(detail.events).length > 0 && (
                    <p className="text-[var(--alo-body)]">Events: {Object.entries(detail.events).map(([k, v]) => `${k} ${v}`).join(' · ')}</p>
                  )}

                  {campaign.status === 'draft' && (
                    <div className="border rounded-lg p-3 space-y-2">
                      <p className="font-semibold">Confirm before queueing</p>
                      <p className="text-[var(--alo-body)]">Type the exact recipient count ({campaign.recipientCount}) and subject to queue this campaign.</p>
                      <Input value={queueConfirm.recipientCount} onChange={(e) => setQueueConfirm({ ...queueConfirm, recipientCount: e.target.value })} placeholder={`Recipient count: ${campaign.recipientCount}`} className="h-8" />
                      <Input value={queueConfirm.subject} onChange={(e) => setQueueConfirm({ ...queueConfirm, subject: e.target.value })} placeholder="Subject (exact)" className="h-8" />
                      <Button size="sm" onClick={queueCampaign} disabled={busy || !confirmReady} className="bg-[var(--alo-cta)] text-white">
                        Queue {campaign.recipientCount} email(s)
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {(campaign.status === 'queued' || campaign.status === 'sending') && (
                      <Button size="sm" variant="outline" onClick={() => changeStatus('pause')} disabled={busy}>Pause</Button>
                    )}
                    {campaign.status === 'paused' && (
                      <Button size="sm" variant="outline" onClick={() => changeStatus('resume')} disabled={busy}>Resume</Button>
                    )}
                    {!TERMINAL.has(campaign.status) && (
                      <Button size="sm" variant="outline" className="text-crm-danger-text" onClick={() => changeStatus('cancel')} disabled={busy}>Cancel campaign</Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => void loadDetail(campaign.id)} disabled={busy}>Refresh detail</Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
