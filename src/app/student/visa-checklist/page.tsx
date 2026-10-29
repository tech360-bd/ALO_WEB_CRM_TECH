'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileCheck, Shield, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  Upload, Eye, Download, Sparkles, RefreshCw, FileText
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function StudentVisaChecklistPage() {
  const [checklist, setChecklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChecklist = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('student_session_token') || localStorage.getItem('alo_student_token') || '';
      const res = await fetch('/api/student-portal/visa', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setChecklist(json.data?.checklistItems || json.checklist || []);
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Failed to load checklist —');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchChecklist(); }, [fetchChecklist]);

  return (
    <div className="space-y-6 p-4 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--alo-border)] pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-[var(--alo-cta)] flex items-center justify-center">
              <FileCheck className="w-5 h-5 text-[var(--alo-text)]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--alo-text)]">Visa Documents & Compliance Checklist — 25+ Types</h1>
              <p className="text-[var(--alo-text-muted)] text-xs">Official checklist verified by your ALO Visa Interview Officer — Passport/Photo/Offer Letter/CAS/Academic Certificates/Transcripts/English Test/Bank Statement/Solvency Certificate/Sponsor Letter/Sponsor ID/Sponsor Occupation Proof/Source of Funds/Birth Certificate/Marriage Certificate/Work Experience/Study Gap Evidence/Refusal Letter/TB/Medical/Accommodation/Consent Documents/Visa Application/Biometric Appointment/Payment Receipt/Other Country-specific — statuses NOT_UPLOADED/UPLOADED/PENDING_REVIEW/APPROVED/REJECTED/NEEDS_UPDATE/EXPIRED/NOT_APPLICABLE — Do not permanently delete submitted visa documents — Use replacement/version history — API: /api/student-portal/visa</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/student/visa"><Button variant="outline" className="border-[var(--alo-border)] text-[var(--alo-placeholder)] hover:text-[var(--alo-text)] ">View Readiness Overview — Safe Readiness Only</Button></Link>
          <Button onClick={fetchChecklist} variant="outline" className="border-[var(--alo-border)] text-[var(--alo-placeholder)] hover:text-[var(--alo-text)]"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></Button>
        </div>
      </div>

      <Card className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)]">
        <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-base font-semibold">Required Compliance Documents — No Permanent Delete — Version History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[var(--alo-border)] text-left text-[var(--alo-text-muted)] bg-[var(--alo-surface-muted)]"><th className="p-3 font-medium">Document Item — 25+ Types</th><th className="p-3 font-medium">Category</th><th className="p-3 font-medium">Mandatory</th><th className="p-3 font-medium">Verification Status — NOT_UPLOADED/UPLOADED/PENDING_REVIEW/APPROVED/REJECTED/NEEDS_UPDATE/EXPIRED/NOT_APPLICABLE</th><th className="p-3 font-medium">Officer Guidance — Supportive/Clear/Professional/Actionable</th><th className="p-3 font-medium text-right">Actions — Request/Approve/Reject/Needs Update/Add Note/Notify/Timeline never permanent delete version history</th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="p-8 text-center text-[var(--alo-text-muted)] text-xs">Loading your verified checklist...</td></tr>
                ) : checklist.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-[var(--alo-text-muted)] text-xs">No checklist items yet — proper empty state — — 25+ docs Passport/Photo/Offer Letter/CAS/Academic Certificates/Transcripts/English Test/Bank Statement/Solvency Certificate/Sponsor Letter/Sponsor ID/Sponsor Occupation Proof/Source of Funds/Birth Certificate/Marriage Certificate/Work Experience/Study Gap Evidence/Refusal Letter/TB/Medical/Accommodation/Consent Documents/Visa Application/Biometric Appointment/Payment Receipt/Other Country-specific — statuses NOT_UPLOADED/UPLOADED/PENDING_REVIEW/APPROVED/REJECTED/NEEDS_UPDATE/EXPIRED/NOT_APPLICABLE — actions Request/Approve/Reject/Needs Update/Add Note/Notify Student/Notify Counselor/Timeline Event — Do not permanently delete submitted visa documents — Use replacement/version history — API: /api/student-portal/visa</td></tr>
                ) : checklist.map((item, idx) => (
                  <tr key={idx} className="border-b border-[var(--alo-border)] hover:bg-[var(--alo-page)] transition-colors">
                    <td className="p-3 font-semibold text-[var(--alo-text)] flex items-center gap-2"><FileText className="w-4 h-4 text-[var(--alo-info-text)]" /><span>{item.item || item.documentName}</span></td>
                    <td className="p-3 text-xs text-[var(--alo-text-muted)] capitalize">{item.category}</td>
                    <td className="p-3">{item.isRequired ? <Badge className="bg-crm-danger-bg text-crm-danger-text border-rose-500/30 text-[11px]">Required</Badge> : <Badge variant="outline" className="text-[var(--alo-text-muted)] text-[11px]">Optional</Badge>}</td>
                    <td className="p-3"><Badge className={item.status === 'APPROVED' || item.status === 'approved' || item.status === 'completed' ? 'bg-crm-success-bg text-crm-success-text border-crm-success-border text-[11px]' : item.status === 'UPLOADED' || item.status === 'uploaded' ? 'bg-[var(--alo-info-bg)] text-[var(--alo-info-text)] border-[var(--alo-brand)]/30 text-[11px]' : 'bg-crm-warning-bg text-crm-warning-text border-crm-warning-border text-[11px]'}>{(item.status || 'NOT_UPLOADED').toUpperCase()}</Badge></td>
                    <td className="p-3 text-xs text-[var(--alo-placeholder)] max-w-xs">{item.note || item.reason || 'Ensure high-resolution scan in PDF format — supportive/clear/professional/actionable — student-safe feedback'}</td>
                    <td className="p-3 text-right"><Link href="/student/documents"><Button size="sm" className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white h-7"><Upload className="w-3 h-3 mr-1" /> Upload — Replacement Previous Versions Remain Auditable Officer Cannot Silently Delete History</Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <div className="text-[11px] text-[var(--alo-text-muted)] text-center">Doc Center checklist 25 types statuses NOT_UPLOADED→NOT_APPLICABLE actions Request/Approve/Reject/Needs Update/Add Note/Notify/Timeline never permanent delete version history — Request with name/reason/deadline/priority/visibility/notification — Two-layer notes INTERNAL_ONLY/VISA_TEAM_ONLY/COUNSELOR_VISIBLE/APPLICATION_TEAM_VISIBLE/STUDENT_SAFE_FEEDBACK/SUPER_ADMIN_ONLY student never sees internal — Student-safe feedback supportive/clear/professional/actionable never internal risk/confidential/staff criticism/guarantee officer approves before send to Portal/Timeline/Notifications/Messages — Reuse existing Email/WhatsApp/SMS/Portal Message no duplicate engine RBAC/consent/audit — No-deletion versioning soft delete only</div>
    </div>
  );
}
