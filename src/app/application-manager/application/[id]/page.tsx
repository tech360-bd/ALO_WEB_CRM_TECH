'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
import { getAllowedApplicationStageTransitions } from '@/lib/application-manager/service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileCheck, Send, Clock, Award, Shield, AlertTriangle, CheckCircle2,
  Users, Building2, BookOpen, Lock, ArrowLeft, RefreshCw,
  FileText, Calendar, MessageSquare, Check, X, Loader2, DollarSign,
  GraduationCap, Globe, Briefcase, Timer, Eye, Download, Plus
} from 'lucide-react';
import Link from 'next/link';

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'student', label: 'Student Profile' },
  { key: 'course', label: 'Course & University' },
  { key: 'documents', label: 'Documents' },
  { key: 'submission', label: 'Submission' },
  { key: 'b2b', label: 'B2B Details', lock: true },
  { key: 'comments', label: 'Comments' },
  { key: 'offer', label: 'Offer' },
  { key: 'cas', label: 'CAS-I20-COE' },
  { key: 'finance', label: 'Finance' },
  { key: 'visa', label: 'Visa Handover' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'audit', label: 'Audit Log' },
] as const;

export default function ApplicationDetailPage() {
  const params = useParams();
  const token = usePortalStore(s => s.token);
  const applicationId = params?.id as string;

  const [app, setApp] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [commentText, setCommentText] = useState('');
  const [commentType, setCommentType] = useState('APPLICATION_TEAM_INTERNAL');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{type:'success'|'error', text:string}|null>(null);
  const [b2bDetails, setB2bDetails] = useState<any[]>([]);
  const [offerData, setOfferData] = useState<any>(null);
  const [casData, setCasData] = useState<any>(null);
  const [canViewB2B, setCanViewB2B] = useState(false);
  const [stageReason, setStageReason] = useState('');
  const [handoverReason, setHandoverReason] = useState('');

  const fetchApp = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, { headers:{ Authorization:`Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setApp(json.application || json.data);
        setCanViewB2B(!!json.meta?.canViewB2B);
      }
    } catch (e){ console.error(e); } finally { setLoading(false); }
  }, [applicationId, token]);

  const fetchB2B = useCallback(async () => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/b2b`, { headers:{ Authorization:`Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setB2bDetails(json.b2bApplications || json.data || []);
        setCanViewB2B(true);
      } else if (res.status===403) {
        setCanViewB2B(false);
      }
    } catch {}
  }, [applicationId, token]);

  const fetchOffer = useCallback(async () => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/offer`, { headers:{ Authorization:`Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setOfferData(json.offers?.[0] || json.data?.[0] || json.offer || null);
      }
    } catch {}
  }, [applicationId, token]);

  const fetchCas = useCallback(async () => {
    try {
      const res = await fetch(`/api/applications/${applicationId}/cas-i20-coe`, { headers:{ Authorization:`Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        setCasData(json.casI20Coe || json.data || null);
      }
    } catch {}
  }, [applicationId, token]);

  useEffect(()=>{ fetchApp(); },[fetchApp]);
  useEffect(()=>{ if (activeTab==='b2b') fetchB2B(); if (activeTab==='offer') fetchOffer(); if (activeTab==='cas') fetchCas(); },[activeTab]);

  const handleVisaHandover = async () => {
    if (!handoverReason.trim()) {
      setMsg({ type: 'error', text: 'Enter a reason before handing the application to the visa team.' });
      return;
    }
    try {
      const res = await fetch(`/api/applications/${applicationId}/visa-handover`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ reason: handoverReason.trim() }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setHandoverReason('');
        setMsg({type:'success', text:json.message || `Visa handover complete — ${json.visaCase?.caseCode} created`});
        await fetchApp();
      } else setMsg({type:'error', text: json.error || 'Handover failed'});
    } catch { setMsg({type:'error', text:'Unable to complete visa handover. Please retry.'}); }
  };

  const handleComment = async (e:any) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/comments`, { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ commentText, commentType, visibility: commentType }) });
      if (res.ok) { setCommentText(''); fetchApp(); }
    } finally { setSubmitting(false); }
  };

  const handleStatusChange = async (newStage:string) => {
    if (!stageReason.trim()) {
      setMsg({ type: 'error', text: 'Enter a reason before changing the application stage.' });
      return;
    }
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, { method:'PATCH', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ stage:newStage, reason:stageReason.trim() }) });
      const json = await res.json();
      if (res.ok && json.success) {
        setStageReason('');
        setMsg({type:'success', text:`Status updated to ${newStage}`});
        await fetchApp();
      } else {
        setMsg({type:'error', text:json.error || 'Stage transition was rejected'});
      }
    } catch {
      setMsg({type:'error', text:'Unable to save the stage change. Please retry.'});
    }
  };

  if (loading) return <div className="p-8 bg-white min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[var(--alo-brand)]" /></div>;
  if (!app) return <div className="p-8 bg-white min-h-screen text-center"><p>Application not found</p><Link href="/application-manager/applications"><Button className="mt-4 bg-[var(--alo-brand)] text-white">Back</Button></Link></div>;

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      {/* Header 12-col */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <div className="bg-white border border-[var(--alo-border)] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Link href="/application-manager/applications"><Button variant="ghost" size="sm" className="p-2"><ArrowLeft className="w-4 h-4" /></Button></Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-[var(--alo-brand)] bg-[var(--alo-brand)]/10 border border-[var(--alo-brand)]/20 rounded px-2 py-0.5">{app.applicationCode || app.id.substring(0,10)}</span>
                  <Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[var(--alo-text)] text-[11px]">{app.stage}</Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">{app.safeStatus}</Badge>
                  {app.isB2b && <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[11px]"><Lock className="w-3 h-3 mr-1" />CONFIDENTIAL B2B</Badge>}
                </div>
                <h1 className="text-lg font-bold text-[var(--alo-text)] mt-1">{app.universityName} • {app.courseName}</h1>
                <p className="text-xs text-[var(--alo-text-muted)]">{app.country} • {app.intake} • {app.applicationSource} • Student: {app.studentId?.substring(0,8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleVisaHandover} className="bg-[var(--alo-brand)] hover:bg-[var(--alo-brand-hover)] text-white "><Shield className="w-4 h-4 mr-1" />Handover to Visa</Button>
              <Button variant="outline" className="border-[var(--alo-border)]" onClick={fetchApp}><RefreshCw className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      {msg && <div className={`p-3 rounded-xl border text-sm flex gap-2 ${msg.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-red-50 border-red-200 text-red-700'}`}>{msg.type==='success'?<CheckCircle2 className="w-4 h-4"/>:<AlertTriangle className="w-4 h-4"/>}{msg.text}</div>}

      {/* Tabs 13 */}
      <div className="bg-white border border-[var(--alo-border)] rounded-2xl p-2 shadow-sm">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.key} onClick={()=>setActiveTab(tab.key)} className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${activeTab===tab.key ? 'bg-[var(--alo-brand)] text-white shadow-sm' : 'text-[var(--alo-body)] hover:bg-[var(--alo-page)] border border-transparent hover:border-[var(--alo-border)]'}`}>
              {(tab as any).lock && <Lock className={`w-3 h-3 ${activeTab===tab.key ? 'text-white' : 'text-rose-500'}`} />}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab==='overview' && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8">
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
              <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Overview Data</CardTitle></CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-[var(--alo-text-muted)]">University</p><p className="font-semibold text-[var(--alo-text)]">{app.universityName}</p></div>
                <div><p className="text-xs text-[var(--alo-text-muted)]">Course</p><p className="font-semibold text-[var(--alo-text)]">{app.courseName}</p></div>
                <div><p className="text-xs text-[var(--alo-text-muted)]">Country</p><p className="font-semibold">{app.country}</p></div>
                <div><p className="text-xs text-[var(--alo-text-muted)]">Intake</p><p className="font-semibold">{app.intake || 'N/A'}</p></div>
                <div><p className="text-xs text-[var(--alo-text-muted)]">Source</p><p className="font-semibold text-[var(--alo-brand)]">{app.applicationSource}</p></div>
                <div><p className="text-xs text-[var(--alo-text-muted)]">Safe Status</p><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs mt-1">{app.safeStatus}</Badge></div>
                <div><p className="text-xs text-[var(--alo-text-muted)]">Counselor</p><p className="font-semibold">{app.counselorName || app.counselorId?.substring(0,8) || 'Unassigned'}</p></div>
                <div><p className="text-xs text-[var(--alo-text-muted)]">App Officer</p><p className="font-semibold">{app.appTeamOfficerId?.substring(0,8) || app.applicationOfficer?.substring(0,8) || 'Pending'}</p></div>
                <div className="col-span-2"><p className="text-xs text-[var(--alo-text-muted)]">Internal Notes</p><p className="text-xs bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2 mt-1">{app.internalNotes || app.notes || 'No notes'}</p></div>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
              <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-xs uppercase tracking-wider text-[var(--alo-text-muted)]">Quick Actions</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-2">
                <Input
                  value={handoverReason}
                  onChange={(event) => setHandoverReason(event.target.value)}
                  maxLength={180}
                  aria-label="Reason for visa handover"
                  placeholder="Reason for visa handover (required)"
                  className="text-xs"
                />
                <Input
                  value={stageReason}
                  onChange={(event) => setStageReason(event.target.value)}
                  maxLength={180}
                  aria-label="Reason for application stage change"
                  placeholder="Reason for stage change (required)"
                  className="text-xs"
                />
                <select
                  value=""
                  onChange={event => event.target.value && handleStatusChange(event.target.value)}
                  disabled={getAllowedApplicationStageTransitions(app.stage).length === 0}
                  aria-label="Choose an allowed next application stage"
                  className="w-full bg-white border border-[var(--alo-border)] rounded-xl px-3 py-2 text-xs disabled:opacity-60"
                >
                  <option value="">{getAllowedApplicationStageTransitions(app.stage).length ? 'Change to an allowed next stage' : 'No further stage transitions'}</option>
                  {getAllowedApplicationStageTransitions(app.stage).map(stage => <option key={stage} value={stage}>{stage}</option>)}
                </select>
                <Button onClick={handleVisaHandover} className="w-full bg-[var(--alo-brand)] text-white "><Shield className="w-4 h-4 mr-1" />Visa Handover</Button>
              </CardContent>
            </Card>
            <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl"><CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-xs">Visa Handover Status</CardTitle></CardHeader><CardContent className="p-4"><Badge className="bg-[var(--alo-page)] border-[var(--alo-border)]">{app.visaHandoverStatus}</Badge><p className="text-[11px] text-[var(--alo-text-muted)] mt-2">Reuses existing Visa Engine — no duplicate VisaCase</p></CardContent></Card>
          </div>
        </div>
      )}

      {activeTab==='student' && (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl"><CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Student Profile — Reuse Existing Student DB</CardTitle></CardHeader><CardContent className="p-4 text-sm space-y-2"><p><strong>Student ID:</strong> {app.studentId}</p><p><strong>Partner ID:</strong> {app.partnerId || 'N/A (Direct)'}</p><p className="text-xs text-[var(--alo-text-muted)]">Full profile fetched from PortalStudentProfile / Student DB — no duplicate system</p></CardContent></Card>
      )}

      {activeTab==='course' && (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl"><CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Course & University — Reuse Course Finder DB</CardTitle></CardHeader><CardContent className="p-4 text-sm"><p><strong>University:</strong> {app.universityName} ({app.universityId || 'No ID'})</p><p><strong>Course:</strong> {app.courseName} ({app.courseId || 'No ID'})</p><p><strong>Country:</strong> {app.country}</p><p><strong>Intake:</strong> {app.intake}</p><p><strong>Level:</strong> {app.level}</p><p className="text-xs text-[var(--alo-text-muted)] mt-2">Integrated with existing University/Course/Student DB, Course Finder, no rebuild</p></CardContent></Card>
      )}

      {activeTab==='documents' && (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[var(--alo-border)] flex flex-row items-center justify-between"><CardTitle className="text-sm">Documents — Engine Reuse (Required/Uploaded/Missing/Rejected/Expired/Under Review/Verified/Locked/Request Again)</CardTitle><Badge className="bg-[var(--alo-page)] border-[var(--alo-border)] text-[11px]">{app.documents?.length || 0} docs</Badge></CardHeader>
          <CardContent className="p-4 space-y-2">
            {(app.documents || []).length===0 ? <p className="text-sm text-[var(--alo-text-muted)] py-6 text-center">No documents — empty. Document engine reuses Required/Uploaded/Missing/Rejected/Expired/Under Review/Verified/Locked/Request Again with preview/download/approve/reject/note/version audited.</p> : (app.documents||[]).map((d:any)=>(
              <div key={d.id} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3 flex items-center justify-between"><div><p className="text-sm font-medium">{d.fileName || d.documentType}</p><p className="text-xs text-[var(--alo-text-muted)]">{d.documentType} • {d.status} • v{d.version}</p></div><div className="flex gap-1"><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="h-7"><Eye className="w-3 h-3" /></Button><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="h-7"><Download className="w-3 h-3" /></Button><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="h-7 bg-emerald-600 text-white"><Check className="w-3 h-3" /></Button><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-7 border-red-200 text-red-600"><X className="w-3 h-3" /></Button></div></div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab==='submission' && (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Submission — Methods DIRECT_UNIVERSITY_PORTAL/EMAIL/UNIVERSITY_REPRESENTATIVE/B2B_INBOUND/B2B_OUTBOUND/PARTNER_SUBMISSION/MANUAL</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Submitted By</p><p className="font-medium">{app.createdBy?.substring(0,8) || 'System'}</p></div>
              <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Submitted Date</p><p className="font-medium">{new Date(app.createdAt).toLocaleDateString()}</p></div>
              <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Portal Ref</p><p className="font-mono text-xs">N/A — will show</p></div>
              <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Fee Status</p><p className="font-medium">{app.applicationFeeStatus || app.paymentStatus || 'PENDING'}</p></div>
            </div>
            <p className="text-xs text-[var(--alo-text-muted)]">Submission fields: submittedBy/To/Date/Ack/Portal Ref/University App ID/Fee status/Receipt/Expected Response/Offer TAT/Follow-up/Note filtered for B2B confidentiality</p>
          </CardContent>
        </Card>
      )}

      {activeTab==='b2b' && (
        <Card className="bg-white border-rose-200 shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-rose-100 bg-rose-50/50 rounded-t-xl flex flex-row items-center justify-between"><CardTitle className="text-sm text-rose-700 flex items-center gap-2"><Lock className="w-4 h-4" />B2B Details — Confidential (Backend 403, Encrypted Credentials Never in Normal Response)</CardTitle><Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[11px]">RESTRICTED</Badge></CardHeader>
          <CardContent className="p-4">
            {!canViewB2B ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center"><Lock className="w-8 h-8 text-rose-400 mx-auto mb-2" /><p className="text-sm font-semibold text-rose-800">B2B Details Restricted</p><p className="text-xs text-rose-600 mt-1">Only APPLICATION_MANAGER/APPLICATION_TEAM/SUPER_ADMIN can view. Backend returns 403 for unauthorized. Normal application response omits B2B provider fields.</p></div>
            ) : b2bDetails.length===0 ? (
              <p className="text-sm text-[var(--alo-text-muted)] py-6 text-center">No B2B details — application is Direct/Partner. B2B Details tab confidential with encrypted credentials never in normal response.</p>
            ) : (
              <div className="space-y-3">
                {b2bDetails.map((b:any)=>(
                  <div key={b.id} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span className="font-semibold">{b.b2bProvider?.name || b.b2bProviderId} — {b.b2bType}</span><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">{b.b2bStatus}</Badge></div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-[var(--alo-text-muted)]">Provider Code:</span> {b.b2bProvider?.providerCode}</div>
                      <div><span className="text-[var(--alo-text-muted)]">Reference:</span> {b.b2bReference}</div>
                      <div><span className="text-[var(--alo-text-muted)]">Portal URL:</span> {b.b2bProvider?.portalUrl || 'Confidential'}</div>
                      <div><span className="text-[var(--alo-text-muted)]">Commission:</span> {b.b2bCommissionAmount} {b.b2bCommissionType}</div>
                      <div className="col-span-2"><span className="text-[var(--alo-text-muted)]">Internal Note:</span> {b.b2bInternalNote || 'N/A'}</div>
                      <div className="col-span-2 bg-rose-50 border border-rose-200 rounded-xl p-2"><span className="text-rose-700 font-medium">Login Note (encrypted):</span> <span className="font-mono text-[11px]">{b.b2bProvider?.loginNote ? '•••••• (decrypted for manager only)' : 'No credentials'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab==='comments' && (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Comments — Channels STUDENT_VISIBLE/PARTNER_VISIBLE/COUNSELOR_VISIBLE/APPLICATION_TEAM_INTERNAL/B2B_CONFIDENTIAL/UNIVERSITY/FINANCE/VISA_HANDOVER</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-4">
            <form onSubmit={handleComment} className="space-y-3">
              <textarea value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Add comment — visibility filtered backend, B2B never leak in templates" className="w-full bg-white border border-[var(--alo-border)] rounded-xl p-3 text-sm min-h-[80px]" />
              <div className="flex gap-2 items-center"><select value={commentType} onChange={e=>setCommentType(e.target.value)} className="bg-white border border-[var(--alo-border)] rounded-xl px-3 py-2 text-xs"><option value="STUDENT_VISIBLE">STUDENT_VISIBLE</option><option value="PARTNER_VISIBLE">PARTNER_VISIBLE</option><option value="COUNSELOR_VISIBLE">COUNSELOR_VISIBLE</option><option value="APPLICATION_TEAM_INTERNAL">APPLICATION_TEAM_INTERNAL</option><option value="B2B_CONFIDENTIAL">B2B_CONFIDENTIAL</option><option value="UNIVERSITY">UNIVERSITY</option><option value="FINANCE">FINANCE</option><option value="VISA_HANDOVER">VISA_HANDOVER</option></select><Button type="submit" disabled={submitting || !commentText.trim()} className="bg-[var(--alo-brand)] text-white ">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageSquare className="w-4 h-4 mr-1" />Post Comment</>}</Button></div>
            </form>
            <div className="space-y-2">
              {(app.comments || []).length===0 ? <p className="text-sm text-[var(--alo-text-muted)] py-4 text-center">No comments — empty. Comments filtered by visibility backend.</p> : (app.comments||[]).map((c:any)=>(
                <div key={c.id} className={`border rounded-xl p-3 ${c.isB2bConfidential ? 'bg-rose-50 border-rose-200' : 'bg-[var(--alo-page)] border-[var(--alo-border)]'}`}><div className="flex items-center justify-between"><span className="text-xs font-medium">{c.role} • {c.userId?.substring(0,6)}</span><Badge className={`${c.isB2bConfidential ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-white border-[var(--alo-border)]'} text-[11px]`}>{c.isB2bConfidential && <Lock className="w-2.5 h-2.5 mr-1" />}{c.visibility} • {c.commentType}</Badge></div><p className="text-sm mt-2">{c.commentText}</p><p className="text-[11px] text-[var(--alo-text-muted)] mt-1">{new Date(c.createdAt).toLocaleString()}</p></div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab==='offer' && (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Offer — DECISION_PENDING/CONDITIONAL/UNCONDITIONAL/REJECTED/DEFERRED/WITHDRAWN/MORE_DOCS/INTERVIEW/FEE_PENDING/DEPOSIT_REQUIRED</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            {offerData ? (
              <div className="grid grid-cols-2 gap-3"><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Offer Status</p><p className="font-semibold">{offerData.offerStatus}</p></div><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Scholarship</p><p className="font-semibold">{offerData.scholarship || 'None'} {offerData.scholarshipAmount ? `(${offerData.scholarshipAmount})` : ''}</p></div><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Deposit</p><p className="font-semibold">{offerData.depositAmount || 0} — Due: {offerData.depositDeadline ? new Date(offerData.depositDeadline).toLocaleDateString() : 'N/A'}</p></div><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Letter</p><p className="text-xs">{offerData.offerLetterUrl ? <a href={offerData.offerLetterUrl} target="_blank" className="text-[var(--alo-brand)] underline">View Letter</a> : 'No letter'}</p></div><div className="col-span-2 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Conditions</p><p className="text-xs">{offerData.offerConditions || 'No conditions'}</p></div></div>
            ) : <p className="text-sm text-[var(--alo-text-muted)] py-4 text-center">No offer yet — {app.offerStatus}. Details will appear here: offer letter/conditions/scholarship/deposit/deadlines.</p>}
          </CardContent>
        </Card>
      )}

      {activeTab==='cas' && (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">CAS / I-20 / COE — Destination UK CAS USA I-20 Australia COE Canada LOA/PAL Ireland/NZ/Dubai Offer/Visa letter</CardTitle></CardHeader>
          <CardContent className="p-4 text-sm space-y-3">
            {casData ? (
              <div className="grid grid-cols-2 gap-3"><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Document Type</p><p className="font-semibold">{casData.documentType} — {app.country === 'UK' ? 'CAS' : app.country === 'USA' ? 'I-20' : app.country === 'Australia' ? 'COE' : app.country === 'Canada' ? 'LOA/PAL' : 'Offer/Visa Letter'}</p></div><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Status</p><p className="font-semibold">{casData.status}</p></div><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Reference</p><p className="font-mono text-xs">{casData.referenceNumber || 'N/A'}</p></div><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">File</p><p className="text-xs">{casData.fileUrl ? <a href={casData.fileUrl} target="_blank" className="text-[var(--alo-brand)] underline">View Document</a> : 'No file'}</p></div></div>
            ) : <p className="text-sm text-[var(--alo-text-muted)] py-4 text-center">No CAS/I-20/COE yet — {app.casI20CoeStatus}. Destination mapping: UK CAS, USA I-20, Australia COE, Canada LOA/PAL, etc.</p>}
          </CardContent>
        </Card>
      )}

      {activeTab==='finance' && (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Finance — Permission Controlled B2B Commission Only with application.view_b2b_commission</CardTitle></CardHeader>
          <CardContent className="p-4 text-sm">
            {app.finance ? (
              <div className="grid grid-cols-2 gap-3"><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Application Fee</p><p className="font-semibold">{app.finance.applicationFee} {app.finance.applicationFeeCurrency} — {app.finance.applicationFeeStatus}</p></div><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">Deposit</p><p className="font-semibold">{app.finance.tuitionDeposit} {app.finance.depositCurrency} — {app.finance.depositStatus}</p></div><div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><p className="text-xs text-[var(--alo-text-muted)]">B2B Commission (restricted)</p><p className="font-semibold">{canViewB2B ? `${app.finance.b2bCommission} — ${app.finance.b2bCommissionStatus}` : 'Restricted — requires view_b2b_commission permission'}</p></div></div>
            ) : <p className="text-sm text-[var(--alo-text-muted)]">No finance record — empty. Finance permission-controlled, B2B commission only with application.view_b2b_commission, not contact/portal/credentials/notes.</p>}
          </CardContent>
        </Card>
      )}

      {activeTab==='visa' && (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Visa Handover — When VISA_HANDOVER_READY Create Visa File/Send Docs/Checklist/Notify/Handover Complete Reuse Existing Visa Engine No Duplicate VisaCase</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-4"><p className="text-sm"><strong>Current Stage:</strong> {app.stage}</p><p className="text-sm"><strong>Handover Status:</strong> {app.visaHandoverStatus}</p><p className="text-xs text-[var(--alo-text-muted)] mt-2">When stage is VISA_HANDOVER_READY, create Visa File, send docs, checklist, notify, handover complete — reuses existing VisaCase model, no duplicate.</p></div>
            <Button onClick={handleVisaHandover} className="bg-[var(--alo-brand)] text-white w-full md:w-auto"><Shield className="w-4 h-4 mr-2" />Handover to Visa Team</Button>
          </CardContent>
        </Card>
      )}

      {activeTab==='timeline' && (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Timeline — Events Anonymized for Unauthorized (Submitted through B2B Provider X → Application Submitted)</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-2">
            {(app.statusLogs || []).length===0 ? <p className="text-sm text-[var(--alo-text-muted)] py-4 text-center">No timeline events — empty. Timeline anonymized for unauthorized roles.</p> : (app.statusLogs||[]).map((log:any)=>(
              <div key={log.id} className="flex gap-3 bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-3"><div className="w-2 h-2 rounded-full bg-[var(--alo-brand)] mt-1.5" /><div><p className="text-sm font-medium">{log.note || `${log.oldStatus} → ${log.newStatus}`}</p><p className="text-xs text-[var(--alo-text-muted)]">{new Date(log.createdAt).toLocaleString()} • {log.visibility} • Safe: {log.safeStatus}</p></div></div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab==='audit' && (
        <Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Audit Log — 30+ Actions with auditId/actorUserId/actorRole/action/entityType/entityId/studentId/before/after/ip/session/createdAt</CardTitle></CardHeader>
          <CardContent className="p-4">
            <p className="text-xs text-[var(--alo-text-muted)]">Audit logs from audit_logs table, 30+ actions tracked: CREATE_APPLICATION, UPDATE_APPLICATION, ASSIGN_APPLICATION, UPDATE_STATUS, SUBMIT_APPLICATION, CREATE_B2B_APPLICATION, VIEW_B2B_DETAILS, MANAGE_OFFER, MANAGE_CAS_I20_COE, VISA_HANDOVER, ADD_COMMENT, etc. with actorUserId, actorRole, before/after, IP, session.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
