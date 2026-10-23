'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Loader2, Download, RefreshCw } from 'lucide-react';

export default function ReportsPage() {
  const token = usePortalStore(s => s.token);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/applications/reports', { headers:{ Authorization:`Bearer ${token}` } });
      const json = await res.json();
      setReport(json.report || json.data);
    } finally { setLoading(false); }
  }, [token]);

  useEffect(()=>{ fetchReport(); },[fetchReport]);

  return (
    <div className="p-4 md:p-6 bg-white min-h-screen space-y-4">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-[var(--alo-text)]">Reports</h1><p className="text-sm text-[var(--alo-text-muted)]">total/by source/Direct vs Partner vs B2B/inbound/outbound/university/country/course/counselor/officer/document/offer/rejection/deferral/CAS pending/deadline/SLA/B2B confidential restricted — CSV/XLSX/PDF</p></div><div className="flex gap-2"><Button variant="outline" className="border-[var(--alo-border)]" onClick={fetchReport}><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`} /></Button><Button disabled title="Not yet wired — disabled to avoid a silent no-op (tracked in BUTTON-INVENTORY.csv)" className="bg-[var(--alo-brand)] text-white"><Download className="w-4 h-4 mr-1" />Export CSV</Button></div></div>
      {loading ? <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--alo-brand)]" /></div> : !report ? <p className="text-sm text-[var(--alo-text-muted)]">No report data</p> : (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12 md:col-span-6 lg:col-span-4"><Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl"><CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">By Source</CardTitle></CardHeader><CardContent className="p-4 space-y-2">{Object.entries(report.bySource||{}).map(([k,v]:any)=><div key={k} className="flex justify-between bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2.5 text-xs"><span>{k.replace(/_/g,' ')}</span><Badge className="bg-white border-[var(--alo-border)] text-[11px]">{v as any}</Badge></div>)}</CardContent></Card></div>
          <div className="col-span-12 md:col-span-6 lg:col-span-4"><Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl"><CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">Direct vs Partner vs B2B</CardTitle></CardHeader><CardContent className="p-4 space-y-2">{Object.entries(report.directVsPartnerVsB2B||{}).map(([k,v]:any)=><div key={k} className="flex justify-between bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2.5 text-xs"><span>{k}</span><Badge className="bg-white border-[var(--alo-border)] text-[11px]">{v as any}</Badge></div>)}</CardContent></Card></div>
          <div className="col-span-12 md:col-span-6 lg:col-span-4"><Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl"><CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">By Country</CardTitle></CardHeader><CardContent className="p-4 space-y-2">{Object.entries(report.byCountry||{}).slice(0,10).map(([k,v]:any)=><div key={k} className="flex justify-between bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2.5 text-xs"><span>{k}</span><Badge className="bg-white border-[var(--alo-border)] text-[11px]">{v as any}</Badge></div>)}</CardContent></Card></div>
          <div className="col-span-12"><Card className="bg-white border-[var(--alo-border)] shadow-sm rounded-xl"><CardHeader className="p-4 border-b border-[var(--alo-border)]"><CardTitle className="text-sm">By Stage — 30+ Internal</CardTitle></CardHeader><CardContent className="p-4"><div className="grid grid-cols-2 md:grid-cols-4 gap-2">{Object.entries(report.byStage||{}).map(([k,v]:any)=><div key={k} className="bg-[var(--alo-page)] border border-[var(--alo-border)] rounded-xl p-2.5 text-xs flex justify-between"><span className="truncate">{k.replace(/_/g,' ')}</span><span className="font-bold">{v as any}</span></div>)}</div></CardContent></Card></div>
        </div>
      )}
    </div>
  );
}
