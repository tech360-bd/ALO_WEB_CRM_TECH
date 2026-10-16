'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { usePortalStore } from '@/lib/stores/portal-store';
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
    try {
      const res = await fetch(`/api/applications/${applicationId}/visa-handover`, { method:'POST', headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      if (json.success) { setMsg({type:'success', text:`Visa handover complete — ${json.visaCase?.caseCode} created, reusing Visa Engine`}); fetchApp(); }
      else setMsg({type:'error', text: json.error || 'Handover failed'});
    } catch (e:any){ setMsg({type:'error', text:e.message}); }
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
    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, { method:'PATCH', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify({ stage:newStage }) });
      const json = await res.json();
      if (json.success) { setMsg({type:'success', text:`Status updated to ${newStage}`}); fetchApp(); }
    } catch {}
  };

  if (loading) return <div className="p-8 bg-white min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#0057B8]" /></div>;
  if (!app) return <div className="p-8 bg-white min-h-screen text-center"><p>Application not found</p><Link href="/application-manager/applications"><Button className="mt-4 bg-[#0057B8] text-white">Back</Button></Link></div>;

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      {/* Header 12-col */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Link href="/application-manager/applications"><Button variant="ghost" size="sm" className="p-2"><ArrowLeft className="w-4 h-4" /></Button></Link>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-[#0057B8] bg-[#0057B8]/10 border border-[#0057B8]/20 rounded px-2 py-0.5">{app.applicationCode || app.id.substring(0,10)}</span>
                  <Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[#0F172A] text-[11px]">{app.stage}</Badge>
                  <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]">{app.safeStatus}</Badge>
                  {app.isB2b && <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]"><Lock className="w-3 h-3 mr-1" />CONFIDENTIAL B2B</Badge>}
                </div>
                <h1 className="text-lg font-bold text-[#0F172A] mt-1">{app.universityName} • {app.courseName}</h1>
                <p className="text-xs text-gray-500">{app.country} • {app.intake} • {app.applicationSource} • Student: {app.studentId?.substring(0,8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={handleVisaHandover} className="bg-[#0057B8] hover:bg-[#003F87] text-white text-xs"><Shield className="w-4 h-4 mr-1" />Handover to Visa</Button>
              <Button variant="outline" className="border-[#E2E8F0]" onClick={fetchApp}><RefreshCw className="w-4 h-4" /></Button>
            </div>
          </div>
        </div>
      </div>

      {msg && <div className={`p-3 rounded-xl border text-sm flex gap-2 ${msg.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-red-50 border-red-200 text-red-700'}`}>{msg.type==='success'?<CheckCircle2 className="w-4 h-4"/>:<AlertTriangle className="w-4 h-4"/>}{msg.text}</div>}

      {/* Tabs 13 */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-2 shadow-sm">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.key} onClick={()=>setActiveTab(tab.key)} className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex items-center gap-1.5 transition-all ${activeTab===tab.key ? 'bg-[#0057B8] text-white shadow-sm' : 'text-gray-600 hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0]'}`}>
              {(tab as any).lock && <Lock className={`w-3 h-3 ${activeTab===tab.key ? 'text-white' : 'text-rose-500'}`} />}{tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab==='overview' && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 lg:col-span-8">
            <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
              <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Overview Data</CardTitle></CardHeader>
              <CardContent className="p-4 grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-xs text-gray-500">University</p><p className="font-semibold text-[#0F172A]">{app.universityName}</p></div>
                <div><p className="text-xs text-gray-500">Course</p><p className="font-semibold text-[#0F172A]">{app.courseName}</p></div>
                <div><p className="text-xs text-gray-500">Country</p><p className="font-semibold">{app.country}</p></div>
                <div><p className="text-xs text-gray-500">Intake</p><p className="font-semibold">{app.intake || 'N/A'}</p></div>
                <div><p className="text-xs text-gray-500">Source</p><p className="font-semibold text-[#0057B8]">{app.applicationSource}</p></div>
                <div><p className="text-xs text-gray-500">Safe Status</p><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs mt-1">{app.safeStatus}</Badge></div>
                <div><p className="text-xs text-gray-500">Counselor</p><p className="font-semibold">{app.counselorName || app.counselorId?.substring(0,8) || 'Unassigned'}</p></div>
                <div><p className="text-xs text-gray-500">App Officer</p><p className="font-semibold">{app.appTeamOfficerId?.substring(0,8) || app.applicationOfficer?.substring(0,8) || 'Pending'}</p></div>
                <div className="col-span-2"><p className="text-xs text-gray-500">Internal Notes</p><p className="text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2 mt-1">{app.internalNotes || app.notes || 'No notes'}</p></div>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-12 lg:col-span-4 space-y-4">
            <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
              <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-xs uppercase tracking-wider text-gray-500">Quick Actions</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-2">
                <select onChange={e=> e.target.value && handleStatusChange(e.target.value)} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs"><option value="">Change Stage (30+)</option><option value="DOCUMENT_REVIEW">DOCUMENT_REVIEW</option><option value="READY_TO_SUBMIT">READY_TO_SUBMIT</option><option value="SUBMITTED_TO_UNIVERSITY">SUBMITTED_TO_UNIVERSITY</option><option value="DECISION_PENDING">DECISION_PENDING</option><option value="CONDITIONAL_OFFER">CONDITIONAL_OFFER</option><option value="UNCONDITIONAL_OFFER">UNCONDITIONAL_OFFER</option><option value="CAS_PENDING">CAS_PENDING</option><option value="VISA_HANDOVER_READY">VISA_HANDOVER_READY</option></select>
                <Button onClick={handleVisaHandover} className="w-full bg-[#0057B8] text-white text-xs"><Shield className="w-4 h-4 mr-1" />Visa Handover</Button>
              </CardContent>
            </Card>
            <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl"><CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-xs">Visa Handover Status</CardTitle></CardHeader><CardContent className="p-4"><Badge className="bg-[#F8FAFC] border-[#E2E8F0]">{app.visaHandoverStatus}</Badge><p className="text-[11px] text-gray-500 mt-2">Reuses existing Visa Engine — no duplicate VisaCase</p></CardContent></Card>
          </div>
        </div>
      )}

      {activeTab==='student' && (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl"><CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Student Profile — Reuse Existing Student DB</CardTitle></CardHeader><CardContent className="p-4 text-sm space-y-2"><p><strong>Student ID:</strong> {app.studentId}</p><p><strong>Partner ID:</strong> {app.partnerId || 'N/A (Direct)'}</p><p className="text-xs text-gray-500">Full profile fetched from PortalStudentProfile / Student DB — no duplicate system</p></CardContent></Card>
      )}

      {activeTab==='course' && (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl"><CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Course & University — Reuse Course Finder DB</CardTitle></CardHeader><CardContent className="p-4 text-sm"><p><strong>University:</strong> {app.universityName} ({app.universityId || 'No ID'})</p><p><strong>Course:</strong> {app.courseName} ({app.courseId || 'No ID'})</p><p><strong>Country:</strong> {app.country}</p><p><strong>Intake:</strong> {app.intake}</p><p><strong>Level:</strong> {app.level}</p><p className="text-xs text-gray-500 mt-2">Integrated with existing University/Course/Student DB, Course Finder, no rebuild</p></CardContent></Card>
      )}

      {activeTab==='documents' && (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0] flex flex-row items-center justify-between"><CardTitle className="text-sm">Documents — Engine Reuse (Required/Uploaded/Missing/Rejected/Expired/Under Review/Verified/Locked/Request Again)</CardTitle><Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">{app.documents?.length || 0} docs</Badge></CardHeader>
          <CardContent className="p-4 space-y-2">
            {(app.documents || []).length===0 ? <p className="text-sm text-gray-500 py-6 text-center">No documents — real DB empty. Document engine reuses Required/Uploaded/Missing/Rejected/Expired/Under Review/Verified/Locked/Request Again with preview/download/approve/reject/note/version audited.</p> : (app.documents||[]).map((d:any)=>(
              <div key={d.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-between"><div><p className="text-sm font-medium">{d.fileName || d.documentType}</p><p className="text-xs text-gray-500">{d.documentType} • {d.status} • v{d.version}</p></div><div className="flex gap-1"><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="h-7"><Eye className="w-3 h-3" /></Button><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="ghost" className="h-7"><Download className="w-3 h-3" /></Button><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="h-7 bg-emerald-600 text-white"><Check className="w-3 h-3" /></Button><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="h-7 border-red-200 text-red-600"><X className="w-3 h-3" /></Button></div></div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab==='submission' && (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Submission — Methods DIRECT_UNIVERSITY_PORTAL/EMAIL/UNIVERSITY_REPRESENTATIVE/B2B_INBOUND/B2B_OUTBOUND/PARTNER_SUBMISSION/MANUAL</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Submitted By</p><p className="font-medium">{app.createdBy?.substring(0,8) || 'System'}</p></div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Submitted Date</p><p className="font-medium">{new Date(app.createdAt).toLocaleDateString()}</p></div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Portal Ref</p><p className="font-mono text-xs">N/A — real DB will show</p></div>
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Fee Status</p><p className="font-medium">{app.applicationFeeStatus || app.paymentStatus || 'PENDING'}</p></div>
            </div>
            <p className="text-xs text-gray-500">Submission fields: submittedBy/To/Date/Ack/Portal Ref/University App ID/Fee status/Receipt/Expected Response/Offer TAT/Follow-up/Note filtered for B2B confidentiality</p>
          </CardContent>
        </Card>
      )}

      {activeTab==='b2b' && (
        <Card className="bg-white border-rose-200 shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-rose-100 bg-rose-50/50 rounded-t-xl flex flex-row items-center justify-between"><CardTitle className="text-sm text-rose-700 flex items-center gap-2"><Lock className="w-4 h-4" />B2B Details — Confidential (Backend 403, Encrypted Credentials Never in Normal Response)</CardTitle><Badge className="bg-rose-100 text-rose-700 border-rose-200 text-[10px]">RESTRICTED</Badge></CardHeader>
          <CardContent className="p-4">
            {!canViewB2B ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center"><Lock className="w-8 h-8 text-rose-400 mx-auto mb-2" /><p className="text-sm font-semibold text-rose-800">B2B Details Restricted</p><p className="text-xs text-rose-600 mt-1">Only APPLICATION_MANAGER/APPLICATION_TEAM/SUPER_ADMIN can view. Backend returns 403 for unauthorized. Normal application response omits B2B provider fields.</p></div>
            ) : b2bDetails.length===0 ? (
              <p className="text-sm text-gray-500 py-6 text-center">No B2B details — application is Direct/Partner. B2B Details tab confidential with encrypted credentials never in normal response.</p>
            ) : (
              <div className="space-y-3">
                {b2bDetails.map((b:any)=>(
                  <div key={b.id} className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between"><span className="font-semibold">{b.b2bProvider?.name || b.b2bProviderId} — {b.b2bType}</span><Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]">{b.b2bStatus}</Badge></div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div><span className="text-gray-500">Provider Code:</span> {b.b2bProvider?.providerCode}</div>
                      <div><span className="text-gray-500">Reference:</span> {b.b2bReference}</div>
                      <div><span className="text-gray-500">Portal URL:</span> {b.b2bProvider?.portalUrl || 'Confidential'}</div>
                      <div><span className="text-gray-500">Commission:</span> {b.b2bCommissionAmount} {b.b2bCommissionType}</div>
                      <div className="col-span-2"><span className="text-gray-500">Internal Note:</span> {b.b2bInternalNote || 'N/A'}</div>
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
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Comments — Channels STUDENT_VISIBLE/PARTNER_VISIBLE/COUNSELOR_VISIBLE/APPLICATION_TEAM_INTERNAL/B2B_CONFIDENTIAL/UNIVERSITY/FINANCE/VISA_HANDOVER</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-4">
            <form onSubmit={handleComment} className="space-y-3">
              <textarea value={commentText} onChange={e=>setCommentText(e.target.value)} placeholder="Add comment — visibility filtered backend, B2B never leak in templates" className="w-full bg-white border border-[#E2E8F0] rounded-xl p-3 text-sm min-h-[80px]" />
              <div className="flex gap-2 items-center"><select value={commentType} onChange={e=>setCommentType(e.target.value)} className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs"><option value="STUDENT_VISIBLE">STUDENT_VISIBLE</option><option value="PARTNER_VISIBLE">PARTNER_VISIBLE</option><option value="COUNSELOR_VISIBLE">COUNSELOR_VISIBLE</option><option value="APPLICATION_TEAM_INTERNAL">APPLICATION_TEAM_INTERNAL</option><option value="B2B_CONFIDENTIAL">B2B_CONFIDENTIAL</option><option value="UNIVERSITY">UNIVERSITY</option><option value="FINANCE">FINANCE</option><option value="VISA_HANDOVER">VISA_HANDOVER</option></select><Button type="submit" disabled={submitting || !commentText.trim()} className="bg-[#0057B8] text-white text-xs">{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><MessageSquare className="w-4 h-4 mr-1" />Post Comment</>}</Button></div>
            </form>
            <div className="space-y-2">
              {(app.comments || []).length===0 ? <p className="text-sm text-gray-500 py-4 text-center">No comments — real DB empty. Comments filtered by visibility backend.</p> : (app.comments||[]).map((c:any)=>(
                <div key={c.id} className={`border rounded-xl p-3 ${c.isB2bConfidential ? 'bg-rose-50 border-rose-200' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}><div className="flex items-center justify-between"><span className="text-xs font-medium">{c.role} • {c.userId?.substring(0,6)}</span><Badge className={`${c.isB2bConfidential ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-white border-[#E2E8F0]'} text-[10px]`}>{c.isB2bConfidential && <Lock className="w-2.5 h-2.5 mr-1" />}{c.visibility} • {c.commentType}</Badge></div><p className="text-sm mt-2">{c.commentText}</p><p className="text-[11px] text-gray-500 mt-1">{new Date(c.createdAt).toLocaleString()}</p></div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab==='offer' && (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Offer — DECISION_PENDING/CONDITIONAL/UNCONDITIONAL/REJECTED/DEFERRED/WITHDRAWN/MORE_DOCS/INTERVIEW/FEE_PENDING/DEPOSIT_REQUIRED</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-3 text-sm">
            {offerData ? (
              <div className="grid grid-cols-2 gap-3"><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Offer Status</p><p className="font-semibold">{offerData.offerStatus}</p></div><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Scholarship</p><p className="font-semibold">{offerData.scholarship || 'None'} {offerData.scholarshipAmount ? `(${offerData.scholarshipAmount})` : ''}</p></div><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Deposit</p><p className="font-semibold">{offerData.depositAmount || 0} — Due: {offerData.depositDeadline ? new Date(offerData.depositDeadline).toLocaleDateString() : 'N/A'}</p></div><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Letter</p><p className="text-xs">{offerData.offerLetterUrl ? <a href={offerData.offerLetterUrl} target="_blank" className="text-[#0057B8] underline">View Letter</a> : 'No letter'}</p></div><div className="col-span-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Conditions</p><p className="text-xs">{offerData.offerConditions || 'No conditions'}</p></div></div>
            ) : <p className="text-sm text-gray-500 py-4 text-center">No offer yet — {app.offerStatus}. Details will appear here: offer letter/conditions/scholarship/deposit/deadlines.</p>}
          </CardContent>
        </Card>
      )}

      {activeTab==='cas' && (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">CAS / I-20 / COE — Destination UK CAS USA I-20 Australia COE Canada LOA/PAL Ireland/NZ/Dubai Offer/Visa letter</CardTitle></CardHeader>
          <CardContent className="p-4 text-sm space-y-3">
            {casData ? (
              <div className="grid grid-cols-2 gap-3"><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Document Type</p><p className="font-semibold">{casData.documentType} — {app.country === 'UK' ? 'CAS' : app.country === 'USA' ? 'I-20' : app.country === 'Australia' ? 'COE' : app.country === 'Canada' ? 'LOA/PAL' : 'Offer/Visa Letter'}</p></div><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Status</p><p className="font-semibold">{casData.status}</p></div><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Reference</p><p className="font-mono text-xs">{casData.referenceNumber || 'N/A'}</p></div><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">File</p><p className="text-xs">{casData.fileUrl ? <a href={casData.fileUrl} target="_blank" className="text-[#0057B8] underline">View Document</a> : 'No file'}</p></div></div>
            ) : <p className="text-sm text-gray-500 py-4 text-center">No CAS/I-20/COE yet — {app.casI20CoeStatus}. Destination mapping: UK CAS, USA I-20, Australia COE, Canada LOA/PAL, etc.</p>}
          </CardContent>
        </Card>
      )}

      {activeTab==='finance' && (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Finance — Permission Controlled B2B Commission Only with application.view_b2b_commission</CardTitle></CardHeader>
          <CardContent className="p-4 text-sm">
            {app.finance ? (
              <div className="grid grid-cols-2 gap-3"><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Application Fee</p><p className="font-semibold">{app.finance.applicationFee} {app.finance.applicationFeeCurrency} — {app.finance.applicationFeeStatus}</p></div><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">Deposit</p><p className="font-semibold">{app.finance.tuitionDeposit} {app.finance.depositCurrency} — {app.finance.depositStatus}</p></div><div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><p className="text-xs text-gray-500">B2B Commission (restricted)</p><p className="font-semibold">{canViewB2B ? `${app.finance.b2bCommission} — ${app.finance.b2bCommissionStatus}` : 'Restricted — requires view_b2b_commission permission'}</p></div></div>
            ) : <p className="text-sm text-gray-500">No finance record — real DB empty. Finance permission-controlled, B2B commission only with application.view_b2b_commission, not contact/portal/credentials/notes.</p>}
          </CardContent>
        </Card>
      )}

      {activeTab==='visa' && (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Visa Handover — When VISA_HANDOVER_READY Create Visa File/Send Docs/Checklist/Notify/Handover Complete Reuse Existing Visa Engine No Duplicate VisaCase</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4"><p className="text-sm"><strong>Current Stage:</strong> {app.stage}</p><p className="text-sm"><strong>Handover Status:</strong> {app.visaHandoverStatus}</p><p className="text-xs text-gray-500 mt-2">When stage is VISA_HANDOVER_READY, create Visa File, send docs, checklist, notify, handover complete — reuses existing VisaCase model, no duplicate.</p></div>
            <Button onClick={handleVisaHandover} className="bg-[#0057B8] text-white w-full md:w-auto"><Shield className="w-4 h-4 mr-2" />Handover to Visa Team</Button>
          </CardContent>
        </Card>
      )}

      {activeTab==='timeline' && (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Timeline — Events Anonymized for Unauthorized (Submitted through B2B Provider X → Application Submitted)</CardTitle></CardHeader>
          <CardContent className="p-4 space-y-2">
            {(app.statusLogs || []).length===0 ? <p className="text-sm text-gray-500 py-4 text-center">No timeline events — real DB empty. Timeline anonymized for unauthorized roles.</p> : (app.statusLogs||[]).map((log:any)=>(
              <div key={log.id} className="flex gap-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3"><div className="w-2 h-2 rounded-full bg-[#0057B8] mt-1.5" /><div><p className="text-sm font-medium">{log.note || `${log.oldStatus} → ${log.newStatus}`}</p><p className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()} • {log.visibility} • Safe: {log.safeStatus}</p></div></div>
            ))}
          </CardContent>
        </Card>
      )}

      {activeTab==='audit' && (
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Audit Log — 30+ Actions with auditId/actorUserId/actorRole/action/entityType/entityId/studentId/before/after/ip/session/createdAt</CardTitle></CardHeader>
          <CardContent className="p-4">
            <p className="text-xs text-gray-500">Audit logs from audit_logs table — real DB, 30+ actions tracked: CREATE_APPLICATION, UPDATE_APPLICATION, ASSIGN_APPLICATION, UPDATE_STATUS, SUBMIT_APPLICATION, CREATE_B2B_APPLICATION, VIEW_B2B_DETAILS, MANAGE_OFFER, MANAGE_CAS_I20_COE, VISA_HANDOVER, ADD_COMMENT, etc. with actorUserId, actorRole, before/after, IP, session.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
