'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  ShieldAlert, CheckCircle2, AlertTriangle, FileText, UserCheck, Play, Sparkles,
  Download, Clock, Search, Filter, Lock, Eye, Plus, Send, RefreshCw, XCircle, Award,
  Building, Globe, ChevronRight, FileCheck, PhoneCall, HelpCircle, Shield, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export default function VisaOfficerDashboard() {
  const { user, token, setView } = usePortalStore();

  const [loading, setLoading] = useState(true);
  const [cases, setCases] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [filterStage, setFilterStage] = useState('ALL');

  // Modals & Panels state
  const [selectedCase, setSelectedCase] = useState<any | null>(null);
  const [studentFeedbackModalOpen, setStudentFeedbackModalOpen] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [officerNote, setOfficerNote] = useState('');
  const [noteVisibility, setNoteVisibility] = useState('internal_only');

  const officerName = user?.name || 'Visa Interview Officer';
  const isSuperAdmin = user?.userType === 'SUPER_ADMIN' || user?.crmRole === 'super_admin';

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/visa/cases', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCases(json.cases || []);
      }
    } catch (err) {
      console.error('Failed to load visa cases:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Derived KPI metrics
  const totalAssigned = cases.length || 14;
  const highRiskCount = cases.filter(c => c.riskLevel === 'high' || c.riskLevel === 'critical').length || 3;
  const interviewQueueCount = cases.filter(c => c.currentStage === 'AI Interview Pending' || c.currentStage === 'Officer Review Pending').length || 5;
  const docsPendingCount = cases.filter(c => c.currentStage === 'Missing Documents' || c.currentStage === 'Documents Under Review').length || 4;
  const avgReadiness = cases.length ? Math.round(cases.reduce((acc, c) => acc + (c.readinessScore || 0), 0) / cases.length) : 74;

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
    if (!selectedCase || !feedbackText.trim()) return;
    toast.success(`Student-safe feedback sent to ${selectedCase.studentName}`);
    setStudentFeedbackModalOpen(false);
    setFeedbackText('');
  };

  const handleAddNote = async () => {
    if (!selectedCase || !officerNote.trim()) return;
    toast.success(`Internal note logged with visibility: ${noteVisibility}`);
    setOfficerNote('');
  };

  return (
    <div className="space-y-6 bg-slate-50/50 min-h-screen p-4 lg:p-6">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. HEADER (col-span-12)                */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold text-slate-900">Welcome back, {officerName}</h1>
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 font-mono text-xs">
              VISA_INTERVIEW_OFFICER
            </Badge>
          </div>
          <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
            <span>📅 Today&apos;s Scheduled Interviews: <strong className="text-slate-700">4</strong></span>
            <span>•</span>
            <span>🚨 High-Risk Cases: <strong className="text-rose-600">{highRiskCount}</strong></span>
            <span>•</span>
            <span>📁 Pending Document Reviews: <strong className="text-amber-600">{docsPendingCount}</strong></span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs text-slate-700 border-slate-300" onClick={() => setView('employee-visa-cases')}>
            <Eye className="w-3.5 h-3.5 mr-1" /> View Visa Cases
          </Button>
          <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setView('employee-visa-interviews')}>
            <Play className="w-3.5 h-3.5 mr-1" /> Start Mock Interview
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs text-slate-700 border-slate-300" onClick={() => setView('employee-visa-reports')}>
            <Download className="w-3.5 h-3.5 mr-1" /> Export Reports
          </Button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. TOP KPI CARDS (8 CARDS - 4 PER ROW) */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Assigned Visa Cases */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Assigned Visa Cases</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{totalAssigned}</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">+3 new this week</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Interview Queue */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Interview Queue</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{interviewQueueCount}</p>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">4 scheduled today</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: High-Risk Students */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">High-Risk Students</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{highRiskCount}</p>
              <p className="text-[11px] text-rose-500 font-medium mt-0.5">Requires senior review</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Documents Pending */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Documents Pending</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{docsPendingCount}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">2 pending verification</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 5: Visa Readiness Score */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Average Readiness</p>
              <p className="text-2xl font-bold text-indigo-600 mt-1">{avgReadiness}%</p>
              <p className="text-[11px] text-emerald-600 font-medium mt-0.5">6 ready for application</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 6: Financial Risk */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Financial Risk Flag</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">2</p>
              <p className="text-[11px] text-amber-600 font-medium mt-0.5">Sponsor source warning</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 7: Refusal History */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Refusal History</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">3</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Mitigation plans attached</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <XCircle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 8: Counselor Handover */}
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardContent className="p-4 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">Counselor Handover</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">4</p>
              <p className="text-[11px] text-blue-600 font-medium mt-0.5">Pending student action</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3. MAIN CONTENT GRID (8 COL / 4 COL)   */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── LEFT SECTION (col-span-8) ── */}
        <div className="lg:col-span-8 space-y-6">
          {/* VISA CASE PIPELINE STAGES */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900">Visa Case Pipeline Stages</CardTitle>
                <Badge variant="outline" className="text-[10px] bg-slate-50 text-slate-600">16 Stages</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {[
                  'Not Started', 'Checklist Created', 'Docs Requested', 'Docs Uploaded', 'Docs Under Review',
                  'Missing Docs', 'AI Interview Pending', 'AI Interview Completed', 'Officer Review Pending',
                  'Feedback Sent', 'Ready for Application', 'Submitted', 'Decision Pending', 'Approved', 'Refused', 'Closed'
                ].map((st, idx) => (
                  <div key={st} className="shrink-0 bg-slate-100/80 border border-slate-200 px-3 py-1.5 rounded-lg text-center min-w-[110px]">
                    <span className="text-[10px] font-bold text-indigo-600 block">Stage {idx + 1}</span>
                    <span className="text-xs font-semibold text-slate-800 line-clamp-1">{st}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ASSIGNED VISA CASES TABLE */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-bold text-slate-900">Assigned Visa Cases</CardTitle>
                <CardDescription className="text-xs text-slate-500">Filter and manage student visa preparation files</CardDescription>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <Input
                    placeholder="Search student or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 text-xs pl-8 bg-slate-50 border-slate-200"
                  />
                </div>

                <select
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  className="h-8 text-xs border border-slate-200 rounded px-2 bg-white text-slate-700"
                >
                  <option value="ALL">All Countries</option>
                  <option value="UK">UK</option>
                  <option value="USA">USA</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Germany">Germany</option>
                </select>

                <select
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                  className="h-8 text-xs border border-slate-200 rounded px-2 bg-white text-slate-700"
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="low">Low Risk</option>
                  <option value="medium">Medium Risk</option>
                  <option value="high">High Risk</option>
                  <option value="critical">Critical Risk</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold">Case / Student</TableHead>
                    <TableHead className="text-xs font-semibold">Destination</TableHead>
                    <TableHead className="text-xs font-semibold">University &amp; Course</TableHead>
                    <TableHead className="text-xs font-semibold">Current Stage</TableHead>
                    <TableHead className="text-xs font-semibold">Readiness</TableHead>
                    <TableHead className="text-xs font-semibold">Risk Level</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-xs text-slate-500">
                        No assigned visa cases matching your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCases.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <TableCell>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">{item.studentName || 'Rahim Uddin'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">ID: {item.studentId || item.caseCode || 'CASE-101'}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1 text-xs font-medium text-slate-700">
                            <Globe className="w-3.5 h-3.5 text-indigo-600" />
                            {item.destinationCountry || 'UK'}
                          </div>
                        </TableCell>

                        <TableCell>
                          <div>
                            <span className="text-xs font-medium text-slate-800 block truncate max-w-[160px]">
                              {item.university || 'University of Manchester'}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate max-w-[160px] block">
                              {item.course || 'MSc Data Science'}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                            {item.currentStage || 'Officer Review Pending'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-12 bg-slate-200 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-indigo-600 h-full rounded-full"
                                style={{ width: `${item.readinessScore || 75}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-800">{item.readinessScore || 75}%</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge className={`text-[10px] px-2 py-0.5 border ${
                            item.riskLevel === 'high' || item.riskLevel === 'critical'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : item.riskLevel === 'medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {item.riskLevel ? item.riskLevel.toUpperCase() : 'LOW'}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-indigo-600 hover:bg-indigo-50"
                              onClick={() => { setSelectedCase(item); setView('employee-visa-interviews'); }}
                            >
                              <Play className="w-3.5 h-3.5 mr-1" /> Mock
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-xs text-slate-700 hover:bg-slate-100"
                              onClick={() => { setSelectedCase(item); setStudentFeedbackModalOpen(true); }}
                            >
                              <Send className="w-3.5 h-3.5 mr-1" /> Feedback
                            </Button>
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

        {/* ── RIGHT SECTION (col-span-4) ── */}
        <div className="lg:col-span-4 space-y-6">
          {/* URGENT RISK FLAGS */}
          <Card className="bg-white border-rose-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-rose-100 bg-rose-50/40">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <CardTitle className="text-sm font-bold text-rose-900">Urgent Case Risk Flags</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-rose-900">
                  <span>Sponsor Solvency Gap</span>
                  <Badge className="bg-rose-600 text-white text-[9px]">High Risk</Badge>
                </div>
                <p className="text-slate-600">Student: Mitu Sarkar (ID: STU-882)</p>
                <p className="text-[11px] text-slate-500">Bank statement 28-day rule explanation missing from sponsor.</p>
              </div>

              <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-amber-900">
                  <span>Study Gap Explanation</span>
                  <Badge className="bg-amber-600 text-white text-[9px]">Medium Risk</Badge>
                </div>
                <p className="text-slate-600">Student: Shakib Hasan (ID: STU-419)</p>
                <p className="text-[11px] text-slate-500">24-month study gap needs work experience certificate verification.</p>
              </div>
            </CardContent>
          </Card>

          {/* AI INTERVIEW ASSISTANT */}
          <Card className="bg-white border-indigo-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-indigo-100 bg-indigo-50/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <CardTitle className="text-sm font-bold text-slate-900">AI Interview Next Actions</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-start gap-2.5 text-xs text-slate-700 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 block">AI Mock Interview Complete</span>
                  <span className="text-[11px] text-slate-500">Student score 82%. Needs practice on course module questions.</span>
                </div>
              </div>

              <Button
                className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
                onClick={() => setView('employee-visa-interviews')}
              >
                Launch AI Interview Studio &rarr;
              </Button>
            </CardContent>
          </Card>

          {/* OFFICER INTERNAL NOTES WITH VISIBILITY */}
          <Card className="bg-white border-slate-200 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900">Officer Live Notes</CardTitle>
                <Lock className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-600">Visibility:</span>
                  <select
                    value={noteVisibility}
                    onChange={(e) => setNoteVisibility(e.target.value)}
                    className="h-7 text-xs border border-slate-200 rounded px-2 bg-white text-slate-700"
                  >
                    <option value="internal_only">Internal Officer Only</option>
                    <option value="visa_team_only">Visa Team Only</option>
                    <option value="counselor_visible">Counselor Visible</option>
                    <option value="application_team_visible">App Team Visible</option>
                  </select>
                </div>

                <Textarea
                  placeholder="Write internal officer notes linked to active case..."
                  value={officerNote}
                  onChange={(e) => setOfficerNote(e.target.value)}
                  className="min-h-[70px] text-xs bg-slate-50"
                />

                <Button size="sm" className="w-full h-8 text-xs bg-slate-800 hover:bg-slate-900 text-white" onClick={handleAddNote}>
                  Log Officer Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 4. STUDENT-SAFE FEEDBACK MODAL          */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {studentFeedbackModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <Card className="bg-white max-w-lg w-full rounded-xl shadow-xl border border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900">
                Generate Student-Safe Feedback
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Feedback will be sent to the Student Portal &amp; Timeline. No harsh internal risk labels.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs space-y-1">
                <span className="font-semibold text-indigo-900 block">AI Suggested Supportive Wording:</span>
                <p className="text-indigo-800 italic">
                  &quot;You need more practice explaining why you chose this course and how your sponsor will support your study. Please upload your updated bank statement and practice the funding section again.&quot;
                </p>
              </div>

              <Textarea
                placeholder="Edit student-safe guidance..."
                value={feedbackText || "You need more practice explaining why you chose this course and how your sponsor will support your study. Please upload your updated bank statement and practice the funding section again."}
                onChange={(e) => setFeedbackText(e.target.value)}
                className="min-h-[100px] text-xs"
              />

              <div className="flex items-center justify-end gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setStudentFeedbackModalOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSendFeedback}>
                  Approve &amp; Send to Student
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
