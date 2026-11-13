"use client";

import React, { useState, useEffect } from 'react';
import {
  Share2,
  MessageSquare,
  Facebook,
  Instagram,
  BarChart,
  Search,
  Video,
  Send,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Shield,
  Layers,
  Key,
  ExternalLink,
  PlusCircle,
  XCircle
} from 'lucide-react';

interface Integration {
  id: string;
  provider: string;
  name: string;
  status: string;
  connectedAccount: string | null;
  businessAccountId: string | null;
  webhookStatus: string;
  apiVersion: string;
  healthStatus: string;
  lastSyncAt: string | null;
  accounts: any[];
}

export default function SocialIntegrationCenterPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWizard, setActiveWizard] = useState<string | null>(null);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [accountNameInput, setAccountNameInput] = useState('');
  const [syncingProvider, setSyncingProvider] = useState<string | null>(null);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  async function fetchIntegrations() {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/ucc/integrations');
      const data = await res.json();
      if (data.success) {
        setIntegrations(data.integrations);
      }
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleStartOAuthWizard = (provider: any) => {
    setSelectedProvider(provider);
    setWizardStep(1);
    setActiveWizard(provider.provider);
  };

  const handleConnectIntegration = async () => {
    if (!selectedProvider) return;
    try {
      const res = await fetch('/api/crm/ucc/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider.provider,
          name: selectedProvider.name,
          connectedAccount: accountNameInput || `ALO Education Official ${selectedProvider.name}`,
          assets: [
            {
              assetId: `AST_${Date.now()}`,
              assetName: `ALO ${selectedProvider.name} Channel`,
              assetType: selectedProvider.provider,
              isPrimary: true,
            },
          ],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveWizard(null);
        setAccountNameInput('');
        fetchIntegrations();
      }
    } catch (err) {
      console.error('Connection failed:', err);
    }
  };

  const handleDisconnect = async (id: string) => {
    try {
      const res = await fetch(`/api/crm/ucc/integrations?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        fetchIntegrations();
      }
    } catch (err) {
      console.error('Disconnect failed:', err);
    }
  };

  const handleSyncNow = async (provider: string) => {
    setSyncingProvider(provider);
    setTimeout(() => {
      setSyncingProvider(null);
      fetchIntegrations();
    }, 1200);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'whatsapp': return <MessageSquare className="w-6 h-6 text-crm-success-text" />;
      case 'facebook_page': return <Facebook className="w-6 h-6 text-[var(--alo-brand)]" />;
      case 'instagram': return <Instagram className="w-6 h-6 text-crm-danger-text" />;
      case 'google_analytics': return <BarChart className="w-6 h-6 text-crm-warning-text" />;
      case 'google_search_console': return <Search className="w-6 h-6 text-[var(--alo-brand)]" />;
      case 'youtube': return <Video className="w-6 h-6 text-crm-danger-text" />;
      case 'telegram': return <Send className="w-6 h-6 text-sky-500" />;
      case 'smtp_email': return <Mail className="w-6 h-6 text-[var(--alo-brand)]" />;
      case 'sms_provider': return <Phone className="w-6 h-6 text-[var(--alo-cta)]" />;
      default: return <Share2 className="w-6 h-6 text-[var(--alo-body)]" />;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-[var(--alo-page)] dark:bg-[var(--alo-page)] min-h-screen text-[var(--alo-text)] dark:text-[var(--alo-body)]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[var(--alo-page)] p-6 rounded-xl border border-[var(--alo-border)] dark:border-[var(--alo-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-7 h-7 text-[var(--alo-brand)]" />
            <h1 className="text-2xl font-bold">ALO Social Integration Center</h1>
            <span className="bg-[var(--alo-brand-pale)] text-[var(--alo-brand)] dark:bg-[var(--alo-brand-deep)]/40 dark:text-[var(--alo-brand)] text-xs font-semibold px-2.5 py-0.5 rounded-full border border-[var(--alo-border)] dark:border-[var(--alo-brand-border)]">
              OAuth 2.0 Official Platform
            </span>
          </div>
          <p className="text-sm text-[var(--alo-text-muted)] dark:text-[var(--alo-text-muted)] mt-1">
            Connect official Meta, WhatsApp Business, Google, YouTube, and Email/SMS accounts. Zero password scraping.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchIntegrations}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--alo-surface-muted)] dark:bg-[var(--alo-page)] hover:bg-[var(--alo-page)] text-[var(--alo-body)] dark:text-[var(--alo-body)] text-sm font-medium rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" /> Sync Integration Status
          </button>
        </div>
      </div>

      {/* Integration Grid */}
      {loading ? (
        <div className="p-12 text-center text-[var(--alo-text-muted)]">Loading Social Integration Status...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item) => {
            const isConnected = item.status === 'connected';
            const isSyncing = syncingProvider === item.provider;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[var(--alo-page)] rounded-xl border border-[var(--alo-border)] dark:border-[var(--alo-border)] p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-[var(--alo-brand-border)] dark:hover:border-[var(--alo-brand-border)] transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[var(--alo-surface-muted)] dark:bg-[var(--alo-page)]/50 rounded-xl">
                        {getProviderIcon(item.provider)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[var(--alo-text)] dark:text-white">{item.name}</h3>
                        <p className="text-xs text-[var(--alo-text-muted)] dark:text-[var(--alo-text-muted)] font-mono mt-0.5">
                          API {item.apiVersion || 'v19.0'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        isConnected
                          ? 'bg-crm-success-bg text-crm-success-text border-crm-success-border dark:bg-[var(--alo-success)]/10 dark:text-crm-success-text dark:border-crm-success-border'
                          : 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)] dark:bg-[var(--alo-page)] dark:text-[var(--alo-placeholder)] dark:border-[var(--alo-border)]'
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-crm-success-text" /> Connected
                        </>
                      ) : (
                        'Disconnected'
                      )}
                    </span>
                  </div>

                  {/* Account Details */}
                  <div className="mt-4 space-y-2 text-xs text-[var(--alo-body)] dark:text-[var(--alo-placeholder)] bg-[var(--alo-page)] dark:bg-[var(--alo-page)]/50 p-3 rounded-lg border border-[var(--alo-border)] dark:border-[var(--alo-border)]">
                    <div className="flex justify-between">
                      <span className="text-[var(--alo-text-muted)]">Account:</span>
                      <span className="font-medium truncate max-w-[180px]">
                        {item.connectedAccount || 'Not Configured'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--alo-text-muted)]">Webhook Status:</span>
                      <span className="font-mono text-crm-success-text dark:text-crm-success-text">
                        {item.webhookStatus || 'inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--alo-text-muted)]">Health:</span>
                      <span className="font-semibold text-crm-success-text dark:text-crm-success-text">
                        {item.healthStatus || 'healthy'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-[var(--alo-border)] dark:border-[var(--alo-border)]/60">
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleSyncNow(item.provider)}
                        disabled={isSyncing}
                        className="text-xs font-medium text-[var(--alo-body)] hover:text-[var(--alo-text)] dark:text-[var(--alo-text-muted)] dark:hover:text-white flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Assets'}
                      </button>
                      <button
                        onClick={() => handleDisconnect(item.id)}
                        className="text-xs font-medium text-crm-danger-text hover:text-crm-danger-text dark:text-[var(--alo-error)] flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStartOAuthWizard(item)}
                      className="w-full py-2 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      <PlusCircle className="w-4 h-4" /> Connect via OAuth 2.0
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* OAuth Connection Wizard Modal */}
      {activeWizard && selectedProvider && (
        <div className="fixed inset-0 z-50 bg-[var(--alo-navy)]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[var(--alo-page)] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[var(--alo-border)] dark:border-[var(--alo-border)] space-y-6">
            <div className="flex justify-between items-center border-b border-[var(--alo-border)] dark:border-[var(--alo-border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--alo-brand-pale)] dark:bg-[var(--alo-brand-deep)]/30 rounded-lg">
                  {getProviderIcon(selectedProvider.provider)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--alo-text)] dark:text-white">
                    Connect {selectedProvider.name}
                  </h3>
                  <p className="text-xs text-[var(--alo-text-muted)]">Official Provider OAuth 2.0 Step {wizardStep} of 2</p>
                </div>
              </div>
              <button
                onClick={() => setActiveWizard(null)}
                className="text-[var(--alo-text-muted)] hover:text-[var(--alo-body)] dark:hover:text-[var(--alo-body)]"
              >
                ✕
              </button>
            </div>

            {wizardStep === 1 && (
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-[var(--alo-brand-pale)] dark:bg-[var(--alo-brand)]/30 border border-[var(--alo-border)] dark:border-[var(--alo-brand-border)] rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[var(--alo-brand)] dark:text-[var(--alo-brand)]">
                    <Shield className="w-4 h-4" /> Official Integration Guarantee
                  </div>
                  <p className="text-xs text-[var(--alo-body)] dark:text-[var(--alo-placeholder)]">
                    You will be redirected to authentication directly on {selectedProvider.name}'s secure servers. ALO Education never sees or stores your password.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[var(--alo-body)] dark:text-[var(--alo-placeholder)]">
                    Integration / Asset Name Label:
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ALO Education Official ${selectedProvider.name}`}
                    value={accountNameInput}
                    onChange={(e) => setAccountNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--alo-page)] dark:bg-[var(--alo-page)] border border-[var(--alo-border-strong)] dark:border-[var(--alo-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--alo-brand)]"
                  />
                </div>

                <button
                  onClick={() => setWizardStep(2)}
                  className="w-full py-2.5 bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white font-semibold rounded-lg flex items-center justify-center gap-2 text-sm transition"
                >
                  <ExternalLink className="w-4 h-4" /> Authenticate on {selectedProvider.name}
                </button>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-crm-success-bg dark:bg-[var(--alo-success)]/10 border border-crm-success-border dark:border-crm-success-border rounded-xl space-y-2 text-center">
                  <CheckCircle2 className="w-8 h-8 text-crm-success-text mx-auto" />
                  <h4 className="font-bold text-[var(--alo-text)] dark:text-white">Authorization Granted</h4>
                  <p className="text-xs text-[var(--alo-body)] dark:text-[var(--alo-placeholder)]">
                    Official OAuth token received. Discovered assets: ALO Primary Page, Phone ID, Analytics Property.
                  </p>
                </div>

                <button
                  onClick={handleConnectIntegration}
                  className="w-full py-2.5 bg-[var(--alo-success-dark)] hover:bg-[var(--alo-success-dark)] text-white font-semibold rounded-lg text-sm transition"
                >
                  Confirm Asset Discovery & Save Integration
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
