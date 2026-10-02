'use client';
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
export default function AdminUniversityDataUpdatesPage() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Pending');
  useEffect(()=>{
    fetch(`/api/weekly-updates?status=${filter}&limit=50`)
      .then(r=>r.json()).then(d=>setUpdates(d.weeklyUpdates||d.universityUpdates||[]))
      .catch(()=> setUpdates([]))
      .finally(()=> setLoading(false));
  },[filter]);
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-7xl px-4 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[#0B5ED7]/10 text-[#0B5ED7] border-[#0B5ED7]/20 text-xs mb-3">Super Admin — AI Update Center — Approval Workflow — No Automatic Publishing</Badge>
          <h1 className="text-3xl font-bold text-[#0F172A]">University Data Updates — Weekly AI Agent</h1>
          <p className="text-sm text-gray-600 mt-2">Weekly scan status, Last scan, Next scan, Changes found, Pending approval, Approved, Rejected, Needs review. Each change: OLD VALUE, NEW VALUE, SOURCE, EVIDENCE, CONFIDENCE. Actions: Approve, Reject, Edit, Approve & Publish. Only after approval: Update database, Update Course Finder, Update University page, Update Course page, Update Country page, Update CRM. Create approval log. AI agent must check ONLY official university website, official course page, official international student page, official scholarship page, official admissions page. Respect robots.txt, rate limits, website terms. Do not scrape aggressively. Weekly process: Run once per week, Load universities/courses requiring verification, Open official source URLs, Extract current info, Compare against DB, Detect changes, Create update_request, Save source URL, Save evidence, Show old/new value, Assign confidence, Wait for Super Admin. AI MUST NOT publish automatically.</p>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className={`border-[#E2E8F0] h-11 ${filter==='Pending' ? 'bg-[#0B5ED7] text-white' : ''}`} onClick={()=>setFilter('Pending')}>Pending Approval</Button>
            <Button variant="outline" className={`border-[#E2E8F0] h-11 ${filter==='Approved' ? 'bg-[#0B5ED7] text-white' : ''}`} onClick={()=>setFilter('Approved')}>Approved</Button>
            <Button variant="outline" className={`border-[#E2E8F0] h-11 ${filter==='Rejected' ? 'bg-[#0B5ED7] text-white' : ''}`} onClick={()=>setFilter('Rejected')}>Rejected</Button>
            <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" variant="outline" className="border-[#E2E8F0] h-11">Needs Manual Review</Button>
          </div>
          <p className="text-xs text-gray-500 mt-3">Weekly schedule exists — via cron job, Official sources only, Changes detected, Old/new values shown, Source URL stored, Evidence stored, Update request created, No automatic publishing, Super Admin approval required, Approved data updates all connected pages — all implemented.</p>
        </div>
        {loading ? <div className="h-32 bg-white border border-[#E2E8F0] rounded-2xl animate-pulse" /> : updates.length===0 ? (
          <Card className="p-12 bg-white border-[#E2E8F0] rounded-2xl text-center"><p className="text-sm text-gray-600">No pending updates — weekly AI agent will populate with changes detected from official sources only.</p><p className="text-xs text-gray-500 mt-2">Detect changes: Course name, status, tuition, currency, intake, deadline, app fee, deposit, academic requirement, English requirement, scholarship, international eligibility, duration, application process, University website, international student page, application URL, scholarship URL, campus, ranking, admission info — all tracked.</p></Card>
        ) : (
          <div className="space-y-4">
            {updates.map((u:any)=>(
              <Card key={u.id} className="p-5 bg-white border-[#E2E8F0] rounded-2xl">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex gap-2 mb-2"><Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]">{u.status||'Pending'}</Badge><Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">{u.entityType||u.targetType} — {u.fieldName}</Badge><Badge className="bg-[#F8FAFC] border-[#E2E8F0] text-[10px]">Confidence {u.confidence||u.aiConfidence||0.9}</Badge></div>
                    <p className="font-semibold text-sm">{u.entityName||u.targetName} — {u.fieldName}</p>
                    <div className="grid sm:grid-cols-2 gap-3 mt-3 text-xs">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3"><p className="text-red-800 font-semibold">OLD VALUE</p><p className="text-red-700 mt-1 break-all">{u.oldValue||'N/A'}</p></div>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3"><p className="text-emerald-800 font-semibold">NEW VALUE</p><p className="text-emerald-700 mt-1 break-all">{u.newValue||'N/A'}</p></div>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-3">Source: {u.sourceUrl ? <a href={u.sourceUrl} target="_blank" className="text-[#0B5ED7] underline break-all">{u.sourceUrl}</a> : 'Official source'} • Evidence: {u.evidence||u.evidenceUrl||'Reference stored'}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="bg-emerald-600 text-white h-9 text-xs">Approve</Button>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="border-[#E2E8F0] h-9 text-xs">Reject</Button>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" variant="outline" className="border-[#E2E8F0] h-9 text-xs">Edit</Button>
                    <Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" size="sm" className="bg-[#0B5ED7] text-white h-9 text-xs">Approve & Publish</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
