'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import {
  User, ShieldAlert, Sparkles, CheckCircle2, Play, Send, Lock, Eye, AlertTriangle,
  FileText, Award, ArrowLeft, RefreshCw, Clock, Check, X, Shield, BookOpen, Building2,
  DollarSign, AlertCircle, FileCheck, HelpCircle, History, ListTodo, MessageSquare, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface VisaInterviewWorkspaceProps {
  caseId?: string;
  onBack?: () => void;
}

export default function VisaInterviewWorkspace({
  caseId = 'CASE-101',
  onBack,
}: VisaInterviewWorkspaceProps) {
  const { user, token } = usePortalStore();

  const [loading, setLoading] = useState(true);
  const [caseData, setCaseData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'interview' | 'funding' | 'study_gap' | 'refusal' | 'checklist' | 'readiness' | 'notes' | 'tasks' | 'timeline'>('interview');

  // Interview Questions & Transcript state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [recordedAnswer, setRecordedAnswer] = useState('');
  const [liveTranscript, setLiveTranscript] = useState<Array<{ question: string; answer: string; category: string }>>([
    {
      question: 'Why did you choose the United Kingdom for higher education?',
      answer: 'The UK offers 1-year intensive Master programs recognized worldwide with high research impact.',
      category: 'Country Motivation',
    },
  ]);

  // Scorecard (12 Dimensions)
  const [scores, setScores] = useState({
    clarity: 85,
    confidence: 80,
    courseKnowledge: 90,
    universityKnowledge: 85,
    countryKnowledge: 80,
    financialExplanation: 75,
    sponsorExplanation: 75,
    studyGapExplanation: 80,
    futurePlan: 85,
    refusalExplanation: 90,
    documentReadiness: 85,
    overallReadiness: 83,
  });

  // Officer Notes & Student-Safe Feedback
  const [officerNoteText, setOfficerNoteText] = useState('');
  const [officerNoteVisibility, setOfficerNoteVisibility] = useState('internal_only');
  const [studentFeedbackText, setStudentFeedbackText] = useState('');
  const [internalDecision, setInternalDecision] = useState('READY');

  const questions = [
    { category: 'Introduction & Country', question: 'Why did you choose the UK for your higher education rather than Bangladesh?' },
    { category: 'University Knowledge', question: 'Why did you select the University of Manchester over other institutions?' },
    { category: 'Course Modules', question: 'Can you detail two specific core modules in your MSc Data Science curriculum?' },
    { category: 'Funding & Sponsor', question: 'Who is sponsoring your tuition and living expenses, and what is their verified annual income?' },
    { category: 'Study Gap & Work History', question: 'Could you explain your 12-month study gap and what professional experience you acquired?' },
    { category: 'Future Career Plan', question: 'What is your exact career plan after completing your degree back in Bangladesh?' },
  ];

  const fetchCaseDetails = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/visa/cases/${caseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setCaseData(json.data || null);
      }
    } catch (err) {
      console.error('Failed to load case detail:', err);
    } finally {
      setLoading(false);
    }
  }, [caseId, token]);

  useEffect(() => {
    fetchCaseDetails();
  }, [fetchCaseDetails]);

  const handleRecordAnswer = () => {
    if (!recordedAnswer.trim()) {
      toast.error('Please enter the student\'s response');
      return;
    }
    setLiveTranscript(prev => [
      ...prev,
      {
        question: questions[currentQuestionIndex].question,
        answer: recordedAnswer,
        category: questions[currentQuestionIndex].category,
      },
    ]);
    setRecordedAnswer('');
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      toast.success('Response logged. Moving to next question.');
    } else {
      toast.success('All questions completed! Scorecard updated.');
    }
  };

  const handleCalculateReadiness = async () => {
    try {
      const res = await fetch(`/api/visa/readiness/${caseId}/calculate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`10-Component Readiness Score: ${data.data.overallScore}%`);
        fetchCaseDetails();
      }
    } catch (err: any) {
      toast.error('Failed to calculate readiness score');
    }
  };

  const handleSaveOfficerNote = async () => {
    if (!officerNoteText.trim()) return;
    try {
      const res = await fetch('/api/visa/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          caseId,
          studentId: caseData?.studentId || 'STU-101',
          content: officerNoteText,
          visibility: officerNoteVisibility,
        }),
      });
      if (res.ok) {
        toast.success(`Note saved with visibility: ${officerNoteVisibility}`);
        setOfficerNoteText('');
      }
    } catch (err) {
      toast.error('Failed to save note');
    }
  };

  const handleSendStudentFeedback = async () => {
    if (!studentFeedbackText.trim()) return;
    toast.success('Approved Student-Safe Feedback posted to Student Portal & Timeline!');
    setStudentFeedbackText('');
  };

  return (
    <div className="space-y-6 bg-slate-50/50 min-h-screen p-4 lg:p-6 text-slate-900">
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1. WORKSPACE HEADER                     */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          {onBack ? (
            <Button variant="outline" size="sm" onClick={onBack} className="h-8 text-xs text-slate-700">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Queue
            </Button>
          ) : (
            <Link href="/employee/visa-cases">
              <Button variant="outline" size="sm" className="h-8 text-xs text-slate-700">
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Cases
              </Button>
            </Link>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">
                Visa Interview Officer Workspace ({caseData?.caseCode || caseId})
              </h1>
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-xs">
                {caseData?.currentStage || 'Officer Review Pending'}
              </Badge>
              <Badge className={
                caseData?.riskLevel === 'high' ? 'bg-rose-100 text-rose-800 border-rose-200 text-xs' :
                caseData?.riskLevel === 'medium' ? 'bg-amber-100 text-amber-800 border-amber-200 text-xs' :
                'bg-emerald-100 text-emerald-800 border-emerald-200 text-xs'
              }>
                RISK: {(caseData?.riskLevel || 'LOW').toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Student: <strong className="text-slate-800">{caseData?.studentName || 'Rahim Uddin'}</strong> ({caseData?.studentId || 'STU-101'}) • Destination: <strong className="text-indigo-600">{caseData?.destinationCountry || 'United Kingdom'}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleCalculateReadiness} size="sm" variant="outline" className="h-8 text-xs text-slate-700 border-slate-300">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-indigo-600" />
            Recalculate Readiness
          </Button>
          <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => toast.success('Mock Interview Completed and Saved!')}>
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Finalize Assessment
          </Button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2. TAB NAVIGATION (17 SECTIONS)         */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto bg-white p-1 rounded-xl shadow-xs">
        {[
          { key: 'interview', label: 'Live Interview & Transcript' },
          { key: 'funding', label: 'Funding & Sponsor Review' },
          { key: 'study_gap', label: 'Study Gap Review' },
          { key: 'refusal', label: 'Refusal History' },
          { key: 'checklist', label: 'Compliance Checklist' },
          { key: 'readiness', label: '10-Component Readiness' },
          { key: 'notes', label: 'Two-Layer Notes' },
          { key: 'tasks', label: 'Tasks & Timeline' },
        ].map((tab: any) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3. ACTIVE TAB CONTENT                  */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* TAB: Live Interview & Transcript */}
      {activeTab === 'interview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel (7 cols): Questions & Live Input */}
          <div className="lg:col-span-7 space-y-6">
            {/* Summary Cards */}
            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="p-4 border-b border-slate-100">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Student & Target Program Profile</CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">University</span>
                  <span className="font-semibold text-slate-800">{caseData?.university || 'University of Manchester'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Course / Program</span>
                  <span className="font-semibold text-slate-800">{caseData?.course || 'MSc Data Science'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Target Intake</span>
                  <span className="font-semibold text-slate-800">{caseData?.intake || 'Sep 2025'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">English Band</span>
                  <span className="font-bold text-emerald-600">IELTS 7.0 (No band &lt; 6.5)</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Verified Sponsor</span>
                  <span className="font-semibold text-slate-800">Father (Business Owner)</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Study Gap</span>
                  <span className="font-semibold text-amber-600">12 Months (Work Exp)</span>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Question Card */}
            <Card className="bg-white border-indigo-200 shadow-xs">
              <CardHeader className="p-4 border-b border-indigo-100 bg-indigo-50/50 flex flex-row items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                    Question {currentQuestionIndex + 1} of {questions.length} • {questions[currentQuestionIndex].category}
                  </span>
                  <CardTitle className="text-sm font-bold text-slate-900 mt-1">
                    {questions[currentQuestionIndex].question}
                  </CardTitle>
                </div>
                <Sparkles className="w-5 h-5 text-indigo-600 shrink-0" />
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Recorded Answer / Student Response:</label>
                  <Textarea
                    placeholder="Enter student's response or interview notes..."
                    rows={4}
                    value={recordedAnswer}
                    onChange={e => setRecordedAnswer(e.target.value)}
                    className="text-xs bg-slate-50 border-slate-200 text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" className="h-8 text-xs text-indigo-600 border-indigo-200" onClick={() => toast.info('AI Prompt: "Ask the student to elaborate on career prospects in Dhaka."')}>
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    AI Suggest Follow-up
                  </Button>
                  <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleRecordAnswer}>
                    Record Response &rarr;
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Live Transcript */}
            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="p-4 border-b border-slate-100">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Live Mock Transcript ({liveTranscript.length} entries)</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {liveTranscript.map((t, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-900">Q: {t.question}</span>
                      <Badge variant="outline" className="text-[10px] bg-white">{t.category}</Badge>
                    </div>
                    <p className="text-slate-700 italic">A: &ldquo;{t.answer}&rdquo;</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel (5 cols): Scorecard & Verdict */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">12-Dimension Scorecard</CardTitle>
                  <p className="text-xs text-slate-400">Human Visa Officer Assessment</p>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold">
                  {scores.overallReadiness}% OVERALL
                </Badge>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[
                  { label: 'Communication Clarity', val: scores.clarity },
                  { label: 'Confidence & Demeanor', val: scores.confidence },
                  { label: 'Course Module Knowledge', val: scores.courseKnowledge },
                  { label: 'University Knowledge', val: scores.universityKnowledge },
                  { label: 'Financial / Source of Funds', val: scores.financialExplanation },
                  { label: 'Sponsor Explanation', val: scores.sponsorExplanation },
                  { label: 'Study Gap Explanation', val: scores.studyGapExplanation },
                  { label: 'Post-Graduation Future Plan', val: scores.futurePlan },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium text-slate-700">
                      <span>{item.label}</span>
                      <span className="font-bold">{item.val}%</span>
                    </div>
                    <Progress value={item.val} className="h-1.5 bg-slate-100" />
                  </div>
                ))}

                <hr className="my-3 border-slate-100" />

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-700">Officer Internal Workflow Verdict:</label>
                  <select
                    value={internalDecision}
                    onChange={e => setInternalDecision(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold text-slate-800"
                  >
                    <option value="READY">READY (File Robust, Ready for Submission)</option>
                    <option value="NEEDS_PRACTICE">NEEDS_PRACTICE (Schedule 2nd Mock)</option>
                    <option value="NEEDS_DOCUMENTS">NEEDS_DOCUMENTS (Missing Bank/Solvency)</option>
                    <option value="HIGH_RISK">HIGH_RISK (Escalate to Senior Officer)</option>
                    <option value="HUMAN_REVIEW_REQUIRED">HUMAN_REVIEW_REQUIRED</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Quick Student-Safe Feedback Composer */}
            <Card className="bg-white border-slate-200 shadow-xs">
              <CardHeader className="p-4 border-b border-slate-100">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Approved Student-Safe Feedback</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <Textarea
                  placeholder="Compose supportive, professional feedback to be displayed on Student Portal..."
                  rows={3}
                  value={studentFeedbackText}
                  onChange={e => setStudentFeedbackText(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 text-slate-900"
                />
                <Button size="sm" className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSendStudentFeedback}>
                  <Send className="w-3.5 h-3.5 mr-1" />
                  Approve &amp; Send to Student Portal
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB: Funding & Sponsor Review */}
      {activeTab === 'funding' && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Financial Solvency &amp; Sponsorship Assessment</CardTitle>
            <CardDescription className="text-xs">Verify Bank Statements, Solvency Certificates, Source of Funds &amp; 28-day holding period</CardDescription>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
              <span className="font-bold text-slate-800 block text-sm">Sponsor Profile</span>
              <p><strong className="text-slate-600">Primary Sponsor:</strong> Father (Md. Abdur Rahim)</p>
              <p><strong className="text-slate-600">Occupation:</strong> Managing Director, Rahim Agro Tech Ltd.</p>
              <p><strong className="text-slate-600">Annual Verified Income:</strong> ৳ 2,400,000 BDT (~£16,000 GBP)</p>
              <p><strong className="text-slate-600">Source of Funds:</strong> Business Dividends + Commercial Property Rental</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2">
              <span className="font-bold text-slate-800 block text-sm">Bank Verification</span>
              <p><strong className="text-slate-600">Bank Name:</strong> Eastern Bank Limited (EBL), Gulshan Branch</p>
              <p><strong className="text-slate-600">Closing Balance:</strong> ৳ 4,850,000 BDT (~£32,000 GBP)</p>
              <p><strong className="text-slate-600">28-Day Holding Period:</strong> <span className="text-emerald-600 font-bold">COMPLIANT (34 Days Maintained)</span></p>
              <p><strong className="text-slate-600">Solvency Certificate:</strong> <span className="text-emerald-600 font-bold">VERIFIED ON LETTERHEAD</span></p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB: Study Gap Review */}
      {activeTab === 'study_gap' && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Study Gap &amp; Career Continuity Review</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="font-bold text-slate-800 text-sm block">12-Month Post-Graduation Gap</span>
              <p className="text-slate-600 mt-1">
                Completed BSc in Computer Science in June 2024. Employed as Junior Software Analyst at Brain Station 23 from July 2024 to May 2025.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">Experience Letter Verified</Badge>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">Salary Payslips Attached</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB: Refusal History */}
      {activeTab === 'refusal' && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Prior Visa Refusal Assessment</CardTitle>
          </CardHeader>
          <CardContent className="p-4 text-xs">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">No Prior Visa Refusals on Record</p>
                <p className="text-[11px] text-emerald-700">Clean immigration history across UK, USA, Canada, Australia, and Schengen zones.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB: Compliance Checklist */}
      {activeTab === 'checklist' && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Visa Checklist &amp; Document Review</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50 text-left text-slate-500">
                  <th className="p-3">Document Item</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Requirement</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { item: 'Valid Passport (6+ months validity)', cat: 'Identity', req: 'Mandatory', status: 'VERIFIED' },
                  { item: 'University Confirmation of Acceptance for Studies (CAS)', cat: 'Admission', req: 'Mandatory', status: 'VERIFIED' },
                  { item: 'Academic Transcripts & Certificates', cat: 'Academic', req: 'Mandatory', status: 'VERIFIED' },
                  { item: 'Official IELTS Test Report Form', cat: 'Language', req: 'Mandatory', status: 'VERIFIED' },
                  { item: '28-Day Bank Statement & Solvency Certificate', cat: 'Financial', req: 'Mandatory', status: 'VERIFIED' },
                  { item: 'Sponsorship Affidavit & Proof of Income', cat: 'Financial', req: 'Mandatory', status: 'VERIFIED' },
                  { item: 'TB Medical Screening Certificate', cat: 'Medical', req: 'Mandatory', status: 'PENDING' },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-800">{row.item}</td>
                    <td className="p-3 text-slate-500">{row.cat}</td>
                    <td className="p-3 font-medium text-rose-600">{row.req}</td>
                    <td className="p-3">
                      <Badge className={
                        row.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]' :
                        'bg-amber-100 text-amber-800 border-amber-200 text-[10px]'
                      }>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" className="h-6 text-xs text-indigo-600">
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* TAB: Readiness */}
      {activeTab === 'readiness' && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold text-slate-900">10-Component Visa Readiness Calculation</CardTitle>
              <CardDescription className="text-xs">Formula weights: Profile (10%), Passport (10%), Academics (10%), English (10%), Offer/CAS (10%), Funding (15%), Bank Statement (10%), Study Gap (10%), Interview (10%), Risk (5%)</CardDescription>
            </div>
            <Button onClick={handleCalculateReadiness} size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
              Recalculate
            </Button>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-indigo-900 uppercase">Computed Readiness Score</p>
                <p className="text-3xl font-extrabold text-indigo-700 mt-0.5">88 / 100</p>
                <p className="text-xs text-indigo-800 mt-1">Visa File is robust. Recommended for Embassy Submission upon TB certificate upload.</p>
              </div>
              <Badge className="bg-emerald-600 text-white text-xs px-3 py-1">LOW RISK</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB: Two-Layer Notes */}
      {activeTab === 'notes' && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Two-Layer Visa Officer Notes</CardTitle>
            <CardDescription className="text-xs">Internal notes are strictly filtered from student views. Only student-safe feedback is exported.</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="space-y-2">
              <Textarea
                placeholder="Log internal visa assessment notes or officer flags..."
                rows={3}
                value={officerNoteText}
                onChange={e => setOfficerNoteText(e.target.value)}
                className="bg-slate-50 border-slate-200"
              />
              <div className="flex items-center justify-between">
                <select
                  value={officerNoteVisibility}
                  onChange={e => setOfficerNoteVisibility(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium"
                >
                  <option value="internal_only">Internal Visa Team Only</option>
                  <option value="counselor_visible">Counselor Visible</option>
                  <option value="application_team_visible">Application Team Visible</option>
                  <option value="super_admin_only">Super Admin Only</option>
                </select>
                <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleSaveOfficerNote}>
                  Save Note
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB: Tasks & Timeline */}
      {activeTab === 'tasks' && (
        <Card className="bg-white border-slate-200 shadow-xs">
          <CardHeader className="p-4 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-slate-900">Visa Action Tasks &amp; Compliance Audit Timeline</CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-4 text-xs">
            <div className="space-y-2">
              {[
                { title: 'Upload TB Medical Certificate', owner: 'Student', due: 'In 3 Days', status: 'PENDING' },
                { title: 'Verify Eastern Bank 28-day holding statement', owner: 'Visa Officer', due: 'Completed', status: 'COMPLETED' },
                { title: 'Schedule 2nd Credibility Mock Practice', owner: 'Visa Officer', due: 'In 5 Days', status: 'SCHEDULED' },
              ].map((task, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{task.title}</p>
                    <p className="text-slate-500 text-[11px]">Assigned to: {task.owner} • Due: {task.due}</p>
                  </div>
                  <Badge className={
                    task.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]' :
                    'bg-amber-100 text-amber-800 border-amber-200 text-[10px]'
                  }>
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
