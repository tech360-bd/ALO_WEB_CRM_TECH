'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EditorialFlowDiagram from '@/components/marketing/EditorialFlowDiagram';
import MarketingKitPanel from '@/components/marketing/MarketingKitPanel';
import {
  Share2,
  Zap,
  ShieldCheck,
  Upload,
  Sparkles,
  FileCheck,
  Check,
  X,
  RefreshCw,
  Sliders,
  Layers,
  Bot,
} from 'lucide-react';

type ProviderStatus = {
  id: string;
  provider: string;
  name: string;
  status: string;
  webhookStatus?: string;
  healthStatus?: string;
  lastSyncAt?: string | null;
};

const defaultProviderCards: ProviderStatus[] = [
  { id: 'whatsapp-default', provider: 'whatsapp', name: 'WhatsApp Business Cloud API', status: 'NOT_CONFIGURED' },
  { id: 'meta-default', provider: 'meta_business', name: 'Meta Facebook & Instagram', status: 'NOT_CONFIGURED' },
  { id: 'email-default', provider: 'smtp_email', name: 'Email Gateway', status: 'NOT_CONFIGURED' },
  { id: 'sms-default', provider: 'sms_provider', name: 'SMS Gateway', status: 'NOT_CONFIGURED' },
  { id: 'n8n-default', provider: 'n8n', name: 'n8n Webhook Manager', status: 'NOT_CONFIGURED' },
];

function statusStyles(status: string) {
  if (status === 'CONNECTED') return 'bg-emerald-50 border-emerald-200 text-emerald-800';
  if (status.includes('PENDING') || status.includes('REQUIRES') || status.includes('LIVE_TEST')) return 'bg-amber-50 border-amber-200 text-amber-800';
  if (status.includes('ERROR') || status.includes('EXPIRED')) return 'bg-red-50 border-red-200 text-red-800';
  return 'bg-slate-50 border-slate-200 text-slate-700';
}

