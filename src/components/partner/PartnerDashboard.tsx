'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Users, FileText, DollarSign, Plus, Upload, MessageSquare, Eye,
  ChevronRight, Clock, CheckCircle2, Building2, ShieldCheck, Timer,
  Plane, RefreshCw,
} from 'lucide-react';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

type LeadStatus = 'new' | 'contacted' | 'converted' | 'lost';
interface LeadRow {
  id: string;
  name: string;
  phone: string;
  destination: string;
  status: LeadStatus;
  counselor: string;
  date: string;
}
interface ApplicationRow {
  id: string;
  student: string;
  university: string;
  course: string;
  stage: string;
  updatedAt: string;
}
interface PartnerProfile {
  partnerId?: string;
  companyName?: string;
  contactPerson?: string;
  approvalStatus?: string;
  activeStudents?: number;
  studentCount?: number;
  applicationCount?: number;
}
interface CommissionSummary {
  totalCommissionExpected?: number;
  totalCommissionPaid?: number;
  totalCommissionPending?: number;
}

function leadStatusBadge(status: LeadStatus) {
  const config: Record<LeadStatus, { variant: 'brand' | 'warning' | 'success' | 'muted'; label: string }> = {
    new: { variant: 'brand', label: 'New' },
    contacted: { variant: 'warning', label: 'Contacted' },
    converted: { variant: 'success', label: 'Converted' },
    lost: { variant: 'muted', label: 'Lost' },
  };
  const item = config[status];
  return <Badge variant={item.variant} className="text-[11px]">{item.label}</Badge>;
}

function stageLabel(stage: string) {
  const normalized = stage.toLowerCase().replace(/[_-]+/g, ' ');
  if (normalized.includes('offer')) return 'Offer';
  if (normalized.includes('visa')) return 'Visa';
  if (normalized.includes('enroll')) return 'Enrolled';
  if (normalized.includes('submit')) return 'Submitted';
  if (normalized.includes('document')) return 'Documents';
  if (normalized.includes('shortlist')) return 'Shortlisted';
  return normalized ? normalized.replace(/\b\w/g, (char) => char.toUpperCase()) : 'Stage not recorded';
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? `৳${amount.toLocaleString('en-BD')}` : '—';
}

