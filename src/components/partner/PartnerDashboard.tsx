'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  FileText,
  DollarSign,
  Plus,
  Upload,
  MessageSquare,
  Eye,
  ChevronRight,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Building2,
  ShieldCheck,
  Timer,
  Globe,
  Plane,
  CircleDot,
} from 'lucide-react';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

// ── Mock Data ──────────────────────────────────────────────

const recentLeads = [
  { name: 'Arif Rahman', phone: '+880 1712-345678', destination: 'UK', status: 'new' as const, counselor: 'Sarah Khan', date: 'Jan 17, 2025' },
  { name: 'Mitu Sarkar', phone: '+880 1898-123456', destination: 'USA', status: 'contacted' as const, counselor: 'Sarah Khan', date: 'Jan 16, 2025' },
  { name: 'Shakib Hasan', phone: '+880 1534-987654', destination: 'Canada', status: 'converted' as const, counselor: 'Rahim Uddin', date: 'Jan 15, 2025' },
  { name: 'Priya Das', phone: '+880 1678-456789', destination: 'UK', status: 'contacted' as const, counselor: 'Sarah Khan', date: 'Jan 14, 2025' },
  { name: 'Nayeem Islam', phone: '+880 1345-789012', destination: 'USA', status: 'new' as const, counselor: 'Fatima Akter', date: 'Jan 13, 2025' },
];

const applicationTracker = [
  { student: 'Arif Rahman', university: 'University of Manchester', course: 'MSc Data Science', stage: 'submitted' as const, lastUpdate: 'Jan 17, 2025' },
  { student: 'Shakib Hasan', university: 'University of Toronto', course: 'MBA', stage: 'offer' as const, lastUpdate: 'Jan 15, 2025' },
  { student: 'Mitu Sarkar', university: 'NYU', course: 'MS Computer Science', stage: 'visa' as const, lastUpdate: 'Jan 16, 2025' },
  { student: 'Priya Das', university: 'University of Birmingham', course: 'MSc Finance', stage: 'enrolled' as const, lastUpdate: 'Jan 14, 2025' },
  { student: 'Taslima Akter', university: 'UBC', course: 'MEng', stage: 'submitted' as const, lastUpdate: 'Jan 12, 2025' },
];

const timelineEvents = [
  { event: 'New lead "Arif Rahman" submitted', time: '2 hours ago', icon: Plus },
  { event: 'Shakib Hasan received offer letter', time: 'Yesterday', icon: CheckCircle2 },
  { event: 'Mitu Sarkar visa application filed', time: 'Yesterday', icon: Globe },
  { event: 'Commission ৳15,000 credited', time: '2 days ago', icon: DollarSign },
  { event: 'Priya Das enrolled successfully', time: '3 days ago', icon: CheckCircle2 },
];

// ── Helpers ────────────────────────────────────────────────

function leadStatusBadge(status: 'new' | 'contacted' | 'converted') {
  switch (status) {
    case 'new':
      return <Badge variant="brand" className="text-[11px]">New</Badge>;
    case 'contacted':
      return <Badge variant="warning" className="text-[11px]">Contacted</Badge>;
    case 'converted':
      return <Badge variant="success" className="text-[11px]">Converted</Badge>;
  }
}

function appStageBadge(stage: 'submitted' | 'offer' | 'visa' | 'enrolled') {
  switch (stage) {
    case 'submitted':
      return <Badge variant="outline" className="text-[11px]">Submitted</Badge>;
    case 'offer':
      return <Badge variant="warning" className="text-[11px]">Offer</Badge>;
    case 'visa':
      return <Badge variant="brand" className="text-[11px]">Visa</Badge>;
    case 'enrolled':
      return <Badge variant="success" className="text-[11px]">Enrolled</Badge>;
  }
}

function destinationFlag(dest: string) {
  const flags: Record<string, string> = { UK: '🇬🇧', USA: '🇺🇸', Canada: '🇨🇦' };
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-alo-text-secondary">
      <Plane className="w-3 h-3" /> {flags[dest] || ''} {dest}
    </span>
  );
}

// ── Pending Approval State ─────────────────────────────────

