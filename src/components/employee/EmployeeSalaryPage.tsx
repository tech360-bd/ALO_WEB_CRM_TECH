'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Wallet, TrendingUp, CreditCard, PiggyBank, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

type SalaryRecord = {
  id: string; basicSalary: number; housingAllow: number; transportAllow: number; medicalAllow: number;
  otherAllow: number; grossSalary: number; taxDeduction: number; pfDeduction: number;
  netSalary: number; currency: string; effectiveFrom: string;
};
type SalaryData = {
  salary: { current: SalaryRecord | null; history: SalaryRecord[] };
  commissions: { summary: { totalPending: number; totalPaid: number; total: number; count: number } };
  bonuses: Array<{ amount: number; currency: string; status: string }>;
  increments: Array<{ id: string; previousAmount: number; newAmount: number; incrementType: string; effectiveFrom: string }>;
};

const formatMoney = (amount: number, currency = 'BDT') => {
  const value = Number.isFinite(amount) ? amount : 0;
  try { return new Intl.NumberFormat('en-BD', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); }
  catch { return `${currency} ${value.toLocaleString('en-BD')}`; }
};

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = usePortalStore.getState().token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

export default function EmployeeSalaryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [salary, setSalary] = useState<SalaryData | null>(null);
  const [error, setError] = useState('');

  const loadSalary = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/employee/salary', { headers: authHeaders(), cache: 'no-store' });
      const body = await response.json().catch(() => null);
      if (!response.ok || body?.success !== true || !body?.data?.salary) throw new Error(body?.error || 'Salary information is unavailable.');
      setSalary(body.data as SalaryData);
    } catch (loadError) {
      setSalary(null);
      setError(loadError instanceof Error ? loadError.message : 'Salary information is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadSalary(); }, [loadSalary]);

  if (loading) return <div className="space-y-4"><Skeleton className="h-12 w-64" /><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>;

  const current = salary?.salary.current || null;
  const history = salary?.salary.history || [];
  const currency = current?.currency || history[0]?.currency || 'BDT';
  const deductions = current ? current.taxDeduction + current.pfDeduction : 0;
  const breakdown = current ? [
    { label: 'Basic salary', amount: current.basicSalary, kind: 'earning' },
    { label: 'Housing allowance', amount: current.housingAllow, kind: 'earning' },
    { label: 'Transport allowance', amount: current.transportAllow, kind: 'earning' },
    { label: 'Medical allowance', amount: current.medicalAllow, kind: 'earning' },
    { label: 'Other allowance', amount: current.otherAllow, kind: 'earning' },
    { label: 'Tax deduction', amount: current.taxDeduction, kind: 'deduction' },
    { label: 'Provident fund deduction', amount: current.pfDeduction, kind: 'deduction' },
  ].filter((item) => item.amount !== 0) : [];

  if (error) return <div role="alert" className="p-6 text-red-700">{error}<Button variant="outline" onClick={() => window.location.reload()}>Retry</Button></div>;
  if (!payslipHistory.length) return <div className="p-6">No approved salary records yet.</div>;

  return (
    <div className="min-h-screen space-y-6 bg-alo-page p-4 lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-alo-text">Salary &amp; Compensation</h1>
          <p className="text-sm text-alo-text-muted">Private compensation information for your employee account.</p>
        </div>
        <Button variant="outline" onClick={() => void loadSalary()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Refresh</Button>
      </div>

      {error && <Card role="alert" className="border-red-200"><CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-red-700"><span>{error}</span><Button variant="outline" size="sm" onClick={() => void loadSalary()}>Retry</Button></CardContent></Card>}

      {!error && <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <SummaryCard icon={<Wallet className="h-5 w-5 text-emerald-600" />} label="Current net salary" value={current ? formatMoney(current.netSalary, currency) : 'Not available'} caption={current?.effectiveFrom ? `Effective ${current.effectiveFrom}` : 'No current salary record'} />
          <SummaryCard icon={<TrendingUp className="h-5 w-5 text-[var(--alo-brand)]" />} label="Gross salary" value={current ? formatMoney(current.grossSalary, currency) : 'Not available'} caption="Current compensation record" />
          <SummaryCard icon={<CreditCard className="h-5 w-5 text-red-600" />} label="Recorded deductions" value={current ? formatMoney(deductions, currency) : 'Not available'} caption="Tax and provident fund" />
          <SummaryCard icon={<PiggyBank className="h-5 w-5 text-alo-brand" />} label="Paid commissions" value={formatMoney(salary?.commissions.summary.totalPaid || 0, currency)} caption={`${salary?.commissions.summary.count || 0} commission records`} />
        </div>

        <Card className="rounded-xl border border-alo-border bg-white">
          <CardHeader className="cursor-pointer pb-0" onClick={() => setExpanded((value) => !value)}>
            <div className="flex items-center justify-between"><CardTitle className="text-base font-semibold text-alo-text">Current compensation breakdown</CardTitle>{expanded ? <ChevronUp className="h-5 w-5 text-alo-text-muted" /> : <ChevronDown className="h-5 w-5 text-alo-text-muted" />}</div>
          </CardHeader>
          {expanded && <CardContent className="pt-4">
            {!current ? <p className="py-6 text-center text-sm text-alo-text-muted">No current salary record is available.</p> : <>
              <div className="space-y-2">{breakdown.map((item) => <div key={item.label} className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-alo-page/50"><div className="flex items-center gap-3"><div className={`h-2 w-2 rounded-full ${item.kind === 'earning' ? 'bg-emerald-500' : 'bg-red-500'}`} /><span className="text-sm text-alo-text">{item.label}</span></div><span className={`text-sm font-semibold ${item.kind === 'earning' ? 'text-emerald-600' : 'text-red-600'}`}>{item.kind === 'deduction' ? '−' : ''}{formatMoney(item.amount, currency)}</span></div>)}</div>
              <div className="mt-3 flex items-center justify-between border-t-2 border-alo-border px-3 pt-3"><span className="text-base font-bold text-alo-text">Net salary</span><span className="text-xl font-bold text-alo-brand">{formatMoney(current.netSalary, currency)}</span></div>
            </>}
          </CardContent>}
        </Card>

        <Card className="rounded-xl border border-alo-border bg-white">
          <CardHeader className="pb-0"><CardTitle className="text-base font-semibold text-alo-text">Salary history</CardTitle></CardHeader>
          <CardContent className="pt-4">
            {history.length === 0 ? <p className="py-8 text-center text-sm text-alo-text-muted">No salary history is available.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-alo-border"><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Effective from</th><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Gross salary</th><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Deductions</th><th className="px-3 py-2.5 text-left text-xs font-medium text-alo-text-muted">Net salary</th></tr></thead><tbody>{history.map((record) => <tr key={record.id} className="border-b border-alo-border/50"><td className="px-3 py-2.5 font-medium text-alo-text">{record.effectiveFrom || 'Not specified'}</td><td className="px-3 py-2.5 text-alo-text-secondary">{formatMoney(record.grossSalary, record.currency)}</td><td className="px-3 py-2.5 text-red-500">{formatMoney(record.taxDeduction + record.pfDeduction, record.currency)}</td><td className="px-3 py-2.5 font-semibold text-alo-text">{formatMoney(record.netSalary, record.currency)}</td></tr>)}</tbody></table></div>}
            <p className="mt-3 text-xs text-alo-text-muted">Payslip downloads are not available because there is no verified payslip document endpoint.</p>
          </CardContent>
        </Card>
      </>}
    </div>
  );
}

function SummaryCard({ icon, label, value, caption }: { icon: React.ReactNode; label: string; value: string; caption: string }) {
  return <Card className="rounded-xl border border-alo-border bg-white"><CardContent className="p-4"><div className="mb-2 flex items-center justify-between">{icon}</div><p className="text-2xl font-bold text-alo-text">{value}</p><p className="mt-0.5 text-xs font-medium text-alo-text-secondary">{label}</p><p className="mt-1 text-xs text-alo-text-muted">{caption}</p></CardContent></Card>;
}
