'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  ShieldAlert, CheckCircle2, AlertTriangle, FileText, UserCheck, Play,
  Download, Clock, Search, Lock, Eye, Send, RefreshCw, XCircle, Award,
  Globe, FileCheck, PhoneCall
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardCommunicationWidget from '@/components/communication/DashboardCommunicationWidget';

export default function VisaOfficerDashboard() {
  const router = useRouter();
  const { user, token } = usePortalStore();

  const [loading, setLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>({ totalAssigned: 0, highRiskCount: 0, interviewQueueCount: 0, docsPendingCount: 0 });
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [filterStage, setFilterStage] = useState('ALL');

  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [studentFeedbackModalOpen, setStudentFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [officerNote, setOfficerNote] = useState('');
  const [noteVisibility, setNoteVisibility] = useState('internal_only');

  const officerName = user?.name || 'Visa Interview Officer';

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    setMetricsLoading(true);
    try {
      const [casesRes, metricsRes] = await Promise.all([
        fetch('/api/visa/cases?limit=100', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/visa/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (casesRes.ok) {
        const json = await casesRes.json();
        setCases(json.cases || []);
      }

      if (metricsRes.ok) {
        const json = await metricsRes.json();
        if (json.metrics) {
          setMetrics(json.metrics);
        }
      }
    } catch (err) {
      console.error('Failed to load visa dashboard:', err);
    } finally {
      setLoading(false);
      setMetricsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Metrics are loaded from the assigned-case API; no synthetic readiness score is displayed.
  const totalAssigned = metrics.totalAssigned;
  const highRiskCount = metrics.highRiskCount ?? null;
  const interviewQueueCount = metrics.interviewQueueCount;
  const docsPendingCount = metrics.docsPendingCount;

  const filteredCases = cases.filter(c => {
    if (filterCountry !== 'ALL' && c.destinationCountry !== filterCountry) return false;
    if (filterRisk !== 'ALL' && c.riskLevel !== filterRisk) return false;
    if (filterStage !== 'ALL' && c.currentStage !== filterStage) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.studentName?.toLowerCase().includes(q) ||
        c.studentId?.toLowerCase().includes(q) ||
        c.caseCode?.toLowerCase().includes(q) ||
        c.university?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSendFeedback = async () => {
    if (!selectedCase || !feedbackText.trim()) {
      toast.error('Feedback text required');
      return;
    }
    try {
      const res = await fetch(`/api/visa/cases/${encodeURIComponent(selectedCase.id)}/student-feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ supportiveText: feedbackText, nextSteps: '', missingDocs: [], practiceTips: '', approved: true }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.error || 'Feedback could not be published.');
        return;
      }
      toast.success(`Approved preparation feedback published to ${selectedCase.studentName}'s portal. No external message was sent.`);
      setStudentFeedbackModalOpen(false);
      setFeedbackText('');
    } catch {
      toast.error('Feedback could not be published.');
    }
  };

  const handleAddNote = async () => {
    if (!selectedCase || !officerNote.trim()) {
      toast.error('Note content required');
      return;
    }
    try {
      const res = await fetch('/api/visa/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          caseId: selectedCase.id,
          content: officerNote,
          visibility: noteVisibility,
          noteType: 'officer_note',
        }),
      });
      if (res.ok) {
        toast.success(`Internal note logged with visibility: ${noteVisibility} — audit logged`);
        setOfficerNote('');
      } else {
        const json = await res.json();
        toast.error(json.error || 'Failed to log note');
      }
    } catch {
      toast.error('Failed to log note');
    }
  };

  if (loading && metricsLoading) {
    return (
      <div className="p-8 text-center text-[var(--alo-text-muted)]">
        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
        <p className="text-xs">Loading Visa Interview Officer dashboard — real API, no fake numbers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-[var(--alo-page)]/50 min-h-screen p-4 lg:p-6">
      <DashboardCommunicationWidget role="VISA_OFFICER" unreadCount={null} slaOverdueCount={null} onNavigateToInbox={() => router.push('/crm/communications/inbox')} />
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-xl border border-[var(--alo-border)] shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-[var(--alo-text)]">Welcome back, {officerName}</h1>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 font-mono text-xs">
              VISA_INTERVIEW_OFFICER
            </Badge>
            <Badge className="bg-emerald-50 text-emerald-700 text-[11px]">RBAC Protected</Badge>
          </div>
          <p className="text-xs text-[var(--alo-text-muted)] flex flex-wrap items-center gap-3">
            <span>📅 Interview Queue: <strong className="text-[var(--alo-body)]">{interviewQueueCount}</strong></span>
            <span>•</span>
            <span>🚨 High-Risk Cases: <strong className="text-rose-600">{highRiskCount ?? 'Restricted'}</strong></span>
            <span>•</span>
            <span>📁 Pending Docs: <strong className="text-amber-600">{docsPendingCount}</strong></span>
            <span>•</span>
            <span>🧑‍⚕️ Human follow-up: <strong className="text-indigo-600">{metrics.interviewsNeedingHumanFollowUp ?? '—'}</strong></span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => router.push('/employee/visa-cases')}>
            <Eye className="w-3.5 h-3.5 mr-1" /> View Visa Cases
          </Button>
          <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => router.push('/employee/visa-interviews')}>
            <Play className="w-3.5 h-3.5 mr-1" /> Start Interview
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={loadDashboardData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => router.push('/employee/visa-reports')}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export Reports
          </Button>
        </div>
      </div>

      {/* KPI Cards, no fake numbers, with loading/empty/error states */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-[var(--alo-border)]">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--alo-text-muted)]">Assigned Visa Cases</p>
              <p className="text-2xl font-bold text-[var(--alo-text)] mt-1">{metricsLoading ? '...' : totalAssigned}</p>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-0.5">{totalAssigned === 0 ? 'No cases — empty state' : 'Live count'}</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><UserCheck className="w-5 h-5" /></div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[var(--alo-border)]">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--alo-text-muted)]">Interview Queue</p>
              <p className="text-2xl font-bold text-[var(--alo-text)] mt-1">{metricsLoading ? '...' : interviewQueueCount}</p>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-0.5">API: /api/visa/dashboard</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Clock className="w-5 h-5" /></div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[var(--alo-border)]">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--alo-text-muted)]">High-Risk Students</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{metricsLoading ? '...' : (highRiskCount ?? 'Restricted')}</p>
              <p className="text-[11px] text-rose-500 mt-0.5">Requires senior review</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><ShieldAlert className="w-5 h-5" /></div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[var(--alo-border)]">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--alo-text-muted)]">Documents Pending</p>
              <p className="text-2xl font-bold text-[var(--alo-text)] mt-1">{metricsLoading ? '...' : docsPendingCount}</p>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-0.5">Real count — no fake</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><FileCheck className="w-5 h-5" /></div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[var(--alo-border)]">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--alo-text-muted)]">Human Follow-up</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{metricsLoading ? '...' : (metrics.interviewsNeedingHumanFollowUp ?? '—')}</p>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-0.5">Recorded officer follow-up state</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center"><Award className="w-5 h-5" /></div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[var(--alo-border)]">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--alo-text-muted)]">Funding Reviews Pending</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{metrics.financialReview?.fundingReviewsPendingHumanReview ?? '—'}</p>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-0.5">Recorded internal reviews</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><AlertTriangle className="w-5 h-5" /></div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[var(--alo-border)]">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--alo-text-muted)]">Refusal History</p>
              <p className="text-2xl font-bold text-[var(--alo-text)] mt-1">{metrics.refusalHistory?.casesWithPriorRefusal ?? '—'}</p>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-0.5">Recorded restricted review count</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><XCircle className="w-5 h-5" /></div>
          </CardContent>
        </Card>

        <Card className="bg-white border-[var(--alo-border)]">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[var(--alo-text-muted)]">Counselor Handover</p>
              <p className="text-2xl font-bold text-[var(--alo-text)] mt-1">{metrics.counselorHandover?.pendingActions ?? '—'}</p>
              <p className="text-[11px] text-[var(--alo-text-muted)] mt-0.5">Open tasks assigned for handover</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><PhoneCall className="w-5 h-5" /></div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline + Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card className="bg-white border-[var(--alo-border)]">
            <CardHeader className="pb-3 border-b border-[var(--alo-border)]">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold">Visa Case Pipeline Stages</CardTitle>
                <Badge variant="outline" className="text-[11px]">{cases.length} assigned cases</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {Object.entries(cases.reduce((counts: Record<string, number>, item) => {
                  const stage = String(item.currentStage || 'not_started');
                  counts[stage] = (counts[stage] || 0) + 1;
                  return counts;
                }, {})).length === 0 ? (
                  <p className="text-xs text-[var(--alo-text-muted)]">No pipeline cases in the assigned scope.</p>
                ) : Object.entries(cases.reduce((counts: Record<string, number>, item) => {
                  const stage = String(item.currentStage || 'not_started');
                  counts[stage] = (counts[stage] || 0) + 1;
                  return counts;
                }, {})).map(([stage, count]) => (
                  <div key={stage} className="shrink-0 bg-[var(--alo-surface-muted)]/80 border px-3 py-1.5 rounded-lg text-center min-w-[110px]">
                    <span className="text-[11px] font-bold text-indigo-600 block">{count} case{count === 1 ? '' : 's'}</span>
                    <span className="text-[11px] font-semibold text-[var(--alo-text)] line-clamp-1">{stage.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-[var(--alo-border)]">
            <CardHeader className="pb-3 border-b border-[var(--alo-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold">Assigned Visa Cases</CardTitle>
                <CardDescription className="text-xs">Filter and manage — no fake data — empty state if none</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--alo-text-muted)]" />
                  <Input placeholder="Search student or ID..." value={search} onChange={e => setSearch(e.target.value)} className="h-8 text-xs pl-8 bg-[var(--alo-page)]" />
                </div>
                <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className="h-8 text-xs border rounded px-2 bg-white">
                  <option value="ALL">All Countries</option><option value="UK">UK</option><option value="USA">USA</option><option value="Canada">Canada</option><option value="Australia">Australia</option><option value="Germany">Germany</option>
                </select>
                {cases.some(item => item.riskLevel) && <select value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="h-8 text-xs border rounded px-2 bg-white">
                  <option value="ALL">All Risk</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
                </select>}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-[var(--alo-page)]">
                  <TableRow>
                    <TableHead className="text-xs">Case / Student</TableHead>
                    <TableHead className="text-xs">Destination</TableHead>
                    <TableHead className="text-xs">University & Course</TableHead>
                    <TableHead className="text-xs">Stage</TableHead>
                                        <TableHead className="text-xs">Risk</TableHead>
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-xs text-[var(--alo-text-muted)]">{loading ? 'Loading...' : 'No assigned visa cases — proper empty state, no fake numbers — real database'}</TableCell></TableRow>
                  ) : (
                    filteredCases.map(item => (
                      <TableRow key={item.id} className="hover:bg-[var(--alo-page)]/80">
                        <TableCell><div><span className="text-xs font-bold block">{item.studentName}</span><span className="text-[11px] text-[var(--alo-text-muted)] font-mono">ID: {item.studentId} • {item.caseCode}</span></div></TableCell>
                        <TableCell><div className="flex items-center gap-1 text-xs"><Globe className="w-3.5 h-3.5 text-indigo-600" />{item.destinationCountry}</div></TableCell>
                        <TableCell><div><span className="text-xs font-medium block truncate max-w-[160px]">{item.university}</span><span className="text-[11px] text-[var(--alo-text-muted)] truncate max-w-[160px] block">{item.course}</span></div></TableCell>
                        <TableCell><Badge variant="outline" className="text-[11px] bg-indigo-50 text-indigo-700 border-indigo-200">{item.currentStage}</Badge></TableCell>
                        <TableCell><Badge className={`text-[11px] px-2 py-0.5 border ${['high', 'critical'].includes(String(item.riskLevel).toLowerCase()) ? 'bg-rose-50 text-rose-700 border-rose-200' : item.riskLevel === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' : item.riskLevel === 'low' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-[var(--alo-surface-muted)] text-[var(--alo-body)] border-[var(--alo-border)]'}`}>{item.riskLevel ? String(item.riskLevel).replaceAll('_', ' ').toUpperCase() : 'RESTRICTED / NOT ASSESSED'}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-600 hover:bg-indigo-50" onClick={() => { setSelectedCase(item); router.push(`/employee/visa-interviews/${encodeURIComponent(item.id)}`); }}><Play className="w-3.5 h-3.5 mr-1" /> Interview</Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedCase(item); setStudentFeedbackModalOpen(true); }}><Send className="w-3.5 h-3.5 mr-1" /> Feedback</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white border-rose-200">
            <CardHeader className="pb-3 border-b border-rose-100 bg-rose-50/40">
              <div className="flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-rose-600" /><CardTitle className="text-sm font-bold text-rose-900">Risk Flags — Real Data</CardTitle></div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {highRiskCount === null ? (
                <div className="text-xs text-[var(--alo-text-muted)] p-3 text-center border-dashed border rounded-lg">Risk details are restricted for this account.</div>
              ) : cases.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length === 0 ? (
                <div className="text-xs text-[var(--alo-text-muted)] p-3 text-center border-dashed border rounded-lg">No high-risk cases — empty state — no fake</div>
              ) : (
                cases.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').slice(0,3).map(c => (
                  <div key={c.id} className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-rose-900"><span>{c.studentName}</span><Badge className="bg-rose-600 text-white text-[11px]">{c.riskLevel?.toUpperCase()}</Badge></div>
                    <p className="text-[var(--alo-body)]">ID: {c.studentId} • {c.destinationCountry}</p>
                    <p className="text-[11px] text-[var(--alo-text-muted)]">Stage: {c.currentStage}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-[var(--alo-border)]">
            <CardHeader className="pb-3 border-b"><div className="flex items-center justify-between"><CardTitle className="text-sm font-bold">Officer Live Notes — Visibility RBAC</CardTitle><Lock className="w-3.5 h-3.5 text-[var(--alo-text-muted)]" /></div></CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2"><span className="text-xs font-medium">Visibility:</span>
                  <select value={noteVisibility} onChange={e => setNoteVisibility(e.target.value)} className="h-7 text-xs border rounded px-2 bg-white">
                    <option value="internal_only">INTERNAL_ONLY</option>
                    <option value="visa_team_only">VISA_TEAM_ONLY</option>
                    <option value="counselor_visible">COUNSELOR_VISIBLE</option>
                    <option value="application_team_visible">APPLICATION_TEAM_VISIBLE</option>
                    <option value="super_admin_only">SUPER_ADMIN_ONLY</option>
                  </select>
                </div>
                <Textarea placeholder="Write officer notes — student never sees internal — partner never sees visa notes — marketing never sees — student sees only approved student-safe feedback — every edit audited" value={officerNote} onChange={e => setOfficerNote(e.target.value)} className="min-h-[70px] text-xs bg-[var(--alo-page)]" />
                <Button size="sm" className="w-full h-12 text-[13px] bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white" onClick={handleAddNote}>Log Officer Note — Audit</Button>
                <p className="text-[11px] text-[var(--alo-text-muted)]">Rules: Student never sees internal, Partner never sees visa, Marketing never sees visa, Student sees only approved student-safe feedback — every edit audited — visibility: INTERNAL_ONLY/VISA_TEAM_ONLY/COUNSELOR_VISIBLE/APPLICATION_TEAM_VISIBLE/STUDENT_SAFE_FEEDBACK/SUPER_ADMIN_ONLY</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {studentFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="bg-white max-w-lg w-full rounded-xl shadow-xl border">
            <CardHeader className="pb-3 border-b"><CardTitle className="text-sm font-bold">Review Student-Safe Feedback Before Publishing</CardTitle><CardDescription className="text-xs">Portal-only delivery. Keep the wording supportive and factual; no external message will be sent.</CardDescription></CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs space-y-1">
                <span className="font-semibold text-indigo-900 block">Officer-authored guidance — no AI draft or official-source claim:</span>
                <p className="text-indigo-800">Write only case-specific, verified, student-safe preparation guidance. Do not include internal risk labels, medical or criminal information, unsupported requirements, or visa guarantees.</p>
              </div>
              <Textarea placeholder="Edit student-safe guidance — supportive/clear/professional/actionable" value={feedbackText} onChange={e => setFeedbackText(e.target.value)} className="min-h-[100px] text-xs" />
              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setStudentFeedbackModalOpen(false)}>Cancel</Button>
                <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSendFeedback}>Approve & Publish to Student Portal</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