export default function MarketingAutomationDashboard() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoUploaded, setLogoUploaded] = useState(false);
  const [n8nStatus, setN8nStatus] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [commentKeyword, setCommentKeyword] = useState('Study Abroad');
  const [commentLog, setCommentLog] = useState<string | null>(null);
  const [workflowLog, setWorkflowLog] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/marketing/automation');
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setLogoUploaded(json.brandConfig?.logoConfigured || false);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleLogoUpload = async () => {
    if (!logoUrl.trim()) {
      setCommentLog('Brand logo URL is required. Upload the file through the approved file flow first, then save its validated URL here.');
      return;
    }
    setUploadingLogo(true);
    try {
      const res = await fetch('/api/marketing/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPLOAD_BRAND_LOGO',
          payload: { title: 'ALO Education Official Logo', fileUrl: logoUrl.trim() },
        }),
      });
      if (res.ok) {
        setLogoUploaded(true);
        fetchDashboardData();
      }
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleTestCommentAutomation = async () => {
    try {
      const res = await fetch('/api/marketing/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRIGGER_COMMENT_AUTOMATION',
          payload: { keyword: commentKeyword },
        }),
      });
      const json = await res.json();
      if (json.success) {
        setCommentLog(`Draft created for "${commentKeyword}". Status: ${json.status}. No public reply, DM, or lead was created.`);
      } else {
        setCommentLog(json.error || 'Comment automation draft was not created.');
      }
    } catch {
      setCommentLog('Automation draft request failed.');
    }
  };

  const handleWorkflowRequest = async () => {
    setWorkflowLog(null);
    const res = await fetch('/api/marketing/automation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'TOGGLE_N8N_WORKFLOW',
        payload: { workflowId: 'marketing-lead-sync', requestedEnabled: !n8nStatus },
      }),
    });
    const json = await res.json();
    if (res.ok && json.success) {
      setN8nStatus(!n8nStatus);
      setWorkflowLog(json.message || 'Workflow state updated.');
      return;
    }
    setWorkflowLog(json.message || json.error || 'Workflow state was not changed.');
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p className="text-xs font-semibold">Loading Marketing Automation Center...</p>
      </div>
    );
  }

  const role = data?.userRole || 'MARKETING_MANAGER';
  const metrics = data?.metrics || {
    activeCampaigns: 0,
    pendingApprovals: 0,
    stagedPosts: 0,
    totalLeads: 0,
    whatsappConversations: 0,
    overdueSlaCount: 0,
    ocrDocumentJobs: 0,
  };
  const providerCards: ProviderStatus[] = data?.providerStatuses?.length ? data.providerStatuses : defaultProviderCards;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-slate-900">
      {/* Header & Access Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">Marketing & Omnichannel Automation Center</h1>
            <span className="px-2.5 py-0.5 bg-[#F97316] text-white text-[11px] font-extrabold rounded-full">
              24/7 LIVE
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official WhatsApp Business, Meta Facebook/Instagram DMs, Comment-to-Lead, AI Post Approvals & n8n Workflows.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="text-slate-400 block">Access Control Level:</span>
            <strong className="text-blue-700 font-bold">{role}</strong>
          </div>
          <Button onClick={fetchDashboardData} className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl px-4 flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Refresh Status
          </Button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">Active Campaigns</span>
          <p className="text-2xl font-extrabold text-blue-600">{metrics.activeCampaigns}</p>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">Pending Approvals</span>
          <p className="text-2xl font-extrabold text-amber-600">{metrics.pendingApprovals}</p>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">Staged AI Posts</span>
          <p className="text-2xl font-extrabold text-indigo-600">{metrics.stagedPosts}</p>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">Captured Leads</span>
          <p className="text-2xl font-extrabold text-emerald-600">{metrics.totalLeads}</p>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">WhatsApp SLA Overdue</span>
          <p className="text-2xl font-extrabold text-red-600">{metrics.overdueSlaCount}</p>
        </Card>
        <Card className="p-4 bg-white border border-slate-200 rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-slate-500">OCR Docs Auto-Matched</span>
          <p className="text-2xl font-extrabold text-purple-600">{metrics.ocrDocumentJobs}</p>
        </Card>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'overview', label: 'Dashboard Overview', icon: Layers },
          { id: 'brand', label: 'Brand Assets & Logo', icon: Sparkles },
          { id: 'comment_lead', label: 'Comment-to-Lead', icon: Zap },
          { id: 'whatsapp_ai', label: 'WhatsApp 24/7 AI & SLA', icon: Bot },
          { id: 'approvals', label: 'Content Approval Queue', icon: FileCheck },
          { id: 'n8n', label: 'n8n Webhook Manager', icon: Sliders },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 shrink-0 transition ${
                isActive ? 'bg-[#2563EB] text-white font-bold' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 bg-white border border-slate-200 rounded-2xl lg:col-span-2 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-600" /> Official Channel Integration Status
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {providerCards.map((provider) => (
                <div key={provider.id} className={`p-4 border rounded-xl space-y-1 ${statusStyles(provider.status)}`}>
                  <div className="flex justify-between gap-3 font-bold">
                    <span>{provider.name}</span>
                    <span>{provider.status}</span>
                  </div>
                  <p>
                    {provider.status === 'CONNECTED'
                      ? `Last sync: ${provider.lastSyncAt || 'not recorded'}`
                      : 'Provider is not live-verified. OAuth, webhook verification, and live API testing must complete before outbound automation runs.'}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Access Security Control Panel */}
          <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" /> Official RBAC Permissions
            </h2>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800">Marketing Manager:</span>
                <p className="text-slate-600">Full Official Company Social Media & Campaign Control.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800">Approved Marketing Users (Max 3):</span>
                <p className="text-slate-600">Shared Access to Prepare Drafts & Manage Comments.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800">Other Employees:</span>
                <p className="text-slate-600">Restricted. Own Official Channels & Assigned Chats Only.</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 2: BRAND ASSETS & LOGO */}
      {activeTab === 'brand' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" /> Official ALO Brand Asset Configuration
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every AI-generated post, video reel, and campaign banner enforces official ALO Education branding rules.
              </p>
            </div>
            {logoUploaded ? (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-300">
                ✓ Logo Configured
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-300">
                ⚠️ Logo Missing
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-center">
              <div className="w-20 h-20 bg-white border-2 border-dashed border-slate-300 rounded-2xl mx-auto flex items-center justify-center text-slate-400">
                {logoUploaded ? (
                  <span className="font-extrabold text-blue-700 text-lg">ALO</span>
                ) : (
                  <Upload className="w-8 h-8" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Official Company Logo</h3>
              <p className="text-slate-500 mt-1">Upload transparent PNG logo for post generation watermark.</p>
            </div>
              <input
                type="url"
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
                placeholder="Validated uploaded logo URL"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl"
              />
              <Button
                onClick={handleLogoUpload}
                disabled={uploadingLogo}
                className="bg-[#2563EB] hover:bg-blue-700 text-white text-xs rounded-xl px-5 mx-auto flex items-center gap-1.5"
              >
                {uploadingLogo ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploadingLogo ? 'Configuring Logo...' : 'Upload & Save Official Logo'}
              </Button>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900">Official ALO Color Tokens</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#F97316]" />
                    <span className="font-semibold text-slate-800">Primary Orange</span>
                  </div>
                  <code className="font-mono text-slate-600">#F97316</code>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-300" />
                    <span className="font-semibold text-slate-800">White Background</span>
                  </div>
                  <code className="font-mono text-slate-600">#FFFFFF</code>
                </div>

                <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2563EB]" />
                    <span className="font-semibold text-slate-800">Professional Blue Accent</span>
                  </div>
                  <code className="font-mono text-slate-600">#2563EB</code>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 3: COMMENT-TO-LEAD AUTOMATION */}
      {activeTab === 'comment_lead' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" /> Facebook & Instagram Comment-to-Lead Automation
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Creates approval-required reply drafts from keyword rules. Live public replies require approved Meta OAuth, verified webhooks, and Marketing Manager approval.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="space-y-4">
              <h3 className="font-bold text-slate-800">Active Keyword Triggers</h3>
              <div className="flex wrap gap-2">
                {['Study Abroad', 'IELTS', 'Visa', 'UK', 'Canada', 'Australia', 'Scholarship', 'Apply'].map((kw) => (
                  <button
                    key={kw}
                    onClick={() => setCommentKeyword(kw)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                      commentKeyword === kw ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {kw}
                  </button>
                ))}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="font-bold text-slate-800 block">Test Selected Trigger:</span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentKeyword}
                    onChange={(e) => setCommentKeyword(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl"
                  />
                  <Button onClick={handleTestCommentAutomation} className="bg-[#2563EB] text-white text-xs rounded-xl px-4">
                    Create Draft
                  </Button>
                </div>
                {commentLog && <p className="text-xs font-semibold text-slate-700 bg-slate-100 p-2.5 rounded-lg">{commentLog}</p>}
              </div>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <h3 className="font-bold text-slate-800">Automation Workflow Lifecycle:</h3>
              <ol className="space-y-2 text-slate-600 list-decimal list-inside">
                <li>Provider webhook receives a verified Facebook or Instagram event.</li>
                <li>CRM stores the event and checks consent, duplicate contacts, and assignment rules.</li>
                <li>AI prepares a draft reply and lead suggestion only.</li>
                <li>Marketing Manager approves before public reply, DM, or lead conversion.</li>
                <li>Audit log stores the approval and final action result.</li>
              </ol>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 4: WHATSAPP 24/7 AI & SLA */}
      {activeTab === 'whatsapp_ai' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-5 h-5 text-emerald-600" /> WhatsApp 24/7 AI Agent & SLA Manager
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              After-hours AI responses, student memory loading, OTP protection for private data, and SLA escalation (40m → 20m → 10m).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <span className="font-bold text-emerald-900">24/7 After-Hours Mode:</span>
              <p className="text-emerald-800">Office hours: Human counselor chat.<br />After hours: AI auto-responds in Bangla/English.</p>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-2">
              <span className="font-bold text-blue-900">OTP Privacy Protection:</span>
              <p className="text-blue-800">AI requires OTP verification before releasing application, visa, or payment info.</p>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
              <span className="font-bold text-amber-900">SLA Escalation Timers:</span>
              <p className="text-amber-800">40m response limit → 20m Manager alert → 10m Super Admin/CEO alert.</p>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 5: CONTENT APPROVAL QUEUE */}
      {activeTab === 'approvals' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-indigo-600" /> AI & Staff Post Draft Approval Queue
            </h2>
            <span className="text-xs font-semibold text-slate-500">Marketing Manager Sign-off Enforced</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900">Post Draft: UK 2026 September Intake Deadline Tips</span>
                <p className="text-slate-500 mt-0.5">Prepared by Marketing Staff • Facebook, Instagram, LinkedIn</p>
              </div>
              <div className="flex items-center gap-2">
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-xl px-3 py-1 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Approve & Publish
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-red-50 text-red-600 hover:bg-red-100 text-xs rounded-xl px-3 py-1 flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Reject
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 6: N8N WEBHOOK MANAGER */}
      {activeTab === 'n8n' && (
        <Card className="p-6 bg-white border border-slate-200 rounded-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" /> n8n Webhook & Workflow Manager
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Toggle automated lead synchronization, WhatsApp sequences, and counselor notification workflows.
              </p>
            </div>
            <Button
              onClick={handleWorkflowRequest}
              className="text-xs font-bold rounded-xl px-4 bg-amber-100 text-amber-800 hover:bg-amber-200"
            >
              Request Workflow Change
            </Button>
          </div>
          {workflowLog && <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 p-3 rounded-xl">{workflowLog}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900">Lead Auto-Sync Webhook</span>
              <p className="text-slate-500">Syncs incoming website form submissions to CRM in real-time.</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900">Counselor Notification Sequence</span>
              <p className="text-slate-500">Triggers instant SMS & WhatsApp notification to assigned counselor.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-6">
        <EditorialFlowDiagram />
        <MarketingKitPanel />
      </div>
    </div>
  );
}
