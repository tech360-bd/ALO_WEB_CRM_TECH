"use client";

// ============================================================
// OAuth Integration Wizard — ALO Education Admin
// Guided UI for connecting official provider APIs
// Security: All connections use official OAuth 2.0 only
// No password scraping, unofficial APIs, or fake sessions
// ============================================================

import React, { useCallback, useEffect, useState } from 'react';
import {
  Zap, Facebook, Instagram, Mail, Globe, Phone, Youtube,
  CheckCircle2, AlertTriangle, Clock, ExternalLink, RefreshCw,
  Shield, ChevronRight, Lock, AlertCircle, Info, Wifi, WifiOff,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Provider definitions
// ─────────────────────────────────────────────────────────────
const PROVIDERS = [
  {
    id: 'meta_business', name: 'Meta Business Manager',
    icon: Facebook, colorClass: 'blue',
    description: 'Connect Meta Business Suite for centralized management of Facebook Pages, Instagram Business, and WhatsApp Business Cloud API.',
    envVars: ['META_APP_ID', 'META_APP_SECRET'],
    requiresOAuth: true,
    officialDocs: 'https://developers.facebook.com/docs/development/create-an-app',
    category: 'Social',
  },
  {
    id: 'whatsapp', name: 'WhatsApp Business Cloud',
    icon: Zap, colorClass: 'emerald',
    description: 'Official WhatsApp Business Cloud API via Meta. Requires a verified Meta Business account and an approved WhatsApp app.',
    envVars: ['META_APP_ID', 'META_APP_SECRET', 'WHATSAPP_PHONE_NUMBER_ID', 'WHATSAPP_BUSINESS_ACCOUNT_ID'],
    requiresOAuth: true,
    officialDocs: 'https://developers.facebook.com/docs/whatsapp/cloud-api',
    category: 'Messaging',
  },
  {
    id: 'instagram', name: 'Instagram Business',
    icon: Instagram, colorClass: 'pink',
    description: 'Manage Instagram Direct Messages, moderate comments, and publish content via the Meta Graph API.',
    envVars: ['META_APP_ID', 'META_APP_SECRET'],
    requiresOAuth: true,
    officialDocs: 'https://developers.facebook.com/docs/instagram-api',
    category: 'Social',
  },
  {
    id: 'google_analytics', name: 'Google Analytics 4',
    icon: Globe, colorClass: 'orange',
    description: 'Connect Google Analytics 4 for website visitor tracking, conversion goals, and channel attribution reporting.',
    envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    requiresOAuth: true,
    officialDocs: 'https://developers.google.com/analytics',
    category: 'Analytics',
  },
  {
    id: 'youtube', name: 'YouTube Channel',
    icon: Youtube, colorClass: 'red',
    description: 'Manage YouTube comments, view analytics, and track performance of ALO Education video content.',
    envVars: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
    requiresOAuth: true,
    officialDocs: 'https://developers.google.com/youtube/v3',
    category: 'Social',
  },
  {
    id: 'smtp_email', name: 'Email (SMTP / IMAP)',
    icon: Mail, colorClass: 'amber',
    description: 'Configure official SMTP/IMAP credentials for sending and receiving emails. Supports Google Workspace and Microsoft 365.',
    envVars: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'],
    requiresOAuth: false,
    officialDocs: 'https://support.google.com/accounts/answer/185833',
    category: 'Email',
  },
  {
    id: 'sms_provider', name: 'SMS Gateway',
    icon: Phone, colorClass: 'slate',
    description: 'Connect an approved SMS gateway provider (Green Web BD, Twilio, or similar) for sending SMS notifications.',
    envVars: ['SMS_API_KEY', 'SMS_SENDER_ID', 'SMS_PROVIDER'],
    requiresOAuth: false,
    officialDocs: 'https://greenweb.com.bd',
    category: 'Messaging',
  },
] as const;

type ProviderId = typeof PROVIDERS[number]['id'];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function OAuthIntegrationWizard() {
  const [integrations, setIntegrations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [oauthNotice, setOauthNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', ...Array.from(new Set(PROVIDERS.map((p) => p.category)))];

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/crm/ucc/integrations');
      const data = await res.json();
      if (data.success) {
        const map: Record<string, any> = {};
        for (const integ of (data.integrations || [])) {
          map[integ.provider] = integ;
        }
        setIntegrations(map);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIntegrations();
    // Check for OAuth callback result
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('oauth_success')) {
        const provider = params.get('provider');
        setOauthNotice({ type: 'success', message: `${provider} authorization received! Verifying connection with provider...` });
      }
      if (params.get('oauth_error')) {
        setOauthNotice({ type: 'error', message: decodeURIComponent(params.get('oauth_error') || 'Unknown error') });
      }
    }
  }, [fetchIntegrations]);

  const startOAuth = async (providerId: string) => {
    setConnecting(providerId);
    try {
      const res = await fetch('/api/crm/ucc/oauth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId }),
      });
      const data = await res.json();

      if (data.success && data.authorizationUrl) {
        window.location.assign(data.authorizationUrl);
      } else {
        setOauthNotice({
          type: 'error',
          message: data.error || `Failed to start ${providerId} OAuth flow. Ensure required environment variables are set.`,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown network error';
      setOauthNotice({ type: 'error', message: `Network error: ${message}` });
    }
    setConnecting(null);
  };

  const getStatus = (providerId: string) => integrations[providerId]?.status || 'disconnected';

  const statusConfig: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    connected: { label: 'Connected', className: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
    connecting: { label: 'Connecting', className: 'bg-[var(--alo-brand-pale)] text-[var(--alo-brand)]', icon: <RefreshCw className="w-3 h-3 animate-spin" /> },
    disconnected: { label: 'Not Connected', className: 'bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)]', icon: <WifiOff className="w-3 h-3" /> },
    expired: { label: 'Token Expired', className: 'bg-red-100 text-red-600', icon: <AlertTriangle className="w-3 h-3" /> },
    error: { label: 'Error', className: 'bg-red-100 text-red-600', icon: <AlertCircle className="w-3 h-3" /> },
  };

  const filteredProviders = activeCategory === 'All'
    ? PROVIDERS
    : PROVIDERS.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[var(--alo-page)] p-6" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="bg-white border border-[var(--alo-border)] rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[var(--alo-brand)] rounded-xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-[var(--alo-text)]">Official Integration Center</h1>
              <p className="text-xs text-[var(--alo-text-muted)] mt-1 max-w-2xl">
                All integrations use official provider OAuth 2.0 and sanctioned APIs only.
                No password scraping, unofficial APIs, or automation of personal accounts is permitted.
                Connection status reflects real provider verification.
              </p>
            </div>
            <button
              onClick={fetchIntegrations}
              disabled={loading}
              className="p-2 rounded-xl hover:bg-[var(--alo-page)] border border-[var(--alo-border)] transition text-[var(--alo-text-muted)]"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* OAuth result notice */}
          {oauthNotice && (
            <div className={`mt-4 flex items-start gap-3 p-3 rounded-xl text-xs border ${
              oauthNotice.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              {oauthNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <span>{oauthNotice.message}</span>
              <button onClick={() => setOauthNotice(null)} className="ml-auto font-bold hover:opacity-70">✕</button>
            </div>
          )}
        </div>

        {/* Category filter */}
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl transition ${
                activeCategory === cat
                  ? 'bg-[var(--alo-brand)] text-white shadow-sm'
                  : 'bg-white border border-[var(--alo-border)] text-[var(--alo-text-muted)] hover:border-[var(--alo-brand)] hover:text-[var(--alo-brand)]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Provider grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProviders.map((provider) => {
            const status = getStatus(provider.id);
            const statusCfg = statusConfig[status] || statusConfig.disconnected;
            const integration = integrations[provider.id];
            const Icon = provider.icon;
            const isConnecting = connecting === provider.id;

            return (
              <div
                key={provider.id}
                className={`bg-white border rounded-2xl p-5 space-y-4 hover:shadow-md transition-all ${
                  status === 'connected' ? 'border-emerald-200' : 'border-[var(--alo-border)]'
                }`}
              >
                {/* Provider header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl bg-${provider.colorClass}-50 flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 text-${provider.colorClass}-600`} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-[var(--alo-text)]">{provider.name}</h3>
                      <div className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit mt-0.5 ${statusCfg.className}`}>
                        {statusCfg.icon}
                        {statusCfg.label}
                      </div>
                    </div>
                  </div>
                  <a
                    href={provider.officialDocs}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[var(--alo-placeholder)] hover:text-[var(--alo-brand)] transition"
                    title="Official documentation"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <p className="text-[11px] text-[var(--alo-text-muted)] leading-relaxed">{provider.description}</p>

                {/* Last sync */}
                {integration?.lastSyncAt && (
                  <div className="text-[11px] text-[var(--alo-text-muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last synced: {new Date(integration.lastSyncAt).toLocaleString()}
                  </div>
                )}

                {/* Required env vars */}
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-[var(--alo-text-muted)] uppercase tracking-wider">Required Environment Variables</p>
                  {provider.envVars.map((v) => (
                    <div key={v} className="flex items-center gap-1.5 text-[11px]">
                      <Shield className="w-3 h-3 text-[var(--alo-placeholder)]" />
                      <code className="font-mono text-[var(--alo-body)] bg-[var(--alo-page)] px-1.5 py-0.5 rounded text-[11px]">{v}</code>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                {provider.requiresOAuth ? (
                  <button
                    onClick={() => startOAuth(provider.id)}
                    disabled={isConnecting}
                    className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition ${
                      status === 'connected'
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : 'bg-[var(--alo-brand)] text-white hover:bg-[var(--alo-brand-hover)] shadow-sm'
                    } disabled:opacity-50`}
                  >
                    {isConnecting ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Redirecting...</>
                    ) : status === 'connected' ? (
                      <><CheckCircle2 className="w-3.5 h-3.5" /> Reauthorize</>
                    ) : (
                      <><Wifi className="w-3.5 h-3.5" /> Connect via Official OAuth</>
                    )}
                  </button>
                ) : (
                  <button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="w-full py-2.5 text-xs font-bold rounded-xl bg-[var(--alo-page)] border border-[var(--alo-border)] text-[var(--alo-text-muted)] hover:border-[var(--alo-brand)] hover:text-[var(--alo-brand)] flex items-center justify-center gap-2 transition">
                    Configure Credentials <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Security notice */}
        <div className="bg-[var(--alo-brand)]/5 border border-[var(--alo-brand)]/20 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-[var(--alo-brand)] flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-sm text-[var(--alo-brand)] mb-2">Security Guarantees</h3>
              <ul className="text-[11px] text-[var(--alo-body)] space-y-1 list-disc pl-4">
                <li>All OAuth access tokens are encrypted at rest using AES-256-GCM before database storage.</li>
                <li>Tokens are never returned in API responses — only masked previews are shown.</li>
                <li>Webhook signatures are cryptographically validated on every inbound event.</li>
                <li>OAuth state parameters prevent CSRF attacks on all authorization flows.</li>
                <li>Every connection, disconnection, and token refresh is recorded in the Integration Audit Log.</li>
                <li>No personal employee accounts, personal WhatsApp, or unofficial APIs are used.</li>
                <li>All communication assets are owned by ALO Education, not individual employees.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
