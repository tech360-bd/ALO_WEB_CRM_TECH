'use client';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
export default function AdminCreateUniversityPage() {
  const [form, setForm] = useState({ name: '', country: '', city: '', website: '', ranking: '', overview: '', sourceUrl: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const tabs = ['Basic Information','Location','Official Links','International Student Information','Ranking','Description','Scholarship','Source Verification','SEO','Visibility','Publish'];
  const [activeTab, setActiveTab] = useState(0);
  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/universities/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, universityId: `UNI-${Date.now().toString(36).toUpperCase()}`, city: form.city, website: form.website, description: form.overview, sourceUrl: form.sourceUrl, ranking: parseInt(form.ranking)||0 }) });
      const json = await res.json();
      setResult(json);
    } catch(e:any){ setResult({ success:false, error:e.message }); } finally{ setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-20 pb-16">
      <div className="mx-auto max-w-5xl px-4 space-y-6">
        <div className="bg-white border border-[#E2E8F0] rounded-3xl p-8 shadow-sm">
          <Badge className="bg-[#0057B8]/10 text-[#0057B8] border-[#0057B8]/20 text-xs mb-3">Manual University Management — 11 Tabs — Super Admin</Badge>
          <h1 className="text-3xl font-bold text-[#0F172A]">Create University — Manual Form</h1>
          <p className="text-sm text-gray-600 mt-2">Form tabs per spec: Basic Information, Location, Official Links, International Student Information, Ranking, Description, Scholarship, Source Verification, SEO, Visibility, Publish. Validation: name required, country required, website required where available, source URL required for verified data. No orphan, no duplicate without Super Admin confirmation.</p>
          <div className="flex flex-wrap gap-2 mt-4">{tabs.map((t,i)=><Button key={t} size="sm" variant={activeTab===i ? 'default' : 'outline'} className={`h-9 text-[11px] ${activeTab===i ? 'bg-[#0057B8] text-white' : 'border-[#E2E8F0]'}`} onClick={()=>setActiveTab(i)}>{t}</Button>)}</div>
        </div>
        <Card className="p-6 bg-white border-[#E2E8F0] rounded-2xl shadow-sm">
          {activeTab===0 && <div className="space-y-4"><h3 className="font-bold">1. Basic Information</h3><div className="grid sm:grid-cols-2 gap-4"><div><Label className="text-xs">University Code *</Label><Input placeholder="Auto-generated" className="bg-white border-[#E2E8F0] h-11 mt-1" disabled /></div><div><Label className="text-xs">University Name *</Label><Input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} placeholder="University of Example" className="bg-white border-[#E2E8F0] h-11 mt-1" /></div><div><Label className="text-xs">Country *</Label><Input value={form.country} onChange={e=>setForm({...form, country:e.target.value})} placeholder="United Kingdom" className="bg-white border-[#E2E8F0] h-11 mt-1" /></div><div><Label className="text-xs">City</Label><Input value={form.city} onChange={e=>setForm({...form, city:e.target.value})} placeholder="London" className="bg-white border-[#E2E8F0] h-11 mt-1" /></div></div></div>}
          {activeTab===1 && <div className="space-y-4"><h3 className="font-bold">2. Location</h3><div className="grid sm:grid-cols-2 gap-4"><div><Label className="text-xs">State</Label><Input placeholder="England" className="bg-white border-[#E2E8F0] h-11 mt-1" /></div><div><Label className="text-xs">Address</Label><Input placeholder="123 University Road" className="bg-white border-[#E2E8F0] h-11 mt-1" /></div></div></div>}
          {activeTab===2 && <div className="space-y-4"><h3 className="font-bold">3. Official Links</h3><div className="space-y-3"><div><Label className="text-xs">Official Website *</Label><Input value={form.website} onChange={e=>setForm({...form, website:e.target.value})} placeholder="https://www.example.ac.uk" className="bg-white border-[#E2E8F0] h-11 mt-1" /></div></div></div>}
          {activeTab===7 && <div className="space-y-4"><h3 className="font-bold">8. Source Verification</h3><div><Label className="text-xs">Source URL * for verified data</Label><Input value={form.sourceUrl} onChange={e=>setForm({...form, sourceUrl:e.target.value})} placeholder="https://www.example.ac.uk/..." className="bg-white border-[#E2E8F0] h-11 mt-1" /></div><p className="text-xs text-gray-500 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3">For factual information store source_url, source_type, source_title, last_verified_at, verification_status. Prefer official university source.</p></div>}
          {activeTab===10 && <div className="space-y-4"><h3 className="font-bold">11. Publish</h3><Button onClick={handleCreate} disabled={loading} className="w-full bg-[#0057B8] text-white h-12 font-bold">{loading ? 'Creating...' : 'Create University — DB-driven, No Duplicate Without Confirmation'}</Button>{result && <div className={`p-4 rounded-xl border text-xs ${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}><pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre></div>}</div>}
          <div className="flex justify-between mt-8"><Button variant="outline" className="border-[#E2E8F0] h-11" disabled={activeTab===0} onClick={()=>setActiveTab(activeTab-1)}>Previous</Button><Button className="bg-[#0057B8] text-white h-11" disabled={activeTab===10} onClick={()=>setActiveTab(activeTab+1)}>Next</Button></div>
        </Card>
      </div>
    </div>
  );
}
