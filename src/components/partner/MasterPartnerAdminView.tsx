'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building,
  GraduationCap,
  FileText,
  Sparkles,
  Ticket,
  Sliders,
  ShieldCheck,
  Plus,
  RefreshCw,
  Send,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart2,
  Settings,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { PartnerMarketingStudio } from '@/components/alo/views/partner-marketing-studio';

interface MasterPartnerAdminViewProps {
  currentPath?: string;
}

export default function MasterPartnerAdminView({ currentPath = '/partner-admin/dashboard' }: MasterPartnerAdminViewProps) {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [requestingSeats, setRequestingSeats] = useState(false);
  const [seatSeats, setSeatSeats] = useState(2);
  const [seatReason, setSeatReason] = useState('');
  const [seatMsg, setSeatMsg] = useState('');

  // Marketing form state
  const [mIdea, setMIdea] = useState('');
  const [mCountry, setMCountry] = useState('United Kingdom');
  const [mAssetType, setMAssetType] = useState('image');
  const [mGenerating, setMGenerating] = useState(false);
  const [mResult, setMResult] = useState<any | null>(null);
  const [mError, setMError] = useState('');

  const fetchPartnerData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/partner-admin/dashboard');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartnerData();
  }, []);

  const handleSeatRequest = async () => {
    setRequestingSeats(true);
    try {
      const res = await fetch('/api/partner-admin/seat-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestedExtraSeats: seatSeats, reason: seatReason }),
      });
      const json = await res.json();
      if (json.success) {
        setSeatMsg('✓ Extra seat request sent to ALO Super Admin for approval.');
        fetchPartnerData();
      }
    } finally {
      setRequestingSeats(false);
    }
  };

  const handleGenerateMarketing = async () => {
    setMGenerating(true);
    setMError('');
    setMResult(null);
    try {
      const res = await fetch('/api/partner-admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: mIdea,
          countryId: mCountry,
          assetType: mAssetType,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setMResult(json);
      } else {
        setMError(json.error || 'Failed to generate content');
      }
    } finally {
      setMGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[var(--alo-text-muted)] space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--alo-brand)]" />
        <p className="text-xs font-semibold">Loading B2B Partner Super Admin Portal...</p>
      </div>
    );
  }

  const kpis = data?.kpis || {
    totalStudents: 28,
    activeApplications: 12,
    submittedApplications: 8,
    offerReceived: 5,
    visaReadyStudents: 3,
    counselorSeats: { limit: 3, used: 2, available: 1 },
    marketingQuota: { monthlyImageLimit: 15, imagesUsed: 4, monthlyVideoLimit: 10, videosUsed: 2 },
    vouchersCount: 6,
    commissionStatus: 'BDT 1,45,000 Verified',
  };

  const routesList = [
    { path: '/partner-admin/dashboard', label: 'Dashboard Overview', icon: BarChart2 },
    { path: '/partner-admin/users', label: 'Counselor & User Seats', icon: Users },
    { path: '/partner-admin/students', label: 'Partner Students', icon: GraduationCap },
    { path: '/partner-admin/applications', label: 'Applications', icon: FileText },
    { path: '/partner-admin/marketing-studio', label: 'Partner Marketing Studio', icon: Sparkles },
    { path: '/partner-admin/voucher-codes', label: 'Student Test Vouchers', icon: Ticket },
    { path: '/partner-admin/company-profile', label: 'Company Profile', icon: Building },
    { path: '/partner-admin/settings', label: 'Partner Settings', icon: Settings },
  ];
  // Portal Navigation Bar — shared by the dashboard body and the Marketing Studio route.
  const portalNav = (
        <div className="flex items-center gap-2 border-b border-[var(--alo-border)] pb-2 text-xs font-semibold overflow-x-auto">
          {routesList.map((r) => {
            const Icon = r.icon;
            const isActive = currentPath === r.path;
            return (
              <Link key={r.path} href={r.path}>
                <div
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 shrink-0 transition cursor-pointer ${
                    isActive ? 'bg-[var(--alo-brand)] text-white font-bold' : 'bg-white text-[var(--alo-body)] border border-[var(--alo-border)] hover:bg-[var(--alo-page)]'
                  }`}
                >
                  <Icon className="w-4 h-4" /> {r.label}
                </div>
              </Link>
            );
          })}
        </div>
  );


  // /partner-admin/marketing-studio renders the real, API-backed Marketing Studio
  // (quota, AI draft generation, approval and scheduling workflow) instead of the
  // generic partner dashboard body. The portal chrome is shared via portalNav.
  const isMarketingStudioPath =
    currentPath === '/partner-admin/marketing-studio' ||
    currentPath === '/partner-admin/content-generator';

  if (isMarketingStudioPath) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 text-[var(--alo-text)]">
        {portalNav}
        <PartnerMarketingStudio />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-[var(--alo-text)]">
      {/* Top Navigation & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[var(--alo-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[var(--alo-text)]">B2B Partner Super Admin Portal</h1>
            <Badge className="bg-[var(--alo-brand)] text-white text-[11px] font-extrabold">VERIFIED B2B PARTNER</Badge>
          </div>
          <p className="text-xs text-[var(--alo-text-muted)] mt-1">
            Manage your company users, assigned student applications, marketing studio quotas, and student test vouchers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="p-3 bg-[var(--alo-page)] rounded-xl border border-[var(--alo-border)] text-xs">
            <span className="text-[var(--alo-text-muted)] block">User Seats:</span>
            <strong className="text-emerald-700 font-bold">{kpis.counselorSeats.used} / {kpis.counselorSeats.limit} Used</strong>
          </div>
          <Button onClick={fetchPartnerData} className="bg-[var(--alo-surface-muted)] hover:bg-slate-200 text-[var(--alo-body)] rounded-xl px-4 flex items-center gap-1.5">
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
        </div>
      </div>

      {portalNav}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">Partner Students</span>
          <p className="text-2xl font-extrabold text-[var(--alo-brand)]">{kpis.totalStudents}</p>
        </Card>
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">Active Applications</span>
          <p className="text-2xl font-extrabold text-indigo-600">{kpis.activeApplications}</p>
        </Card>
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">Submitted Stage</span>
          <p className="text-2xl font-extrabold text-purple-600">{kpis.submittedApplications}</p>
        </Card>
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">Offers Received</span>
          <p className="text-2xl font-extrabold text-emerald-600">{kpis.offerReceived}</p>
        </Card>
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">Image Quota</span>
          <p className="text-2xl font-extrabold text-amber-600">{kpis.marketingQuota.imagesUsed} / {kpis.marketingQuota.monthlyImageLimit}</p>
        </Card>
        <Card className="p-4 bg-white border border-[var(--alo-border)] rounded-xl space-y-1">
          <span className="text-[11px] font-semibold text-[var(--alo-text-muted)]">Video Quota</span>
          <p className="text-2xl font-extrabold text-rose-600">{kpis.marketingQuota.videosUsed} / {kpis.marketingQuota.monthlyVideoLimit}</p>
        </Card>
      </div>

      {/* SECTION 1: USER SEAT MANAGEMENT & ALO SUPER ADMIN REQUEST FLOW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white border border-[var(--alo-border)] rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--alo-border)] pb-3">
            <h2 className="text-base font-bold text-[var(--alo-text)] flex items-center gap-2">
              <Users className="w-5 h-5 text-[var(--alo-brand)]" /> Counselor Seat Management
            </h2>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Default Limit: 3 Users (1 Admin + 2 Counselors)
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[var(--alo-page)] rounded-xl border border-[var(--alo-border)] flex justify-between items-center">
              <div>
                <span className="font-bold text-[var(--alo-text)]">1. Partner Super Admin (You)</span>
                <p className="text-[var(--alo-text-muted)]">Master Partner Control • Full Company Scope</p>
              </div>
              <Badge className="bg-[var(--alo-brand)] text-white text-[11px]">ACTIVE</Badge>
            </div>

            <div className="p-3 bg-[var(--alo-page)] rounded-xl border border-[var(--alo-border)] flex justify-between items-center">
              <div>
                <span className="font-bold text-[var(--alo-text)]">2. Senior Counselor (Partner Employee 1)</span>
                <p className="text-[var(--alo-text-muted)]">Assigned Partner Students & Applications</p>
              </div>
              <Badge className="bg-emerald-600 text-white text-[11px]">ACTIVE</Badge>
            </div>

            <div className="p-3 bg-[var(--alo-page)] rounded-xl border border-[var(--alo-border)] flex justify-between items-center">
              <div>
                <span className="font-bold text-[var(--alo-text)]">3. Application Assistant (Partner Employee 2)</span>
                <p className="text-[var(--alo-text-muted)]">Available Seat</p>
              </div>
              <Badge className="bg-slate-200 text-[var(--alo-body)] text-[11px]">AVAILABLE</Badge>
            </div>
          </div>
        </Card>

        {/* EXTRA SEAT REQUEST FORM */}
        <Card className="p-6 bg-white border border-[var(--alo-border)] rounded-2xl space-y-4">
          <div className="border-b border-[var(--alo-border)] pb-3">
            <h2 className="text-base font-bold text-[var(--alo-text)] flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" /> Request Extra User Seats from ALO Super Admin
            </h2>
            <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">
              If your counseling team is expanding, submit a seat increase request. ALO Super Admin reviews and approves all requests.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-[var(--alo-body)] block mb-1">Extra Seats Needed:</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={seatSeats}
                onChange={(e) => setSeatSeats(Number(e.target.value))}
                className="text-xs bg-[var(--alo-page)]"
              />
            </div>

            <div>
              <label className="font-semibold text-[var(--alo-body)] block mb-1">Reason for Request:</label>
              <Textarea
                placeholder="Explain why your company needs extra counselor seats..."
                value={seatReason}
                onChange={(e) => setSeatReason(e.target.value)}
                className="min-h-[70px] text-xs bg-[var(--alo-page)]"
              />
            </div>

            <Button
 onClick={handleSeatRequest}
 disabled={requestingSeats}
 className="w-full bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white rounded-xl py-2 flex items-center justify-center gap-1.5"
 >
              {requestingSeats ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {requestingSeats ? 'Submitting Request...' : 'Submit Request to ALO Super Admin'}
            </Button>

            {seatMsg && <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 p-2.5 rounded-lg text-center">{seatMsg}</p>}
          </div>
        </Card>
      </div>

      {/* SECTION 2: PARTNER MARKETING STUDIO (15 IMAGES / 10 VIDEOS MAX 30s) */}
      <Card className="p-6 bg-white border border-[var(--alo-border)] rounded-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-[var(--alo-border)] pb-4">
          <div>
            <h2 className="text-base font-bold text-[var(--alo-text)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" /> Partner Marketing Automation Studio
            </h2>
            <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">
              Generate AI promotional captions, image banners, and 30-second reel video scripts under your monthly partner quota.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="p-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl">
              📷 Images: {kpis.marketingQuota.imagesUsed} / {kpis.marketingQuota.monthlyImageLimit}
            </span>
            <span className="p-2 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">
              🎥 30s Videos: {kpis.marketingQuota.videosUsed} / {kpis.marketingQuota.monthlyVideoLimit}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          <div className="space-y-4">
            <div>
              <label className="font-semibold text-[var(--alo-body)] block mb-1">Campaign Idea / Objective:</label>
              <Input
                placeholder="e.g. September 2026 UK Intake Free Counseling Drive"
                value={mIdea}
                onChange={(e) => setMIdea(e.target.value)}
                className="text-xs bg-[var(--alo-page)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[var(--alo-body)] block mb-1">Destination Country:</label>
                <select
                  value={mCountry}
                  onChange={(e) => setMCountry(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[var(--alo-border-strong)] rounded-xl bg-[var(--alo-page)]"
                >
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="United States">United States</option>
                  <option value="Germany">Germany</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[var(--alo-body)] block mb-1">Asset Type (Quota Check):</label>
                <select
                  value={mAssetType}
                  onChange={(e) => setMAssetType(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[var(--alo-border-strong)] rounded-xl bg-[var(--alo-page)]"
                >
                  <option value="image">Social Image Banner (15/mo)</option>
                  <option value="video">30s Reel Video Script (10/mo)</option>
                </select>
              </div>
            </div>

            <Button
 onClick={handleGenerateMarketing}
 disabled={mGenerating}
 className="w-full bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-black font-bold rounded-xl py-2.5 flex items-center justify-center gap-2"
 >
              {mGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {mGenerating ? 'Generating AI Draft...' : 'Generate AI Marketing Package'}
            </Button>

            {mError && <p className="text-xs font-bold text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">{mError}</p>}
          </div>

          {/* GENERATED DRAFT PREVIEW */}
          <div className="p-4 bg-[var(--alo-page)] rounded-2xl border border-[var(--alo-border)] space-y-3">
            <h3 className="font-bold text-[var(--alo-text)] border-b border-[var(--alo-border)] pb-2">AI Draft Output Preview</h3>
            {mResult ? (
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="font-bold text-[var(--alo-text)] block">Caption &amp; Hashtags:</span>
                  <p className="text-[var(--alo-body)] bg-white p-2.5 rounded-lg border border-[var(--alo-border)]">{mResult.request?.caption}</p>
                </div>
                <div>
                  <span className="font-bold text-[var(--alo-text)] block">30s Video Script / Image Prompt:</span>
                  <p className="text-[var(--alo-body)] bg-white p-2.5 rounded-lg border border-[var(--alo-border)] font-mono text-[11px]">
                    {mResult.request?.videoScript || mResult.request?.imagePrompt}
                  </p>
                </div>
                <Badge className="bg-emerald-600 text-white text-[11px]">{mResult.quotaUsed}</Badge>
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--alo-text-muted)]">
                <Sparkles className="w-8 h-8 mx-auto opacity-40 mb-2" />
                <p>Submit campaign idea to generate caption, hashtags, and 30s reel scripts under partner quota.</p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* SECTION 3: STUDENT TEST VOUCHERS & BENEFIT ENTITLEMENTS */}
      <Card className="p-6 bg-white border border-[var(--alo-border)] rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--alo-border)] pb-3">
          <div>
            <h2 className="text-base font-bold text-[var(--alo-text)] flex items-center gap-2">
              <Ticket className="w-5 h-5 text-purple-600" /> Student Test Vouchers &amp; Benefit Entitlements
            </h2>
            <p className="text-xs text-[var(--alo-text-muted)] mt-0.5">
              Special ALO learning &amp; interview prep benefits are granted ONLY when a student has an active ALO Education application.
            </p>
          </div>
          <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs font-mono">
            3 English Vouchers per Application
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 space-y-1">
            <span className="font-bold text-purple-900 block">1. UKVI / Credibility Prep</span>
            <p className="text-purple-800">1 Full UKVI interview prep package per active application.</p>
          </div>
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 space-y-1">
            <span className="font-bold text-indigo-900 block">2. University Mock Attempt</span>
            <p className="text-indigo-800">1 Free university interview practice mock attempt.</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
            <span className="font-bold text-emerald-900 block">3. 3x English Test Vouchers</span>
            <p className="text-emerald-800">3 Voucher codes generated upon active ALO application approval.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
