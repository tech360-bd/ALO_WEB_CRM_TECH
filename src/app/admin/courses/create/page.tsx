'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
export default function AdminCreateCoursePage() {
  const [form, setForm] = useState({ name: '', universityId: '', studyLevel: 'Masters', studyArea: 'Business', tuition: '', currency: 'GBP', duration: '12', sourceUrl: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const tabs = ['Basic Information','University & Campus','Tuition & Fees','Intakes','Academic Requirements','English Requirements','Scholarships','Tags','Source Verification','SEO','Visibility','Publish'];
  const [activeTab, setActiveTab] = useState(0);
  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/courses/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseTitle: form.name, universityId: form.universityId, studyLevel: form.studyLevel, subjectArea: form.studyArea, durationMonths: parseInt(form.duration)||12, tuitionFee: parseFloat(form.tuition)||0, currency: form.currency, sourceUrl: form.sourceUrl }) });
      const json = await res.json();
      setResult(json);
    } catch(e:any){ setResult({ success:false, error:e.message }); } finally{ setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-5xl px-4 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs mb-3">Manual Course Management</Badge>
          <h1 className="text-3xl font-bold text-[#0F172A]">Create Course — Manual Form</h1>
          <p className="text-sm text-gray-600 mt-2">Complete each tab — Basic Information, University &amp; Campus, Tuition &amp; Fees, Intakes, Academic and English Requirements, Scholarships, Tags, Source Verification, SEO, Visibility — then publish. A course must always be linked to its country, university, study level and subject area.</p>
          <div className="flex flex-wrap gap-2 mt-4">{tabs.map((t,i)=><Button key={t} size="sm" variant={activeTab===i ? 'default' : 'outline'} className={`h-9 text-[11px] ${activeTab===i ? 'bg-[#0057B8] text-white' : 'border-[#E2E8F0]'}`} onClick={()=>setActiveTab(i)}>{t}</Button>)}</div>
        </div>
        <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
          {activeTab===0 && <div className="space-y-4"><h3 className="font-bold">1. Basic Information</h3><div className="grid sm:grid-cols-2 gap-4"><div><Label className="text-xs">Course Name *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="MSc Data Science" className="bg-white border-[#E2E8F0] h-11 mt-1" /></div><div><Label className="text-xs">University ID *</Label><Input value={form.universityId} onChange={e=>setForm({...form, universityId:e.target.value})} placeholder="Select from DB — universityId" className="bg-white border-[#E2E8F0] h-11 mt-1" /></div></div></div>}
          {activeTab===11 && <div className="space-y-4"><h3 className="font-bold">12. Publish — No Orphan, No Duplicate Without Super Admin</h3><Button onClick={handleCreate} disabled={loading} className="w-full bg-[#0057B8] text-white h-12 font-bold">{loading ? 'Creating...' : 'Create Course — DB-driven, No Orphan, Duplicate Prevention'}</Button>{result && <div className={`p-4 rounded-xl border text-xs ${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}><pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre></div>}</div>}
          <div className="flex justify-between mt-8"><Button variant="outline" className="border-[#E2E8F0] h-11" disabled={activeTab===0} onClick={()=>setActiveTab(activeTab-1)}>Previous</Button><Button className="bg-[#0057B8] text-white h-11" disabled={activeTab===11} onClick={()=>setActiveTab(activeTab+1)}>Next</Button></div>
        </Card>
      </div>
    </div>
  );
}