function PendingApprovalCard() {
  return (
    <div className="bg-alo-page min-h-screen p-4 lg:p-6 flex items-center justify-center">
      <Card className="bg-white rounded-xl border border-alo-border max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Timer className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-alo-text mb-2">Account Pending Approval</h2>
          <p className="text-sm text-alo-text-muted mb-6">
            Your partner account is currently under review by the ALO Education team.
            You&apos;ll receive an email notification once your account is approved.
          </p>
          <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 mb-6">
            <Clock className="w-4 h-4 text-amber-600" />
            <p className="text-sm text-amber-700 font-medium">Estimated review time: 24-48 hours</p>
          </div>
          <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" className="w-full">
            <MessageSquare className="w-4 h-4" /> Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Component ──────────────────────────────────────────────

export default function PartnerDashboard() {
  const { user } = usePortalStore();
  const [apiLeads, setApiLeads] = useState<typeof recentLeads | null>(null);
  const [apiApps, setApiApps] = useState<typeof applicationTracker | null>(null);
  const [apiStudents, setApiStudents] = useState<number>(0);
  const [apiTotalLeads, setApiTotalLeads] = useState<number>(0);
  const [apiTotalApps, setApiTotalApps] = useState<number>(0);

  const token = usePortalStore.getState().token;

  const headers: HeadersInit = token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };

  // Simulate pending approval state
  const isPending = user?.status === 'pending';

  const fetchDashboardData = useCallback(async () => {
    try {
      const partnerId = user?.id || '';

      // Fetch recent leads
      const leadsRes = await fetch(`/api/partner/leads?partnerId=${partnerId}&status=new&limit=5`, { headers });
      const leadsData = await leadsRes.json();
      if (leadsData.success && Array.isArray(leadsData.leads) && leadsData.leads.length > 0) {
        setApiLeads(leadsData.leads.map((l: any) => ({
          name: l.studentName || l.name,
          phone: l.studentPhone || l.phone,
          destination: l.destinationCountry || l.destination,
          status: l.status || 'new',
          counselor: l.counselor || '—',
          date: l.createdAt ? new Date(l.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '',
        })));
      }

      // Fetch applications
      const appsRes = await fetch(`/api/partner/applications?limit=5`, { headers });
      const appsData = await appsRes.json();
      if (appsData.success && Array.isArray(appsData.applications) && appsData.applications.length > 0) {
        setApiApps(appsData.applications.map((a: any) => ({
          student: a.studentName || a.student,
          university: a.university || '—',
          course: a.program || a.course || '—',
          stage: a.stage || a.status || 'submitted',
          lastUpdate: a.updatedAt || a.lastUpdate || '',
        })));
        setApiTotalApps(appsData.total || appsData.applications.length);
      }

      // Fetch students count
      const stuRes = await fetch(`/api/partner/students?partnerId=${partnerId}&limit=10`, { headers });
      const stuData = await stuRes.json();
      if (stuData.success) {
        if (Array.isArray(stuData.data)) setApiStudents(stuData.data.length);
        if (typeof stuData.total === 'number') setApiStudents(stuData.total);
      }

      // Fetch total leads count
      const allLeadsRes = await fetch(`/api/partner/leads?partnerId=${partnerId}&limit=100`, { headers });
      const allLeadsData = await allLeadsRes.json();
      if (allLeadsData.success && Array.isArray(allLeadsData.leads)) {
        setApiTotalLeads(allLeadsData.leads.length);
      }
    } catch {
      // Fallback to mock data silently
    }
  }, [user?.id]);

  useEffect(() => { fetchDashboardData(); }, [fetchDashboardData]);

  const displayLeads = apiLeads || recentLeads;
  const displayApps = apiApps || applicationTracker;
  const displayTotalLeads = apiTotalLeads || 24;
  const displayActiveStudents = apiStudents || 12;
  const displayTotalApps = apiTotalApps || 8;

  if (isPending) {
    return <PendingApprovalCard />;
  }

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant="muted" className="text-[11px] font-mono">PID-2025-0042</Badge>
            <Badge variant="success" className="text-[11px]"><ShieldCheck className="w-3 h-3 mr-1" />Active</Badge>
          </div>
          <h1 className="text-2xl font-bold text-alo-text">Global Education Consultancy</h1>
          <p className="text-sm text-alo-text-muted mt-0.5 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> Partner Dashboard
          </p>
        </div>
        <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" size="sm">
          <Plus className="w-4 h-4" /> Submit New Lead
        </Button>
      </div>

      {/* ── KPI Row ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads Submitted */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-alo-brand" />
              <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium">
                <ArrowUpRight className="w-3 h-3" />+6 this week
              </span>
            </div>
            <p className="text-2xl font-bold text-alo-text">{displayTotalLeads}</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Total Leads Submitted</p>
          </CardContent>
        </Card>

        {/* Active Students */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-alo-brand" />
              <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium">
                <ArrowUpRight className="w-3 h-3" />+2 this month
              </span>
            </div>
            <p className="text-2xl font-bold text-alo-text">{displayActiveStudents}</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Active Students</p>
          </CardContent>
        </Card>

        {/* Applications Submitted */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <FileText className="w-5 h-5 text-alo-brand" />
              <span className="inline-flex items-center text-[11px] text-emerald-600 font-medium">
                <ArrowUpRight className="w-3 h-3" />+3 this month
              </span>
            </div>
            <p className="text-2xl font-bold text-alo-text">{displayTotalApps}</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Applications Submitted</p>
          </CardContent>
        </Card>

        {/* Commission Earned */}
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-alo-brand" />
              <span className="text-[11px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                ৳45,000 pending
              </span>
            </div>
            <p className="text-2xl font-bold text-alo-text">৳1,85,000</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Commission Earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Embedded Communication Widget for Partner */}
      <DashboardCommunicationWidget
        role="PARTNER"
        unreadCount={null}
      />

      {/* ── Main Content Grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left Column (col-span-2) ─────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Leads Card */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text">Recent Leads</CardTitle>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="text-xs text-alo-brand">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Counselor</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayLeads.map((lead, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-alo-text">{lead.name}</TableCell>
                      <TableCell className="text-alo-text-secondary text-xs">{lead.phone}</TableCell>
                      <TableCell>{destinationFlag(lead.destination)}</TableCell>
                      <TableCell>{leadStatusBadge(lead.status)}</TableCell>
                      <TableCell className="text-alo-text-secondary text-xs">{lead.counselor}</TableCell>
                      <TableCell className="text-alo-text-muted text-xs">{lead.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Application Tracker Card */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-alo-text">Application Tracker</CardTitle>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="ghost" size="sm" className="text-xs text-alo-brand">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {displayApps.map((app, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-alo-brand-light/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-lg bg-alo-brand-light flex items-center justify-center shrink-0">
                        <Building2 className="w-4 h-4 text-alo-brand" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-alo-text truncate">{app.student}</p>
                        <p className="text-xs text-alo-text-muted truncate">{app.university} — {app.course}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {appStageBadge(app.stage)}
                      <span className="text-[11px] text-alo-text-muted hidden sm:block">{app.lastUpdate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Right Column (col-span-1) ────────────────────── */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="brand" className="w-full justify-start text-sm">
                  <Plus className="w-4 h-4" /> Submit New Lead
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="w-full justify-start text-sm">
                  <Upload className="w-4 h-4" /> Upload Document
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="w-full justify-start text-sm">
                  <Eye className="w-4 h-4" /> View Commission
                </Button>
                <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="w-full justify-start text-sm">
                  <MessageSquare className="w-4 h-4" /> Message ALO
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Commission Summary (Pie-chart-like visual) */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text">Commission Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                {/* Visual ring */}
                <div className="relative w-28 h-28 shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {/* Background circle */}
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    {/* Paid: ৳1,40,000 of ৳2,50,000 total = 56% */}
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#059669" strokeWidth="3"
                      strokeDasharray="56 44" strokeDashoffset="0" strokeLinecap="round" />
                    {/* Pending: ৳45,000 of ৳2,50,000 = 18% */}
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#d97706" strokeWidth="3"
                      strokeDasharray="18 82" strokeDashoffset="-56" strokeLinecap="round" />
                    {/* Expected: ৳65,000 of ৳2,50,000 = 26% */}
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#2563EB" strokeWidth="3"
                      strokeDasharray="26 74" strokeDashoffset="-74" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold text-alo-text">৳2.5L</span>
                    <span className="text-[10px] text-alo-text-muted">Total</span>
                  </div>
                </div>
                {/* Legend */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-xs font-medium text-alo-text">Paid</p>
                      <p className="text-[11px] text-alo-text-muted">৳1,40,000</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div>
                      <p className="text-xs font-medium text-alo-text">Pending</p>
                      <p className="text-[11px] text-alo-text-muted">৳45,000</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#2563EB]" />
                    <div>
                      <p className="text-xs font-medium text-alo-text">Expected</p>
                      <p className="text-[11px] text-alo-text-muted">৳65,000</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Latest Updates */}
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-alo-text">Latest Updates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-alo-border" />
                <div className="space-y-4">
                  {timelineEvents.map((item, i) => (
                    <div key={i} className="relative flex items-start gap-3 pl-1">
                      <div className="relative z-10 mt-0.5 w-[30px] h-[30px] rounded-full bg-alo-brand-light flex items-center justify-center shrink-0">
                        <item.icon className="w-3.5 h-3.5 text-alo-brand" />
                      </div>
                      <div className="min-w-0 pt-0.5">
                        <p className="text-sm text-alo-text leading-snug">{item.event}</p>
                        <p className="text-[11px] text-alo-text-muted mt-0.5">{item.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}