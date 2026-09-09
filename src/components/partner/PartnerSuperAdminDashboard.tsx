'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users, FileText, CheckCircle2, Clock, Image, Video, Award, ShieldCheck, Ticket, Plus, Sparkles, Send, Lock
} from 'lucide-react';
import { toast } from 'sonner';

export default function PartnerSuperAdminDashboard() {
  const { user, token, setView } = usePortalStore();

  const [metrics, setMetrics] = useState<any>({
    totalStudents: 24,
    activeApps: 12,
    submittedApps: 8,
    offersReceived: 5,
    visaReady: 4,
    pendingDocs: 3,
    availableSeats: 3,
    usedSeats: 2,
    imageQuotaUsed: 6,
    videoQuotaUsed: 3,
    mockVouchersUsed: 8,
    interviewPrepUsage: 4,
    englishVouchersUsed: 7,
    pendingAloApprovals: 2,
    supportTickets: 1,
  });

  return (
    <div className="space-y-6 bg-slate-50/50 min-h-screen p-4 lg:p-6">
      {/* Partner Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Global Education Consultancy</h1>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs font-mono">B2B PARTNER SUPER ADMIN</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your company employees, student applications, marketing studio (15 images / 10 videos quota), and student mock test vouchers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setView('partner-admin-marketing-studio')}>
            <Sparkles className="w-3.5 h-3.5 mr-1" /> Open Marketing Studio
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs text-slate-700 border-slate-300" onClick={() => setView('partner-admin-users-create')}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Request Extra Seats
          </Button>
        </div>
      </div>

      {/* 15 KPI Metric Cards (Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Students */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-slate-500">Total Students</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics.totalStudents}</p>
          </CardContent>
        </Card>

        {/* Active Apps */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-slate-500">Active Applications</p>
            <p className="text-xl font-bold text-indigo-600 mt-0.5">{metrics.activeApps}</p>
          </CardContent>
        </Card>

        {/* Submitted Apps */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-slate-500">Submitted Apps</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics.submittedApps}</p>
          </CardContent>
        </Card>

        {/* Offers Received */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-slate-500">Offers Received</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{metrics.offersReceived}</p>
          </CardContent>
        </Card>

        {/* Visa Ready */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-slate-500">Visa Ready</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{metrics.visaReady}</p>
          </CardContent>
        </Card>

        {/* Pending Docs */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-slate-500">Pending Documents</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5">{metrics.pendingDocs}</p>
          </CardContent>
        </Card>

        {/* User Seats */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-slate-500">Counselor Seats</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{metrics.usedSeats} / {metrics.availableSeats}</p>
          </CardContent>
        </Card>

        {/* Image Quota */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-slate-500">Image Quota</p>
            <p className="text-xl font-bold text-indigo-600 mt-0.5">{metrics.imageQuotaUsed} / 15</p>
          </CardContent>
        </Card>

        {/* Video Quota */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-slate-500">Video Quota (30s)</p>
            <p className="text-xl font-bold text-purple-600 mt-0.5">{metrics.videoQuotaUsed} / 10</p>
          </CardContent>
        </Card>

        {/* English Mock Vouchers */}
        <Card className="bg-white border-slate-200 shadow-2xs">
          <CardContent className="p-3">
            <p className="text-[11px] font-medium text-slate-500">English Vouchers (3/stu)</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5">{metrics.englishVouchersUsed} Issued</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Marketing Studio Preview + User Seats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (col-span-7): Marketing Studio */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="bg-white border-indigo-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-indigo-100 bg-indigo-50/30 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Partner AI Marketing Studio</CardTitle>
                <CardDescription className="text-xs text-slate-500">Generate Facebook/Instagram posts, hashtags &amp; 30s video scripts within ALO monthly quota.</CardDescription>
              </div>
              <Sparkles className="w-5 h-5 text-indigo-600" />
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <span>Study in UK — Sep 2025 Campaign</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700">Quota Available</Badge>
                </div>
                <p className="text-slate-600 italic">
                  &quot;Apply now for Top UK Universities! Up to £7,500 Scholarships available for Bangladeshi students. DM or WhatsApp us for instant assessment.&quot;
                </p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Quota Remaining: <strong>9 Images</strong> • <strong>7 Videos</strong></span>
                <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setView('partner-admin-marketing-studio')}>
                  Generate AI Campaign &rarr;
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (col-span-5): Student Benefit Vouchers */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900">Student Benefit Vouchers</CardTitle>
                <Ticket className="w-4 h-4 text-emerald-600" />
              </div>
              <CardDescription className="text-xs text-slate-500">
                Issued for partner students with active ALO applications (3 English mock test vouchers per student).
              </CardDescription>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-emerald-900">
                  <span>Voucher Code: ALO-MOCK-8821</span>
                  <Badge className="bg-emerald-600 text-white text-[9px]">AVAILABLE</Badge>
                </div>
                <p className="text-slate-600">Student: Arif Rahman (MSc Data Science)</p>
                <p className="text-[11px] text-slate-500">Includes 3 Free English Mock Tests &amp; 1 UKVI Interview Prep.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