function PendingApprovalCard() {
  return (
    <div className="bg-alo-page min-h-screen p-4 lg:p-6 flex items-center justify-center">
      <Card className="bg-white rounded-xl border border-alo-border max-w-md w-full">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
            <Timer className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-alo-text mb-2">Account Pending Approval</h2>
          <p className="text-sm text-alo-text-muted">
            Your partner account is awaiting review. Partner records remain unavailable until access is approved.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PartnerDashboard() {
  const router = useRouter();
  const user = usePortalStore((state) => state.user);
  const [profile, setProfile] = useState<PartnerProfile | null>(null);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [leadCount, setLeadCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [commission, setCommission] = useState<CommissionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const paths = [
        '/api/partner/profile',
        '/api/partner/leads?limit=5',
        '/api/partner/applications?limit=5',
        '/api/partner/commission?limit=5',
      ];
      const responses = await Promise.all(paths.map((path) => fetch(path, { credentials: 'include' })));
      const payloads = await Promise.all(responses.map((response) => response.json().catch(() => ({}))));
      const failedIndex = responses.findIndex((response, index) => !response.ok || payloads[index]?.success === false);
      if (failedIndex >= 0) {
        const message = payloads[failedIndex]?.error || `Partner dashboard request failed (HTTP ${responses[failedIndex].status}).`;
        throw new Error(message);
      }

      const [profilePayload, leadsPayload, applicationsPayload, commissionPayload] = payloads;
      const profileData = profilePayload.profile as PartnerProfile | undefined;
      const leadRows = Array.isArray(leadsPayload.data) ? leadsPayload.data : [];
      const applicationRows = Array.isArray(applicationsPayload.data) ? applicationsPayload.data : [];

      setProfile(profileData || null);
      setLeads(leadRows.map((lead: any): LeadRow => ({
        id: String(lead.id || ''),
        name: String(lead.studentName || ''),
        phone: String(lead.studentPhone || ''),
        destination: String(lead.destinationCountry || ''),
        status: (['new', 'contacted', 'converted', 'lost'].includes(String(lead.status).toLowerCase())
          ? String(lead.status).toLowerCase()
          : 'new') as LeadStatus,
        counselor: String(lead.assignedCounselorName || 'Not assigned'),
        date: String(lead.createdAt || ''),
      })));
      setApplications(applicationRows.map((application: any): ApplicationRow => ({
        id: String(application.id || ''),
        student: String(application.studentProfile?.fullName || 'Student name unavailable'),
        university: String(application.university || 'University not recorded'),
        course: String(application.course || 'Course not recorded'),
        stage: String(application.stage || ''),
        updatedAt: String(application.updatedAt || ''),
      })));
      setLeadCount(Number.isFinite(Number(leadsPayload.total)) ? Number(leadsPayload.total) : Number(leadsPayload.pagination?.total || 0));
      setStudentCount(Number.isFinite(Number(profileData?.studentCount)) ? Number(profileData?.studentCount) : 0);
      setApplicationCount(Number.isFinite(Number(applicationsPayload.pagination?.total)) ? Number(applicationsPayload.pagination.total) : applicationRows.length);
      setCommission(commissionPayload.data?.summary || null);
    } catch (caught) {
      setProfile(null);
      setLeads([]);
      setApplications([]);
      setLeadCount(0);
      setStudentCount(0);
      setApplicationCount(0);
      setCommission(null);
      setError(caught instanceof Error ? caught.message : 'Could not load partner dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchDashboardData(); }, [fetchDashboardData]);

  const pendingApproval = profile?.approvalStatus?.toLowerCase() === 'pending'
    || user?.status?.toLowerCase() === 'pending'
    || Boolean(error && /partner account approval/i.test(error));

  const activities = useMemo(() => [
    ...leads.map((lead) => ({
      key: `lead-${lead.id}`,
      label: `Lead submitted: ${lead.name || 'Student name unavailable'}`,
      detail: `${lead.destination || 'Destination not recorded'} · ${formatDate(lead.date)}`,
      icon: Plus,
      date: lead.date ? new Date(lead.date).getTime() : 0,
    })),
    ...applications.map((application) => ({
      key: `application-${application.id}`,
      label: `Application update: ${application.student}`,
      detail: `${stageLabel(application.stage)} · ${formatDate(application.updatedAt)}`,
      icon: CheckCircle2,
      date: application.updatedAt ? new Date(application.updatedAt).getTime() : 0,
    })),
  ].sort((a, b) => b.date - a.date).slice(0, 5), [leads, applications]);

  if (loading) {
    return (
      <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}</div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    );
  }

  if (pendingApproval) return <PendingApprovalCard />;

  const companyName = profile?.companyName || user?.name || 'Partner account';
  const commissionExpected = Number(commission?.totalCommissionExpected ?? 0);
  const commissionPaid = Number(commission?.totalCommissionPaid ?? 0);
  const commissionPending = Number(commission?.totalCommissionPending ?? Math.max(0, commissionExpected - commissionPaid));
  const paidPercent = commissionExpected > 0 ? Math.min(100, (commissionPaid / commissionExpected) * 100) : 0;
  const approvalLabel = profile?.approvalStatus ? profile.approvalStatus.replace(/[_-]/g, ' ') : 'Status not recorded';

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <Badge variant="muted" className="text-[11px] font-mono">{profile?.partnerId || 'Partner ID not recorded'}</Badge>
            <Badge variant={profile?.approvalStatus?.toLowerCase() === 'approved' || profile?.approvalStatus?.toLowerCase() === 'active' ? 'success' : 'muted'} className="text-[11px]">
              <ShieldCheck className="w-3 h-3 mr-1" />{approvalLabel}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold text-alo-text">{companyName}</h1>
          <p className="text-sm text-alo-text-muted mt-0.5 flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />Partner Dashboard</p>
        </div>
        <Button variant="brand" size="sm" onClick={() => router.push('/partner/leads')}><Plus className="w-4 h-4" />Submit New Lead</Button>
      </div>

      {error && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-amber-900">{error}</p>
            <Button variant="outline" size="sm" onClick={() => void fetchDashboardData()}><RefreshCw className="mr-2 h-3.5 w-3.5" />Retry</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-alo-brand" /><span className="text-xs text-alo-text-muted">Total Leads</span></div><p className="text-2xl font-bold text-alo-text">{leadCount}</p></CardContent></Card>
        <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-alo-brand" /><span className="text-xs text-alo-text-muted">Active Students</span></div><p className="text-2xl font-bold text-alo-text">{studentCount}</p></CardContent></Card>
        <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><FileText className="w-5 h-5 text-alo-brand" /><span className="text-xs text-alo-text-muted">Applications</span></div><p className="text-2xl font-bold text-alo-text">{applicationCount}</p></CardContent></Card>
        <Card className="bg-white rounded-xl border border-alo-border"><CardContent className="p-4"><div className="flex items-center gap-2 mb-2"><DollarSign className="w-5 h-5 text-alo-brand" /><span className="text-xs text-alo-text-muted">Commission Expected</span></div><p className="text-2xl font-bold text-alo-text">{formatCurrency(commissionExpected)}</p><p className="mt-1 text-[11px] text-alo-text-muted">Paid {formatCurrency(commissionPaid)} · Pending {formatCurrency(commissionPending)}</p></CardContent></Card>
      </div>

      <DashboardCommunicationWidget role="PARTNER" unreadCount={null} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0"><div className="flex items-center justify-between"><CardTitle className="text-base font-semibold text-alo-text">Recent Leads</CardTitle><Button variant="ghost" size="sm" className="text-xs text-alo-brand" onClick={() => router.push('/partner/leads')}>View All <ChevronRight className="w-3.5 h-3.5" /></Button></div></CardHeader>
            <CardContent className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-left text-xs text-alo-text-muted"><th className="py-2 pr-3">Student</th><th className="py-2 pr-3">Phone</th><th className="py-2 pr-3">Destination</th><th className="py-2 pr-3">Status</th><th className="py-2">Date</th></tr></thead>
                  <tbody>
                    {leads.length === 0 ? <tr><td colSpan={5} className="py-10 text-center text-sm text-alo-text-muted">No partner leads recorded yet.</td></tr> : leads.map((lead) => (
                      <tr key={lead.id} className="border-b last:border-0">
                        <td className="py-3 pr-3 font-medium text-alo-text">{lead.name || 'Name not recorded'}</td>
                        <td className="py-3 pr-3 text-xs text-alo-text-secondary">{lead.phone || '—'}</td>
                        <td className="py-3 pr-3 text-xs text-alo-text-secondary"><span className="inline-flex items-center gap-1"><Plane className="h-3 w-3" />{lead.destination || '—'}</span></td>
                        <td className="py-3 pr-3">{leadStatusBadge(lead.status)}</td>
                        <td className="py-3 text-xs text-alo-text-muted">{formatDate(lead.date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-0"><div className="flex items-center justify-between"><CardTitle className="text-base font-semibold text-alo-text">Application Tracker</CardTitle><Button variant="ghost" size="sm" className="text-xs text-alo-brand" onClick={() => router.push('/partner/applications')}>View All <ChevronRight className="w-3.5 h-3.5" /></Button></div></CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {applications.length === 0 ? <p className="py-10 text-center text-sm text-alo-text-muted">No partner student applications recorded yet.</p> : applications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between gap-3 py-3 px-3 rounded-lg hover:bg-alo-brand-light/30 transition-colors">
                    <div className="flex items-center gap-3 min-w-0 flex-1"><div className="w-9 h-9 rounded-lg bg-alo-brand-light flex items-center justify-center shrink-0"><Building2 className="w-4 h-4 text-alo-brand" /></div><div className="min-w-0"><p className="text-sm font-medium text-alo-text truncate">{application.student}</p><p className="text-xs text-alo-text-muted truncate">{application.university} — {application.course}</p></div></div>
                    <div className="flex items-center gap-3 shrink-0"><Badge variant="outline" className="text-[11px]">{stageLabel(application.stage)}</Badge><span className="text-[11px] text-alo-text-muted hidden sm:block">{formatDate(application.updatedAt)}</span></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-alo-text">Quick Actions</CardTitle></CardHeader>
            <CardContent><div className="grid grid-cols-2 gap-3">
              <Button variant="brand" className="w-full justify-start text-sm" onClick={() => router.push('/partner/leads')}><Plus className="w-4 h-4" />Submit Lead</Button>
              <Button variant="outline" className="w-full justify-start text-sm" onClick={() => router.push('/partner/documents')}><Upload className="w-4 h-4" />Documents</Button>
              <Button variant="outline" className="w-full justify-start text-sm" onClick={() => router.push('/partner/commission')}><Eye className="w-4 h-4" />Commission</Button>
              <Button variant="outline" className="w-full justify-start text-sm" onClick={() => router.push('/partner/messages')}><MessageSquare className="w-4 h-4" />Message ALO</Button>
            </div></CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-alo-text">Commission Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm"><span className="text-alo-text-secondary">Paid</span><span className="font-semibold text-alo-text">{formatCurrency(commissionPaid)}</span></div>
              <div className="mt-3 h-3 rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-valuenow={Math.round(paidPercent)} aria-valuemin={0} aria-valuemax={100} aria-label="Paid commission percentage"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${paidPercent}%` }} /></div>
              <div className="mt-3 flex items-center justify-between text-xs text-alo-text-muted"><span>Pending {formatCurrency(commissionPending)}</span><span>Expected {formatCurrency(commissionExpected)}</span></div>
              <Button variant="link" className="mt-2 h-auto px-0 text-xs" onClick={() => router.push('/partner/commission')}>Open commission statement <ChevronRight className="ml-1 h-3.5 w-3.5" /></Button>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-xl border border-alo-border">
            <CardHeader className="pb-2"><CardTitle className="text-base font-semibold text-alo-text">Latest Updates</CardTitle></CardHeader>
            <CardContent>
              {activities.length === 0 ? <p className="py-6 text-center text-sm text-alo-text-muted">No recent activity is recorded.</p> : (
                <div className="relative"><div className="absolute left-[15px] top-2 bottom-2 w-px bg-alo-border" /><div className="space-y-4">
                  {activities.map((activity) => <div key={activity.key} className="relative flex items-start gap-3 pl-1"><div className="relative z-10 mt-0.5 w-[30px] h-[30px] rounded-full bg-alo-brand-light flex items-center justify-center shrink-0"><activity.icon className="w-3.5 h-3.5 text-alo-brand" /></div><div className="min-w-0 pt-0.5"><p className="text-sm text-alo-text leading-snug">{activity.label}</p><p className="text-[11px] text-alo-text-muted mt-0.5">{activity.detail}</p></div></div>)}
                </div></div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
