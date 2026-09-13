'use client';
import { useState } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateApplicationPage() {
  const token = usePortalStore(s => s.token);
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{type:'success'|'error', text:string}|null>(null);
  const [form, setForm] = useState({ studentId:'', universityName:'', courseName:'', country:'', intake:'', level:'', applicationSource:'DIRECT_ALO_APPLICATION', notes:'' });

  const handleSubmit = async (e:any) => {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
      const res = await fetch('/api/applications', { method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setMsg({type:'success', text:`Application ${json.application?.applicationCode || json.data?.applicationCode} created`});
      setTimeout(()=> router.push(`/application-manager/application/${json.application?.id || json.data?.id}`), 1000);
    } catch (err:any){ setMsg({type:'error', text: err.message}); } finally { setLoading(false); }
  };

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen">
      <div className="max-w-3xl mx-auto space-y-4">
        <div><h1 className="text-xl font-bold text-[#0F172A]">Create Application</h1><p className="text-sm text-gray-500">Direct/Student Self/Partner/Manual Import/Referral/Event/Course Finder — real DB, audit logged</p><div className="flex gap-2 mt-2"><Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-[10px]">REAL API</Badge><Badge className="bg-[#F8FAFC] text-gray-600 border-[#E2E8F0] text-[10px]">10 SOURCES NORMALIZED</Badge></div></div>
        {msg && <div className={`p-3 rounded-xl border text-sm flex gap-2 ${msg.type==='success'?'bg-emerald-50 border-emerald-200 text-emerald-700':'bg-red-50 border-red-200 text-red-700'}`}>{msg.type==='success'?<CheckCircle2 className="w-4 h-4"/>:<AlertTriangle className="w-4 h-4"/>}{msg.text}</div>}
        <Card className="bg-white border-[#E2E8F0] shadow-sm rounded-xl">
          <CardHeader className="p-4 border-b border-[#E2E8F0]"><CardTitle className="text-sm">Application Details — Required Fields</CardTitle></CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-6"><label className="text-xs font-medium">Student ID *</label><Input required value={form.studentId} onChange={e=>setForm({...form, studentId:e.target.value})} className="bg-white border-[#E2E8F0]" placeholder="Student profile ID" /></div>
                <div className="col-span-12 md:col-span-6"><label className="text-xs font-medium">Source *</label><select value={form.applicationSource} onChange={e=>setForm({...form, applicationSource:e.target.value})} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm"><option value="DIRECT_ALO_APPLICATION">DIRECT_ALO_APPLICATION</option><option value="STUDENT_SELF_APPLICATION">STUDENT_SELF_APPLICATION</option><option value="PARTNER_APPLICATION">PARTNER_APPLICATION</option><option value="B2B_INBOUND_APPLICATION">B2B_INBOUND_APPLICATION</option><option value="B2B_OUTBOUND_APPLICATION">B2B_OUTBOUND_APPLICATION</option><option value="UNIVERSITY_DIRECT_PORTAL">UNIVERSITY_DIRECT_PORTAL</option><option value="MANUAL_IMPORT">MANUAL_IMPORT</option><option value="REFERRAL">REFERRAL</option><option value="EVENT_SEMINAR_LEAD">EVENT_SEMINAR_LEAD</option><option value="WEBSITE_COURSE_FINDER_LEAD">WEBSITE_COURSE_FINDER_LEAD</option></select></div>
                <div className="col-span-12 md:col-span-6"><label className="text-xs font-medium">University *</label><Input required value={form.universityName} onChange={e=>setForm({...form, universityName:e.target.value})} className="bg-white border-[#E2E8F0]" /></div>
                <div className="col-span-12 md:col-span-6"><label className="text-xs font-medium">Course *</label><Input required value={form.courseName} onChange={e=>setForm({...form, courseName:e.target.value})} className="bg-white border-[#E2E8F0]" /></div>
                <div className="col-span-6 md:col-span-3"><label className="text-xs font-medium">Country</label><Input value={form.country} onChange={e=>setForm({...form, country:e.target.value})} className="bg-white border-[#E2E8F0]" placeholder="UK/USA/Australia" /></div>
                <div className="col-span-6 md:col-span-3"><label className="text-xs font-medium">Intake</label><Input value={form.intake} onChange={e=>setForm({...form, intake:e.target.value})} className="bg-white border-[#E2E8F0]" placeholder="Sep 2026" /></div>
                <div className="col-span-6 md:col-span-3"><label className="text-xs font-medium">Level</label><Input value={form.level} onChange={e=>setForm({...form, level:e.target.value})} className="bg-white border-[#E2E8F0]" placeholder="Bachelor/Master" /></div>
                <div className="col-span-12"><label className="text-xs font-medium">Notes</label><textarea value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} className="w-full bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm min-h-[80px]" /></div>
              </div>
              <Button type="submit" disabled={loading} className="bg-[#0057B8] text-white w-full md:w-auto min-h-[48px]">{loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating...</> : 'Create Application — Real DB'}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
