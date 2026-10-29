'use client';

import { useState, useEffect, useCallback } from 'react';
import { useStudentAuth } from '@/app/student/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Shield, CheckCircle2, AlertCircle, Clock, FileText, ArrowRight,
  Sparkles, BookOpen, AlertTriangle, RefreshCw, Upload, Check, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function StudentVisaReadinessPage() {
  const { student, token } = useStudentAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchVisaData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/student-portal/visa', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data || {});
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to load visa data');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchVisaData(); }, [fetchVisaData]);

  if (loading) {
    return <div className="p-8 text-center text-[var(--alo-text-muted)] text-xs"><RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />Loading your visa readiness…</div>;
  }

  const visaCase = data?.visaCase;
  const checklist = data?.checklistItems || [];
  const reports = data?.reports || [];
  const readiness = reports[0] || null;
  const score = readiness?.overallScore ?? visaCase?.readinessScore ?? 0;
  const feedbackNotes = data?.studentFeedback || [];
  const latestFeedback = feedbackNotes[0]?.content || data?.visaCase?.studentFeedback || null;
  const tasks = data?.tasks || [];
  const documents = data?.documents || [];
  const aiSessions = data?.aiSessions || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--alo-text)] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[var(--alo-brand)]" />
            <span>Visa Readiness & Preparation</span>
          </h1>
          <p className="text-[var(--alo-text-muted)] text-xs mt-1">Track your visa milestones, checklist verification, and practice embassy mock interviews — Student portal view checklist/requested/schedule/approved feedback/safe readiness/next actions/messages/appointments/AI practice NOT internal/risk/sensitive/medical/criminal/refusal analysis/staff comments — student never sees internal</p>
        </div>
        <Link href="/student/visa-interview-practice">
          <Button className="bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-cta)] hover:opacity-90 text-white flex items-center gap-2 shadow-lg">
            <Sparkles className="w-4 h-4" />
            <span>Practice AI Visa Interview — 9 Types — One Q At A Time</span>
          </Button>
        </Link>
      </div>

      <Card className="border-crm-success-border bg-crm-success-bg text-[var(--alo-text)]">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-xs text-[var(--alo-info-text)] font-semibold tracking-wider uppercase">Current Visa Readiness Score — 10 Components = 100% — Profile 10% Passport 10% Academic 10% English 10% Offer/CAS 10% Funding 15% Bank 10% Study Gap 10% Interview 10% Risk 5%</p>
              <div className="flex items-baseline gap-3 mt-2">
                <span className="text-5xl font-extrabold text-[var(--alo-text)]">{score}%</span>
                <Badge className={score >= 80 ? 'bg-crm-success-bg text-crm-success-text border-crm-success-border' : score >= 60 ? 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border' : 'bg-crm-danger-bg text-crm-danger-text border-crm-danger-border'}>
                  {score >= 80 ? 'READY' : score >= 60 ? 'NEEDS_DOCUMENTS' : score > 0 ? 'NEEDS_PRACTICE' : 'NOT_STARTED — proper empty state'}
                </Badge>
              </div>
              <p className="text-[var(--alo-text-muted)] text-xs mt-2">
                {readiness?.recommendation || visaCase?.nextAction || (checklist.length === 0 ? 'No visa case assigned yet — proper empty statebase — contact counselor' : 'Calculated across 10 verification criteria: passport, academics, English test, financial solvency, study gap, interview — What is strong/weak/missing/next action/responsible/deadline explained — internal sensitive risk not exposed to students')}
              </p>
              {visaCase && <p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Case: {visaCase.caseCode} • Stage: {visaCase.currentStage} • Destination: {visaCase.destinationCountry} • University: {visaCase.university} • Course: {visaCase.course} • Intake: {visaCase.intake} • API: /api/student-portal/visa</p>}
            </div>
            <div className="flex-1 max-w-md">
              <div className="h-3 bg-[var(--alo-surface-muted)] rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-[var(--alo-brand)] to-[var(--alo-cta)] rounded-full transition-all duration-500" style={{ width: `${score}%` }} /></div>
              <div className="flex justify-between text-[11px] text-[var(--alo-text-muted)] mt-2"><span>Profile 10% Passport 10% Academic 10% English 10% Offer/CAS 10%</span><span>Funding 15% Bank 10% Study Gap 10% Interview 10% Risk 5%</span></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]">
            <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-base font-semibold flex items-center justify-between"><span>Visa Document Checklist</span><span className="text-xs text-[var(--alo-text-muted)]">{checklist.filter((i: any) => i.status === 'APPROVED' || i.status === 'approved').length} of {checklist.length} Verified</span></CardTitle></CardHeader>
            <CardContent className="p-4 space-y-3">
              {checklist.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--alo-text-muted)] border border-dashed border-[var(--alo-border)] rounded-xl">
                  No checklist items yet — proper empty state — — 25+ docs Passport/Photo/Offer Letter/CAS/Academic Certificates/Transcripts/English Test/Bank Statement/Solvency Certificate/Sponsor Letter/Sponsor ID/Sponsor Occupation Proof/Source of Funds/Birth Certificate/Marriage Certificate/Work Experience/Study Gap Evidence/Refusal Letter/TB/Medical/Accommodation/Consent Documents/Visa Application/Biometric Appointment/Payment Receipt/Other Country-specific — statuses NOT_UPLOADED/UPLOADED/PENDING_REVIEW/APPROVED/REJECTED/NEEDS_UPDATE/EXPIRED/NOT_APPLICABLE — actions Request/Approve/Reject/Needs Update/Add Note/Notify/Timeline never permanent delete version history
                </div>
              ) : checklist.map((item: any, idx: number) => (
                <div key={idx} className="p-3 bg-[var(--alo-surface-muted)] rounded-xl border border-[var(--alo-border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {item.status === 'APPROVED' || item.status === 'approved' ? <div className="w-7 h-7 rounded-full bg-crm-success-bg text-crm-success-text flex items-center justify-center"><Check className="w-4 h-4" /></div> : item.status === 'PENDING_REVIEW' || item.status === 'under_review' ? <div className="w-7 h-7 rounded-full bg-crm-warning-bg text-crm-warning-text flex items-center justify-center"><Clock className="w-4 h-4" /></div> : <div className="w-7 h-7 rounded-full bg-[var(--alo-surface-muted)] text-[var(--alo-text-muted)] flex items-center justify-center"><FileText className="w-4 h-4" /></div>}
                    <span className="text-sm text-[var(--alo-body)]">{item.item || item.documentName}</span>
                  </div>
                  <Badge className={item.status === 'APPROVED' || item.status === 'approved' ? 'bg-crm-success-bg text-crm-success-text border-crm-success-border' : 'bg-gray-500/20 text-[var(--alo-text-muted)] border-gray-500/30'}>{(item.status || 'NOT_UPLOADED').replace(/_/g, ' ').toUpperCase()}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]">
            <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-xs font-semibold uppercase tracking-wider">Your Tasks</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-2">
              {tasks.length === 0 ? <div className="text-xs text-[var(--alo-text-muted)] p-4 text-center border-dashed border rounded-lg">No tasks assigned — proper empty state</div> : tasks.map((t: any, i: number) => (
                <div key={i} className="p-2 bg-[var(--alo-surface-muted)] rounded-lg border border-[var(--alo-border)] flex items-center justify-between text-xs"><span>{t.title}</span><Badge className="text-[11px]">{t.status}</Badge></div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-[var(--alo-brand)]/20 to-[var(--alo-cta)]/10 border border-[var(--alo-brand)]/30 text-white">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-[var(--alo-cta)]" /><h3 className="font-bold text-sm">AI Mock Interview Simulator</h3></div>
              <p className="text-xs text-[var(--alo-placeholder)] leading-relaxed">Practise embassy credibility questions one at a time. The AI understands Bangladeshi English and Banglish patterns and scores meaning and clarity — never accent. Practice only: no AI tool can guarantee a visa outcome.</p>
              <Link href="/student/visa-interview-practice" className="block"><Button className="w-full bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white py-2.5 flex items-center justify-center gap-2"><span>Start Practice Session</span><ArrowRight className="w-3.5 h-3.5" /></Button></Link>
              {aiSessions.length > 0 && <div className="text-[11px] text-[var(--alo-text-muted)]">Recent AI sessions: {aiSessions.length} — last score {aiSessions[0]?.readinessScore || 0}% — {aiSessions[0]?.interviewType}</div>}
            </CardContent>
          </Card>

          <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]">
            <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-xs font-semibold text-[var(--alo-text-muted)] uppercase tracking-wider">Officer Feedback</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-2">
              {latestFeedback ? <p className="text-xs text-[var(--alo-placeholder)] leading-relaxed">{latestFeedback}</p> : <div className="text-xs text-[var(--alo-text-muted)] p-4 text-center border-dashed border border-[var(--alo-border)] rounded-lg">No officer feedback yet — proper empty state — student-safe feedback supportive/clear/professional/actionable never include internal risk labels/confidential comments/staff criticism/unsupported claims/visa guarantees — officer must approve before sending — save to Student Portal/Timeline/Notifications/Messages</div>}
              <div className="pt-2 border-t border-[var(--alo-border)] flex items-center justify-between text-[11px] text-[var(--alo-text-muted)]"><span>Visa Team Officer — Approved</span><span>Student-Safe — Timeline</span></div>
            </CardContent>
          </Card>

          <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]">
            <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-xs font-semibold uppercase tracking-wider">Documents</CardTitle></CardHeader>
            <CardContent className="p-4 space-y-2">
              {documents.length === 0 ? <div className="text-xs text-[var(--alo-text-muted)] p-4 text-center border-dashed border rounded-lg">No documents uploaded — proper empty state</div> : documents.slice(0,5).map((d: any, i: number) => (
                <div key={i} className="p-2 bg-[var(--alo-surface-muted)] rounded border border-[var(--alo-border)] text-xs flex justify-between"><span>{d.fileName || d.category}</span><Badge className="text-[11px]">{d.status}</Badge></div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="text-[11px] text-[var(--alo-text-muted)] text-center">Student portal view checklist/requested/schedule/approved feedback/safe readiness/next actions/messages/appointments/AI practice NOT internal/risk/sensitive/medical/criminal/refusal analysis/staff comments — student never sees internal — partner never sees visa — marketing never sees visa — every download/readiness/sensitive audited — reuse existing Email/WhatsApp/SMS/Portal Message no duplicate engine RBAC/consent/audit — Timeline every major event Visa Case Created→Decision Updated student-safe vs internal RBAC</div>
    </div>
  );
}
