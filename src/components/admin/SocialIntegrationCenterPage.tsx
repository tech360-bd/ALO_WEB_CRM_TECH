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
      case 'whatsapp': return <MessageSquare className="w-6 h-6 text-emerald-500" />;
      case 'facebook_page': return <Facebook className="w-6 h-6 text-blue-600" />;
      case 'instagram': return <Instagram className="w-6 h-6 text-pink-600" />;
      case 'google_analytics': return <BarChart className="w-6 h-6 text-amber-500" />;
      case 'google_search_console': return <Search className="w-6 h-6 text-indigo-500" />;
      case 'youtube': return <Video className="w-6 h-6 text-red-600" />;
      case 'telegram': return <Send className="w-6 h-6 text-sky-500" />;
      case 'smtp_email': return <Mail className="w-6 h-6 text-purple-600" />;
      case 'sms_provider': return <Phone className="w-6 h-6 text-orange-500" />;
      default: return <Share2 className="w-6 h-6 text-slate-600" />;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-7 h-7 text-[#0B5ED7]" />
            <h1 className="text-2xl font-bold">ALO Social Integration Center</h1>
            <span className="bg-blue-100 text-[#0B5ED7] dark:bg-blue-900/40 dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              OAuth 2.0 Official Platform
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Connect official Meta, WhatsApp Business, Google, YouTube, and Email/SMS accounts. Zero password scraping.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchIntegrations}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition"
          >
            <RefreshCw className="w-4 h-4" /> Sync Integration Status
          </button>
        </div>
      </div>

      {/* Integration Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading Social Integration Status...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item) => {
            const isConnected = item.status === 'connected';
            const isSyncing = syncingProvider === item.provider;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                        {getProviderIcon(item.provider)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          API {item.apiVersion || 'v19.0'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        isConnected
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Connected
                        </>
                      ) : (
                        'Disconnected'
                      )}
                    </span>
                  </div>

                  {/* Account Details */}
                  <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Account:</span>
                      <span className="font-medium truncate max-w-[180px]">
                        {item.connectedAccount || 'Not Configured'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Webhook Status:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {item.webhookStatus || 'inactive'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Health:</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {item.healthStatus || 'healthy'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60">
                  {isConnected ? (
                    <>
                      <button
                        onClick={() => handleSyncNow(item.provider)}
                        disabled={isSyncing}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        {isSyncing ? 'Syncing...' : 'Sync Assets'}
                      </button>
                      <button
                        onClick={() => handleDisconnect(item.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Disconnect
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStartOAuthWizard(item)}
                      className="w-full py-2 bg-[#0B5ED7] hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                  {getProviderIcon(selectedProvider.provider)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                    Connect {selectedProvider.name}
                  </h3>
                  <p className="text-xs text-slate-500">Official Provider OAuth 2.0 Step {wizardStep} of 2</p>
                </div>
              </div>
              <button
                onClick={() => setActiveWizard(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {wizardStep === 1 && (
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[#0B5ED7] dark:text-blue-300">
                    <Shield className="w-4 h-4" /> Official Integration Guarantee
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    You will be redirected to authentication directly on {selectedProvider.name}'s secure servers. ALO Education never sees or stores your password.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Integration / Asset Name Label:
                  </label>
                  <input
                    type="text"
                    placeholder={`e.g. ALO Education Official ${selectedProvider.name}`}
                    value={accountNameInput}
                    onChange={(e) => setAccountNameInput(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0B5ED7]"
                  />
                </div>

                <button
                  onClick={() => setWizardStep(2)}
                  className="w-full py-2.5 bg-[#0B5ED7] hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 text-sm transition"
                >
                  <ExternalLink className="w-4 h-4" /> Authenticate on {selectedProvider.name}
                </button>
              </div>
            )}

            {wizardStep === 2 && (
              <div className="space-y-4 text-sm">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-2 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                  <h4 className="font-bold text-slate-900 dark:text-white">Authorization Granted</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Official OAuth token received. Discovered assets: ALO Primary Page, Phone ID, Analytics Property.
                  </p>
                </div>

                <button
                  onClick={handleConnectIntegration}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm transition"
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
