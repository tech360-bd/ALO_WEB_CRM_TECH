'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function HrmPayrollPage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [slip, setSlip] = useState<any>(null);

  const load = () => {
    setLoading(true);
    fetch(`/api/hrm/payroll?monthYear=${month}`).then(r=>r.json()).then(j=> setList(j.data||[])).catch(()=>{}).finally(()=> setLoading(false));
  };
  useEffect(()=> { load(); }, [month]);

  const generate = async () => {
    setGenerating(true);
    try{
      const res = await fetch('/api/hrm/payroll', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ monthYear: month })});
      const j = await res.json();
      if (j.success) { toast.success(`Payroll generated: ${j.data.created} employees`); load(); } else toast.error(j.error);
    } catch { toast.error('Generate failed'); } finally { setGenerating(false); }
  };

  const viewSlip = async (employeeId:string) => {
    const res = await fetch(`/api/hrm/payroll?view=slip&monthYear=${month}&employeeId=${employeeId}`);
    const j = await res.json();
    if (j.success) setSlip(j.data); else toast.error(j.error);
  };

  const patch = async (id:string, action:string) => {
    const res = await fetch('/api/hrm/payroll', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ id, action })});
    const j = await res.json();
    if (j.success) { toast.success(`Payroll ${action}`); load(); } else toast.error(j.error);
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--alo-text)]">Payroll</h1>
          <p className="text-xs text-[var(--alo-text-muted)]">Monthly Payroll • Attendance/Leave/Late/Holiday/Overtime/Bonus/Allowance/Loan/Advance/Tax/PF/Deduction • Salary Slip • Bank Sheet — Employee sees only final approved salary; HR/Finance see calculation details</p>
        </div>
        <div className="flex gap-2">
          <input type="month" value={month} onChange={e=> setMonth(e.target.value)} className="h-9 text-xs border border-[var(--alo-border)] rounded px-2 bg-white" />
          <Button onClick={generate} disabled={generating} className="bg-[var(--alo-cta)] hover:bg-[var(--alo-cta-hover)] text-white ">{generating? 'Generating...' : 'Generate Monthly Payroll'}</Button>
        </div>
      </div>

      <Card className="bg-white border-[var(--alo-border)]">
        <CardHeader className="p-4 border-b"><CardTitle className="text-sm font-bold">Payroll — {month}</CardTitle></CardHeader>
        <CardContent className="p-0 overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-[var(--alo-page)] text-[var(--alo-text-muted)]"><tr><th className="p-2 text-left">Employee</th><th className="p-2">Gross</th><th className="p-2">Deductions</th><th className="p-2">Net Pay</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} className="p-6 text-center text-[var(--alo-text-muted)]">Loading...</td></tr> : list.length ? list.map((p:any)=> (
                <tr key={p.id||p.employeeId} className="border-t border-[var(--alo-border)]">
                  <td className="p-2 font-mono">{p.employeeId}</td>
                  <td className="p-2 text-center">৳{Number(p.totalEarnings||p.grossSalary||0).toLocaleString()}</td>
                  <td className="p-2 text-center">৳{Number(p.totalDeductions||0).toLocaleString()}</td>
                  <td className="p-2 text-center font-bold">৳{Number(p.netPay||p.netSalary||0).toLocaleString()}</td>
                  <td className="p-2 text-center"><Badge variant="outline" className="text-xs capitalize">{p.status}</Badge></td>
                  <td className="p-2 text-center flex gap-1 justify-center">
                    <Button size="sm" variant="outline" className="h-7 " onClick={()=> viewSlip(p.employeeId)}>Slip</Button>
                    <Button size="sm" variant="outline" className="h-7 " onClick={()=> patch(p.id, 'approve')}>Approve</Button>
                    <Button size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={()=> patch(p.id, 'pay')}>Pay</Button>
                  </td>
                </tr>
              )) : <tr><td colSpan={6} className="p-6 text-center text-[var(--alo-text-muted)]">No payroll for {month} — click Generate</td></tr>}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {slip && (
        <Card className="bg-white border-[var(--alo-border)]">
          <CardHeader className="p-4 border-b flex flex-row items-center justify-between"><CardTitle className="text-sm font-bold">Salary Slip — {slip.monthYear} — {slip.employeeId||''}</CardTitle><Button variant="ghost" size="sm" onClick={()=> setSlip(null)} className="text-xs">Close</Button></CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="p-3 bg-[var(--alo-page)] rounded-xl border"><p className="text-xs text-[var(--alo-text-muted)]">Status</p><p className="font-bold text-sm">{slip.status}</p></div>
              <div className="p-3 bg-[var(--alo-page)] rounded-xl border"><p className="text-xs text-[var(--alo-text-muted)]">Gross</p><p className="font-bold text-sm">৳{Number(slip.totalEarnings||slip.grossSalary||0).toLocaleString()}</p></div>
              <div className="p-3 bg-[var(--alo-page)] rounded-xl border"><p className="text-xs text-[var(--alo-text-muted)]">Deductions</p><p className="font-bold text-sm">৳{Number(slip.totalDeductions||0).toLocaleString()}</p></div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200"><p className="text-xs text-emerald-700">Net Pay</p><p className="font-bold text-sm text-emerald-700">৳{Number(slip.netPay||slip.netSalary||0).toLocaleString()}</p></div>
            </div>
            {slip.items?.length ? (
              <div className="overflow-auto border rounded-xl">
                <table className="w-full text-xs"><thead className="bg-[var(--alo-page)]"><tr><th className="p-2 text-left">Label</th><th className="p-2">Type</th><th className="p-2 text-right">Amount</th></tr></thead>
                <tbody>{slip.items.map((it:any,idx:number)=> <tr key={idx} className="border-t"><td className="p-2">{it.label}</td><td className="p-2 text-center capitalize">{it.itemType}</td><td className={`p-2 text-right ${Number(it.amount)<0? 'text-red-600' : 'text-emerald-700'}`}>{Number(it.amount).toLocaleString()}</td></tr>)}</tbody></table>
              </div>
            ) : slip.note ? <p className="text-xs text-[var(--alo-text-muted)]">{slip.note}</p> : null}
            <p className="text-xs text-[var(--alo-text-muted)]">Payroll Report & Bank Sheet available via export — HR/Finance only details.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
