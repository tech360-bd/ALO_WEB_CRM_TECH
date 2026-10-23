'use client';

import { useState, useEffect } from 'react';
import { usePortalStore } from '@/lib/stores/portal-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Download, Wallet, TrendingUp, Building2, CreditCard, PiggyBank, ChevronDown, ChevronUp } from 'lucide-react';

const mockSalaryBreakdown = [
  { label: 'Basic Salary', amount: 40000, type: 'earning' },
  { label: 'House Rent Allowance', amount: 12000, type: 'earning' },
  { label: 'Medical Allowance', amount: 3000, type: 'earning' },
  { label: 'Transport Allowance', amount: 2000, type: 'earning' },
  { label: 'Performance Bonus', amount: 5000, type: 'earning' },
  { label: 'Income Tax', amount: -6000, type: 'deduction' },
  { label: 'Provident Fund', amount: -3600, type: 'deduction' },
  { label: 'Professional Tax', amount: -200, type: 'deduction' },
];

const mockPayslipHistory = [
  { id: '1', month: 'January 2025', gross: 62000, deductions: 9800, net: 52200, status: 'paid', paidOn: '2025-01-31' },
  { id: '2', month: 'December 2024', gross: 60000, deductions: 9600, net: 50400, status: 'paid', paidOn: '2024-12-31' },
  { id: '3', month: 'November 2024', gross: 57000, deductions: 9200, net: 47800, status: 'paid', paidOn: '2024-11-30' },
  { id: '4', month: 'October 2024', gross: 57000, deductions: 9200, net: 47800, status: 'paid', paidOn: '2024-10-31' },
  { id: '5', month: 'September 2024', gross: 57000, deductions: 9200, net: 47800, status: 'paid', paidOn: '2024-09-30' },
  { id: '6', month: 'August 2024', gross: 55000, deductions: 8800, net: 46200, status: 'paid', paidOn: '2024-08-31' },
];

const formatTaka = (n: number) => `৳${Math.abs(n).toLocaleString('en-BD')}`;

export default function EmployeeSalaryPage() {
  const { user } = usePortalStore();
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [salaryBreakdown, setSalaryBreakdown] = useState(mockSalaryBreakdown);
  const [payslipHistory, setPayslipHistory] = useState(mockPayslipHistory);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const token = usePortalStore.getState().token;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/employee/salary', { headers })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.breakdown) setSalaryBreakdown(data.breakdown);
        if (data?.payslips) setPayslipHistory(data.payslips);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); });
  }, []);

  const handleDownloadPdf = (p: typeof payslipHistory[0]) => {
    setDownloading(p.id);
    toast.info(`Generating PDF for ${p.month}...`);
    setTimeout(() => {
      toast.info('PDF download will be available in production. Please contact HR for payslips.');
      setDownloading(null);
    }, 1500);
  };

  const gross = salaryBreakdown.filter(s => s.type === 'earning').reduce((a, s) => a + s.amount, 0);
  const deductions = salaryBreakdown.filter(s => s.type === 'deduction').reduce((a, s) => a + Math.abs(s.amount), 0);
  const net = gross - deductions;

  if (loading) return <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>;

  return (
    <div className="space-y-6 bg-alo-page min-h-screen p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-bold text-alo-text">Salary &amp; Payslips</h1>
        <p className="text-sm text-alo-text-muted">View your salary breakdown and download payslips</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              <Badge variant="success" className="text-[11px]">Net Pay</Badge>
            </div>
            <p className="text-2xl font-bold text-alo-text">{formatTaka(net)}</p>
            <p className="text-xs text-alo-text-muted mt-0.5">{payslipHistory[0]?.month || 'Current Month'}</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2"><TrendingUp className="w-5 h-5 text-[var(--alo-brand)]" /></div>
            <p className="text-2xl font-bold text-alo-text">{formatTaka(gross)}</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Gross Pay</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2"><CreditCard className="w-5 h-5 text-red-600" /></div>
            <p className="text-2xl font-bold text-alo-text">{formatTaka(deductions)}</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Total Deductions</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-xl border border-alo-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2"><PiggyBank className="w-5 h-5 text-alo-brand" /></div>
            <p className="text-2xl font-bold text-alo-text">{formatTaka(3600)}</p>
            <p className="text-xs text-alo-text-muted mt-0.5">Provident Fund (Monthly)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-alo-text">{payslipHistory[0]?.month || 'Current Month'} Salary Breakdown</CardTitle>
            {expanded ? <ChevronUp className="w-5 h-5 text-alo-text-muted" /> : <ChevronDown className="w-5 h-5 text-alo-text-muted" />}
          </div>
        </CardHeader>
        {expanded && <CardContent className="pt-4">
          <div className="space-y-2">
            {salaryBreakdown.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-alo-page/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.type === 'earning' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="text-sm text-alo-text">{item.label}</span>
                </div>
                <span className={`text-sm font-semibold ${item.type === 'earning' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {item.amount < 0 ? '-' : '+'}{formatTaka(item.amount)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t-2 border-alo-border flex items-center justify-between px-3">
            <span className="text-base font-bold text-alo-text">Net Pay</span>
            <span className="text-xl font-bold text-alo-brand">{formatTaka(net)}</span>
          </div>
        </CardContent>}
      </Card>

      <Card className="bg-white rounded-xl border border-alo-border">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold text-alo-text">Payslip History</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-alo-border">
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Month</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Gross Pay</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Deductions</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Net Pay</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Status</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Paid On</th>
                <th className="text-left py-2.5 px-3 text-xs font-medium text-alo-text-muted">Action</th>
              </tr></thead>
              <tbody>
                {payslipHistory.map(p => (
                  <tr key={p.id} className="border-b border-alo-border/50 hover:bg-alo-page/50">
                    <td className="py-2.5 px-3 text-alo-text font-medium">{p.month}</td>
                    <td className="py-2.5 px-3 text-alo-text-secondary">{formatTaka(p.gross)}</td>
                    <td className="py-2.5 px-3 text-red-500">{formatTaka(p.deductions)}</td>
                    <td className="py-2.5 px-3 text-alo-text font-semibold">{formatTaka(p.net)}</td>
                    <td className="py-2.5 px-3"><Badge variant="success" className="text-[11px]">{p.status}</Badge></td>
                    <td className="py-2.5 px-3 text-alo-text-muted text-xs">{p.paidOn}</td>
                    <td className="py-2.5 px-3">
                      <Button variant="ghost" size="sm" className="h-7 text-alo-brand" disabled={downloading === p.id} onClick={() => handleDownloadPdf(p)}>
                        {downloading === p.id ? 'Generating...' : <><Download className="w-3 h-3 mr-1" /> PDF</>}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
