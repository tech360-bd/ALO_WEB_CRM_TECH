'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  CheckCircle2,
  Globe,
  Loader2,
  Mail,
  MessageSquare,
  Plug,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Webhook,
} from 'lucide-react';

interface IntegrationCardConfig {
  id: string;
  name: string;
  provider: string;
  oauthSlug?: 'facebook' | 'instagram' | 'linkedin' | 'youtube';
  healthSlug?: 'facebook' | 'instagram' | 'linkedin' | 'youtube' | 'whatsapp' | 'opensms';
  env: string[];
  docs: string;
}

const INTEGRATIONS: IntegrationCardConfig[] = [
  {
    id: 'facebook',
    name: 'Meta Facebook Pages',
    provider: 'facebook_page',
    oauthSlug: 'facebook',
    healthSlug: 'facebook',
    env: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'FACEBOOK_REDIRECT_URI'],
    docs: 'Facebook OAuth + Lead Ads',
  },
  {
    id: 'instagram',
    name: 'Instagram Business',
    provider: 'instagram',
    oauthSlug: 'instagram',
    healthSlug: 'instagram',
    env: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'INSTAGRAM_REDIRECT_URI'],
    docs: 'Meta Graph Content Publishing',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn Official OAuth',
    provider: 'linkedin',
    oauthSlug: 'linkedin',
    healthSlug: 'linkedin',
    env: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_REDIRECT_URI'],
    docs: 'LinkedIn Posts REST API',
  },
  {
    id: 'youtube',
    name: 'YouTube Channel',
    provider: 'youtube',
    oauthSlug: 'youtube',
    healthSlug: 'youtube',
    env: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'YOUTUBE_REDIRECT_URI'],
    docs: 'Google OAuth 2.0 + YouTube v3',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp Business Platform',
    provider: 'whatsapp',
    healthSlug: 'whatsapp',
    env: ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ACCOUNT_ID'],
    docs: 'WHATSAPP-AUTOMATION-REPORT.md',
  },
  {
    id: 'opensms',
    name: 'OpenSMS / httpSMS Gateway',
    provider: 'sms_provider',
    healthSlug: 'opensms',
    env: ['OPENSMS_BASE_URL', 'OPENSMS_API_KEY', 'HTTPSMS_API_KEY'],
    docs: 'daslearning-org/OpenSMS + httpSMS',
  },
  {
    id: 'email',
    name: 'Email (SMTP)',
    provider: 'smtp_email',
    env: ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USERNAME', 'MAIL_PASSWORD'],
    docs: 'EMAIL_CONFIGURATION_GUIDE.md',
  },
  {
    id: 'n8n',
    name: 'n8n Webhooks',
    provider: 'n8n',
    env: ['N8N_WEBHOOK_URL'],
    docs: 'N8nWorkflowsView',
  },
  {
    id: 'analytics',
    name: 'Search Analytics',
    provider: 'google_search_console',
    env: ['GOOGLE_SEARCH_CONSOLE_CREDENTIALS_JSON'],
    docs: 'SEO & Blog Manager',
  },
];

interface ProviderStatusRow {
  provider?: string;
  status?: string;
  healthStatus?: string;
  webhookStatus?: string;
  connectedAccount?: string | null;
}

interface HealthFeedback {
  status: string;
  note: string;
  connectedAccount?: string | null;
}

export default function IntegrationsView() {
  const [statusRows, setStatusRows] = useState<ProviderStatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [healthMap, setHealthMap] = useState<Record<string, HealthFeedback>>({});

  // Publisher state
  const [pubPlatform, setPubPlatform] = useState<'facebook' | 'instagram' | 'linkedin'>('facebook');
  const [pubText, setPubText] = useState('');
  const [pubMediaUrl, setPubMediaUrl] = useState('');
  const [pubContentId, setPubContentId] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [pubResult, setPubResult] = useState<{ ok: boolean; message: string } | null>(null);

  const loadStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/marketing/automation', { credentials: 'same-origin' });
      const json = await response.json().catch(() => ({}));
      const rows = json.providerStatuses || json.providerStatus || json.data?.accounts || [];
      setStatusRows(Array.isArray(rows) ? rows : []);
    } catch {
      setStatusRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStatuses();
  }, [loadStatuses]);

  const getStatus = (item: IntegrationCardConfig): string => {
    if (healthMap[item.id]) return healthMap[item.id].status;
    const hit = statusRows.find(
      (s) => s.provider === item.provider || (s.provider && s.provider.includes(item.id)),
    );
    return hit ? hit.status || hit.healthStatus || hit.webhookStatus || 'NOT_CONFIGURED' : 'NOT_CONFIGURED';
  };

  const handleConnect = async (item: IntegrationCardConfig) => {
    if (!item.oauthSlug) return;
    setBusyId(`connect:${item.id}`);
    try {
      const response = await fetch(
        `/api/social/${item.oauthSlug}/auth?mode=json&returnTo=${encodeURIComponent('/admin/marketing')}`,
        { credentials: 'same-origin' },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.authorizeUrl) {
        setHealthMap((prev) => ({
          ...prev,
          [item.id]: {
            status: payload?.status || 'NOT_CONFIGURED',
            note: payload?.error || `Unable to start ${item.name} OAuth (${response.status}).`,
          },
        }));
        return;
      }
      window.location.assign(payload.authorizeUrl);
    } catch (error) {
      setHealthMap((prev) => ({
        ...prev,
        [item.id]: {
          status: 'CONNECTION_ERROR',
          note: error instanceof Error ? error.message : 'Network error starting OAuth.',
        },
      }));
    } finally {
      setBusyId(null);
    }
  };

  const handleHealthCheck = async (item: IntegrationCardConfig) => {
    if (!item.healthSlug) return;
    setBusyId(`health:${item.id}`);
    try {
      const response = await fetch(`/api/social/${item.healthSlug}/health`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ live: false }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.report) {
        setHealthMap((prev) => ({
          ...prev,
          [item.id]: {
            status: 'ERROR',
            note: payload?.error || `Health check failed (${response.status}).`,
          },
        }));
        return;
      }
      setHealthMap((prev) => ({
        ...prev,
        [item.id]: {
          status: payload.report.status,
          note: payload.report.note,
          connectedAccount: payload.report.connectedAccount,
        },
      }));
    } catch (error) {
      setHealthMap((prev) => ({
        ...prev,
        [item.id]: {
          status: 'ERROR',
          note: error instanceof Error ? error.message : 'Health check failed.',
        },
      }));
    } finally {
      setBusyId(null);
    }
  };

  const handlePublish = async (event: React.FormEvent) => {
    event.preventDefault();
    setPublishing(true);
    setPubResult(null);
    try {
      const response = await fetch('/api/marketing/social/publish', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: pubPlatform,
          text: pubText,
          ...(pubMediaUrl.trim() ? { mediaUrl: pubMediaUrl.trim() } : {}),
          ...(pubContentId.trim() ? { contentId: pubContentId.trim() } : {}),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.published) {
        setPubResult({
          ok: false,
          message: payload?.error || `Publish refused (${response.status}).`,
        });
        return;
      }
      setPubResult({
        ok: true,
        message: `Published to ${payload.platform} (Post ID: ${payload.externalPostId}).`,
      });
      setPubText('');
      setPubMediaUrl('');
    } catch (error) {
      setPubResult({
        ok: false,
        message: error instanceof Error ? error.message : 'Network error during publish.',
      });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-[var(--alo-text)] flex items-center gap-2">
            <Plug className="w-6 h-6 text-[var(--alo-cta)]" />
            Integrations &amp; Official Social OAuth
          </h2>
          <p className="text-sm text-[var(--alo-text-muted)]">
            Connect Facebook, Instagram Business, LinkedIn, YouTube, WhatsApp and OpenSMS/httpSMS. Signed OAuth state, AES-256-GCM encrypted token storage, and fail-closed verification.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void loadStatuses()} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-[var(--alo-cta)]" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATIONS.map((i) => {
            const st = getStatus(i);
            const isConnected = ['VERIFIED_CONNECTED', 'LIVE_VERIFIED', 'STORED_READY', 'CONNECTED', 'connected'].includes(st);
            const isPending = st.includes('PENDING') || st.includes('REQUIRES') || st.includes('LEGACY') || st === 'TOKEN_MISSING';
            const feedback = healthMap[i.id];

            return (
              <Card
                key={i.id}
                className={
                  isConnected
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : isPending
                      ? 'border-amber-200 bg-amber-50/30'
                      : 'border-[var(--alo-border)]'
                }
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    {i.id === 'facebook' || i.id === 'instagram' ? (
                      <Globe className="w-4 h-4 text-[var(--alo-brand)]" />
                    ) : i.id === 'whatsapp' ? (
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                    ) : i.id === 'email' ? (
                      <Mail className="w-4 h-4 text-[var(--alo-brand)]" />
                    ) : i.id === 'opensms' ? (
                      <Smartphone className="w-4 h-4 text-[var(--alo-cta)]" />
                    ) : (
                      <Webhook className="w-4 h-4 text-[var(--alo-brand)]" />
                    )}
                    {i.name}
                  </CardTitle>
                  <Badge
                    className={
                      isConnected
                        ? 'bg-emerald-100 text-emerald-700 border-emerald-200 w-fit mt-1'
                        : isPending
                          ? 'bg-amber-100 text-amber-700 border-amber-200 w-fit mt-1'
                          : 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)] w-fit mt-1'
                    }
                  >
                    {isConnected ? (
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                    ) : (
                      <AlertTriangle className="w-3 h-3 mr-1" />
                    )}
                    {st}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2 text-xs">
                  <p className="text-[var(--alo-text-muted)]">Env: {i.env.join(', ')}</p>
                  <p className="text-[var(--alo-text-muted)]">Docs: {i.docs}</p>
                  {feedback?.connectedAccount ? (
                    <p className="font-medium text-emerald-700">Account: {feedback.connectedAccount}</p>
                  ) : null}
                  {feedback?.note ? (
                    <p className="rounded-md border bg-white/80 p-2 text-[11px] text-[var(--alo-body)]">
                      {feedback.note}
                    </p>
                  ) : null}
                  <div className="flex gap-2 pt-2">
                    {i.oauthSlug ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId !== null}
                        onClick={() => void handleConnect(i)}
                        className="h-7 text-[11px]"
                      >
                        {busyId === `connect:${i.id}` ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Plug className="w-3 h-3 mr-1" />
                        )}
                        Connect OAuth
                      </Button>
                    ) : null}
                    {i.healthSlug ? (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId !== null}
                        onClick={() => void handleHealthCheck(i)}
                        className="h-7 text-[11px]"
                      >
                        {busyId === `health:${i.id}` ? (
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3 h-3 mr-1" />
                        )}
                        Health Check
                      </Button>
                    ) : null}
                  </div>
                  <p className="text-[11px] text-[var(--alo-text-muted)] flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    AES-256-GCM encrypted tokens, HMAC OAuth state, rate-limited.
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="border-[var(--alo-border)]">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Send className="w-4 h-4 text-[var(--alo-cta)]" />
            Direct Approved Social Publisher (Facebook · Instagram Business · LinkedIn)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePublish} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="space-y-1 block">
                <span className="font-semibold">Target Platform</span>
                <select
                  value={pubPlatform}
                  onChange={(e) => setPubPlatform(e.target.value as 'facebook' | 'instagram' | 'linkedin')}
                  className="h-9 w-full rounded-md border border-[var(--alo-border)] bg-white px-2 text-xs"
                >
                  <option value="facebook">Facebook Page</option>
                  <option value="instagram">Instagram Business (requires HTTPS image)</option>
                  <option value="linkedin">LinkedIn Member / Page</option>
                </select>
              </label>
              <label className="space-y-1 block">
                <span className="font-semibold">HTTPS Media / Article URL {pubPlatform === 'instagram' ? '(required)' : '(optional)'}</span>
                <Input
                  value={pubMediaUrl}
                  onChange={(e) => setPubMediaUrl(e.target.value)}
                  placeholder="https://aloeducation.com/..."
                  className="h-9 text-xs"
                />
              </label>
              <label className="space-y-1 block">
                <span className="font-semibold">Approved Content ID (optional gate check)</span>
                <Input
                  value={pubContentId}
                  onChange={(e) => setPubContentId(e.target.value)}
                  placeholder="Verify MarketingGeneratedContent is approved"
                  className="h-9 text-xs"
                />
              </label>
            </div>
            <label className="space-y-1 block">
              <span className="font-semibold">Post Copy</span>
              <Textarea
                value={pubText}
                onChange={(e) => setPubText(e.target.value)}
                rows={3}
                maxLength={3000}
                placeholder="Write verified post copy (no unverified visa/scholarship guarantees)..."
                className="text-xs"
              />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] text-[var(--alo-text-muted)]">
                Requires connected OAuth token, active GlobalAiPause check, and Marketing Manager / Super Admin authority.
              </p>
              <Button
                type="submit"
                size="sm"
                disabled={publishing || !pubText.trim() || (pubPlatform === 'instagram' && !pubMediaUrl.trim())}
                className="bg-[var(--alo-cta)] text-white"
              >
                {publishing ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
                Publish Now
              </Button>
            </div>
            {pubResult ? (
              <p
                role="status"
                className={`rounded-lg border p-2 text-xs ${
                  pubResult.ok
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-red-200 bg-red-50 text-red-800'
                }`}
              >
                {pubResult.message}
              </p>
            ) : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
